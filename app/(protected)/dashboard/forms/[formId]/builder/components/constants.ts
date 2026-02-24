import {
  Calendar,
  FileUp,
  Hash,
  List,
  ListOrdered,
  Mail,
  MessageSquare,
  Minus,
  Phone,
  ScreenShare,
  Star,
  Text,
  ThumbsUp,
  Type,
} from "lucide-react";
import { QuestionType } from "@prisma/client";

import { FORM_COMPONENTS } from "@/config/form-components";

import type { QuestionProperties } from "./types";

export const QUESTION_TYPE_META: Record<
  QuestionType,
  { label: string; icon: React.ElementType; group: string }
> = {
  WELCOME_SCREEN: {
    label: "Welcome Screen",
    icon: ScreenShare,
    group: "Screens",
  },
  THANK_YOU_SCREEN: {
    label: "Thank You Screen",
    icon: ThumbsUp,
    group: "Screens",
  },
  STATEMENT: { label: "Statement", icon: MessageSquare, group: "Screens" },
  SHORT_TEXT: { label: "Short Text", icon: Type, group: "Text" },
  LONG_TEXT: { label: "Long Text", icon: Text, group: "Text" },
  EMAIL: { label: "Email", icon: Mail, group: "Contact" },
  PHONE: { label: "Phone", icon: Phone, group: "Contact" },
  NUMBER: { label: "Number", icon: Hash, group: "Input" },
  DATE: { label: "Date", icon: Calendar, group: "Input" },
  MULTIPLE_CHOICE: { label: "Multiple Choice", icon: List, group: "Choice" },
  DROPDOWN: { label: "Dropdown", icon: ListOrdered, group: "Choice" },
  RATING: { label: "Rating", icon: Star, group: "Rating" },
  SCALE: { label: "Scale", icon: Minus, group: "Rating" },
  YES_NO: { label: "Yes / No", icon: ThumbsUp, group: "Choice" },
  FILE_UPLOAD: { label: "File Upload", icon: FileUp, group: "Input" },
};

export const QUESTION_TYPE_GROUPS = [
  {
    label: "Screens",
    types: [
      QuestionType.WELCOME_SCREEN,
      QuestionType.THANK_YOU_SCREEN,
      QuestionType.STATEMENT,
    ],
  },
  { label: "Text", types: [QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT] },
  { label: "Contact", types: [QuestionType.EMAIL, QuestionType.PHONE] },
  {
    label: "Choice",
    types: [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.DROPDOWN,
      QuestionType.YES_NO,
    ],
  },
  {
    label: "Input",
    types: [QuestionType.NUMBER, QuestionType.DATE, QuestionType.FILE_UPLOAD],
  },
  { label: "Rating", types: [QuestionType.RATING, QuestionType.SCALE] },
];

export function getDefaultProperties(type: QuestionType): QuestionProperties {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.DROPDOWN:
      return { choices: ["Option 1", "Option 2", "Option 3"] };
    case QuestionType.RATING:
      return { maxRating: 5 };
    case QuestionType.SCALE:
      return {
        minValue: 1,
        maxValue: 10,
        minLabel: "Not likely",
        maxLabel: "Very likely",
      };
    case QuestionType.SHORT_TEXT:
    case QuestionType.LONG_TEXT:
    case QuestionType.EMAIL:
    case QuestionType.PHONE:
    case QuestionType.NUMBER:
      return { placeholder: "" };
    default:
      return {};
  }
}

export function getDefaultTitle(type: QuestionType): string {
  switch (type) {
    case QuestionType.WELCOME_SCREEN:
      return "Welcome!";
    case QuestionType.THANK_YOU_SCREEN:
      return "Thank you!";
    case QuestionType.STATEMENT:
      return "Here is something important";
    case QuestionType.SHORT_TEXT:
      return "What is your answer?";
    case QuestionType.LONG_TEXT:
      return "Tell us more";
    case QuestionType.EMAIL:
      return "What is your email?";
    case QuestionType.PHONE:
      return "What is your phone number?";
    case QuestionType.NUMBER:
      return "Enter a number";
    case QuestionType.DATE:
      return "Pick a date";
    case QuestionType.MULTIPLE_CHOICE:
      return "Choose one or more";
    case QuestionType.DROPDOWN:
      return "Select from the list";
    case QuestionType.RATING:
      return "How would you rate this?";
    case QuestionType.SCALE:
      return "On a scale, how likely are you to...";
    case QuestionType.YES_NO:
      return "Do you agree?";
    case QuestionType.FILE_UPLOAD:
      return "Upload a file";
    default:
      return "New question";
  }
}

export const SCREEN_TYPES: QuestionType[] = [
  QuestionType.WELCOME_SCREEN,
  QuestionType.THANK_YOU_SCREEN,
  QuestionType.STATEMENT,
];

/** Index of the last thank-you screen (for inserting new questions before it). -1 if none. */
export function getThankYouScreenIndex(
  questions: { type: string }[],
): number {
  let idx = -1;
  questions.forEach((q, i) => {
    if (q.type === QuestionType.THANK_YOU_SCREEN) idx = i;
  });
  return idx;
}

/** Ensure exactly one thank-you screen exists at the end. Reorders and dedupes. */
export function normalizeQuestionsThankYouLast<T extends { type: string }>(
  questions: T[],
): T[] {
  const rest = questions.filter(
    (q) => q.type !== QuestionType.THANK_YOU_SCREEN,
  );
  const thankYous = questions.filter(
    (q) => q.type === QuestionType.THANK_YOU_SCREEN,
  );
  const lastThankYou =
    thankYous.length > 0 ? thankYous[thankYous.length - 1] : null;
  if (!lastThankYou) return questions;
  return [...rest, lastThankYou] as T[];
}

export { FORM_COMPONENTS };
