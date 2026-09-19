"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPendingResponse,
  loadFormDraft,
  saveFormDraft,
  submitFormResponse,
} from "@/actions/form-actions";
import { getTurnstileToken } from "@/components/form-renderer/turnstile-token";
import { QuestionType } from "@prisma/client";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  GripVertical,
  Star,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { LogicRule } from "@/lib/types/logic";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { isPaymentOptionsForm, isLegacyPaymentForm } from "@/lib/types/payment";
import { cn, contrastColor } from "@/lib/utils";
import { FormattedText } from "@/components/form-renderer/formatted-text";
import { FormThemeWrapper } from "@/components/form-renderer/form-theme-wrapper";
import { PaymentSelector } from "@/components/form-renderer/payment-selector";
import {
  formatOtherAnswer,
  getSelectionHint,
  isOtherAnswer,
  joinChoiceAnswer,
  parseChoiceAnswer,
  parseOtherAnswer,
  validateChoiceSelections,
  validateRankingAnswer,
} from "@/lib/choice-answers";
import { embedResizeMessage } from "@/lib/embed-protocol";
import {
  resolveLogicDestination,
  thankYouIndex,
} from "@/lib/form-logic";
import { ClassicFormRenderer } from "@/components/form-renderer/classic-form-renderer";
import {
  getScreenFormat,
  screenDescriptionClassName,
  screenTitleClassName,
} from "@/lib/screen-format";
import {
  validateEmail,
  validatePhone,
  validateWebsite,
} from "@/lib/validations/form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface FormRendererProps {
  form: FormData;
  isPreview?: boolean;
  isEmbed?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

// ---------------------------------------------------------------------------
// Form-scoped colour tokens — completely independent of page-level dark mode.
// Every colour class that previously used `dark:` variants is replaced by a
// conditional value from this object, driven by `contrastColor(bgColor)`.
// ---------------------------------------------------------------------------

const LIGHT_COLORS = {
  text: "text-gray-900",
  textMuted: "text-gray-500",
  border: "border-gray-300",
  borderHover: "hover:border-gray-400",
  borderFocus: "focus:border-gray-900",
  surface: "bg-white",
  surfaceHover: "hover:bg-gray-100",
  surfaceSubtle: "hover:bg-gray-50",
  kbdBg: "bg-gray-200/60",
  kbdBorder: "border-gray-300",
  badgeBg: "bg-gray-100",
  badgeBorder: "border-gray-300",
  badgeText: "text-gray-600",
  placeholder: "placeholder:text-gray-400",
  starEmpty: "text-gray-400",
  overlay: "bg-white/80",
  yesNoKbd: "border-gray-300 bg-gray-200/60 text-gray-600",
};

const DARK_COLORS = {
  text: "text-gray-100",
  textMuted: "text-gray-400",
  border: "border-gray-700",
  borderHover: "hover:border-gray-500",
  borderFocus: "focus:border-gray-100",
  surface: "bg-gray-800",
  surfaceHover: "hover:bg-gray-700",
  surfaceSubtle: "hover:bg-gray-800/50",
  kbdBg: "bg-gray-800",
  kbdBorder: "border-gray-700",
  badgeBg: "bg-gray-800",
  badgeBorder: "border-gray-700",
  badgeText: "text-gray-400",
  placeholder: "placeholder:text-gray-500",
  starEmpty: "text-gray-600",
  overlay: "bg-gray-900/80",
  yesNoKbd: "border-gray-600 bg-gray-800 text-gray-400",
};

type FormColors = typeof LIGHT_COLORS;

const FormColorsCtx = createContext<FormColors>(LIGHT_COLORS);
const useC = () => useContext(FormColorsCtx);
