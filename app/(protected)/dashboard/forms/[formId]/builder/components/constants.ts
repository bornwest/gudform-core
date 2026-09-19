import {
  Calendar,
  CheckSquare,
  FileUp,
  Hash,
  Image as ImageIcon,
  Link2,
  List,
  ListOrdered,
  Mail,
  MessageSquare,
  Minus,
  PenLine,
  Phone,
  ScreenShare,
  Star,
  Text,
  ThumbsUp,
  Type,
} from "lucide-react";
import { QuestionType } from "@prisma/client";

import { FORM_COMPONENTS } from "@/config/form-components";

import type { Question, QuestionProperties } from "./types";

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

export interface PaletteItem {
  id: string;
  type: QuestionType;
  label: string;
  icon: React.ElementType;
  defaultTitle?: string;
  properties?: QuestionProperties;
}

function fromType(
  type: QuestionType,
  extra?: Partial<PaletteItem>,
): PaletteItem {
  const meta = QUESTION_TYPE_META[type];
  return {
    id: extra?.id ?? type,
    type,
    label: extra?.label ?? meta.label,
    icon: extra?.icon ?? meta.icon,
    defaultTitle: extra?.defaultTitle,
    properties: extra?.properties,
  };
}

export const QUESTION_TYPE_GROUPS: { label: string; items: PaletteItem[] }[] =
  [
    {
      label: "Screens",
      items: [
        fromType(QuestionType.WELCOME_SCREEN),
        fromType(QuestionType.THANK_YOU_SCREEN),
        fromType(QuestionType.STATEMENT),
      ],
    },
    {
      label: "Text",
      items: [fromType(QuestionType.SHORT_TEXT), fromType(QuestionType.LONG_TEXT)],
    },
    {
      label: "Contact",
      items: [
        fromType(QuestionType.EMAIL),
        fromType(QuestionType.PHONE),
        fromType(QuestionType.SHORT_TEXT, {
          id: "website",
          label: "Website",
          icon: Link2,
          defaultTitle: "What is your website?",
          properties: { placeholder: "https://", format: "url" },
        }),
      ],
    },
    {
      label: "Choice",
      items: [
        fromType(QuestionType.MULTIPLE_CHOICE),
        fromType(QuestionType.MULTIPLE_CHOICE, {
          id: "multi-select",
          label: "Multi Select",
          icon: CheckSquare,
          defaultTitle: "Choose as many as apply",
          properties: {
            choices: ["Option 1", "Option 2", "Option 3"],
            allowMultiple: true,
          },
        }),
        fromType(QuestionType.DROPDOWN),
        fromType(QuestionType.YES_NO),
        fromType(QuestionType.MULTIPLE_CHOICE, {
          id: "picture-choice",
          label: "Picture Choice",
          icon: ImageIcon,
          defaultTitle: "Which of these do you prefer?",
          properties: {
            choices: ["Option 1", "Option 2", "Option 3"],
            pictureChoice: true,
            choiceImages: ["", "", ""],
          },
        }),
        fromType(QuestionType.MULTIPLE_CHOICE, {
          id: "ranking",
          label: "Ranking",
          icon: ListOrdered,
          defaultTitle: "Rank these in order of preference",
          properties: {
            choices: ["Option 1", "Option 2", "Option 3"],
            ranking: true,
          },
        }),
      ],
    },
    {
      label: "Input",
      items: [
        fromType(QuestionType.NUMBER),
        fromType(QuestionType.DATE),
        fromType(QuestionType.FILE_UPLOAD),
        fromType(QuestionType.FILE_UPLOAD, {
          id: "signature",
          label: "Signature",
          icon: PenLine,
          defaultTitle: "Please sign below",
          properties: { maxFileSize: 10, capture: "signature" },
        }),
      ],
    },
    {
      label: "Rating",
      items: [fromType(QuestionType.RATING), fromType(QuestionType.SCALE)],
    },
  ];

export const PALETTE_ITEMS: PaletteItem[] = QUESTION_TYPE_GROUPS.flatMap(
  (group) => group.items,
);

export function getPaletteItem(id: string): PaletteItem | undefined {
  return PALETTE_ITEMS.find((item) => item.id === id);
}

export function getPaletteId(question: {
  type: QuestionType;
  properties?: QuestionProperties;
}): string {
  if (
    question.type === QuestionType.FILE_UPLOAD &&
    question.properties?.capture === "signature"
  ) {
    return "signature";
  }
  if (
    question.type === QuestionType.MULTIPLE_CHOICE &&
    question.properties?.ranking
  ) {
    return "ranking";
  }
  if (
    question.type === QuestionType.MULTIPLE_CHOICE &&
    question.properties?.pictureChoice
  ) {
    return "picture-choice";
  }
  if (
    question.type === QuestionType.MULTIPLE_CHOICE &&
    question.properties?.allowMultiple
  ) {
    return "multi-select";
  }
  if (
    question.type === QuestionType.SHORT_TEXT &&
    question.properties?.format === "url"
  ) {
    return "website";
  }
  return question.type;
}

export function getQuestionDisplayMeta(question: {
  type: QuestionType;
  properties?: QuestionProperties;
}): { label: string; icon: React.ElementType } {
  const item = getPaletteItem(getPaletteId(question));
  if (item) return { label: item.label, icon: item.icon };
  const meta = QUESTION_TYPE_META[question.type];
  return { label: meta.label, icon: meta.icon };
}

export function createQuestionFromPalette(item: PaletteItem): Question {
  return {
    type: item.type,
    title: item.defaultTitle ?? getDefaultTitle(item.type),
    description: undefined,
    required: false,
    properties: {
      ...getDefaultProperties(item.type),
      ...item.properties,
    },
    logic: [],
  };
}

export function getDefaultProperties(type: QuestionType): QuestionProperties {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        choices: ["Option 1", "Option 2", "Option 3"],
        allowMultiple: false,
      };
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
    case QuestionType.FILE_UPLOAD:
      return { maxFileSize: 10 };
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
      return "Choose one";
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
