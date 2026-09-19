import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

// GET /api/v1/collections/:collectionId — Get a single collection
export async function GET(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { collectionId } = await context.params;

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: auth.userId },
    include: {
      forms: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE }, questions: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { forms: true, teams: true } },
    },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ collection });
}

// PATCH /api/v1/collections/:collectionId — Update a collection
export async function PATCH(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { collectionId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: auth.userId },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.isDefault) {
    return NextResponse.json(
      { error: "Cannot rename the default collection" },
      { status: 400 },
    );
  }

  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json(
      { error: "Name is required (1-50 characters)" },
      { status: 400 },
    );
  }

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: { name },
  });

  return NextResponse.json({ collection: updated });
}

// DELETE /api/v1/collections/:collectionId — Delete a collection
export async function DELETE(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { collectionId } = await context.params;

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: auth.userId },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete the default collection" },
      { status: 400 },
    );
  }

  // Move orphaned forms back to default collection
  const defaultCollection = await prisma.collection.findFirst({
    where: { userId: auth.userId, isDefault: true },
  });

  if (defaultCollection) {
    await prisma.form.updateMany({
      where: { collectionId },
      data: { collectionId: defaultCollection.id },
    });
  }

  await prisma.collection.delete({ where: { id: collectionId } });

  return NextResponse.json({ deleted: true });
}
