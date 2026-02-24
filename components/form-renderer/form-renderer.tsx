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
  submitFormResponse,
} from "@/actions/form-actions";
import { QuestionType } from "@prisma/client";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Star,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { LogicRule } from "@/lib/types/logic";
import type { PaymentOption, PaymentSelectionMode } from "@/lib/types/payment";
import { isPaymentOptionsForm, isLegacyPaymentForm } from "@/lib/types/payment";
import { cn, contrastColor } from "@/lib/utils";
import { validatePhone, validateEmail } from "@/lib/validations/form";
import { FormThemeWrapper } from "@/components/form-renderer/form-theme-wrapper";
import { PaymentSelector } from "@/components/form-renderer/payment-selector";

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
// Logic evaluation engine
// ---------------------------------------------------------------------------

function matchesRule(rule: LogicRule, answer: string): boolean {
  const trimmed = answer.trim();

  switch (rule.operator) {
    case "always":
      return true;
    case "is_answered":
      return trimmed.length > 0;
    case "is_not_answered":
      return trimmed.length === 0;
    case "equals":
      return trimmed.toLowerCase() === (rule.value || "").toLowerCase();
    case "does_not_equal":
      return trimmed.toLowerCase() !== (rule.value || "").toLowerCase();
    case "greater_than": {
      const n = parseFloat(trimmed);
      const v = parseFloat(rule.value || "");
      return !isNaN(n) && !isNaN(v) && n > v;
    }
    case "less_than": {
      const n = parseFloat(trimmed);
      const v = parseFloat(rule.value || "");
      return !isNaN(n) && !isNaN(v) && n < v;
    }
    case "contains":
      return trimmed.toLowerCase().includes((rule.value || "").toLowerCase());
    case "does_not_contain":
      return !trimmed.toLowerCase().includes((rule.value || "").toLowerCase());
    default:
      return false;
  }
}

/**
 * Evaluate logic rules for a question and return the resolved next index.
 * Returns `"end"` for end-form action, a target index for jump_to, or `null`
 * if no rule matched (fall through to sequential navigation).
 */
function evaluateLogicRules(
  rules: LogicRule[],
  answer: string,
  questions: Question[],
): number | "end" | null {
  for (const rule of rules) {
    if (matchesRule(rule, answer)) {
      const action = rule.action;
      if (action.type === "end_form") return "end";
      const targetIndex = questions.findIndex(
        (q) => q.id === action.questionId,
      );
      return targetIndex >= 0 ? targetIndex : null;
    }
  }
  return null;
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

// ---------------------------------------------------------------------------
// Question Components
// ---------------------------------------------------------------------------

function WelcomeScreen({
  question,
  themeColor,
  onNext,
}: {
  question: Question;
  themeColor: string;
  onNext: () => void;
}) {
  const c = useC();
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1
        className={cn(
          "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl",
          c.text,
        )}
      >
        {question.title}
      </h1>
      {question.description && (
        <p className={cn("mt-4 max-w-lg text-lg sm:text-xl", c.textMuted)}>
          {question.description}
        </p>
      )}
      <button
        onClick={onNext}
        className="mt-10 inline-flex h-12 items-center justify-center rounded-lg px-8 text-base font-semibold transition-all hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:brightness-75"
        style={{
          backgroundColor: themeColor,
          color: contrastColor(themeColor),
        }}
      >
        Start
      </button>
      <p className={cn("mt-4 text-xs", c.textMuted)}>
        press{" "}
        <kbd
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[10px]",
            c.kbdBorder,
            c.kbdBg,
          )}
        >
          Enter
        </kbd>
      </p>
    </div>
  );
}

