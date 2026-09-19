import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { ensureDefaultCollection } from "@/lib/collections";

// GET /api/v1/collections — List all collections
export async function GET(req: Request) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  // Ensure the user has at least a default collection
  await ensureDefaultCollection(auth.userId);

  const collections = await prisma.collection.findMany({
    where: { userId: auth.userId },
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { forms: true, teams: true } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ collections });
}

// POST /api/v1/collections — Create a new collection
export async function POST(req: Request) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const body = await req.json().catch(() => ({}));
  const name = body.name?.trim();

  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json(
      { error: "Name is required (1-50 characters)" },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.create({
    data: {
      name,
      userId: auth.userId,
    },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
