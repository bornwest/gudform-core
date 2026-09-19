import { QuestionType } from "@prisma/client";

import { isSaasEdition } from "@/config/edition";
import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/html-escape";
import { getEffectivePlanConfig } from "@/lib/subscription";
import { formatChoiceAnswerForDisplay } from "@/lib/choice-answers";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { getResend, getEmailFrom } from "@/lib/email";

interface PostSubmissionForm {
  id: string;
  title: string;
  userId: string;
  notifyOnResponse: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  autoResponderEnabled: boolean;
  autoResponderSubject: string | null;
  autoResponderMessage: string | null;
  user: { email: string | null; name: string | null };
  questions: { id: string; type: QuestionType; title: string }[];
}

export async function triggerPostSubmissionActions(
  form: PostSubmissionForm,
  answers: { questionId: string; value: string }[],
  responseId: string,
) {
  const resend = getResend();

  const answerDetails = answers.map((a) => {
    const q = form.questions.find((q) => q.id === a.questionId);
    return { question: q?.title || "Unknown", answer: formatChoiceAnswerForDisplay(a.value) };
  });

  // 1. Notification email to form owner
  if (form.notifyOnResponse && form.user.email && resend) {
    try {
      const responseCount = await prisma.formResponse.count({
        where: { formId: form.id, ...COUNTABLE_RESPONSE_WHERE },
      });

      const safeTitle = escapeHtml(form.title);
      await resend.emails.send({
        from: getEmailFrom(),
        to: form.user.email,
        subject: `New response on "${form.title}"`,
        html: `<h2>New response on "${safeTitle}"</h2>
          <p>Response #${responseCount}</p>
          ${answerDetails.map((a) => `<p><strong>${escapeHtml(a.question)}</strong><br/>${escapeHtml(a.answer) || "\u2014"}</p>`).join("")}
          <p style="color:#999;font-size:12px;">Sent by GudForm</p>`,
      });
    } catch (error) {
      console.error(
        `[post-submission] Failed to send owner notification for form ${form.id}:`,
        error
      );
    }
  }

  // 2. Webhook delivery
  if (form.webhookUrl) {
    const { deliverWebhook } = await import("@/lib/webhooks");
    await deliverWebhook(form.webhookUrl, form.webhookSecret, {
      event: "form.response.completed",
      formId: form.id,
      formTitle: form.title,
      responseId,
      answers: answerDetails,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Auto-responder to respondent (Pro+ only)
  // 
  // CRITICAL: Auto-responder emails to arbitrary submitters require a verified
  // production domain in Resend. The default onboarding@resend.dev is a sandbox
  // that only delivers to verified recipients (typically just the account owner).
  //
  // To enable auto-responder in production:
  // 1. Add and verify your domain in Resend: https://resend.com/domains
  // 2. Set RESEND_FROM="GudForm <noreply@yourdomain.com>" in environment
  //
  // Without RESEND_FROM configured, emails to submitters will silently fail.
  const planConfig = await getEffectivePlanConfig(form.userId);
  const hasAutoResponder = planConfig.features.customBranding;

  if (
    hasAutoResponder &&
    resend &&
    form.autoResponderEnabled &&
    form.autoResponderSubject &&
    form.autoResponderMessage
  ) {
    // Find the first EMAIL question to send confirmation to
    const emailQuestion = form.questions.find((q) => q.type === "EMAIL");
    if (emailQuestion) {
      const emailAnswer = answers.find(
        (a) => a.questionId === emailQuestion.id,
      );
      if (emailAnswer?.value) {
        try {
          await resend.emails.send({
            from: getEmailFrom(),
            to: emailAnswer.value,
            subject: form.autoResponderSubject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2>${escapeHtml(form.autoResponderSubject)}</h2>
              <p style="white-space:pre-wrap;">${escapeHtml(form.autoResponderMessage)}</p>
              <p style="color:#999;font-size:12px;margin-top:32px;">
                Automated response from "${escapeHtml(form.title)}" on GudForm.
              </p>
            </div>`,
          });
        } catch (error) {
          console.error(
            `[post-submission] Failed to send auto-responder for form ${form.id} to ${emailAnswer.value}:`,
            error
          );
          // Auto-responder failure is logged but doesn't block other post-submission actions
          // Owner should check Resend dashboard for delivery issues if using sandbox domain
        }
      }
    }
  }

  // 4. Marketplace integrations (hosted only)
  if (!isSaasEdition()) return;

  try {
    const { deliverToIntegrations } = await import(
      "@/lib/integration-delivery"
    );
    const enrichedAnswers = answerDetails.map((a, i) => {
      const q = form.questions.find((q) => q.title === a.question);
      return {
        questionId: answers[i]?.questionId || "",
        question: a.question,
        type: q?.type || "SHORT_TEXT",
        answer: a.answer,
      };
    });
    await deliverToIntegrations(
      form.id,
      form.userId,
      responseId,
      form.title,
      enrichedAnswers,
    );
  } catch (err) {
    console.error("Integration delivery failed:", err);
  }
}
