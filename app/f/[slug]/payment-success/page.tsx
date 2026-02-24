import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { triggerPostSubmissionActions } from "@/lib/post-submission";
import { contrastColor } from "@/lib/utils";

interface PaymentSuccessProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    session_id?: string;
    response_id?: string;
  }>;
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessProps) {
  const { slug } = await params;
  const { session_id, response_id } = await searchParams;

  if (!session_id || !response_id) notFound();

  // Load form
  const form = await prisma.form.findFirst({
    where: { slug },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form) notFound();

  // Verify checkout session
  const stripe = getStripe();
  let paymentConfirmed = false;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      paymentConfirmed = true;

      // Finalize the response if still pending
      const response = await prisma.formResponse.findFirst({
        where: {
          id: response_id,
          formId: form.id,
          paymentStatus: "PENDING",
        },
        include: { answers: true },
      });

      if (response) {
        await prisma.formResponse.update({
          where: { id: response_id },
          data: {
            completedAt: new Date(),
            paymentStatus: "COMPLETED",
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          },
        });

        // Trigger post-submission actions (fire-and-forget)
        const answerPayload = response.answers.map((a) => ({
          questionId: a.questionId,
          value: a.value,
        }));
        triggerPostSubmissionActions(form, answerPayload, response_id).catch(
          () => {},
        );
      }
    }
  } catch {
    // Session verification failed — may be invalid or expired
  }

  if (!paymentConfirmed) {
    redirect(`/f/${slug}/payment-cancel?response_id=${response_id}`);
  }

  // Find the thank-you question for display
  const thankYouQuestion = form.questions.find(
    (q) => q.type === "THANK_YOU_SCREEN",
  );

  // Determine effective background colour.  When themeMode is DARK and the
  // stored background is plain white we swap it to a dark surface.
  const defaultBg = form.backgroundColor || "#ffffff";
  const isDefaultWhiteBg =
    defaultBg.toLowerCase() === "#ffffff" || defaultBg.toLowerCase() === "#fff";
  const bgColor =
    form.themeMode === "DARK" && isDefaultWhiteBg ? "#0f172a" : defaultBg;

  // Detect dark background using actual luminance — reliable for every colour.
  const isDark = contrastColor(bgColor) === "white";

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: form.themeColor }}
        >
          <svg
            className="size-8"
            style={{ color: contrastColor(form.themeColor) }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1
          className="text-4xl font-bold"
          style={{ color: isDark ? "#f9fafb" : "#111827" }}
        >
          {thankYouQuestion?.title || "Thank you!"}
        </h1>
        {thankYouQuestion?.description && (
          <p
            className="mt-4 text-lg"
            style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
          >
            {thankYouQuestion.description}
          </p>
        )}
        <div
          className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
            color: isDark ? "#4ade80" : "#15803d",
          }}
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Payment confirmed
        </div>
      </div>
    </div>
  );
}
