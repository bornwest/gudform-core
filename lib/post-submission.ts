import { QuestionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/html-escape";

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
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const answerDetails = answers.map((a) => {
    const q = form.questions.find((q) => q.id === a.questionId);
    return { question: q?.title || "Unknown", answer: a.value };
  });

  // 1. Notification email to form owner
  if (form.notifyOnResponse && form.user.email) {
    const responseCount = await prisma.formResponse.count({
      where: { formId: form.id },
    });

    const safeTitle = escapeHtml(form.title);
    await resend.emails.send({
      from: "GudForm <onboarding@resend.dev>",
      to: form.user.email,
      subject: `New response on "${form.title}"`,
      html: `<h2>New response on "${safeTitle}"</h2>
        <p>Response #${responseCount}</p>
        ${answerDetails.map((a) => `<p><strong>${escapeHtml(a.question)}</strong><br/>${escapeHtml(a.answer) || "\u2014"}</p>`).join("")}
        <p style="color:#999;font-size:12px;">Sent by GudForm</p>`,
    });
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

  // 3. Auto-responder to respondent (always available in self-hosted)
  if (
    form.autoResponderEnabled &&
    form.autoResponderSubject &&
    form.autoResponderMessage
  ) {
    const emailQuestion = form.questions.find((q) => q.type === "EMAIL");
    if (emailQuestion) {
      const emailAnswer = answers.find(
        (a) => a.questionId === emailQuestion.id,
      );
      if (emailAnswer?.value) {
        await resend.emails.send({
          from: "GudForm <onboarding@resend.dev>",
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
      }
    }
  }
}
