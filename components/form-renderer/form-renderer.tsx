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

// ---------------------------------------------------------------------------
// Question Components
// ---------------------------------------------------------------------------

function ScreenCopy({
  question,
  heading = "h1",
}: {
  question: Question;
  heading?: "h1" | "h2";
}) {
  const c = useC();
  const format = getScreenFormat(question.type, question.properties);
  return (
    <>
      <FormattedText
        as={heading}
        text={question.title}
        className={cn(
          screenTitleClassName(format),
          !format.titleColor && c.text,
          "leading-tight tracking-tight",
        )}
        style={format.titleColor ? { color: format.titleColor } : undefined}
      />
      {question.description && (
        <FormattedText
          as="div"
          text={question.description}
          className={cn(
            "mt-6 max-w-2xl leading-relaxed",
            screenDescriptionClassName(format),
            !format.descriptionColor && c.textMuted,
          )}
          style={
            format.descriptionColor
              ? { color: format.descriptionColor }
              : undefined
          }
        />
      )}
    </>
  );
}

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
  const format = getScreenFormat(question.type, question.properties);
  const buttonText =
    (question.properties?.buttonText as string | undefined)?.trim() || "Start";
  return (
    <div
      className={cn(
        "flex flex-col",
        format.align === "center"
          ? "items-center justify-center text-center"
          : "items-start text-left",
      )}
    >
      <ScreenCopy question={question} />
      <button
        onClick={onNext}
        className="mt-12 inline-flex h-14 items-center justify-center rounded-xl px-10 text-base font-semibold shadow-sm transition-all hover:shadow-md hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 active:scale-[0.98]"
        style={{
          backgroundColor: themeColor,
          color: contrastColor(themeColor),
        }}
      >
        {buttonText}
      </button>
      <p className={cn("mt-5 text-xs", c.textMuted)}>
        press{" "}
        <kbd
          className={cn(
            "rounded-md border px-2 py-1 font-mono text-[10px] font-medium shadow-sm",
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

  const format = getScreenFormat(question.type, question.properties);

  return (
    <div
      className={cn(
        "flex flex-col",
        format.align === "center"
          ? "items-center justify-center text-center"
          : "items-start text-left",
      )}
    >
      <div
        className="mb-8 flex size-20 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <Check
          className="size-10"
          style={{ color: contrastColor(themeColor) }}
        />
      </div>
      <ScreenCopy question={question} />
      {redirectUrl && (
        <p className={cn("mt-8 text-base", c.textMuted)}>
          Redirecting you shortly...
        </p>
      )}
      {!removeBranding && (
        <a
          href="https://gudform.com"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-10 text-sm transition-opacity hover:opacity-80",
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
  const format = getScreenFormat(question.type, question.properties);
  const buttonText =
    (question.properties?.buttonText as string | undefined)?.trim() ||
    "Continue";
  return (
    <div
      className={cn(
        "flex flex-col",
        format.align === "center"
          ? "items-center text-center"
          : "items-start text-left",
      )}
    >
      <ScreenCopy question={question} heading="h2" />
      <button
        onClick={onNext}
        className="mt-10 inline-flex h-12 items-center justify-center rounded-xl px-8 font-semibold shadow-sm transition-all hover:shadow-md hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 active:scale-[0.98]"
        style={{
          backgroundColor: themeColor,
          color: contrastColor(themeColor),
        }}
      >
        {buttonText}
      </button>
      <p className={cn("mt-4 text-xs", c.textMuted)}>
        press{" "}
        <kbd
          className={cn(
            "rounded-md border px-2 py-1 font-mono text-[10px] font-medium shadow-sm",
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
    (question.properties?.placeholder as string) ||
    (question.properties?.format === "url"
      ? "https://"
      : "Type your answer here...");
  const inputType = question.properties?.format === "url" ? "url" : "text";
  return (
    <input
      type={inputType}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputType === "url" ? "url" : undefined}
      className={cn(
        "w-full border-0 border-b-2 bg-transparent pb-3 text-2xl font-medium outline-none transition-all duration-200 sm:text-3xl",
        c.text,
        c.border,
        c.borderFocus,
        c.placeholder,
        "focus:border-b-[3px]",
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
  const allowOther = question.properties?.allowOther === true;
  const pictureChoice = question.properties?.pictureChoice === true;
  const choiceImages: (string | null | undefined)[] = Array.isArray(
    question.properties?.choiceImages,
  )
    ? question.properties.choiceImages
    : [];
  const minSelections =
    typeof question.properties?.minSelections === "number"
      ? question.properties.minSelections
      : undefined;
  const maxSelections =
    typeof question.properties?.maxSelections === "number"
      ? question.properties.maxSelections
      : undefined;

  const selectedValues = useMemo(() => {
    return new Set(parseChoiceAnswer(value));
  }, [value]);

  const otherSelected = Array.from(selectedValues).some(isOtherAnswer);
  const otherText = parseOtherAnswer(
    Array.from(selectedValues).find(isOtherAnswer) || "",
  );
  const [otherDraft, setOtherDraft] = useState(otherText);

  const applyOther = useCallback(
    (text: string) => {
      const formatted = formatOtherAnswer(text);
      if (allowMultiple) {
        const next = Array.from(selectedValues).filter((item) => !isOtherAnswer(item));
        next.push(formatted);
        onChange(joinChoiceAnswer(next));
      } else {
        onChange(formatted);
      }
    },
    [allowMultiple, onChange, selectedValues],
  );

  const handleSelect = useCallback(
    (option: string) => {
      if (allowMultiple) {
        const next = new Set(selectedValues);
        if (next.has(option)) {
          next.delete(option);
        } else {
          if (maxSelections != null && next.size >= maxSelections) {
            toast.error(
              `Select at most ${maxSelections} option${maxSelections === 1 ? "" : "s"}`,
            );
            return;
          }
          next.add(option);
        }
        onChange(joinChoiceAnswer(Array.from(next)));
      } else {
        onChange(option);
      }
    },
    [allowMultiple, selectedValues, onChange, maxSelections],
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
        const image = choiceImages[idx];
        return (
          <button
            key={idx}
            onClick={() => handleSelect(option)}
            className={cn(
              "group flex items-center gap-3.5 rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all sm:text-lg",
              c.text,
              isSelected 
                ? "shadow-md" 
                : cn(c.border, c.borderHover, "hover:shadow-sm"),
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
            {pictureChoice && image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="size-16 shrink-0 rounded-lg object-cover shadow-sm"
              />
            ) : null}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center text-sm font-bold transition-all",
                allowMultiple ? "rounded-lg" : "rounded-full",
                !isSelected &&
                  cn("border-2 shadow-sm", c.badgeBorder, c.badgeBg, c.badgeText, "group-hover:border/60"),
                isSelected && "shadow-md",
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
              {allowMultiple ? (
                isSelected ? (
                  <Check className="size-4.5" />
                ) : null
              ) : (
                LETTERS[idx]
              )}
            </span>
            <span className="flex-1 leading-snug">{option}</span>
            {isSelected && !allowMultiple && (
              <Check
                className="size-5 shrink-0"
                style={{ color: themeColor }}
              />
            )}
          </button>
        );
      })}
      {allowOther && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (otherSelected && !allowMultiple) {
                onChange("");
                return;
              }
              applyOther(otherDraft);
            }}
            className={cn(
              "group flex items-center gap-3.5 rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all sm:text-lg",
              c.text,
              otherSelected ? "shadow-md" : cn(c.border, c.borderHover, "hover:shadow-sm"),
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
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                !otherSelected &&
                  cn("border-2 shadow-sm", c.badgeBorder, c.badgeBg, c.badgeText, "group-hover:border/60"),
                otherSelected && "shadow-md",
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
              {LETTERS[options.length] || "+"}
            </span>
            <span className="flex-1 leading-snug">Other</span>
          </button>
          {otherSelected && (
            <input
              value={otherDraft}
              onChange={(e) => {
                setOtherDraft(e.target.value);
                applyOther(e.target.value);
              }}
              placeholder="Type your answer"
              className={cn(
                "ml-11 w-full max-w-md border-b-2 bg-transparent py-3 text-base outline-none transition-all duration-200 focus:border-b-[3px]",
                c.text,
                c.placeholder,
              )}
              style={{ borderColor: themeColor }}
            />
          )}
        </div>
      )}
      {allowMultiple && (
        <p className={cn("mt-3 text-sm", c.textMuted)}>
          {getSelectionHint({ minSelections, maxSelections })}
        </p>
      )}
    </div>
  );
}

function RankingInput({
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
  const ordered = useMemo(() => {
    const parsed = parseChoiceAnswer(value);
    if (
      parsed.length === options.length &&
      options.every((option) => parsed.includes(option))
    ) {
      return parsed;
    }
    return options;
  }, [value, options]);

  useEffect(() => {
    if (!value && options.length > 0) {
      onChange(joinChoiceAnswer(options));
    }
  }, [options, onChange, value]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(joinChoiceAnswer(next));
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((option, idx) => (
        <div
          key={`${option}-${idx}`}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex != null) move(dragIndex, idx);
            setDragIndex(null);
          }}
          className={cn(
            "flex cursor-grab items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base font-medium active:cursor-grabbing",
            c.text,
            c.border,
          )}
        >
          <GripVertical className="size-4 shrink-0 opacity-50" />
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
            aria-label="Move up"
            onClick={() => move(idx, idx - 1)}
            className={cn("rounded p-1", c.surfaceHover)}
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={() => move(idx, idx + 1)}
            className={cn("rounded p-1", c.surfaceHover)}
          >
            <ArrowDown className="size-4" />
          </button>
        </div>
      ))}
      <p className={cn("text-xs", c.textMuted)}>
        Drag or use the arrows to rank. 1 is highest.
      </p>
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
              "group flex h-16 min-w-[140px] items-center justify-center gap-3 rounded-xl border-2 px-10 text-lg font-bold transition-all sm:h-[4.5rem] sm:min-w-[160px] sm:text-xl",
              isSelected ? "scale-[1.02] shadow-lg" : cn(c.border, c.text, c.borderHover, "hover:scale-[1.01] hover:shadow-md"),
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
                "rounded-lg border px-2 py-1.5 font-mono text-xs font-semibold shadow-sm transition-all",
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

function SignatureInput({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = contrastColor(themeColor) === "white" ? "#f8fafc" : "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUploading(true);
    setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not save signature");
      const file = new File([blob], "signature.png", { type: "image/png" });
      const body = new FormData();
      body.append("file", file);
      body.append("formId", formId);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save signature");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <canvas
        ref={canvasRef}
        width={520}
        height={200}
        className={cn("w-full rounded-xl border-2", c.border)}
        style={{ touchAction: "none", backgroundColor: `${themeColor}08` }}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className={cn("rounded-lg border px-3 py-2 text-sm", c.border, c.text)}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          disabled={uploading}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: themeColor }}
        >
          {uploading ? "Saving..." : value ? "Update signature" : "Save signature"}
        </button>
      </div>
      {value && (
        <p className={cn("text-xs", c.textMuted)}>Signature saved</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
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

  const maxMb =
    (question.properties?.maxFileSize as number | undefined) ??
    (question.properties?.maxFileSizeMB as number | undefined) ??
    10;
  const MAX_SIZE = maxMb * 1024 * 1024;

  if (question.properties?.capture === "signature") {
    return (
      <SignatureInput
        question={question}
        value={value}
        onChange={onChange}
        themeColor={themeColor}
        formId={formId}
      />
    );
  }

  async function uploadFile(file: File) {
    setError("");

    if (file.size > MAX_SIZE) {
      setError(`File size exceeds ${maxMb} MB limit.`);
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
              Max file size: {maxMb}MB
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
        if (question.properties?.ranking === true) {
          return (
            <RankingInput
              question={question}
              value={value}
              onChange={onChange}
              themeColor={themeColor}
            />
          );
        }
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
    question.type !== "MULTIPLE_CHOICE" ||
    question.properties?.allowMultiple ||
    question.properties?.ranking ||
    question.properties?.allowOther;

  return (
    <div className="flex w-full max-w-2xl flex-col items-start">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-sm font-semibold tabular-nums" style={{ color: themeColor }}>
          {questionNumber}
        </span>
        <span className={cn("text-sm", c.textMuted)}>of {totalQuestions}</span>
        {question.required && (
          <span className="ml-1 text-sm font-semibold text-red-500">*</span>
        )}
      </div>
      <h2
        className={cn(
          "mb-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl",
          c.text,
        )}
      >
        {question.title}
      </h2>
      {question.description && (
        <p className={cn("mb-8 text-base leading-relaxed sm:text-lg", c.textMuted)}>
          {question.description}
        </p>
      )}
      {!question.description && <div className="mb-8" />}
      <div className="w-full">{renderInput()}</div>
      {showOkButton && (
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={onNext}
            className="inline-flex h-12 items-center justify-center rounded-xl px-8 font-semibold shadow-sm transition-all hover:shadow-md hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 active:scale-[0.98]"
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
                "rounded-md border px-2 py-1 font-mono text-[10px] font-medium shadow-sm",
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

export function FormRenderer({
  form,
  isPreview = false,
  isEmbed = false,
}: FormRendererProps) {
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
  const resumeTokenRef = useRef<string | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = form.questions;
  const currentQuestion = questions[currentIndex];
  const themeColor = form.themeColor || "#6366f1";

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
  }, [currentIndex, visible, submitting, showPaymentSelector]);

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

    if (
      type === "SHORT_TEXT" &&
      currentQuestion.properties?.format === "url" &&
      answer.trim() &&
      !validateWebsite(answer)
    ) {
      toast.error("Please enter a valid website URL");
      return false;
    }

    if (type === "MULTIPLE_CHOICE" && answer.trim()) {
      const choices = getQuestionOptions(currentQuestion);
      const result = currentQuestion.properties?.ranking
        ? validateRankingAnswer(answer, choices)
        : validateChoiceSelections(answer, {
            choices,
            allowMultiple: currentQuestion.properties?.allowMultiple === true,
            minSelections: currentQuestion.properties?.minSelections,
            maxSelections: currentQuestion.properties?.maxSelections,
            allowOther: currentQuestion.properties?.allowOther === true,
          });
      if (!result.valid) {
        toast.error(result.error || "Please choose a valid option");
        return false;
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
        }, 500);
      }, 400);
    },
    [transitioning],
  );

  // Handle payment flow with selected option IDs
  const executePaymentFlow = useCallback(
    async (
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
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
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
    const dest = currentQuestion
      ? resolveLogicDestination(
          currentQuestion,
          currentAnswer,
          questions,
          currentIndex,
        )
      : { type: "index" as const, index: currentIndex + 1 };

    const thankYouIdx = thankYouIndex(questions);
    const shouldSubmit =
      dest.type === "end" ||
      (dest.type === "index" &&
        (dest.index >= questions.length ||
          questions[dest.index]?.type === "THANK_YOU_SCREEN"));

    if (shouldSubmit && !submitted) {
      const answerPayload = answerableQuestions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
        .map((q) => ({
          questionId: q.id,
          value: answers[q.id],
        }));

      const nextIndex = thankYouIdx >= 0 ? thankYouIdx : currentIndex;

      if (isPaymentOptionsForm(form)) {
        setPendingAnswerPayload(answerPayload);
        setPendingThankYouIndex(thankYouIdx >= 0 ? thankYouIdx : null);
        setShowPaymentSelector(true);
        return;
      }

      setSubmitting(true);
      try {
        if (isPreview) {
          setSubmitted(true);
          setSubmitting(false);
          if (thankYouIdx >= 0) transitionTo(nextIndex, "up");
        } else if (isLegacyPaymentForm(form)) {
          await executePaymentFlow(answerPayload);
          return;
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
          setSubmitting(false);
          if (thankYouIdx >= 0) transitionTo(nextIndex, "up");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
        setSubmitting(false);
      }
      return;
    }

    let resolvedNextIndex = dest.type === "index" ? dest.index : currentIndex + 1;

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

    visitedRef.current.add(resolvedNextIndex);
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
      !currentQuestion.properties?.ranking &&
      answer &&
      !isOtherAnswer(answer) &&
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
      setAnswers((prev) => {
        const next = { ...prev, [currentQuestion.id]: value };
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
    },
    [currentQuestion, form.id, isPreview],
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

  // Use ClassicFormRenderer for classic display mode
  if (form.displayMode === "classic") {
    return (
      <FormColorsCtx.Provider value={colors}>
        <FormThemeWrapper bgColor={bgColor} fillViewport={!isEmbed}>
          <ClassicFormRenderer
            form={form}
            isPreview={isPreview}
            isEmbed={isEmbed}
            colors={colors}
            bgIsDark={bgIsDark}
            themeColor={themeColor}
            bgColor={bgColor}
          />
        </FormThemeWrapper>
      </FormColorsCtx.Provider>
    );
  }

  return (
    <FormColorsCtx.Provider value={colors}>
      <FormThemeWrapper bgColor={bgColor} fillViewport={!isEmbed}>
        <div
          className={cn(
            "relative flex flex-col",
            isEmbed ? "min-h-0" : "min-h-screen",
            colors.text,
          )}
          style={{ backgroundColor: bgColor }}
        >
          {/* Progress bar */}
          {form.showProgressBar && !isWelcomeOrThankYou && (
            <div
              className="fixed inset-x-0 top-0 z-50 h-1 shadow-sm"
              style={{ backgroundColor: `${themeColor}15` }}
            >
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: themeColor,
                  boxShadow: `0 0 8px ${themeColor}40`,
                }}
              />
            </div>
          )}

          {/* Main content area */}
          <main className="flex flex-1 items-center justify-center px-6 py-20 sm:px-8">
            <div
              className={cn(
                "w-full max-w-2xl transition-all duration-500 ease-out",
                isWelcomeOrThankYou && "flex items-center justify-center",
                visible
                  ? "translate-y-0 scale-100 opacity-100"
                  : slideDirection === "up"
                    ? "-translate-y-6 scale-[0.98] opacity-0"
                    : "translate-y-6 scale-[0.98] opacity-0",
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