function ThankYouScreen({
  question,
  themeColor,
  redirectUrl,
  removeBranding,
}: {
  question: Question;
  themeColor: string;
  redirectUrl: string | null;
  removeBranding: boolean;
}) {
  const c = useC();

  useEffect(() => {
    if (redirectUrl) {
      // C7: Only allow http/https redirects to prevent javascript: and other protocol attacks
      try {
        const parsed = new URL(redirectUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
      } catch {
        return;
      }
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className="mb-6 flex size-16 items-center justify-center rounded-full"
        style={{ backgroundColor: themeColor }}
      >
        <Check
          className="size-8"
          style={{ color: contrastColor(themeColor) }}
        />
      </div>
      <h1
        className={cn("text-4xl font-bold tracking-tight sm:text-5xl", c.text)}
      >
        {question.title}
      </h1>
      {question.description && (
        <p className={cn("mt-4 max-w-lg text-lg sm:text-xl", c.textMuted)}>
          {question.description}
        </p>
      )}
      {redirectUrl && (
        <p className={cn("mt-6 text-sm", c.textMuted)}>
          Redirecting you shortly...
        </p>
      )}
      {!removeBranding && (
        <a
          href="https://gudform.com"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-8 text-sm transition-opacity hover:opacity-80",
            c.textMuted,
          )}
        >
          Create your own form &rarr;
        </a>
      )}
    </div>
  );
}

function StatementScreen({
  question,
  themeColor,
  onNext,
}: {
  question: Question;
  themeColor: string;
  onNext: () => void;
}) {
  const c = useC();
  return (
    <div className="flex flex-col items-start">
      <h2
        className={cn(
          "text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl",
          c.text,
        )}
      >
        {question.title}
      </h2>
      {question.description && (
        <p className={cn("mt-3 max-w-lg text-base sm:text-lg", c.textMuted)}>
          {question.description}
        </p>
      )}
      <button
        onClick={onNext}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg px-6 font-semibold transition-all hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:brightness-75"
        style={{
          backgroundColor: themeColor,
          color: contrastColor(themeColor),
        }}
      >
        Continue
      </button>
      <p className={cn("mt-3 text-xs", c.textMuted)}>
        press{" "}
        <kbd
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[10px]",
            c.kbdBorder,
            c.kbdBg,
          )}
        >
          Enter
        </kbd>
      </p>
    </div>
  );
}

function ShortTextInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useC();
  const placeholder =
    (question.properties?.placeholder as string) || "Type your answer here...";
  return (
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent pb-2 text-2xl font-medium outline-none transition-colors sm:text-3xl",
        c.text,
        c.border,
        c.borderFocus,
        c.placeholder,
      )}
    />
  );
}

function LongTextInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useC();
  const placeholder =
    (question.properties?.placeholder as string) || "Type your answer here...";
  return (
    <div>
      <textarea
        autoFocus
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none border-0 border-b-2 bg-transparent pb-2 text-xl font-medium outline-none transition-colors sm:text-2xl",
          c.text,
          c.border,
          c.borderFocus,
          c.placeholder,
        )}
      />
      <p className={cn("mt-1 text-xs", c.textMuted)}>
        <kbd
          className={cn(
            "rounded border px-1 py-0.5 font-mono text-[10px]",
            c.kbdBorder,
            c.kbdBg,
          )}
        >
          Shift
        </kbd>{" "}
        +{" "}
        <kbd
          className={cn(
            "rounded border px-1 py-0.5 font-mono text-[10px]",
            c.kbdBorder,
            c.kbdBg,
          )}
        >
          Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
}

function MultipleChoiceInput({
  question,
  value,
  onChange,
  themeColor,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();
  const options = getQuestionOptions(question);
  const allowMultiple = question.properties?.allowMultiple === true;

  const selectedValues = useMemo(() => {
    if (!value) return new Set<string>();
    return new Set(value.split("|||"));
  }, [value]);

  const handleSelect = useCallback(
    (option: string) => {
      if (allowMultiple) {
        const next = new Set(selectedValues);
        if (next.has(option)) {
          next.delete(option);
        } else {
          next.add(option);
        }
        onChange(Array.from(next).join("|||"));
      } else {
        onChange(option);
      }
    },
    [allowMultiple, selectedValues, onChange],
  );

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const idx = e.key.toLowerCase().charCodeAt(0) - 97;
      if (idx >= 0 && idx < options.length) {
        handleSelect(options[idx]);
      }
    }
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [options, handleSelect]);

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, idx) => {
        const isSelected = selectedValues.has(option);
        return (
          <button
            key={idx}
            onClick={() => handleSelect(option)}
            className={cn(
              "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base font-medium transition-all hover:shadow-sm sm:text-lg",
              c.text,
              isSelected ? "shadow-sm" : cn(c.border, c.borderHover),
            )}
            style={
              isSelected
                ? {
                    borderColor: themeColor,
                    backgroundColor: `${themeColor}10`,
                  }
                : undefined
            }
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded text-sm font-bold transition-colors",
                !isSelected &&
                  cn("border", c.badgeBorder, c.badgeBg, c.badgeText),
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
              {LETTERS[idx]}
            </span>
            <span className="flex-1">{option}</span>
            {isSelected && (
              <Check
                className="size-5 shrink-0"
                style={{ color: themeColor }}
              />
            )}
          </button>
        );
      })}
      {allowMultiple && (
        <p className={cn("mt-1 text-xs", c.textMuted)}>
          Choose as many as you like
        </p>
      )}
    </div>
  );
}

