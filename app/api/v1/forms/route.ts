import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { ensureDefaultCollection } from "@/lib/collections";
import { parseQuestionsPayload, replaceFormQuestions } from "@/lib/form-questions";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

// GET /api/v1/forms — List all forms
export async function GET(req: Request) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const url = new URL(req.url);
  const collectionId = url.searchParams.get("collectionId") || undefined;

  const forms = await prisma.form.findMany({
    where: {
      userId: auth.userId,
      ...(collectionId ? { collectionId } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      collectionId: true,
      collection: { select: { id: true, name: true } },
      themeColor: true,
      backgroundColor: true,
      themeMode: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE }, questions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ forms });
}

// POST /api/v1/forms — Create a new form
export async function POST(req: Request) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const body = await req.json().catch(() => ({}));
  const title = body.title || "Untitled Form";

  const { generateSlug } = await import("@/lib/utils");

  // Assign to specified collection or default collection
  let collectionId = body.collectionId || null;
  if (!collectionId) {
    const defaultCol = await ensureDefaultCollection(auth.userId);
    collectionId = defaultCol.id;
  } else {
    // Validate collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: auth.userId },
    });
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }
  }

  const form = await prisma.form.create({
    data: {
      title,
      slug: generateSlug(),
      userId: auth.userId,
      description: body.description || null,
      collectionId,
    },
  });

  if (body.questions) {
    const parsed = parseQuestionsPayload(body.questions);
    if (!parsed.ok) {
      await prisma.form.delete({ where: { id: form.id } });
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const questions = await replaceFormQuestions(form.id, parsed.questions);
    return NextResponse.json({ form: { ...form, questions } }, { status: 201 });
  }

  return NextResponse.json({ form }, { status: 201 });
}
