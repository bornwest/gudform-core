import { sendGTMEvent } from "@next/third-parties/google";

/** The events public forms push to the GTM data layer. */
export type FormEventName =
  | "form_view"
  | "form_start"
  | "form_question_submit"
  | "form_submit";

export interface FormEventQuestion {
  id: string;
  type: string;
  title: string;
}

/**
 * Pushes a form event to the GTM data layer. Does nothing unless the page
 * loaded GTM (`form.gtm`), which is never the case in preview. Answers are
 * never sent.
 */
export function pushFormEvent(
  event: FormEventName,
  form: { id: string; title: string; gtm?: boolean },
  question?: FormEventQuestion & { number: number },
) {
  if (!form.gtm || typeof window === "undefined") return;
  try {
    sendGTMEvent({
      event,
      form_id: form.id,
      form_title: form.title,
      ...(question && {
        question_id: question.id,
        question_number: question.number,
        question_type: question.type,
        question_title: question.title,
      }),
    });
  } catch {
    // Tracking must never break the form.
  }
}