function DropdownInput({
  question,
  value,
  onChange,
  themeColor,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();
  const options = getQuestionOptions(question);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setFocusedIndex((i) => Math.max(i - 1, 0));
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex]);
          setOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, open]);

  return (
    <div className="relative w-full max-w-md">
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border-2 bg-transparent px-4 py-3 text-left text-lg font-medium transition-colors",
          c.text,
          c.border,
          c.borderHover,
        )}
      >
        <span
          className={value ? "" : c.placeholder.replace("placeholder:", "")}
        >
          {value || "Select an option..."}
        </span>
        <ChevronDown
          className={cn("size-5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg",
            c.border,
            c.surface,
          )}
        >
          {options.map((option, idx) => (
            <button
              key={idx}
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-3 text-left text-base transition-colors",
                c.text,
                c.surfaceHover,
                value === option && "font-semibold",
                idx === focusedIndex && "ring-2 ring-inset ring-current",
              )}
              style={value === option ? { color: themeColor } : undefined}
            >
              {option}
              {value === option && <Check className="ml-auto size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useC();
  const placeholder =
    (question.properties?.placeholder as string) || "name@example.com";
  return (
    <input
      type="email"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent pb-2 text-2xl font-medium outline-none transition-colors sm:text-3xl",
        c.text,
        c.border,
        c.borderFocus,
        c.placeholder,
      )}
    />
  );
}

function NumberInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useC();
  const placeholder =
    (question.properties?.placeholder as string) || "Type a number...";
  return (
    <input
      type="number"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent pb-2 text-2xl font-medium outline-none transition-colors [appearance:textfield] sm:text-3xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        c.text,
        c.border,
        c.borderFocus,
        c.placeholder,
      )}
    />
  );
}

function PhoneInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useC();
  const placeholder =
    (question.properties?.placeholder as string) || "+1 (555) 000-0000";
  return (
    <input
      type="tel"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent pb-2 text-2xl font-medium outline-none transition-colors sm:text-3xl",
        c.text,
        c.border,
        c.borderFocus,
        c.placeholder,
      )}
    />
  );
}

function DateInput({
  question,
  value,
  onChange,
  themeColor,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();
  return (
    <input
      type="date"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full max-w-xs rounded-lg border-2 bg-transparent px-4 py-3 text-lg font-medium outline-none transition-colors",
        c.text,
        c.border,
        c.borderFocus,
      )}
      style={{ accentColor: themeColor }}
    />
  );
}

