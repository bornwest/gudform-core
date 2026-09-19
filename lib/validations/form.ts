import { z } from "zod";

import { validateChoiceSelections, validateRankingAnswer } from "@/lib/choice-answers";
import { getReachedQuestionIds } from "@/lib/form-logic";
import type { LogicRule } from "@/lib/types/logic";
import { validateRedirectUrl } from "@/lib/url-validation";

// ---------------------------------------------------------------------------
// Shared helpers (used by both renderer and server actions)
// ---------------------------------------------------------------------------

/** Question types that accept user answers (excludes screens/statements). */
export function isAnswerableQuestion(type: string): boolean {
  return type !== "WELCOME_SCREEN" && type !== "THANK_YOU_SCREEN" && type !== "STATEMENT";
}

/** Validate a phone number: correct format and at least 7 digits. */
export function validatePhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!/^\+?[\d\s\-().]{7,20}$/.test(trimmed)) return false;
  const digitCount = (trimmed.match(/\d/g) || []).length;
  return digitCount >= 7;
}

/** Validate an email address (basic format check). */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate a website answer: http(s) URL, protocol optional. */
export function validateWebsite(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Server-side answer validation
// ---------------------------------------------------------------------------

interface QuestionForValidation {
  id: string;
  type: string;
  required: boolean;
  properties: Record<string, any> | null;
  logic?: LogicRule[] | null;
}

interface AnswerInput {
  questionId: string;
  value: string;
}

/**
 * Validate submitted answers against the form's questions.
 * Returns an object with `valid` and an array of `errors`.
 */
export function validateAnswers(
  questions: QuestionForValidation[],
  answers: AnswerInput[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Build lookup maps
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const reached = getReachedQuestionIds(questions, answers);

  // 1. Check that all submitted questionIds belong to the form
  for (const answer of answers) {
    if (!questionMap.has(answer.questionId)) {
      errors.push(`Answer references unknown question: ${answer.questionId}`);
    }
  }
  if (errors.length > 0) return { valid: false, errors };

  // 2. Check required fields that this response actually reached
  for (const q of questions) {
    if (!isAnswerableQuestion(q.type)) continue;
    if (!q.required) continue;
    if (!reached.has(q.id)) continue;
    const value = answerMap.get(q.id);
    if (!value || !value.trim()) {
      errors.push(`Required question "${q.type}" is missing an answer`);
    }
  }

  // 3. Type-specific and validation-rule checks
  for (const answer of answers) {
    const q = questionMap.get(answer.questionId)!;
    const value = answer.value.trim();
    if (!value) continue; // empty non-required answers are fine

    const props = q.properties ?? {};
    const validation = (props.validation ?? {}) as Record<string, any>;

    switch (q.type) {
      case "EMAIL": {
        if (!validateEmail(value)) {
          errors.push("Invalid email address format");
          break;
        }
        // Domain allow/block lists
        const domain = value.split("@")[1]?.toLowerCase();
        if (domain) {
          const allowed: string[] = validation.allowedDomains ?? [];
          if (allowed.length > 0 && !allowed.includes(domain)) {
            errors.push(`Only emails from these domains are accepted: ${allowed.join(", ")}`);
          }
          const blocked: string[] = validation.blockedDomains ?? [];
          if (blocked.length > 0 && blocked.includes(domain)) {
            errors.push(`Emails from ${domain} are not accepted`);
          }
        }
        break;
      }

      case "PHONE": {
        if (validation.phoneFormat && !validatePhone(value)) {
          errors.push("Invalid phone number format");
        }
        break;
      }

      case "NUMBER": {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push("Expected a numeric value");
          break;
        }
        if (validation.min !== undefined && validation.min !== null && num < validation.min) {
          errors.push(`Value must be at least ${validation.min}`);
        }
        if (validation.max !== undefined && validation.max !== null && num > validation.max) {
          errors.push(`Value must be at most ${validation.max}`);
        }
        break;
      }

      case "RATING": {
        const rating = parseInt(value, 10);
        const maxRating = props.maxRating ?? 5;
        if (isNaN(rating) || rating < 1 || rating > maxRating) {
          errors.push(`Rating must be between 1 and ${maxRating}`);
        }
        break;
      }

      case "SCALE": {
        const scale = parseInt(value, 10);
        const min = props.minValue ?? 1;
        const max = props.maxValue ?? 10;
        if (isNaN(scale) || scale < min || scale > max) {
          errors.push(`Scale value must be between ${min} and ${max}`);
        }
        break;
      }

      case "YES_NO": {
        if (value !== "Yes" && value !== "No") {
          errors.push("Answer must be Yes or No");
        }
        break;
      }

      case "SHORT_TEXT": {
        if (props.format === "url" && !validateWebsite(value)) {
          errors.push("Please enter a valid website URL");
        }
        break;
      }

      case "MULTIPLE_CHOICE":
      case "DROPDOWN": {
        const choices: string[] = props.choices ?? props.options ?? [];
        const result = props.ranking
          ? validateRankingAnswer(value, choices)
          : validateChoiceSelections(value, {
              choices,
              allowMultiple:
                q.type === "MULTIPLE_CHOICE" && props.allowMultiple === true,
              minSelections: props.minSelections,
              maxSelections: props.maxSelections,
              allowOther: props.allowOther === true,
            });
        if (!result.valid) {
          errors.push(result.error || "Answer must be one of the available choices");
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const createFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  themeColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  showProgressBar: z.boolean().optional(),
  redirectUrl: z
    .string()
    .url()
    .refine((url) => validateRedirectUrl(url).valid, {
      message: "Redirect URL must use HTTP or HTTPS and not point to a private address",
    })
    .optional()
    .or(z.literal("")),
  notifyOnResponse: z.boolean().optional(),
  closeDate: z.string().datetime().optional().nullable(),
  responseLimit: z.number().int().positive().optional().nullable(),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "WELCOME_SCREEN",
    "SHORT_TEXT",
    "LONG_TEXT",
    "MULTIPLE_CHOICE",
    "DROPDOWN",
    "EMAIL",
    "NUMBER",
    "PHONE",
    "DATE",
    "RATING",
    "SCALE",
    "YES_NO",
    "FILE_UPLOAD",
    "STATEMENT",
    "THANK_YOU_SCREEN",
  ]),
  title: z.string().max(500).default(""),
  description: z.string().max(5000).optional(),
  required: z.boolean().optional(),
  properties: z.record(z.any()).optional(),
  logic: z
    .array(
      z.object({
        id: z.string(),
        operator: z.enum([
          "always",
          "is_answered",
          "is_not_answered",
          "equals",
          "does_not_equal",
          "greater_than",
          "less_than",
          "contains",
          "does_not_contain",
        ]),
        value: z.string().optional(),
        action: z.union([
          z.object({ type: z.literal("jump_to"), questionId: z.string() }),
          z.object({ type: z.literal("end_form") }),
        ]),
      }),
    )
    .optional(),
});

export const saveQuestionsSchema = z.object({
  formId: z.string(),
  questions: z.array(questionSchema),
});

export const submitResponseSchema = z.object({
  formId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string(),
    }),
  ),
});
