"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Star } from "lucide-react";
import { toast } from "sonner";

import type { LogicRule } from "@/lib/types/logic";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { isPaymentOptionsForm, isLegacyPaymentForm } from "@/lib/types/payment";
import { cn, contrastColor } from "@/lib/utils";
import {
  validateEmail,
  validatePhone,
  validateWebsite,
} from "@/lib/validations/form";
import { FormattedText } from "@/components/form-renderer/formatted-text";
import {
  getScreenFormat,
  screenDescriptionClassName,
  screenTitleClassName,
} from "@/lib/screen-format";
import {
  formatOtherAnswer,
  isOtherAnswer,
  joinChoiceAnswer,
  parseChoiceAnswer,
  parseOtherAnswer,
  validateChoiceSelections,
  validateRankingAnswer,
} from "@/lib/choice-answers";
import { getTurnstileToken } from "@/components/form-renderer/turnstile-token";
import {
  createPendingResponse,
  loadFormDraft,
  saveFormDraft,
  submitFormResponse,
} from "@/actions/form-actions";
import { PaymentSelector } from "@/components/form-renderer/payment-selector";
import { embedResizeMessage } from "@/lib/embed-protocol";
import { shouldSkipQuestion } from "@/lib/form-logic";
import type { QuestionType } from "@prisma/client";

interface Question {
  id: string;
  order: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  properties: Record<string, any>;
  logic: LogicRule[];
}

interface FormData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  themeColor: string;
  backgroundColor: string;
  themeMode: "LIGHT" | "DARK" | "SYSTEM";
  showProgressBar: boolean;
  displayMode?: string;
  redirectUrl: string | null;
  questions: Question[];
  paymentEnabled: boolean;
  paymentAmount: number | null;
  paymentCurrency: string;
  paymentDescription: string | null;
  paymentOptions: PaymentOption[] | null;
  paymentSelectionMode: PaymentSelectionMode;
  removeBranding: boolean;
}

interface ClassicFormRendererProps {
  form: FormData;
  isPreview?: boolean;
  isEmbed?: boolean;
  colors: any;
  bgIsDark: boolean;
  themeColor: string;
  bgColor: string;
}

function isAnswerableQuestion(type: QuestionType): boolean {
  return (
    type !== "WELCOME_SCREEN" &&
    type !== "THANK_YOU_SCREEN" &&
    type !== "STATEMENT"
  );
}

function getQuestionOptions(question: Question): string[] {
  const options = question.properties?.options;
  if (Array.isArray(options)) {
    return options.filter(
      (option): option is string => typeof option === "string",
    );
  }

  const choices = question.properties?.choices;
  if (Array.isArray(choices)) {
    return choices.filter(
      (choice): choice is string => typeof choice === "string",
    );
  }

  return [];
}

