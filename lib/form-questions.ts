import { Prisma, QuestionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { questionSchema } from "@/lib/validations/form";

export type QuestionWriteInput = {
  id?: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  properties?: Record<string, unknown>;
  logic?: unknown[];
};

export type ParseQuestionsResult =
  | { ok: true; questions: QuestionWriteInput[] }
  | { ok: false; error: string };

export function parseQuestionsPayload(raw: unknown): ParseQuestionsResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "questions must be an array" };
  }
  const questions: QuestionWriteInput[] = [];
  for (const item of raw) {
    const parsed = questionSchema.safeParse(item);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Invalid question",
      };
    }
    questions.push(parsed.data as QuestionWriteInput);
  }
  return { ok: true, questions };
}

/** Replace the live question list for a form. Incoming ids are kept. */
export async function replaceFormQuestions(
  formId: string,
  questions: QuestionWriteInput[],
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.question.findMany({
      where: { formId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((q) => q.id));
    const incomingIds = new Set(
      questions.filter((q) => q.id).map((q) => q.id!),
    );

    const idsToDelete = Array.from(existingIds).filter(
      (id) => !incomingIds.has(id),
    );
    if (idsToDelete.length > 0) {
      await tx.question.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

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
            properties: (q.properties ?? {}) as Prisma.InputJsonValue,
            logic: (q.logic ?? []) as Prisma.InputJsonValue,
          },
        }),
      );

    const createPromises = questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => !q.id || !existingIds.has(q.id!))
      .map(({ q, index }) =>
        tx.question.create({
          data: {
            formId,
            order: index,
            type: q.type,
            title: q.title,
            description: q.description ?? null,
            required: q.required ?? false,
            properties: (q.properties ?? {}) as Prisma.InputJsonValue,
            logic: (q.logic ?? []) as Prisma.InputJsonValue,
          },
        }),
      );

    await Promise.all([...updatePromises, ...createPromises]);

    return tx.question.findMany({
      where: { formId },
      orderBy: { order: "asc" },
    });
  });
}
