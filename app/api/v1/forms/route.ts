import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import { ensureDefaultCollection } from "@/lib/collections";

// GET /api/v1/forms — List all forms
export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      _count: { select: { responses: true, questions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ forms });
}

// POST /api/v1/forms — Create a new form
export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ form }, { status: 201 });
}
