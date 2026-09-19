export type OnboardingStep = "create" | "publish" | "share" | "response";

export type OnboardingFormSummary = {
  status: string;
  publishedAt: Date | string | null;
  responses: number;
};

export function getOnboardingProgress(forms: OnboardingFormSummary[]): {
  completed: OnboardingStep[];
  next: OnboardingStep | null;
  done: boolean;
} {
  const completed: OnboardingStep[] = [];
  if (forms.length === 0) {
    return { completed, next: "create", done: false };
  }
  completed.push("create");

  const published = forms.some(
    (form) => form.status === "PUBLISHED" || Boolean(form.publishedAt),
  );
  if (!published) {
    return { completed, next: "publish", done: false };
  }
  completed.push("publish");

  const hasResponse = forms.some((form) => form.responses > 0);
  if (!hasResponse) {
    return { completed, next: "share", done: false };
  }
  completed.push("share", "response");
  return { completed, next: null, done: true };
}
