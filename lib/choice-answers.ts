export const CHOICE_SEPARATOR = "|||";
export const OTHER_PREFIX = "Other: ";

export function formatOtherAnswer(text: string): string {
  return `${OTHER_PREFIX}${text.trim()}`;
}

export function isOtherAnswer(value: string): boolean {
  return value.startsWith(OTHER_PREFIX) || value.trim() === "Other:";
}

export function parseOtherAnswer(value: string): string {
  if (value.startsWith(OTHER_PREFIX)) return value.slice(OTHER_PREFIX.length).trim();
  if (value.trim() === "Other:") return "";
  return "";
}

function isAllowedChoice(
  item: string,
  choices: string[],
  allowOther?: boolean,
): boolean {
  if (choices.includes(item)) return true;
  if (allowOther && isOtherAnswer(item) && parseOtherAnswer(item)) return true;
  return false;
}

export function parseChoiceAnswer(value: string | null | undefined): string[] {
  if (!value || !value.trim()) return [];
  return value
    .split(CHOICE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinChoiceAnswer(values: string[]): string {
  return values.join(CHOICE_SEPARATOR);
}

export function formatChoiceAnswerForDisplay(value: string): string {
  return parseChoiceAnswer(value).join(", ");
}

export function choiceAnswerIncludes(answer: string, option: string): boolean {
  const needle = option.trim().toLowerCase();
  if (!needle) return false;
  return parseChoiceAnswer(answer).some(
    (selected) => selected.toLowerCase() === needle,
  );
}

export function answerContains(answer: string, value: string): boolean {
  if (answer.includes(CHOICE_SEPARATOR)) {
    return choiceAnswerIncludes(answer, value);
  }
  return answer.toLowerCase().includes((value || "").toLowerCase());
}

export function getSelectionHint(options: {
  minSelections?: number;
  maxSelections?: number;
}): string {
  const min = options.minSelections ?? 0;
  const max = options.maxSelections;

  if (max != null && min > 0 && min === max) {
    return `Choose ${min} option${min === 1 ? "" : "s"}`;
  }
  if (min > 0 && max != null) {
    return `Choose ${min} to ${max} options`;
  }
  if (min > 0 && max == null) {
    return `Choose at least ${min} option${min === 1 ? "" : "s"}`;
  }
  if (max != null) {
    return `Choose up to ${max} option${max === 1 ? "" : "s"}`;
  }
  return "Choose as many as you like";
}

export function validateRankingAnswer(
  value: string,
  choices: string[],
): { valid: boolean; error?: string } {
  const selected = parseChoiceAnswer(value);
  if (selected.length !== choices.length) {
    return { valid: false, error: "Rank every option exactly once" };
  }
  const seen = new Set<string>();
  for (const item of selected) {
    if (!choices.includes(item) || seen.has(item)) {
      return { valid: false, error: "Rank every option exactly once" };
    }
    seen.add(item);
  }
  return { valid: true };
}

export function validateChoiceSelections(
  value: string,
  options: {
    choices: string[];
    allowMultiple?: boolean;
    minSelections?: number;
    maxSelections?: number;
    allowOther?: boolean;
  },
): { valid: boolean; error?: string } {
  const selected = parseChoiceAnswer(value);
  const { choices, allowMultiple, allowOther } = options;

  if (!allowMultiple) {
    if (choices.length > 0 && selected.length === 1 && isAllowedChoice(selected[0], choices, allowOther)) {
      return { valid: true };
    }
    if (choices.length > 0 && selected.length === 1 && !isAllowedChoice(selected[0], choices, allowOther)) {
      return { valid: false, error: "Answer must be one of the available choices" };
    }
    if (choices.length > 0 && selected.length > 1) {
      return { valid: false, error: "Answer must be one of the available choices" };
    }
    if (choices.length === 0) return { valid: true };
    if (selected.length === 0) return { valid: true };
    return { valid: false, error: "Answer must be one of the available choices" };
  }

  if (choices.length > 0) {
    for (const item of selected) {
      if (!isAllowedChoice(item, choices, allowOther)) {
        return { valid: false, error: "Answer must be one of the available choices" };
      }
    }
  }

  const min = options.minSelections ?? 0;
  const max = options.maxSelections;

  if (min > 0 && selected.length < min) {
    return {
      valid: false,
      error: `Select at least ${min} option${min === 1 ? "" : "s"}`,
    };
  }
  if (max != null && selected.length > max) {
    return {
      valid: false,
      error: `Select at most ${max} option${max === 1 ? "" : "s"}`,
    };
  }

  return { valid: true };
}
