import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { authorizeApiRequest } from "@/lib/api-auth";
import { parseQuestionsPayload, replaceFormQuestions } from "@/lib/form-questions";

interface RouteContext {
  params: Promise<{ formId: string }>;
}

export async function PUT(req: Request, context: RouteContext) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;
  const auth = gate.auth;

  const { formId } = await context.params;
  const form = await prisma.form.findFirst({
    where: { id: formId, userId: auth.userId },
    select: { id: true },
  });
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseQuestionsPayload(body.questions);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const questions = await replaceFormQuestions(formId, parsed.questions);
  return NextResponse.json({ questions });
}