function RatingInput({
  question,
  value,
  onChange,
  themeColor,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();
  const maxRating = (question.properties?.maxRating as number) || 5;
  const currentRating = value ? parseInt(value, 10) : 0;
  const [hoverRating, setHoverRating] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newRating = currentRating;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newRating = Math.min((currentRating || 0) + 1, maxRating);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newRating = Math.max((currentRating || 2) - 1, 1);
        break;
      default:
        // Number keys 1-9
        if (/^[1-9]$/.test(e.key)) {
          const n = parseInt(e.key, 10);
          if (n <= maxRating) {
            e.preventDefault();
            newRating = n;
          }
        }
        return;
    }
    onChange(String(newRating));
  };

  return (
    <div
      className="flex gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      tabIndex={0}
      role="slider"
      aria-label="Rating"
      aria-valuemin={1}
      aria-valuemax={maxRating}
      aria-valuenow={currentRating || undefined}
      onKeyDown={handleKeyDown}
      style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
    >
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const filled = star <= (hoverRating || currentRating);
        return (
          <button
            key={star}
            tabIndex={-1}
            onClick={() => onChange(String(star))}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "size-10 transition-colors sm:size-12",
                filled ? "fill-current" : c.starEmpty,
              )}
              style={filled ? { color: themeColor } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

function ScaleInput({
  question,
  value,
  onChange,
  themeColor,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();
  const minValue = (question.properties?.minValue as number) ?? 1;
  const maxValue = (question.properties?.maxValue as number) ?? 10;
  const minLabel = (question.properties?.minLabel as string) || "";
  const maxLabel = (question.properties?.maxLabel as string) || "";
  const currentValue = value ? parseInt(value, 10) : null;
  const range = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => minValue + i,
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newValue = currentValue ?? minValue;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = Math.min((currentValue ?? minValue - 1) + 1, maxValue);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = Math.max((currentValue ?? minValue + 1) - 1, minValue);
        break;
      default:
        // Number keys 0-9
        if (/^[0-9]$/.test(e.key)) {
          const n = parseInt(e.key, 10);
          if (n >= minValue && n <= maxValue) {
            e.preventDefault();
            newValue = n;
          }
        }
        return;
    }
    onChange(String(newValue));
  };

  return (
    <div>
      <div
        className="flex flex-wrap gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        tabIndex={0}
        role="slider"
        aria-label="Scale"
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        aria-valuenow={currentValue ?? undefined}
        onKeyDown={handleKeyDown}
        style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
      >
        {range.map((num) => {
          const isSelected = num === currentValue;
          return (
            <button
              key={num}
              tabIndex={-1}
              onClick={() => onChange(String(num))}
              className={cn(
                "flex size-12 items-center justify-center rounded-lg border-2 text-base font-bold transition-all hover:shadow-sm sm:size-14 sm:text-lg",
                isSelected ? "shadow-sm" : cn(c.border, c.text, c.borderHover),
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
        <div className={cn("mt-3 flex justify-between text-sm", c.textMuted)}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function YesNoInput({
  value,
  onChange,
  themeColor,
}: {
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
}) {
  const c = useC();

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key.toLowerCase() === "y") onChange("Yes");
      if (e.key.toLowerCase() === "n") onChange("No");
    }
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [onChange]);

  return (
    <div className="flex gap-4">
      {["Yes", "No"].map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              "flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-lg border-2 px-8 text-lg font-bold transition-all hover:shadow-sm sm:h-16 sm:min-w-[140px] sm:text-xl",
              isSelected ? "shadow-sm" : cn(c.border, c.text, c.borderHover),
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
            <kbd
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-xs",
                isSelected
                  ? contrastColor(themeColor) === "white"
                    ? "border-white/30 bg-white/20"
                    : "border-black/20 bg-black/10"
                  : c.yesNoKbd,
              )}
            >
              {option === "Yes" ? "Y" : "N"}
            </kbd>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FileUploadInput({
  question,
  value,
  onChange,
  themeColor,
  formId,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
  formId: string;
}) {
  const c = useC();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>(value || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  async function uploadFile(file: File) {
    setError("");

    if (file.size > MAX_SIZE) {
      setError("File size exceeds 10 MB limit.");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("formId", formId);

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setFileName("");
        return;
      }

      setFileUrl(data.url);
      onChange(data.url);
    } catch {
      setError("Upload failed. Please try again.");
      setFileName("");
    } finally {
      setUploading(false);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          "flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 transition-colors",
          c.text,
          c.border,
          c.surfaceSubtle,
          dragOver
            ? "border-solid opacity-80"
            : c.borderHover,
          uploading && "pointer-events-none opacity-60",
        )}
        style={dragOver ? { borderColor: themeColor } : undefined}
      >
        <div
          className="flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${themeColor}20` }}
        >
          {uploading ? (
            <div
              className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: themeColor }}
            />
          ) : (
            <Upload className="size-6" style={{ color: themeColor }} />
          )}
        </div>
        {uploading ? (
          <p className="text-base font-medium">Uploading {fileName}...</p>
        ) : fileUrl ? (
          <div className="text-center">
            <p className="text-base font-medium">{fileName || "File uploaded"}</p>
            <p className={cn("mt-1 text-sm", c.textMuted)}>
              Click to change file
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-base font-medium">
              Choose file or drag and drop
            </p>
            <p className={cn("mt-1 text-sm", c.textMuted)}>
              Max file size: 10MB
            </p>
          </div>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionView - renders the question header + the appropriate input
// ---------------------------------------------------------------------------

function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  value,
  onChange,
  themeColor,
  onNext,
  formId,
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  value: string;
  onChange: (v: string) => void;
  themeColor: string;
  onNext: () => void;
  formId: string;
}) {
  const c = useC();

  const renderInput = () => {
    switch (question.type) {
      case "SHORT_TEXT":
        return (
          <ShortTextInput
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "LONG_TEXT":
        return (
          <LongTextInput
            question={question}
            value={value}
            onChange={onChange}
          />
        );
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoiceInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "DROPDOWN":
        return (
          <DropdownInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "EMAIL":
        return (
          <EmailInput question={question} value={value} onChange={onChange} />
        );
      case "NUMBER":
        return (
          <NumberInput question={question} value={value} onChange={onChange} />
        );
      case "PHONE":
        return (
          <PhoneInput question={question} value={value} onChange={onChange} />
        );
      case "DATE":
        return (
          <DateInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "RATING":
        return (
          <RatingInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "SCALE":
        return (
          <ScaleInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "YES_NO":
        return (
          <YesNoInput
            value={value}
            onChange={onChange}
            themeColor={themeColor}
          />
        );
      case "FILE_UPLOAD":
        return (
          <FileUploadInput
            question={question}
            value={value}
            onChange={onChange}
            themeColor={themeColor}
            formId={formId}
          />
        );
      default:
        return null;
    }
  };

  const showOkButton =
    question.type !== "MULTIPLE_CHOICE" || question.properties?.allowMultiple;

  return (
    <div className="flex w-full max-w-2xl flex-col items-start">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: themeColor }}>
          {questionNumber}
        </span>
        <span className={cn("text-sm", c.textMuted)}>of {totalQuestions}</span>
        {question.required && (
          <span className="text-sm font-medium text-red-500">*</span>
        )}
      </div>
      <h2
        className={cn(
          "mb-2 text-2xl font-bold tracking-tight sm:text-3xl",
          c.text,
        )}
      >
        {question.title}
      </h2>
      {question.description && (
        <p className={cn("mb-6 text-base sm:text-lg", c.textMuted)}>
          {question.description}
        </p>
      )}
      {!question.description && <div className="mb-6" />}
      <div className="w-full">{renderInput()}</div>
      {showOkButton && (
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={onNext}
            className="inline-flex h-11 items-center justify-center rounded-lg px-6 font-semibold transition-all hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:brightness-75"
            style={{
              backgroundColor: themeColor,
              color: contrastColor(themeColor),
            }}
          >
            OK
            <Check className="ml-2 size-4" />
          </button>
          <span className={cn("text-sm", c.textMuted)}>
            press{" "}
            <kbd
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                c.kbdBorder,
                c.kbdBg,
              )}
            >
              Enter
            </kbd>
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FormRenderer Component
// ---------------------------------------------------------------------------

export function FormRenderer({ form, isPreview = false }: FormRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [navigationHistory, setNavigationHistory] = useState<number[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("up");
  const [visible, setVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [pendingAnswerPayload, setPendingAnswerPayload] = useState<
    { questionId: string; value: string }[] | null
  >(null);
  const [pendingThankYouIndex, setPendingThankYouIndex] = useState<
    number | null
  >(null);
  const visitedRef = useRef(new Set<number>());

  const questions = form.questions;
  const currentQuestion = questions[currentIndex];
  const themeColor = form.themeColor || "#6366f1";

  // Count answerable questions for progress and numbering
  const answerableQuestions = useMemo(
    () => questions.filter((q) => isAnswerableQuestion(q.type)),
    [questions],
  );
  const totalAnswerable = answerableQuestions.length;

  // Progress: percentage based on current position among all questions
  const progress = useMemo(() => {
    if (questions.length <= 1) return 100;
    return Math.round((currentIndex / (questions.length - 1)) * 100);
  }, [currentIndex, questions.length]);

  // Get the question number for answerable questions
  const questionNumber = useMemo(() => {
    if (!currentQuestion || !isAnswerableQuestion(currentQuestion.type))
      return 0;
    return (
      answerableQuestions.findIndex((q) => q.id === currentQuestion.id) + 1
    );
  }, [currentQuestion, answerableQuestions]);

  // Validate current question
  const validateCurrent = useCallback((): boolean => {
    if (!currentQuestion) return true;
    const type = currentQuestion.type;

    if (!isAnswerableQuestion(type)) return true;

    const answer = answers[currentQuestion.id] || "";

    if (currentQuestion.required && !answer.trim()) {
      toast.error("This field is required");
      return false;
    }

    if (type === "EMAIL" && answer.trim() && !validateEmail(answer)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Field-level validation from properties.validation
    const validation = currentQuestion.properties?.validation as
      | Record<string, any>
      | undefined;

    if (validation && answer.trim()) {
      // EMAIL: domain allow/block lists
      if (type === "EMAIL") {
        const emailDomain = answer.split("@")[1]?.toLowerCase();
        if (emailDomain) {
          const allowed: string[] = validation.allowedDomains ?? [];
          if (allowed.length > 0 && !allowed.includes(emailDomain)) {
            toast.error(
              `Only emails from these domains are accepted: ${allowed.join(", ")}`,
            );
            return false;
          }
          const blocked: string[] = validation.blockedDomains ?? [];
          if (blocked.length > 0 && blocked.includes(emailDomain)) {
            toast.error(`Emails from ${emailDomain} are not accepted`);
            return false;
          }
        }
      }

      // PHONE: format check
      if (type === "PHONE" && validation.phoneFormat) {
        if (!validatePhone(answer)) {
          toast.error("Please enter a valid phone number");
          return false;
        }
      }

      // NUMBER: min/max range
      if (type === "NUMBER") {
        const num = parseFloat(answer.trim());
        if (!isNaN(num)) {
          if (
            validation.min !== undefined &&
            validation.min !== null &&
            num < validation.min
          ) {
            toast.error(`Value must be at least ${validation.min}`);
            return false;
          }
          if (
            validation.max !== undefined &&
            validation.max !== null &&
            num > validation.max
          ) {
            toast.error(`Value must be at most ${validation.max}`);
            return false;
          }
        }
      }
    }

    return true;
  }, [currentQuestion, answers]);

  // Transition helper
  const transitionTo = useCallback(
    (nextIndex: number, direction: "up" | "down") => {
      if (transitioning) return;
      setTransitioning(true);
      setSlideDirection(direction);
      setVisible(false);

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setSlideDirection(direction);
        setVisible(true);
        setTimeout(() => {
          setTransitioning(false);
        }, 400);
      }, 300);
    },
    [transitioning],
  );

  // Handle payment flow with selected option IDs
  const executePaymentFlow = useCallback(
    async (
      answerPayload: { questionId: string; value: string }[],
      selectedOptionIds?: string[],
    ) => {
      const meta = {
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        referrer:
          typeof document !== "undefined" ? document.referrer : undefined,
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
    },
    [form.id, form.slug],
  );

  // Called when the user confirms payment option selection
  const handlePaymentSelectorConfirm = useCallback(
    async (selectedIds: string[]) => {
      if (!pendingAnswerPayload) return;
      setSubmitting(true);
      try {
        await executePaymentFlow(pendingAnswerPayload, selectedIds);
      } catch {
        toast.error("Something went wrong. Please try again.");
        setSubmitting(false);
      }
    },
    [pendingAnswerPayload, executePaymentFlow],
  );

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;

    const answerPayload = answerableQuestions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({
        questionId: q.id,
        value: answers[q.id],
      }));

    if (isPaymentOptionsForm(form)) {
      // Show payment selector overlay
      setPendingAnswerPayload(answerPayload);
      setPendingThankYouIndex(null);
      setShowPaymentSelector(true);
      return;
    }

    setSubmitting(true);
    try {
      if (isPreview) {
        setSubmitted(true);
      } else {
        const meta = {
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          referrer:
            typeof document !== "undefined" ? document.referrer : undefined,
        };

        if (isLegacyPaymentForm(form)) {
          await executePaymentFlow(answerPayload);
        } else {
          await submitFormResponse(form.id, answerPayload, meta);
          setSubmitted(true);
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    submitted,
    answerableQuestions,
    answers,
    form,
    isPreview,
    executePaymentFlow,
  ]);

  // Go to next question (with conditional logic evaluation)
  const goNext = useCallback(async () => {
    if (transitioning) return;

    if (!validateCurrent()) return;

    // Push current position onto the navigation history stack
    setNavigationHistory((prev) => [...prev, currentIndex]);

    // Evaluate logic rules for the current question
    const currentAnswer = currentQuestion
      ? (answers[currentQuestion.id] ?? "")
      : "";
    const currentRules = currentQuestion?.logic ?? [];
    let resolvedNextIndex: number;

    if (
      currentRules.length > 0 &&
      currentQuestion &&
      isAnswerableQuestion(currentQuestion.type)
    ) {
      const logicResult = evaluateLogicRules(
        currentRules,
        currentAnswer,
        questions,
      );

      if (logicResult === "end") {
        // Jump to end: find the THANK_YOU_SCREEN or use last index
        const thankYouIndex = questions.findIndex(
          (q) => q.type === "THANK_YOU_SCREEN",
        );
        resolvedNextIndex =
          thankYouIndex >= 0 ? thankYouIndex : questions.length - 1;
      } else if (logicResult !== null) {
        resolvedNextIndex = logicResult;
      } else {
        // No logic rule matched — check defaultDestination
        const defaultDest = currentQuestion.properties?.defaultDestination as
          | { type: string; questionId?: string }
          | undefined;
        if (defaultDest?.type === "end_form") {
          const thankYouIdx = questions.findIndex(
            (q) => q.type === "THANK_YOU_SCREEN",
          );
          resolvedNextIndex =
            thankYouIdx >= 0 ? thankYouIdx : questions.length - 1;
        } else if (defaultDest?.type === "jump_to" && defaultDest.questionId) {
          const targetIdx = questions.findIndex(
            (q) => q.id === defaultDest.questionId,
          );
          resolvedNextIndex = targetIdx >= 0 ? targetIdx : currentIndex + 1;
        } else {
          resolvedNextIndex = currentIndex + 1;
        }
      }
    } else {
      // No logic rules at all — check defaultDestination
      const defaultDest = currentQuestion?.properties?.defaultDestination as
        | { type: string; questionId?: string }
        | undefined;
      if (defaultDest?.type === "end_form") {
        const thankYouIdx = questions.findIndex(
          (q) => q.type === "THANK_YOU_SCREEN",
        );
        resolvedNextIndex =
          thankYouIdx >= 0 ? thankYouIdx : questions.length - 1;
      } else if (defaultDest?.type === "jump_to" && defaultDest.questionId) {
        const targetIdx = questions.findIndex(
          (q) => q.id === defaultDest.questionId,
        );
        resolvedNextIndex = targetIdx >= 0 ? targetIdx : currentIndex + 1;
      } else {
        resolvedNextIndex = currentIndex + 1;
      }
    }

    // Cycle detection: if we've already visited this index, skip to next sequential
    if (visitedRef.current.has(resolvedNextIndex)) {
      let fallback = currentIndex + 1;
      while (
        fallback < questions.length &&
        visitedRef.current.has(fallback)
      ) {
        fallback++;
      }
      resolvedNextIndex = fallback;
    }

    if (resolvedNextIndex >= questions.length) return;

    // Track visited questions
    visitedRef.current.add(resolvedNextIndex);

    // If the resolved next question is THANK_YOU_SCREEN, submit first
    const nextQ = questions[resolvedNextIndex];
    if (nextQ.type === "THANK_YOU_SCREEN" && !submitted) {
      const answerPayload = answerableQuestions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          value: answers[q.id],
        }));

      if (isPaymentOptionsForm(form)) {
        // Show payment selector overlay
        setPendingAnswerPayload(answerPayload);
        setPendingThankYouIndex(resolvedNextIndex);
        setShowPaymentSelector(true);
        return;
      }

      setSubmitting(true);
      try {
        if (isPreview) {
          setSubmitted(true);
          setSubmitting(false);
          transitionTo(resolvedNextIndex, "up");
        } else {
          const meta = {
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : undefined,
            referrer:
              typeof document !== "undefined" ? document.referrer : undefined,
          };

          if (isLegacyPaymentForm(form)) {
            await executePaymentFlow(answerPayload);
            return;
          } else {
            await submitFormResponse(form.id, answerPayload, meta);
            setSubmitted(true);
            setSubmitting(false);
            transitionTo(resolvedNextIndex, "up");
          }
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    transitionTo(resolvedNextIndex, "up");
  }, [
    currentIndex,
    currentQuestion,
    questions,
    transitioning,
    validateCurrent,
    submitted,
    answerableQuestions,
    answers,
    form,
    isPreview,
    transitionTo,
    handleSubmit,
    executePaymentFlow,
  ]);

  // Go to previous question (using navigation history stack)
  const goPrev = useCallback(() => {
    if (transitioning || submitted) return;
    if (navigationHistory.length === 0) return;

    // Remove current index from visited set so it can be visited again
    visitedRef.current.delete(currentIndex);

    const prevIndex = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory((prev) => prev.slice(0, -1));
    transitionTo(prevIndex, "down");
  }, [navigationHistory, transitioning, submitted, transitionTo, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        if (currentQuestion?.type === "LONG_TEXT") {
          if (!e.shiftKey) {
            e.preventDefault();
            goNext();
          }
          return;
        }
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, currentQuestion?.type]);

  // Auto-advance for single-select multiple choice and yes/no
  const prevAnswerRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];

    if (
      currentQuestion.type === "YES_NO" &&
      answer &&
      answer !== prevAnswerRef.current
    ) {
      prevAnswerRef.current = answer;
      const timer = setTimeout(() => goNext(), 400);
      return () => clearTimeout(timer);
    }

    if (
      currentQuestion.type === "MULTIPLE_CHOICE" &&
      !currentQuestion.properties?.allowMultiple &&
      answer &&
      answer !== prevAnswerRef.current
    ) {
      prevAnswerRef.current = answer;
      const timer = setTimeout(() => goNext(), 400);
      return () => clearTimeout(timer);
    }

    prevAnswerRef.current = answer;
  }, [answers, currentQuestion, goNext]);

  // Answer updater
  const updateAnswer = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion],
  );

  // Determine what to render
  const renderContent = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === "WELCOME_SCREEN") {
      return (
        <WelcomeScreen
          question={currentQuestion}
          themeColor={themeColor}
          onNext={goNext}
        />
      );
    }

    if (currentQuestion.type === "THANK_YOU_SCREEN") {
      return (
        <ThankYouScreen
          question={currentQuestion}
          themeColor={themeColor}
          redirectUrl={form.redirectUrl}
          removeBranding={form.removeBranding}
        />
      );
    }

    if (currentQuestion.type === "STATEMENT") {
      return (
        <StatementScreen
          question={currentQuestion}
          themeColor={themeColor}
          onNext={goNext}
        />
      );
    }

    return (
      <QuestionView
        question={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={totalAnswerable}
        value={answers[currentQuestion.id] || ""}
        onChange={updateAnswer}
        themeColor={themeColor}
        onNext={goNext}
        formId={form.id}
      />
    );
  };

  const isWelcomeOrThankYou =
    currentQuestion?.type === "WELCOME_SCREEN" ||
    currentQuestion?.type === "THANK_YOU_SCREEN";

  // Resolve background colour – when using SYSTEM theme we need to listen
  // for the OS preference so we can swap the default white background to
  // a dark surface, keeping text readable.
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (form.themeMode !== "SYSTEM") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [form.themeMode]);

  const isDark =
    form.themeMode === "DARK" || (form.themeMode === "SYSTEM" && systemDark);
  const defaultBg = form.backgroundColor || "#ffffff";
  const isDefaultWhiteBg =
    defaultBg.toLowerCase() === "#ffffff" || defaultBg.toLowerCase() === "#fff";
  const bgColor = isDark && isDefaultWhiteBg ? "#0f172a" : defaultBg;

  // Choose colour tokens based on actual background luminance — this is
  // completely independent of the page-level dark/light mode.
  const bgIsDark = contrastColor(bgColor) === "white";
  const colors = bgIsDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <FormColorsCtx.Provider value={colors}>
      <FormThemeWrapper bgColor={bgColor}>
        <div
          className={cn("relative flex min-h-screen flex-col", colors.text)}
          style={{ backgroundColor: bgColor }}
        >
          {/* Progress bar */}
          {form.showProgressBar && !isWelcomeOrThankYou && (
            <div
              className="fixed inset-x-0 top-0 z-50 h-1"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: themeColor,
                }}
              />
            </div>
          )}

          {/* Main content area */}
          <main className="flex flex-1 items-center justify-center px-6 py-16 sm:px-8">
            <div
              className={cn(
                "w-full max-w-2xl transition-all duration-300 ease-out",
                isWelcomeOrThankYou && "flex items-center justify-center",
                visible
                  ? "translate-y-0 opacity-100"
                  : slideDirection === "up"
                    ? "-translate-y-8 opacity-0"
                    : "translate-y-8 opacity-0",
              )}
            >
              {renderContent()}
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
          </main>

          {/* Branding footer (bottom left) */}
          {!form.removeBranding && (
            <a
              href="https://gudform.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "fixed bottom-6 left-6 z-40 text-xs transition-opacity hover:opacity-80",
                colors.textMuted,
              )}
            >
              Powered by <span className="font-semibold">GudForm</span>
            </a>
          )}

          {/* Navigation buttons (bottom right) */}
          {!isWelcomeOrThankYou && (
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5">
              <button
                onClick={goPrev}
                disabled={navigationHistory.length === 0 || transitioning}
                className={cn(
                  "flex size-12 items-center justify-center rounded-lg border shadow-sm transition-colors disabled:opacity-30 sm:size-10",
                  colors.border,
                  colors.surface,
                  colors.text,
                  colors.surfaceHover,
                )}
                aria-label="Previous question"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex >= questions.length - 1 || transitioning}
                className={cn(
                  "flex size-12 items-center justify-center rounded-lg border shadow-sm transition-colors disabled:opacity-30 sm:size-10",
                  colors.border,
                  colors.surface,
                  colors.text,
                  colors.surfaceHover,
                )}
                aria-label="Next question"
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          )}
        </div>
      </FormThemeWrapper>
    </FormColorsCtx.Provider>
  );
}
