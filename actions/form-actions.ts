"use server";

import { revalidatePath } from "next/cache";
import { FormStatus, FormThemeMode, Prisma, QuestionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { generateSlug } from "@/lib/utils";
import {
  ensureDefaultCollection,
  getAccessibleFormIdsForTeamMember,
} from "@/lib/collections";
import { validateAnswers } from "@/lib/validations/form";
import { getCurrency } from "@/config/currencies";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";

export async function createForm(title?: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const defaultCollection = await ensureDefaultCollection(user.id);

  const MAX_SLUG_RETRIES = 3;
  let form;
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    try {
      form = await prisma.form.create({
        data: {
          title: title || "Untitled Form",
          slug: generateSlug(),
          userId: user.id,
          collectionId: defaultCollection.id,
          questions: {
            create: [
              {
                order: 0,
                type: QuestionType.WELCOME_SCREEN,
                title: "Welcome to our form",
                description: "This will only take a few minutes.",
                properties: {},
              },
              {
                order: 1,
                type: QuestionType.SHORT_TEXT,
                title: "What is your name?",
                required: true,
                properties: { placeholder: "Type your name..." },
              },
              {
                order: 2,
                type: QuestionType.EMAIL,
                title: "What is your email?",
                required: true,
                properties: { placeholder: "name@example.com" },
              },
              {
                order: 3,
                type: QuestionType.THANK_YOU_SCREEN,
                title: "Thank you!",
                description: "Your response has been recorded.",
                properties: {},
              },
            ],
          },
        },
      });
      break;
    } catch (error: any) {
      if (
        error?.code === "P2002" &&
        error?.meta?.target?.includes("slug") &&
        attempt < MAX_SLUG_RETRIES - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  revalidatePath("/dashboard");
  return form!;
}

export async function getUserForms(collectionId?: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Lazy init — ensure default collection exists
  await ensureDefaultCollection(user.id);

  const where: any = { userId: user.id };
  if (collectionId) {
    where.collectionId = collectionId;
  }

  return prisma.form.findMany({
    where,
    include: {
      collection: {
        select: { id: true, name: true },
      },
      _count: {
        select: { responses: true, questions: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFormById(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // First try direct ownership
  let form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });

  // Fallback: check team access via collections
  if (!form) {
    const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);
    if (accessibleIds.includes(formId)) {
      form = await prisma.form.findFirst({
        where: { id: formId },
        include: {
          questions: { orderBy: { order: "asc" } },
          _count: { select: { responses: true } },
        },
      });
    }
  }

  return form;
}

export async function updateForm(
  formId: string,
  data: {
    title?: string;
    description?: string;
    themeColor?: string;
    backgroundColor?: string;
    themeMode?: FormThemeMode;
    showProgressBar?: boolean;
    redirectUrl?: string;
    notifyOnResponse?: boolean;
    status?: FormStatus;
    webhookUrl?: string;
    webhookSecret?: string;
    autoResponderEnabled?: boolean;
    autoResponderSubject?: string;
    autoResponderMessage?: string;
    closeDate?: Date | null;
    responseLimit?: number | null;
    paymentEnabled?: boolean;
    paymentAmount?: number;
    paymentCurrency?: string;
    paymentDescription?: string;
    paymentOptions?: PaymentOption[] | null;
    paymentSelectionMode?: PaymentSelectionMode;
    removeBranding?: boolean;
  },
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  // Validate payment options if provided
  if (data.paymentOptions && data.paymentOptions.length > 0) {
    const currencyCode = data.paymentCurrency || form.paymentCurrency || "usd";
    const currency = getCurrency(currencyCode);
    for (const opt of data.paymentOptions) {
      if (!opt.label.trim()) {
        throw new Error("Each payment option must have a label");
      }
      if (opt.amount <= 0) {
        throw new Error("Each payment option amount must be greater than 0");
      }
      if (opt.amount < currency.minAmount) {
        throw new Error(
          `Each payment option must be at least ${currency.minAmount} (smallest unit) for ${currencyCode.toUpperCase()}`,
        );
      }
    }
  }

  const updateData: any = { ...data };
  if (data.status === "PUBLISHED" && form.status !== "PUBLISHED") {
    updateData.publishedAt = new Date();
  }

  const updated = await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteForm(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  await prisma.form.delete({
    where: { id: formId, userId: user.id },
  });

  revalidatePath("/dashboard");
}

export async function duplicateForm(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const original = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!original) throw new Error("Form not found");

  const MAX_SLUG_RETRIES = 3;
  let form;
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    try {
      form = await prisma.form.create({
        data: {
          title: `${original.title} (Copy)`,
          description: original.description,
          slug: generateSlug(),
          userId: user.id,
          collectionId: original.collectionId,
          themeColor: original.themeColor,
          backgroundColor: original.backgroundColor,
          showProgressBar: original.showProgressBar,
          paymentEnabled: original.paymentEnabled,
          paymentAmount: original.paymentAmount,
          paymentCurrency: original.paymentCurrency,
          paymentDescription: original.paymentDescription,
          paymentOptions: original.paymentOptions ?? undefined,
          paymentSelectionMode: original.paymentSelectionMode,
          questions: {
            create: original.questions.map((q) => ({
              order: q.order,
              type: q.type,
              title: q.title,
              description: q.description,
              required: q.required,
              properties: q.properties as any,
              logic: q.logic as any,
            })),
          },
        },
      });
      break;
    } catch (error: any) {
      if (
        error?.code === "P2002" &&
        error?.meta?.target?.includes("slug") &&
        attempt < MAX_SLUG_RETRIES - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  revalidatePath("/dashboard");
  return form!;
}

export async function saveQuestions(
  formId: string,
  questions: {
    id?: string;
    type: QuestionType;
    title: string;
    description?: string;
    required?: boolean;
    properties?: Record<string, any>;
    logic?: any[];
  }[],
): Promise<{ id: string; order: number }[]> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) throw new Error("Form not found");

  // Published forms save to draftQuestions to avoid impacting live form
  if (form.status === "PUBLISHED") {
    return saveDraftQuestions(formId, questions);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Get existing question IDs
    const existing = await tx.question.findMany({
      where: { formId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((q) => q.id));

    // IDs present in the incoming array (existing questions being kept)
    const incomingIds = new Set(
      questions.filter((q) => q.id).map((q) => q.id!),
    );

    // Delete questions that were removed by the user
    const idsToDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
    if (idsToDelete.length > 0) {
      await tx.question.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // Update existing questions (preserve IDs and associated answers)
    const updatePromises = questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => q.id && existingIds.has(q.id!))
      .map(({ q, index }) =>
        tx.question.update({
          where: { id: q.id! },
          data: {
            order: index,
            type: q.type,
            title: q.title,
            description: q.description ?? null,
            required: q.required ?? false,
            properties: q.properties ?? {},
            logic: q.logic ?? [],
          },
        }),
      );

    // Create new questions
    const createPromises = questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => !q.id)
      .map(({ q, index }) =>
        tx.question.create({
          data: {
            formId,
            order: index,
            type: q.type,
            title: q.title,
            description: q.description ?? null,
            required: q.required ?? false,
            properties: q.properties ?? {},
            logic: q.logic ?? [],
          },
        }),
      );

    await Promise.all([...updatePromises, ...createPromises]);

    // Return all questions with their IDs in order
    return tx.question.findMany({
      where: { formId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  return result;
}

/**
 * Save questions as a draft (JSON blob) without touching the live questions.
 * Used when editing a published form so changes don't go live until explicitly published.
 */
async function saveDraftQuestions(
  formId: string,
  questions: {
    id?: string;
    type: QuestionType;
    title: string;
    description?: string;
    required?: boolean;
    properties?: Record<string, any>;
    logic?: any[];
  }[],
): Promise<{ id: string; order: number }[]> {
  const draftData = questions.map((q, index) => ({
    id: q.id || `draft_${index}_${Date.now()}`,
    order: index,
    type: q.type,
    title: q.title,
    description: q.description ?? null,
    required: q.required ?? false,
    properties: q.properties ?? {},
    logic: q.logic ?? [],
  }));

  await prisma.form.update({
    where: { id: formId },
    data: { draftQuestions: draftData as any },
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  return draftData.map((q) => ({ id: q.id, order: q.order }));
}

/**
 * Publish draft questions: copy draftQuestions to the live questions table
 * and clear the draft. Only works on published forms with pending drafts.
 */
export async function publishDraftQuestions(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: { questions: { select: { id: true } } },
  });
  if (!form) throw new Error("Form not found");
  if (!form.draftQuestions) throw new Error("No draft changes to publish");

  const draft = form.draftQuestions as any[];

  await prisma.$transaction(async (tx) => {
    const existingIds = new Set(form.questions.map((q) => q.id));
    const draftExistingIds = new Set(
      draft.filter((q) => !q.id.startsWith("draft_")).map((q) => q.id),
    );

    // Delete questions removed in the draft
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !draftExistingIds.has(id),
    );
    if (idsToDelete.length > 0) {
      await tx.question.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // Update existing questions and create new ones
    for (const q of draft) {
      if (!q.id.startsWith("draft_") && existingIds.has(q.id)) {
        await tx.question.update({
          where: { id: q.id },
          data: {
            order: q.order,
            type: q.type,
            title: q.title,
            description: q.description,
            required: q.required,
            properties: q.properties,
            logic: q.logic,
          },
        });
      } else {
        await tx.question.create({
          data: {
            formId,
            order: q.order,
            type: q.type,
            title: q.title,
            description: q.description,
            required: q.required,
            properties: q.properties,
            logic: q.logic,
          },
        });
      }
    }

    // Clear draft
    await tx.form.update({
      where: { id: formId },
      data: { draftQuestions: Prisma.DbNull },
    });
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath(`/f/${form.slug}`);
}

// Record a form view (fire-and-forget, never blocks rendering)
export async function recordFormView(
  formId: string,
  metadata?: { ipAddress?: string; userAgent?: string; referrer?: string },
) {
  try {
    await prisma.formView.create({
      data: {
        formId,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        referrer: metadata?.referrer ?? null,
      },
    });
  } catch {
    // Silently fail — view tracking should never block form rendering
  }
}

// Preview form for authenticated owner (any status).
// Uses draft questions if available so the owner can preview unpublished edits.
export async function getPreviewForm(slug: string) {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const form = await prisma.form.findFirst({
    where: { slug, userId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form) return null;

  // If draft questions exist, overlay them onto the form for preview
  if (form.draftQuestions && Array.isArray(form.draftQuestions)) {
    const draft = form.draftQuestions as any[];
    return {
      ...form,
      questions: draft.map((q, i) => ({
        id: q.id,
        formId: form.id,
        order: q.order ?? i,
        type: q.type,
        title: q.title,
        description: q.description ?? null,
        required: q.required ?? false,
        properties: q.properties ?? {},
        logic: q.logic ?? [],
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      })),
    };
  }

  return form;
}

// Public actions (no auth required)
export async function getPublicForm(slug: string) {
  const form = await prisma.form.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form) return null;

  // Check if form is closed by date
  if (form.closeDate && new Date() > form.closeDate) return null;

  // Check response limit
  if (form.responseLimit) {
    const responseCount = await prisma.formResponse.count({
      where: { formId: form.id },
    });
    if (responseCount >= form.responseLimit) return null;
  }

  return form;
}

export async function createPendingResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: { ipAddress?: string; userAgent?: string; referrer?: string },
  selectedOptionIds?: string[],
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form?.paymentEnabled) {
    throw new Error("Payment not enabled for this form");
  }

  // Server-side answer validation
  const validation = validateAnswers(
    form.questions as Parameters<typeof validateAnswers>[0],
    answers,
  );
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  // Resolve payment amount — multi-tier vs legacy
  const formPaymentOptions = form.paymentOptions as PaymentOption[] | null;
  let resolvedAmount = form.paymentAmount;
  let resolvedSelectedIds: string[] | undefined;

  if (formPaymentOptions && formPaymentOptions.length > 0 && selectedOptionIds) {
    // Validate selected IDs exist
    const optionMap = new Map(formPaymentOptions.map((o) => [o.id, o]));
    for (const id of selectedOptionIds) {
      if (!optionMap.has(id)) {
        throw new Error(`Invalid payment option: ${id}`);
      }
    }

    // Enforce selection mode
    const selectionMode = form.paymentSelectionMode as PaymentSelectionMode;
    if (selectionMode === "single" && selectedOptionIds.length !== 1) {
      throw new Error("Exactly one payment option must be selected");
    }
    if (selectedOptionIds.length === 0) {
      throw new Error("At least one payment option must be selected");
    }

    // Compute total
    resolvedAmount = selectedOptionIds.reduce(
      (sum, id) => sum + optionMap.get(id)!.amount,
      0,
    );

    // Validate total against currency minimum
    const currency = getCurrency(form.paymentCurrency);
    if (resolvedAmount < currency.minAmount) {
      throw new Error(
        `Total payment must be at least ${currency.minAmount} (smallest unit) for ${form.paymentCurrency.toUpperCase()}`,
      );
    }

    resolvedSelectedIds = selectedOptionIds;
  }

  // Atomic insert with response limit check
  const response = await prisma.$transaction(async (tx) => {
    if (form.responseLimit) {
      const count = await tx.formResponse.count({ where: { formId } });
      if (count >= form.responseLimit) {
        throw new Error("This form has reached its response limit");
      }
    }

    return tx.formResponse.create({
      data: {
        formId,
        // completedAt is NOT set — will be set on payment success
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

export async function submitFormResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: { ipAddress?: string; userAgent?: string; referrer?: string },
) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      user: { select: { email: true, name: true } },
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form) throw new Error("Form not found");

  // Server-side answer validation
  const answerValidation = validateAnswers(
    form.questions as Parameters<typeof validateAnswers>[0],
    answers,
  );
  if (!answerValidation.valid) {
    throw new Error(answerValidation.errors[0]);
  }

  // Atomic insert with response limit check (Phase 2: race condition fix)
  const response = await prisma.$transaction(async (tx) => {
    if (form.responseLimit) {
      const count = await tx.formResponse.count({ where: { formId } });
      if (count >= form.responseLimit) {
        throw new Error("This form has reached its response limit");
      }
    }

    return tx.formResponse.create({
      data: {
        formId,
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

  // Fire-and-forget post-submission actions
  if (form) {
    const { triggerPostSubmissionActions } = await import(
      "@/lib/post-submission"
    );
    triggerPostSubmissionActions(form, answers, response.id).catch(() => {});
  }

  return response;
}

export async function getFormResponses(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Check direct ownership or team access via collections
  let form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
  });
  if (!form) {
    const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);
    if (accessibleIds.includes(formId)) {
      form = await prisma.form.findFirst({ where: { id: formId } });
    }
  }
  if (!form) throw new Error("Form not found");

  return prisma.formResponse.findMany({
    where: { formId },
    include: {
      answers: {
        include: { question: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function getFormAnalytics(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Check direct ownership or team access via collections
  let form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!form) {
    const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);
    if (accessibleIds.includes(formId)) {
      form = await prisma.form.findFirst({
        where: { id: formId },
        include: { questions: { orderBy: { order: "asc" } } },
      });
    }
  }
  if (!form) throw new Error("Form not found");

  // Run all aggregate queries in parallel (no full-table fetch)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalResponses,
    completedResponses,
    avgTimeResult,
    responsesOverTimeRaw,
    viewCount,
    paymentStats,
  ] = await Promise.all([
    // Total response count
    prisma.formResponse.count({ where: { formId } }),

    // Completed response count
    prisma.formResponse.count({
      where: { formId, completedAt: { not: null } },
    }),

    // Avg completion time in seconds via raw SQL
    prisma.$queryRaw<[{ avg_seconds: number | null }]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "startedAt"))) as avg_seconds
      FROM "form_responses"
      WHERE "formId" = ${formId} AND "completedAt" IS NOT NULL
    `,

    // Responses per day (last 30 days) via raw SQL
    prisma.$queryRaw<{ date: Date | string; count: bigint }[]>`
      SELECT DATE("startedAt") as date, COUNT(*) as count
      FROM "form_responses"
      WHERE "formId" = ${formId} AND "startedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("startedAt")
      ORDER BY date
    `,

    // View count
    prisma.formView.count({ where: { formId } }),

    // Payment aggregate (pending)
    prisma.formResponse.aggregate({
      where: { formId, paymentStatus: "PENDING" },
      _count: true,
      _sum: { paymentAmount: true },
    }),
  ]);

  const completionRate =
    totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
  const avgCompletionTime = avgTimeResult[0]?.avg_seconds ?? 0;
  const conversionRate =
    viewCount > 0 ? (completedResponses / viewCount) * 100 : 0;

  // Convert raw SQL results to the expected { [date]: count } format
  const responsesOverTime: Record<string, number> = {};
  for (const row of responsesOverTimeRaw) {
    const dateStr =
      row.date instanceof Date
        ? row.date.toISOString().split("T")[0]
        : String(row.date);
    responsesOverTime[dateStr] = Number(row.count);
  }

  return {
    totalResponses,
    completedResponses,
    completionRate: Math.round(completionRate),
    avgCompletionTime: Math.round(avgCompletionTime),
    responsesOverTime,
    questions: form.questions,
    viewCount,
    conversionRate: Math.round(conversionRate),
    pendingPaymentCount: paymentStats._count,
    pendingPaymentAmount: paymentStats._sum.paymentAmount ?? 0,
  };
}

export async function deleteResponse(responseId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const response = await prisma.formResponse.findFirst({
    where: { id: responseId },
    include: { form: true },
  });

  if (!response || response.form.userId !== user.id) {
    throw new Error("Not found");
  }

  await prisma.formResponse.delete({ where: { id: responseId } });
  revalidatePath(`/dashboard/forms/${response.formId}/responses`);
}
