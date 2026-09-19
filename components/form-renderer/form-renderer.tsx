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
