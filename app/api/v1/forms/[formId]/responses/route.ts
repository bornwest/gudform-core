import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { createCompletedFormResponse } from "@/lib/form-response";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

// GET /api/v1/forms/:formId/responses
export async function GET(req: Request, context: RouteContext) {
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

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const skip = (page - 1) * limit;

  const [responses, total] = await Promise.all([
    prisma.formResponse.findMany({
      where: { formId, ...COUNTABLE_RESPONSE_WHERE },
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
    prisma.formResponse.count({ where: { formId, ...COUNTABLE_RESPONSE_WHERE } }),
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

export async function POST(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { formId } = await context.params;
  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
    select: { id: true, status: true },
  });
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  if (form.status === "CLOSED") {
    return NextResponse.json({ error: "Form is closed" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const answers = Array.isArray(body.answers) ? body.answers : null;
  if (!answers) {
    return NextResponse.json(
      { error: "answers must be an array of { questionId, value }" },
      { status: 400 },
    );
  }

  try {
    const response = await createCompletedFormResponse(formId, answers);
    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to submit response",
      },
      { status: 400 },
    );
  }
}
