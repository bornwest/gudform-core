import { prisma } from "@/lib/db";
import { getCurrency } from "@/config/currencies";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { validateAnswers } from "@/lib/validations/form";

export type FormResponseMetadata = {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  turnstileToken?: string;
  resumeToken?: string;
};

// Postgres text columns can't hold NUL (\u0000). It arrives in answers via
// text pasted from binaries, PDFs or legacy systems and would make the
// insert fail, so strip it before validating or saving.
function stripNul<T>(value: T): T {
  return (typeof value === "string" ? value.replace(/\u0000/g, "") : value) as T;
}

export function stripNulFromAnswers<T extends { value: string }>(
  answers: T[],
): T[] {
  return answers.map((answer) => ({ ...answer, value: stripNul(answer.value) }));
}

function stripNulFromMetadata(
  metadata?: FormResponseMetadata,
): FormResponseMetadata | undefined {
  if (!metadata) return metadata;
  return {
    ...metadata,
    userAgent: stripNul(metadata.userAgent),
    referrer: stripNul(metadata.referrer),
  };
}

export async function createPendingPaymentResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
  selectedOptionIds?: string[],
) {
  answers = stripNulFromAnswers(answers);
  metadata = stripNulFromMetadata(metadata);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: { 
        where: { deletedAt: null },
        orderBy: { order: "asc" } 
      },
      formVersions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!form?.paymentEnabled) {
    throw new Error("Payment not enabled for this form");
  }

  const validation = validateAnswers(
    form.questions as Parameters<typeof validateAnswers>[0],
    answers,
  );
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const formPaymentOptions = form.paymentOptions as PaymentOption[] | null;
  let resolvedAmount = form.paymentAmount;
  let resolvedSelectedIds: string[] | undefined;

  if (formPaymentOptions && formPaymentOptions.length > 0 && selectedOptionIds) {
    const optionMap = new Map(formPaymentOptions.map((o) => [o.id, o]));
    for (const id of selectedOptionIds) {
      if (!optionMap.has(id)) {
        throw new Error(`Invalid payment option: ${id}`);
      }
    }

    const selectionMode = form.paymentSelectionMode as PaymentSelectionMode;
    if (selectionMode === "single" && selectedOptionIds.length !== 1) {
      throw new Error("Exactly one payment option must be selected");
    }
    if (selectedOptionIds.length === 0) {
      throw new Error("At least one payment option must be selected");
    }

    resolvedAmount = selectedOptionIds.reduce(
      (sum, id) => sum + optionMap.get(id)!.amount,
      0,
    );

    const currency = getCurrency(form.paymentCurrency);
    if (resolvedAmount < currency.minAmount) {
      throw new Error(
        `Total payment must be at least ${currency.minAmount} (smallest unit) for ${form.paymentCurrency.toUpperCase()}`,
      );
    }

    resolvedSelectedIds = selectedOptionIds;
  }

  const response = await prisma.$transaction(async (tx) => {
    if (form.responseLimit) {
      const count = await tx.formResponse.count({
        where: { formId, ...COUNTABLE_RESPONSE_WHERE },
      });
      if (count >= form.responseLimit) {
        throw new Error("This form has reached its response limit");
      }
    }

    return tx.formResponse.create({
      data: {
        formId,
        formVersionId: form.formVersions[0]?.id ?? null,
        ipAddress: form.collectIpAddress ? metadata?.ipAddress : null,
        userAgent: metadata?.userAgent,
        referrer: metadata?.referrer,
        paymentStatus: "PENDING",
        paymentAmount: resolvedAmount,
        paymentCurrency: form.paymentCurrency,
        selectedPaymentOptionIds: resolvedSelectedIds ?? undefined,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });
  });

  return response;
}

/**
 * Optional timing/status for importing historical responses (REST API).
 * A response with `partial` or any explicit date never fires notifications,
 * webhooks or integrations.
 */
export type ResponseTimingOptions = {
  startedAt?: Date;
  completedAt?: Date;
  partial?: boolean;
};

export function parseResponseTiming(
  body: Record<string, unknown>,
): { ok: true; options: ResponseTimingOptions } | { ok: false; error: string } {
  const options: ResponseTimingOptions = {};

  // completedAt: a date -> completed then; explicit null -> in progress; absent -> completed now.
  if (body.completedAt === null) options.partial = true;

  for (const key of ["startedAt", "completedAt"] as const) {
    const raw = body[key];
    if (raw === undefined || raw === null) continue;
    const date = typeof raw === "string" ? new Date(raw) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return { ok: false, error: `${key} must be an ISO 8601 date string` };
    }
    options[key] = date;
  }

  if (options.completedAt && !options.startedAt) {
    options.startedAt = options.completedAt;
  }
  if (
    options.startedAt &&
    options.completedAt &&
    options.completedAt < options.startedAt
  ) {
    return { ok: false, error: "completedAt cannot be before startedAt" };
  }
  return { ok: true, options };
}

