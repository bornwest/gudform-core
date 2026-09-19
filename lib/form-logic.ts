import {
  CHOICE_SEPARATOR,
  answerContains,
  choiceAnswerIncludes,
  parseChoiceAnswer,
} from "@/lib/choice-answers";
import type { LogicRule } from "@/lib/types/logic";

function isAnswerable(type: string): boolean {
  return (
    type !== "WELCOME_SCREEN" &&
    type !== "THANK_YOU_SCREEN" &&
    type !== "STATEMENT"
  );
}

export type LogicQuestion = {
  id: string;
  type: string;
  logic?: LogicRule[] | null;
  properties?: Record<string, unknown> | null;
};

export type LogicDestination =
  | { type: "end" }
  | { type: "index"; index: number };

type AnswerRef = { questionId: string; value: string };

function asRules(logic: LogicQuestion["logic"]): LogicRule[] {
  return Array.isArray(logic) ? logic : [];
}

function defaultDestination(
  question: LogicQuestion,
): { type?: string; questionId?: string } | undefined {
  const dest = question.properties?.defaultDestination;
  if (!dest || typeof dest !== "object") return undefined;
  return dest as { type?: string; questionId?: string };
}

function bothNumeric(a: string, b: string): boolean {
  return a.trim() !== "" && b.trim() !== "" && !isNaN(parseFloat(a)) && !isNaN(parseFloat(b));
}

export function matchesLogicRule(rule: LogicRule, answer: string): boolean {
  const trimmed = (answer || "").trim();
  const ruleValue = rule.value ?? "";

  switch (rule.operator) {
    case "always":
      return true;
    case "is_answered":
      return trimmed.length > 0;
    case "is_not_answered":
      return trimmed.length === 0;
    case "equals": {
      if (!ruleValue) return false;
      if (trimmed.includes(CHOICE_SEPARATOR) || parseChoiceAnswer(trimmed).length > 1) {
        return choiceAnswerIncludes(trimmed, ruleValue);
      }
      if (bothNumeric(trimmed, ruleValue)) {
        return parseFloat(trimmed) === parseFloat(ruleValue);
      }
      return trimmed.toLowerCase() === ruleValue.toLowerCase();
    }
    case "does_not_equal": {
      if (!ruleValue) return false;
      if (trimmed.includes(CHOICE_SEPARATOR) || parseChoiceAnswer(trimmed).length > 1) {
        return !choiceAnswerIncludes(trimmed, ruleValue);
      }
      if (bothNumeric(trimmed, ruleValue)) {
        return parseFloat(trimmed) !== parseFloat(ruleValue);
      }
      return trimmed.toLowerCase() !== ruleValue.toLowerCase();
    }
    case "greater_than": {
      const n = parseFloat(trimmed);
      const v = parseFloat(ruleValue);
      return !isNaN(n) && !isNaN(v) && n > v;
    }
    case "less_than": {
      const n = parseFloat(trimmed);
      const v = parseFloat(ruleValue);
      return !isNaN(n) && !isNaN(v) && n < v;
    }
    case "contains":
      return answerContains(trimmed, ruleValue);
    case "does_not_contain":
      return !answerContains(trimmed, ruleValue);
    default:
      return false;
  }
}

export function resolveLogicDestination(
  question: LogicQuestion,
  answer: string,
  questions: { id: string; type: string }[],
  currentIndex: number,
): LogicDestination {
  const sequential: LogicDestination = {
    type: "index",
    index: currentIndex + 1,
  };

  if (isAnswerable(question.type)) {
    for (const rule of asRules(question.logic)) {
      if (!matchesLogicRule(rule, answer)) continue;
      const action = rule.action;
      if (action.type === "end_form") return { type: "end" };
      const targetIndex = questions.findIndex(
        (q) => q.id === action.questionId,
      );
      if (targetIndex >= 0) return { type: "index", index: targetIndex };
      return sequential;
    }
  }

  const dest = defaultDestination(question);
  if (dest?.type === "end_form") return { type: "end" };
  if (dest?.type === "jump_to" && dest.questionId) {
    const targetIndex = questions.findIndex((q) => q.id === dest.questionId);
    if (targetIndex >= 0) return { type: "index", index: targetIndex };
  }

  return sequential;
}

export function getReachedQuestionIds(
  questions: LogicQuestion[],
  answers: AnswerRef[],
): Set<string> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));
  const reached = new Set<string>();
  const visitedIndexes = new Set<number>();
  let index = 0;
  let steps = 0;

  while (index >= 0 && index < questions.length && steps < questions.length + 2) {
    if (visitedIndexes.has(index)) break;
    visitedIndexes.add(index);

    const question = questions[index];
    reached.add(question.id);

    if (question.type === "THANK_YOU_SCREEN") break;

    const dest = resolveLogicDestination(
      question,
      answerMap.get(question.id) ?? "",
      questions,
      index,
    );

    if (dest.type === "end") {
      const thankYou = questions.find((q) => q.type === "THANK_YOU_SCREEN");
      if (thankYou) reached.add(thankYou.id);
      break;
    }

    if (dest.index === index) break;
    index = dest.index;
    steps += 1;
  }

  return reached;
}

export function thankYouIndex(questions: { type: string }[]): number {
  return questions.findIndex((q) => q.type === "THANK_YOU_SCREEN");
}

/**
 * Determines if a question should be skipped based on form logic and current answers.
 * Used in classic mode to determine which questions to display.
 */
export function shouldSkipQuestion(
  question: LogicQuestion,
  answers: Record<string, string>,
  allQuestions: LogicQuestion[],
): boolean {
  // Build answer array in order
  const answerArray: AnswerRef[] = Object.entries(answers).map(
    ([questionId, value]) => ({ questionId, value }),
  );

  // Get questions that would be reached with current answers
  const reachedIds = getReachedQuestionIds(allQuestions, answerArray);

  // If this question's ID is not in the reached set, it should be skipped
  return !reachedIds.has(question.id);
}