export function ClassicFormRenderer({
  form,
  isPreview = false,
  isEmbed = false,
  colors,
  bgIsDark,
  themeColor,
  bgColor,
}: ClassicFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [pendingAnswerPayload, setPendingAnswerPayload] = useState<
    { questionId: string; value: string }[] | null
  >(null);
  const resumeTokenRef = useRef<string | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = form.questions;
  const answerableQuestions = useMemo(
    () => questions.filter((q) => isAnswerableQuestion(q.type)),
    [questions],
  );

  // Visible questions (after applying logic) - must be before any early returns
  const visibleQuestions = useMemo(() => {
    return answerableQuestions.filter((q) => {
      return !shouldSkipQuestion(q, answers, questions);
    });
  }, [answerableQuestions, answers, questions]);

  // Load draft if available
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("resume");
    const stored = window.localStorage.getItem(`gudform:draft:${form.id}`);
    let parsed: { resumeToken?: string; answers?: Record<string, string> } | null =
      null;
    try {
      parsed = stored ? JSON.parse(stored) : null;
    } catch {
      parsed = null;
    }
    const token = fromUrl || parsed?.resumeToken;
    if (parsed?.answers) {
      setAnswers(parsed.answers);
    }
    if (!token) return;
    loadFormDraft(form.id, token)
      .then((draft) => {
        if (cancelled || !draft) return;
        resumeTokenRef.current = draft.resumeToken;
        setAnswers(draft.answers);
        window.localStorage.setItem(
          `gudform:draft:${form.id}`,
          JSON.stringify({ resumeToken: draft.resumeToken, answers: draft.answers }),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [form.id, isPreview]);

  // Handle embed height
  useEffect(() => {
    if (!isEmbed) return;
    const html = document.documentElement;
    const body = document.body;
    html.style.minHeight = "0";
    body.style.minHeight = "0";
    html.style.height = "auto";
    body.style.height = "auto";
    return () => {
      html.style.minHeight = "";
      body.style.minHeight = "";
      html.style.height = "";
      body.style.height = "";
    };
  }, [isEmbed]);

  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const send = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        320,
      );
      window.parent.postMessage(embedResizeMessage(height), "*");
    };
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.documentElement);
    window.addEventListener("resize", send);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", send);
    };
  }, [submitted, submitting, showPaymentSelector]);

  // Auto-save draft
  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (!isPreview) {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
          const payload = Object.entries(next)
            .filter(([, answer]) => answer)
            .map(([questionId, answer]) => ({
              questionId,
              value: answer,
            }));
          if (payload.length === 0) return;
          saveFormDraft(form.id, payload, resumeTokenRef.current || undefined)
            .then((result) => {
              resumeTokenRef.current = result.resumeToken;
              window.localStorage.setItem(
                `gudform:draft:${form.id}`,
                JSON.stringify({
                  resumeToken: result.resumeToken,
                  answers: next,
                }),
              );
            })
            .catch(() => {});
        }, 1200);
      }
      return next;
    });
  };

  // Validate all questions
  const validateAll = (): boolean => {
    const visibleQuestions = answerableQuestions.filter((q) => {
      return !shouldSkipQuestion(q, answers, questions);
    });

    for (const question of visibleQuestions) {
      const answer = answers[question.id] || "";

      if (question.required && !answer.trim()) {
        toast.error(`"${question.title}" is required`);
        return false;
      }

      if (question.type === "EMAIL" && answer.trim() && !validateEmail(answer)) {
        toast.error(`Please enter a valid email for "${question.title}"`);
        return false;
      }

      if (
        question.type === "SHORT_TEXT" &&
        question.properties?.format === "url" &&
        answer.trim() &&
        !validateWebsite(answer)
      ) {
        toast.error(`Please enter a valid URL for "${question.title}"`);
        return false;
      }

      if (question.type === "PHONE" && answer.trim() && question.properties?.validation?.phoneFormat && !validatePhone(answer)) {
        toast.error(`Please enter a valid phone number for "${question.title}"`);
        return false;
      }

      if (question.type === "MULTIPLE_CHOICE" && answer.trim()) {
        const choices = getQuestionOptions(question);
        const result = question.properties?.ranking
          ? validateRankingAnswer(answer, choices)
          : validateChoiceSelections(answer, {
              choices,
              allowMultiple: question.properties?.allowMultiple === true,
              minSelections: question.properties?.minSelections,
              maxSelections: question.properties?.maxSelections,
              allowOther: question.properties?.allowOther === true,
            });
        if (!result.valid) {
          toast.error(result.error || `Please choose a valid option for "${question.title}"`);
          return false;
        }
      }
    }

    return true;
  };

  const executePaymentFlow = async (
    answerPayload: { questionId: string; value: string }[],
    selectedOptionIds?: string[],
  ) => {
    const turnstileToken = await getTurnstileToken();
    const meta = {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      referrer:
        typeof document !== "undefined" ? document.referrer : undefined,
      turnstileToken,
    };

    const pendingResponse = await createPendingResponse(
      form.id,
      answerPayload,
      meta,
      selectedOptionIds,
    );

    const res = await fetch(`/f/${form.slug}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responseId: pendingResponse.id,
        selectedOptionIds,
      }),
    });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Failed to create payment session");
    }
  };

  const handlePaymentSelectorConfirm = async (selectedIds: string[]) => {
    if (!pendingAnswerPayload) return;
    setSubmitting(true);
    try {
      await executePaymentFlow(pendingAnswerPayload, selectedIds);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting || submitted) return;

    if (!validateAll()) return;

    const answerPayload = visibleQuestions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({
        questionId: q.id,
        value: answers[q.id],
      }));

    if (isPaymentOptionsForm(form)) {
      setPendingAnswerPayload(answerPayload);
      setShowPaymentSelector(true);
      return;
    }

    setSubmitting(true);
    try {
      if (isPreview) {
        setSubmitted(true);
      } else if (isLegacyPaymentForm(form)) {
        await executePaymentFlow(answerPayload);
      } else {
        const turnstileToken = await getTurnstileToken();
        await submitFormResponse(form.id, answerPayload, {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          referrer:
            typeof document !== "undefined" ? document.referrer : undefined,
          turnstileToken,
          resumeToken: resumeTokenRef.current || undefined,
        });
        window.localStorage.removeItem(`gudform:draft:${form.id}`);
        resumeTokenRef.current = null;
        setSubmitted(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Find welcome and thank you screens
  const welcomeScreen = questions.find((q) => q.type === "WELCOME_SCREEN");
  const thankYouScreen = questions.find((q) => q.type === "THANK_YOU_SCREEN");

  // Handle redirect effect for thank you screen
  useEffect(() => {
    if (submitted && form.redirectUrl) {
      try {
        const parsed = new URL(form.redirectUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
      } catch {
        return;
      }
      const timer = setTimeout(() => {
        window.location.href = form.redirectUrl!;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, form.redirectUrl]);

  // If submitted, show thank you screen
  if (submitted) {
    if (thankYouScreen) {
      const format = getScreenFormat(thankYouScreen.type, thankYouScreen.properties);
      return (
        <div
          className={cn(
            "flex min-h-screen items-center justify-center px-6 py-20",
            colors.text,
          )}
          style={{ backgroundColor: bgColor }}
        >
          <div className={cn(
            "w-full max-w-2xl",
            format.align === "center" ? "text-center" : "text-left"
          )}>
            <div
              className={cn(
                "mb-8 flex size-20 items-center justify-center rounded-full shadow-lg",
                format.align === "center" && "mx-auto"
              )}
              style={{ backgroundColor: themeColor }}
            >
              <Check
                className="size-10"
                style={{ color: contrastColor(themeColor) }}
              />
            </div>
            <FormattedText
              as="h1"
              text={thankYouScreen.title}
              className={cn(
                screenTitleClassName(format),
                !format.titleColor && colors.text
              )}
              style={format.titleColor ? { color: format.titleColor } : undefined}
            />
            {thankYouScreen.description && (
              <FormattedText
                as="div"
                text={thankYouScreen.description}
                className={cn(
                  "mt-6 max-w-2xl leading-relaxed",
                  format.align === "center" && "mx-auto",
                  screenDescriptionClassName(format),
                  !format.descriptionColor && colors.textMuted
                )}
                style={format.descriptionColor ? { color: format.descriptionColor } : undefined}
              />
            )}
            {form.redirectUrl && (
              <p className={cn("mt-8 text-base", colors.textMuted)}>
                Redirecting you shortly...
              </p>
            )}
            {!form.removeBranding && (
              <a
                href="https://gudform.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-10 inline-block text-sm transition-opacity hover:opacity-80",
                  colors.textMuted,
                )}
              >
                Create your own form &rarr;
              </a>
            )}
          </div>
        </div>
      );
    }

    // Fallback success message when no thank you screen is defined
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center px-6 py-20",
          colors.text,
        )}
        style={{ backgroundColor: bgColor }}
      >
        <div className="w-full max-w-2xl text-center">
          <div
            className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: themeColor }}
          >
            <Check
              className="size-10"
              style={{ color: contrastColor(themeColor) }}
            />
          </div>
          <h1 className={cn("text-4xl font-bold leading-tight tracking-tight sm:text-5xl", colors.text)}>
            Thank you!
          </h1>
          <p className={cn("mt-6 text-lg leading-relaxed sm:text-xl", colors.textMuted)}>
            Your response has been submitted successfully.
          </p>
          {form.redirectUrl && (
            <p className={cn("mt-8 text-base", colors.textMuted)}>
              Redirecting you shortly...
            </p>
          )}
          {!form.removeBranding && (
            <a
              href="https://gudform.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-10 inline-block text-sm transition-opacity hover:opacity-80",
                colors.textMuted,
              )}
            >
              Create your own form &rarr;
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col",
        isEmbed ? "min-h-0" : "min-h-screen",
        colors.text,
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className="mx-auto w-full max-w-4xl px-6 py-20 sm:px-8">
        {/* Welcome screen */}
        {welcomeScreen && (() => {
          const format = getScreenFormat(welcomeScreen.type, welcomeScreen.properties);
          return (
            <div className={cn(
              "mb-16",
              format.align === "center" ? "text-center" : "text-left"
            )}>
              <FormattedText
                as="h1"
                text={welcomeScreen.title}
                className={cn(
                  screenTitleClassName(format),
                  !format.titleColor && colors.text
                )}
                style={format.titleColor ? { color: format.titleColor } : undefined}
              />
              {welcomeScreen.description && (
                <FormattedText
                  as="div"
                  text={welcomeScreen.description}
                  className={cn(
                    "mt-6 max-w-2xl leading-relaxed",
                    format.align === "center" && "mx-auto",
                    screenDescriptionClassName(format),
                    !format.descriptionColor && colors.textMuted
                  )}
                  style={format.descriptionColor ? { color: format.descriptionColor } : undefined}
                />
              )}
            </div>
          );
        })()}

        {/* All questions in a form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions
            .filter((q) => !shouldSkipQuestion(q, answers, questions))
            .map((question, globalIdx) => {
              // Handle STATEMENT blocks separately - render inline but not as answerable questions
              if (question.type === "STATEMENT") {
                const format = getScreenFormat(question.type, question.properties);
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "rounded-2xl border-2 p-8 shadow-sm",
                      colors.border,
                      colors.surface,
                      format.align === "center" ? "text-center" : "text-left",
                    )}
                  >
                    <FormattedText
                      as="h2"
                      text={question.title}
                      className={cn(
                        screenTitleClassName(format),
                        !format.titleColor && colors.text,
                        "mb-3 leading-tight tracking-tight",
                      )}
                      style={format.titleColor ? { color: format.titleColor } : undefined}
                    />
                    {question.description && (
                      <FormattedText
                        as="div"
                        text={question.description}
                        className={cn(
                          "leading-relaxed",
                          screenDescriptionClassName(format),
                          !format.descriptionColor && colors.textMuted,
                        )}
                        style={
                          format.descriptionColor
                            ? { color: format.descriptionColor }
                            : undefined
                        }
                      />
                    )}
                  </div>
                );
              }

              // For answerable questions, render the question card
              const questionIndex = visibleQuestions.findIndex((q) => q.id === question.id);
              if (questionIndex === -1) return null; // Skip if not in visible questions

              return (
            <div
              key={question.id}
              className={cn(
                "group rounded-2xl border-2 p-8 shadow-sm transition-all duration-200 hover:shadow-md",
                colors.border,
                colors.surface,
              )}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="text-sm font-semibold tabular-nums" style={{ color: themeColor }}>
                  {questionIndex + 1}
                </span>
                <span className={cn("text-sm", colors.textMuted)}>
                  of {visibleQuestions.length}
                </span>
                {question.required && (
                  <span className="ml-1 text-sm font-semibold text-red-500">*</span>
                )}
              </div>

              <h3 className={cn("mb-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl", colors.text)}>
                {question.title}
              </h3>

              {question.description && (
                <p className={cn("mb-6 text-base leading-relaxed", colors.textMuted)}>
                  {question.description}
                </p>
              )}

              {/* Render question input based on type */}
              <div>
                {(question.type === "SHORT_TEXT" || question.type === "EMAIL") && (
                  <input
                    type={question.type === "EMAIL" ? "email" : "text"}
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={
                      (question.properties?.placeholder as string) ||
                      "Type your answer here..."
                    }
                    className={cn(
                      "w-full rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                      colors.text,
                      colors.border,
                      colors.borderFocus,
                      colors.placeholder,
                    )}
                  />
                )}

                {question.type === "LONG_TEXT" && (
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={
                      (question.properties?.placeholder as string) ||
                      "Type your answer here..."
                    }
                    rows={4}
                    className={cn(
                      "w-full resize-none rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                      colors.text,
                      colors.border,
                      colors.borderFocus,
                      colors.placeholder,
                    )}
                  />
                )}

                {question.type === "NUMBER" && (
                  <input
                    type="number"
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={
                      (question.properties?.placeholder as string) ||
                      "Type a number..."
                    }
                    className={cn(
                      "w-full rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                      colors.text,
                      colors.border,
                      colors.borderFocus,
                      colors.placeholder,
                    )}
                  />
                )}

                {question.type === "PHONE" && (
                  <input
                    type="tel"
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={
                      (question.properties?.placeholder as string) ||
                      "+1 (555) 000-0000"
                    }
                    className={cn(
                      "w-full rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                      colors.text,
                      colors.border,
                      colors.borderFocus,
                      colors.placeholder,
                    )}
                  />
                )}

                {question.type === "DATE" && (
                  <input
                    type="date"
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    className={cn(
                      "w-full rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                      colors.text,
                      colors.border,
                      colors.borderFocus,
                    )}
                    style={{ accentColor: themeColor }}
                  />
                )}

                {question.type === "MULTIPLE_CHOICE" && (() => {
                  const options = getQuestionOptions(question);
                  const allowMultiple = question.properties?.allowMultiple === true;
                  const allowOther = question.properties?.allowOther === true;
                  const isRanking = question.properties?.ranking === true;
                  const selectedValues = new Set(parseChoiceAnswer(answers[question.id] || ""));
                  const otherSelected = Array.from(selectedValues).some(isOtherAnswer);
                  const otherText = parseOtherAnswer(
                    Array.from(selectedValues).find(isOtherAnswer) || ""
                  );

                  const handleSelect = (option: string) => {
                    if (allowMultiple) {
                      const next = new Set(selectedValues);
                      if (next.has(option)) {
                        next.delete(option);
                      } else {
                        const maxSelections = question.properties?.maxSelections;
                        if (maxSelections != null && next.size >= maxSelections) {
                          toast.error(`Select at most ${maxSelections} option${maxSelections === 1 ? "" : "s"}`);
                          return;
                        }
                        next.add(option);
                      }
                      updateAnswer(question.id, joinChoiceAnswer(Array.from(next)));
                    } else {
                      updateAnswer(question.id, option);
                    }
                  };

                  const handleOther = (text: string) => {
                    const formatted = formatOtherAnswer(text);
                    if (allowMultiple) {
                      const next = Array.from(selectedValues).filter((item) => !isOtherAnswer(item));
                      next.push(formatted);
                      updateAnswer(question.id, joinChoiceAnswer(next));
                    } else {
                      updateAnswer(question.id, formatted);
                    }
                  };

                  const handleOtherSelect = () => {
                    if (otherSelected) {
                      if (!allowMultiple) {
                        updateAnswer(question.id, "");
                      } else {
                        const next = Array.from(selectedValues).filter((item) => !isOtherAnswer(item));
                        updateAnswer(question.id, joinChoiceAnswer(next));
                      }
                    } else {
                      handleOther("");
                    }
                  };

                  // Ranking UI
                  if (isRanking) {
                    const ordered = (() => {
                      const parsed = parseChoiceAnswer(answers[question.id] || "");
                      if (
                        parsed.length === options.length &&
                        options.every((option) => parsed.includes(option))
                      ) {
                        return parsed;
                      }
                      return options;
                    })();

                    const move = (from: number, to: number) => {
                      if (to < 0 || to >= ordered.length) return;
                      const next = [...ordered];
                      const [item] = next.splice(from, 1);
                      next.splice(to, 0, item);
                      updateAnswer(question.id, joinChoiceAnswer(next));
                    };

                    return (
                      <div className="flex flex-col gap-3">
                        {ordered.map((option, idx) => (
                          <div
                            key={`${option}-${idx}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base",
                              colors.text,
                              colors.border,
                            )}
                          >
                            <span
                              className="flex size-7 shrink-0 items-center justify-center rounded text-sm font-bold"
                              style={{
                                backgroundColor: themeColor,
                                color: contrastColor(themeColor),
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span className="flex-1">{option}</span>
                            <button
                              type="button"
                              onClick={() => move(idx, idx - 1)}
                              disabled={idx === 0}
                              className={cn(
                                "rounded p-1 transition-colors disabled:opacity-30",
                                colors.surfaceHover,
                              )}
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => move(idx, idx + 1)}
                              disabled={idx === ordered.length - 1}
                              className={cn(
                                "rounded p-1 transition-colors disabled:opacity-30",
                                colors.surfaceHover,
                              )}
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        ))}
                        <p className={cn("text-xs", colors.textMuted)}>
                          Use arrows to rank. 1 is highest.
                        </p>
                      </div>
                    );
                  }

                  // Regular MC (single/multi + optional Other)
                  return (
                    <div className="flex flex-col gap-3">
                      {options.map((option, optIdx) => {
                        const isSelected = selectedValues.has(option);
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base transition-all",
                              colors.text,
                              isSelected ? "shadow-md" : cn(colors.border, colors.borderHover, "hover:shadow-sm"),
                            )}
                            style={
                              isSelected
                                ? {
                                    borderColor: themeColor,
                                    backgroundColor: `${themeColor}08`,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center text-sm font-bold transition-all",
                                allowMultiple ? "rounded" : "rounded-full",
                                !isSelected && cn("border-2", colors.border),
                              )}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: themeColor,
                                      color: contrastColor(themeColor),
                                    }
                                  : undefined
                              }
                            >
                              {allowMultiple && isSelected && <Check className="size-4" />}
                              {!allowMultiple && !isSelected && String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {isSelected && !allowMultiple && (
                              <Check className="size-5 shrink-0" style={{ color: themeColor }} />
                            )}
                          </button>
                        );
                      })}
                      {allowOther && (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleOtherSelect}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base transition-all",
                              colors.text,
                              otherSelected ? "shadow-md" : cn(colors.border, colors.borderHover, "hover:shadow-sm"),
                            )}
                            style={
                              otherSelected
                                ? {
                                    borderColor: themeColor,
                                    backgroundColor: `${themeColor}08`,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center text-sm font-bold transition-all",
                                allowMultiple ? "rounded" : "rounded-full",
                                !otherSelected && cn("border-2", colors.border),
                              )}
                              style={
                                otherSelected
                                  ? {
                                      backgroundColor: themeColor,
                                      color: contrastColor(themeColor),
                                    }
                                  : undefined
                              }
                            >
                              {otherSelected && (allowMultiple ? <Check className="size-4" /> : "")}
                              {!otherSelected && "+"}
                            </span>
                            <span className="flex-1">Other</span>
                            {otherSelected && !allowMultiple && (
                              <Check className="size-5 shrink-0" style={{ color: themeColor }} />
                            )}
                          </button>
                          {otherSelected && (
                            <input
                              type="text"
                              value={otherText}
                              onChange={(e) => handleOther(e.target.value)}
                              placeholder="Please specify..."
                              className={cn(
                                "ml-9 rounded-lg border-2 px-4 py-2 text-base outline-none transition-all",
                                colors.text,
                                colors.placeholder,
                              )}
                              style={{ borderColor: themeColor }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {question.type === "DROPDOWN" && (() => {
                  const options = getQuestionOptions(question);
                  return (
                    <select
                      value={answers[question.id] || ""}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      className={cn(
                        "w-full rounded-xl border-2 bg-transparent px-5 py-4 text-base shadow-sm outline-none transition-all duration-200 focus:shadow-md",
                        colors.text,
                        colors.border,
                        colors.borderFocus,
                      )}
                      style={{ accentColor: themeColor }}
                    >
                      <option value="">Select an option...</option>
                      {options.map((option, optIdx) => (
                        <option key={optIdx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  );
                })()}

                {question.type === "YES_NO" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => {
                      const isSelected = answers[question.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateAnswer(question.id, option)}
                          className={cn(
                            "flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-xl border-2 px-8 text-base font-semibold transition-all",
                            isSelected ? "shadow-lg" : cn(colors.border, colors.text, colors.borderHover, "hover:shadow-md"),
                          )}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: themeColor,
                                  borderColor: themeColor,
                                  color: contrastColor(themeColor),
                                }
                              : undefined
                          }
                        >
                          {option}
                          {isSelected && <Check className="size-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "RATING" && (() => {
                  const maxRating = (question.properties?.maxRating as number) || 5;
                  const currentRating = answers[question.id] ? parseInt(answers[question.id], 10) : 0;
                  return (
                    <div className="flex gap-2">
                      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
                        const filled = star <= currentRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateAnswer(question.id, String(star))}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "size-9 transition-colors",
                                filled ? "fill-current" : colors.starEmpty,
                              )}
                              style={filled ? { color: themeColor } : undefined}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {question.type === "SCALE" && (() => {
                  const minValue = (question.properties?.minValue as number) ?? 1;
                  const maxValue = (question.properties?.maxValue as number) ?? 10;
                  const minLabel = (question.properties?.minLabel as string) || "";
                  const maxLabel = (question.properties?.maxLabel as string) || "";
                  const currentValue = answers[question.id] ? parseInt(answers[question.id], 10) : null;
                  const range = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

                  return (
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {range.map((num) => {
                          const isSelected = num === currentValue;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => updateAnswer(question.id, String(num))}
                              className={cn(
                                "flex size-12 items-center justify-center rounded-lg border-2 text-base font-bold transition-all",
                                isSelected ? "shadow-sm" : cn(colors.border, colors.text, colors.borderHover, "hover:shadow-sm"),
                              )}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: themeColor,
                                      borderColor: themeColor,
                                      color: contrastColor(themeColor),
                                    }
                                  : undefined
                              }
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      {(minLabel || maxLabel) && (
                        <div className={cn("mt-2 flex justify-between text-sm", colors.textMuted)}>
                          <span>{minLabel}</span>
                          <span>{maxLabel}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {question.type === "FILE_UPLOAD" && (
                  <div className={cn("rounded-lg border-2 border-dashed px-6 py-8 text-center", colors.border)}>
                    <p className={cn("text-sm", colors.textMuted)}>
                      File upload is not supported in classic mode. Please switch to conversational mode.
                    </p>
                  </div>
                )}
              </div>
            </div>
              );
            })}

          {/* Submit button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 items-center justify-center rounded-xl px-16 text-base font-semibold shadow-lg transition-all hover:shadow-xl hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: themeColor,
                color: contrastColor(themeColor),
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {!form.removeBranding && (
          <div className="mt-12 text-center">
            <a
              href="https://gudform.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-sm transition-opacity hover:opacity-80",
                colors.textMuted,
              )}
            >
              Powered by <span className="font-semibold">GudForm</span>
            </a>
          </div>
        )}
      </div>

      {/* Payment selector overlay */}
      {showPaymentSelector &&
        form.paymentOptions &&
        form.paymentOptions.length > 0 && (
          <div
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-sm",
              colors.overlay,
            )}
          >
            <PaymentSelector
              options={form.paymentOptions}
              selectionMode={form.paymentSelectionMode}
              currency={form.paymentCurrency}
              themeColor={themeColor}
              bgIsDark={bgIsDark}
              submitting={submitting}
              onConfirm={handlePaymentSelectorConfirm}
            />
          </div>
        )}

      {/* Submitting overlay */}
      {submitting && !showPaymentSelector && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm",
            colors.overlay,
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="size-8 animate-spin rounded-full border-4 border-t-transparent"
              style={{
                borderColor: `${themeColor}40`,
                borderTopColor: themeColor,
              }}
            />
            <p className={cn("text-sm font-medium", colors.textMuted)}>
              Submitting your response...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
