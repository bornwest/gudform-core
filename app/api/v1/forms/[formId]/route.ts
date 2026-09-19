import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { formId } = await context.params;

  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
    include: {
      questions: { orderBy: { order: "asc" } },
      collection: { select: { id: true, name: true } },
      _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE } } },
    },
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({ form });
}

export async function PATCH(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

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

export async function DELETE(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

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
