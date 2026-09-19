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

export async function createPendingPaymentResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
  selectedOptionIds?: string[],
) {
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
        ipAddress: metadata?.ipAddress,
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

export async function createCompletedFormResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
) {
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
            completedAt: new Date(),
            resumeToken: null,
            ipAddress: metadata.ipAddress,
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
        completedAt: new Date(),
        ipAddress: metadata?.ipAddress,
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

  const { triggerPostSubmissionActions } = await import(
    "@/lib/post-submission"
  );
  triggerPostSubmissionActions(form, answers, response.id).catch(() => {});

  return response;
}

export async function upsertFormDraft(
  formId: string,
  answers: { questionId: string; value: string }[],
  resumeToken?: string,
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      status: true,
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

  if (resumeToken) {
    const existing = await prisma.formResponse.findFirst({
      where: { formId, resumeToken, completedAt: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.$transaction(async (tx) => {
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
