"use server";

import { revalidatePath } from "next/cache";
import {
  FormStatus,
  FormThemeMode,
  Prisma,
  QuestionType,
} from "@prisma/client";

import { getCurrency } from "@/config/currencies";
import { isSaasEdition } from "@/config/edition";
import {
  ensureDefaultCollection,
  getAccessibleFormIdsForTeamMember,
} from "@/lib/collections";
import { prisma } from "@/lib/db";
import {
  createCompletedFormResponse,
  createPendingPaymentResponse,
  getFormDraft,
  upsertFormDraft,
  type FormResponseMetadata,
} from "@/lib/form-response";
import { assertPlanFeature } from "@/lib/plan-gates";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { getCurrentUser } from "@/lib/session";
import { getEffectivePlanConfig } from "@/lib/subscription";
import { requireTurnstileForPublicSubmit } from "@/lib/turnstile";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { generateSlug } from "@/lib/utils";

function formOwnerSelect() {
  // Hosted billing relations are stripped from the public Prisma schema.
  if (isSaasEdition()) {
    return {
      stripeConnectAccount: {
        select: { onboardingCompleted: true },
      },
      subscription: {
        select: { plan: true },
      },
    } as object;
  }
  return { id: true };
}

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

  const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);

  const where: any = {
    OR: [{ userId: user.id }, { id: { in: accessibleIds } }],
  };
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
        select: {
          responses: { where: COUNTABLE_RESPONSE_WHERE },
          questions: true,
        },
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
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
      _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE } } },
      user: {
        select: formOwnerSelect(),
      },
    },
  });

  // Fallback: check team access via collections
  if (!form) {
    const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);
    if (accessibleIds.includes(formId)) {
      form = await prisma.form.findFirst({
        where: { id: formId },
        include: {
          questions: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
          },
          _count: {
            select: { responses: { where: COUNTABLE_RESPONSE_WHERE } },
          },
          user: {
            select: formOwnerSelect(),
          },
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
    displayMode?: string;
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
  if (data.webhookUrl === "") updateData.webhookUrl = null;
  if (data.webhookSecret === "") updateData.webhookSecret = null;

  const plan = await getEffectivePlanConfig(user.id);
  if (data.webhookUrl || data.webhookSecret) {
    assertPlanFeature(plan, "webhooks", "Webhooks");
  }
  if (data.autoResponderEnabled === true) {
    assertPlanFeature(plan, "customBranding", "Auto-responder emails");
  }
  if (data.removeBranding === true) {
    assertPlanFeature(plan, "customBranding", "Custom branding");
  }
  if (data.paymentEnabled === true) {
    assertPlanFeature(plan, "paymentCollection", "Payments");
  }

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
    include: {
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
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
    // Get existing question IDs (only non-deleted)
    const existing = await tx.question.findMany({
      where: { formId, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((q) => q.id));

    // IDs present in the incoming array (existing questions being kept)
    const incomingIds = new Set(
      questions.filter((q) => q.id).map((q) => q.id!),
    );

    // Soft-delete questions that were removed by the user
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id),
    );
    if (idsToDelete.length > 0) {
      await tx.question.updateMany({
        where: { id: { in: idsToDelete } },
        data: { deletedAt: new Date() },
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

    // Return all non-deleted questions with their IDs in order
    return tx.question.findMany({
      where: { formId, deletedAt: null },
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

type VersionChange = {
  type: "add" | "remove" | "modify" | "reorder";
  questionId: string;
  details?: string;
};

type VersionClassification = {
  isBreaking: boolean;
  changes: VersionChange[];
  summary: string;
};

/**
 * Create an immutable snapshot of the form schema
 */
async function createFormVersion(
  formId: string,
  questions: any[],
  classification: VersionClassification,
  tx: any,
): Promise<string> {
  // Get the next version number
  const latestVersion = await tx.formVersion.findFirst({
    where: { formId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });

  const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  const snapshot = {
    questions: questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      properties: q.properties,
      logic: q.logic,
    })),
    createdAt: new Date().toISOString(),
  };

  const version = await tx.formVersion.create({
    data: {
      formId,
      versionNumber,
      snapshot,
      isBreaking: classification.isBreaking,
      changesSummary: classification.summary,
    },
  });

  return version.id;
}

/**
 * Classify changes between old and new question sets
 */
function classifyChanges(
  oldQuestions: any[],
  newQuestions: any[],
): VersionClassification {
  const changes: VersionChange[] = [];
  let isBreaking = false;

  const oldMap = new Map(oldQuestions.map((q) => [q.id, q]));
  const newMap = new Map(
    newQuestions
      .filter((q) => !q.id.startsWith("draft_"))
      .map((q) => [q.id, q]),
  );

  // Check for removed questions (breaking)
  for (const [id, oldQ] of Array.from(oldMap.entries())) {
    if (!newMap.has(id)) {
      changes.push({
        type: "remove",
        questionId: id,
        details: `Removed: "${oldQ.title}"`,
      });
      isBreaking = true;
    }
  }

  // Check for new questions
  for (const newQ of newQuestions) {
    if (newQ.id.startsWith("draft_")) {
      changes.push({
        type: "add",
        questionId: newQ.id,
        details: `Added: "${newQ.title}"`,
      });
      // New optional questions are not breaking
      if (newQ.required) {
        isBreaking = true;
      }
    }
  }

  // Check for modified questions
  for (const [id, newQ] of Array.from(newMap.entries())) {
    const oldQ = oldMap.get(id);
    if (!oldQ) continue;

    // Type change is breaking
    if (oldQ.type !== newQ.type) {
      changes.push({
        type: "modify",
        questionId: id,
        details: `Type changed from ${oldQ.type} to ${newQ.type}`,
      });
      isBreaking = true;
    }

    // Making a question required is breaking
    if (!oldQ.required && newQ.required) {
      changes.push({
        type: "modify",
        questionId: id,
        details: "Made required",
      });
      isBreaking = true;
    }

    // Check for removed options in multiple choice (breaking)
    if (
      (oldQ.type === "MULTIPLE_CHOICE" || oldQ.type === "DROPDOWN") &&
      oldQ.properties?.options &&
      newQ.properties?.options
    ) {
      const oldOptions = new Set(
        oldQ.properties.options.map((o: any) => o.value || o),
      );
      const newOptions = new Set(
        newQ.properties.options.map((o: any) => o.value || o),
      );
      const removedOptions = Array.from(oldOptions).filter(
        (opt) => !newOptions.has(opt),
      );

      if (removedOptions.length > 0) {
        changes.push({
          type: "modify",
          questionId: id,
          details: `Removed options: ${removedOptions.join(", ")}`,
        });
        isBreaking = true;
      }
    }

    // Order change (not breaking)
    if (oldQ.order !== newQ.order) {
      changes.push({
        type: "reorder",
        questionId: id,
        details: `Moved from position ${oldQ.order} to ${newQ.order}`,
      });
    }

    // Title change (not breaking)
    if (oldQ.title !== newQ.title) {
      changes.push({
        type: "modify",
        questionId: id,
        details: `Renamed from "${oldQ.title}" to "${newQ.title}"`,
      });
    }
  }

  const summary =
    changes.length > 0
      ? changes.map((c) => c.details || c.type).join("; ")
      : "No changes";

  return { isBreaking, changes, summary };
}

/**
 * Publish draft questions: copy draftQuestions to the live questions table,
 * create an immutable version snapshot, and clear the draft.
 * Returns classification of changes (breaking vs compatible).
 */
export async function publishDraftQuestions(formId: string): Promise<{
  versionId: string;
  isBreaking: boolean;
  changesSummary: string;
}> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!form) throw new Error("Form not found");
  if (!form.draftQuestions) throw new Error("No draft changes to publish");

  const draft = form.draftQuestions as any[];

  // Classify changes before publishing
  const classification = classifyChanges(form.questions, draft);

  const result = await prisma.$transaction(async (tx) => {
    const existingIds = new Set(form.questions.map((q) => q.id));
    const draftExistingIds = new Set(
      draft.filter((q) => !q.id.startsWith("draft_")).map((q) => q.id),
    );

    // Soft-delete questions removed in the draft
    const idsToDelete = Array.from(existingIds).filter(
      (id) => !draftExistingIds.has(id),
    );
    if (idsToDelete.length > 0) {
      await tx.question.updateMany({
        where: { id: { in: idsToDelete } },
        data: { deletedAt: new Date() },
      });
    }

    // Track created question IDs for draft_ replacements
    const draftIdMap = new Map<string, string>();

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
            deletedAt: null, // Un-soft-delete if it was previously deleted
          },
        });
      } else {
        const created = await tx.question.create({
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
        if (q.id.startsWith("draft_")) {
          draftIdMap.set(q.id, created.id);
        }
      }
    }

    // Get all questions with real IDs for the version snapshot
    const finalQuestions = await tx.question.findMany({
      where: { formId, deletedAt: null },
      orderBy: { order: "asc" },
    });

    // Create immutable version snapshot
    const versionId = await createFormVersion(
      formId,
      finalQuestions,
      classification,
      tx,
    );

    // Clear draft
    await tx.form.update({
      where: { id: formId },
      data: { draftQuestions: Prisma.DbNull },
    });

    return { versionId, classification };
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath(`/f/${form.slug}`);

  return {
    versionId: result.versionId,
    isBreaking: result.classification.isBreaking,
    changesSummary: result.classification.summary,
  };
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
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
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
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!form) return null;

  // Check if form is closed by date
  if (form.closeDate && new Date() > form.closeDate) return null;

  // Check response limit
  if (form.responseLimit) {
    const responseCount = await prisma.formResponse.count({
      where: { formId: form.id, ...COUNTABLE_RESPONSE_WHERE },
    });
    if (responseCount >= form.responseLimit) return null;
  }

  return form;
}

export async function createPendingResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
  selectedOptionIds?: string[],
) {
  await requireTurnstileForPublicSubmit(metadata?.turnstileToken);
  return createPendingPaymentResponse(
    formId,
    answers,
    metadata,
    selectedOptionIds,
  );
}

export async function submitFormResponse(
  formId: string,
  answers: { questionId: string; value: string }[],
  metadata?: FormResponseMetadata,
) {
  await requireTurnstileForPublicSubmit(metadata?.turnstileToken);
  return createCompletedFormResponse(formId, answers, metadata);
}

export async function saveFormDraft(
  formId: string,
  answers: { questionId: string; value: string }[],
  resumeToken?: string,
) {
  return upsertFormDraft(formId, answers, resumeToken);
}

export async function loadFormDraft(formId: string, resumeToken: string) {
  return getFormDraft(formId, resumeToken);
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

  const responses = await prisma.formResponse.findMany({
    where: { formId, ...COUNTABLE_RESPONSE_WHERE },
    include: {
      answers: {
        include: { question: true },
      },
      formVersion: {
        select: {
          id: true,
          versionNumber: true,
          snapshot: true,
          createdAt: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  // Enrich responses with version-specific question metadata
  return responses.map((response) => {
    if (!response.formVersion?.snapshot) {
      return response;
    }

    const versionSnapshot = response.formVersion.snapshot as {
      questions?: Array<{
        id: string;
        title?: string;
        type?: string;
        properties?: any;
      }>;
    };
    const questionMap = new Map(
      versionSnapshot.questions?.map((q) => [q.id, q]) || [],
    );

    return {
      ...response,
      answers: response.answers.map((answer) => {
        const versionQuestion = questionMap.get(answer.questionId);
        return {
          ...answer,
          question: {
            ...answer.question,
            // Use historical labels from version if available
            title: versionQuestion?.title ?? answer.question.title,
            type: versionQuestion?.type ?? answer.question.type,
            properties:
              versionQuestion?.properties ?? answer.question.properties,
          },
        };
      }),
    };
  });
}

export async function getFormAnalytics(formId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Check direct ownership or team access via collections
  let form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!form) {
    const accessibleIds = await getAccessibleFormIdsForTeamMember(user.id);
    if (accessibleIds.includes(formId)) {
      form = await prisma.form.findFirst({
        where: { id: formId },
        include: {
          questions: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
          },
        },
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
