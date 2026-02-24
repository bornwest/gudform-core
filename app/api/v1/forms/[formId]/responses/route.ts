import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

// GET /api/v1/forms/:formId/responses
export async function GET(req: Request, context: RouteContext) {
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

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const skip = (page - 1) * limit;

  const [responses, total] = await Promise.all([
    prisma.formResponse.findMany({
      where: { formId },
      include: {
        answers: {
          include: {
            question: { select: { id: true, title: true, type: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.formResponse.count({ where: { formId } }),
  ]);

  return NextResponse.json({
    responses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
