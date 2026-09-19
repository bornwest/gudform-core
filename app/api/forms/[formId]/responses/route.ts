import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

// Public endpoint for submitting form responses
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> },
) {
  try {
    const { answers } = await req.json();
    const { formId } = await params;

    const form = await prisma.form.findFirst({
      where: { id: formId, status: "PUBLISHED" },
      include: {
        user: { select: { email: true, name: true } },
        questions: { select: { id: true, type: true, title: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if form is closed
    if (form.closeDate && new Date() > form.closeDate) {
      return NextResponse.json({ error: "Form is closed" }, { status: 403 });
    }

    // Check response limit
    if (form.responseLimit) {
      const count = await prisma.formResponse.count({
        where: { formId, ...COUNTABLE_RESPONSE_WHERE },
      });
      if (count >= form.responseLimit) {
        return NextResponse.json(
          { error: "Response limit reached" },
          { status: 403 },
        );
      }
    }

    const response = await prisma.formResponse.create({
      data: {
        formId,
        completedAt: new Date(),
        ipAddress: req.headers.get("x-forwarded-for") || null,
        userAgent: req.headers.get("user-agent") || null,
        referrer: req.headers.get("referer") || null,
        answers: {
          create: answers.map(
            (a: { questionId: string; value: string }) => ({
              questionId: a.questionId,
              value: a.value,
            }),
          ),
        },
      },
    });

    // Fire-and-forget post-submission actions (notifications, webhooks, integrations)
    const { triggerPostSubmissionActions } = await import(
      "@/lib/post-submission"
    );
    triggerPostSubmissionActions(form, answers, response.id).catch(() => {});

    return NextResponse.json({ id: response.id });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 },
    );
  }
}