export async function createCompletedFormResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
  options?: ResponseTimingOptions,
) {
  answers = stripNulFromAnswers(answers);
  metadata = stripNulFromMetadata(metadata);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      user: { select: { email: true, name: true } },
      questions: { 
        where: { deletedAt: null },
        orderBy: { order: "asc" } 
      },
      formVersions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!form) throw new Error("Form not found");

  const ipAddress = form.collectIpAddress ? (metadata?.ipAddress ?? null) : null;

  if (options?.partial) {
    // In-progress import: like a saved draft, so no required-field validation,
    // no response-limit check and no post-submission actions.
    const known = new Set(form.questions.map((q) => q.id));
    const unknown = answers.find((a) => !known.has(a.questionId));
    if (unknown) {
      throw new Error(`Answer references unknown question: ${unknown.questionId}`);
    }
    return prisma.formResponse.create({
      data: {
        formId,
        formVersionId: form.formVersions[0]?.id ?? null,
        startedAt: options.startedAt,
        completedAt: null,
        ipAddress,
        userAgent: metadata?.userAgent,
        referrer: metadata?.referrer,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });
  }

  const completedAt = options?.completedAt ?? new Date();
  const answerValidation = validateAnswers(
    form.questions as Parameters<typeof validateAnswers>[0],
    answers,
  );
  if (!answerValidation.valid) {
    throw new Error(answerValidation.errors[0]);
  }

  const response = await prisma.$transaction(async (tx) => {
    if (form.responseLimit) {
      const count = await tx.formResponse.count({
        where: { formId, ...COUNTABLE_RESPONSE_WHERE },
      });
      if (count >= form.responseLimit) {
        throw new Error("This form has reached its response limit");
      }
    }

    if (metadata?.resumeToken) {
      const draft = await tx.formResponse.findFirst({
        where: {
          formId,
          resumeToken: metadata.resumeToken,
          completedAt: null,
        },
      });
      if (draft) {
        await tx.answer.deleteMany({ where: { responseId: draft.id } });
        return tx.formResponse.update({
          where: { id: draft.id },
          data: {
            formVersionId: form.formVersions[0]?.id ?? null,
            completedAt,
            resumeToken: null,
            ipAddress,
            userAgent: metadata.userAgent,
            referrer: metadata.referrer,
            answers: {
              create: answers.map((a) => ({
                questionId: a.questionId,
                value: a.value,
              })),
            },
          },
        });
      }
    }

    return tx.formResponse.create({
      data: {
        formId,
        formVersionId: form.formVersions[0]?.id ?? null,
        startedAt: options?.startedAt,
        completedAt,
        ipAddress,
        userAgent: metadata?.userAgent,
        referrer: metadata?.referrer,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });
  });

  // Imported (back-dated) responses must not re-notify or re-fire webhooks.
  if (!options?.startedAt && !options?.completedAt) {
    const { triggerPostSubmissionActions } = await import(
      "@/lib/post-submission"
    );
    triggerPostSubmissionActions(form, answers, response.id).catch(() => {});
  }

  return response;
}

export async function upsertFormDraft(
  formId: string,
  answers: { questionId: string; value: string }[],
  resumeToken?: string,
  requestIp?: string,
) {
  answers = stripNulFromAnswers(answers);

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      status: true,
      collectIpAddress: true,
      questions: {
        where: { deletedAt: null },
        select: { id: true } 
      },
    },
  });
  if (!form) throw new Error("Form not found");
  if (form.status !== "PUBLISHED") throw new Error("Form is not published");

  const allowed = new Set(form.questions.map((question) => question.id));
  const filtered = answers.filter((answer) => allowed.has(answer.questionId));
  const ipAddress = form.collectIpAddress ? (requestIp ?? null) : null;

  if (resumeToken) {
    const existing = await prisma.formResponse.findFirst({
      where: { formId, resumeToken, completedAt: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.formResponse.update({
          where: { id: existing.id },
          data: { ipAddress },
        });
        await tx.answer.deleteMany({ where: { responseId: existing.id } });
        await tx.answer.createMany({
          data: filtered.map((answer) => ({
            responseId: existing.id,
            questionId: answer.questionId,
            value: answer.value,
          })),
        });
      });
      return { resumeToken };
    }
  }

  const token = crypto.randomUUID();
  await prisma.formResponse.create({
    data: {
      formId,
      resumeToken: token,
      ipAddress,
      answers: {
        create: filtered.map((answer) => ({
          questionId: answer.questionId,
          value: answer.value,
        })),
      },
    },
  });
  return { resumeToken: token };
}

export async function getFormDraft(formId: string, resumeToken: string) {
  const draft = await prisma.formResponse.findFirst({
    where: { formId, resumeToken, completedAt: null },
    include: { answers: true },
  });
  if (!draft?.resumeToken) return null;
  return {
    resumeToken: draft.resumeToken,
    answers: Object.fromEntries(
      draft.answers.map((answer) => [answer.questionId, answer.value]),
    ),
  };
}
