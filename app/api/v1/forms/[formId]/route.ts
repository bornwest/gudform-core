import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

// GET /api/v1/forms/:formId
export async function GET(req: Request, context: RouteContext) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await context.params;

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
    include: {
      questions: { orderBy: { order: "asc" } },
      collection: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({ form });
}

// PATCH /api/v1/forms/:formId
export async function PATCH(req: Request, context: RouteContext) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const allowedFields = [
    "title",
    "description",
    "themeColor",
    "backgroundColor",
    "showProgressBar",
    "redirectUrl",
    "notifyOnResponse",
    "status",
    "collectionId",
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Validate collection ownership when moving forms
  if (updateData.collectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: updateData.collectionId, userId: auth.userId },
    });
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }
  }

  if (updateData.status === "PUBLISHED" && form.status !== "PUBLISHED") {
    updateData.publishedAt = new Date();
  }

  const updated = await prisma.form.update({
    where: { id: formId },
    data: updateData,
  });

  return NextResponse.json({ form: updated });
}

// DELETE /api/v1/forms/:formId
export async function DELETE(req: Request, context: RouteContext) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await context.params;

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  await prisma.form.delete({ where: { id: formId } });

  return NextResponse.json({ deleted: true });
}
