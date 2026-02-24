import { QuestionType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Logic rule types — shared by builder and renderer
// ---------------------------------------------------------------------------

export type LogicOperator =
  | "always" // kept for backward compatibility with existing data
  | "is_answered"
  | "is_not_answered"
  | "equals"
  | "does_not_equal"
  | "greater_than"
  | "less_than"
  | "contains"
  | "does_not_contain";

export type LogicAction =
  | { type: "jump_to"; questionId: string }
  | { type: "end_form" };

export interface LogicRule {
  id: string;
  operator: LogicOperator;
  value?: string;
  action: LogicAction;
}

/** Default destination when no logic rule matches. Stored in properties. */
export interface DefaultDestination {
  type: "next" | "jump_to" | "end_form";
  questionId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const OPERATOR_LABELS: Record<LogicOperator, string> = {
  always: "Always",
  is_answered: "Is answered",
  is_not_answered: "Is not answered",
  equals: "Equals",
  does_not_equal: "Does not equal",
  greater_than: "Greater than",
  less_than: "Less than",
  contains: "Contains",
  does_not_contain: "Does not contain",
};

const CHOICE_OPS: LogicOperator[] = ["equals", "does_not_equal"];
const NUMERIC_OPS: LogicOperator[] = [
  "equals",
  "does_not_equal",
  "greater_than",
  "less_than",
];
const TEXT_OPS: LogicOperator[] = ["equals", "contains", "does_not_contain"];
const UNIVERSAL_OPS: LogicOperator[] = ["is_answered", "is_not_answered"];

/** Returns selectable operators for the builder UI (excludes "always"). */
export function getOperatorsForType(type: QuestionType): LogicOperator[] {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.DROPDOWN:
    case QuestionType.YES_NO:
      return [...UNIVERSAL_OPS, ...CHOICE_OPS];
    case QuestionType.NUMBER:
    case QuestionType.RATING:
    case QuestionType.SCALE:
      return [...UNIVERSAL_OPS, ...NUMERIC_OPS];
    default:
      return [...UNIVERSAL_OPS, ...TEXT_OPS];
  }
}

/** Returns true when the operator needs a comparison value input. */
export function operatorNeedsValue(op: LogicOperator): boolean {
  return !["always", "is_answered", "is_not_answered"].includes(op);
}
