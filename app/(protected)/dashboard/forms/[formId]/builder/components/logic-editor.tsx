"use client";

import { GitBranch, Plus, Trash2 } from "lucide-react";
import { QuestionType } from "@prisma/client";

import type { LogicRule } from "@/lib/types/logic";
import {
  getOperatorsForType,
  operatorNeedsValue,
  OPERATOR_LABELS,
} from "@/lib/types/logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SCREEN_TYPES, getQuestionDisplayMeta } from "./constants";
import type { Question, QuestionProperties } from "./types";

export function LogicEditor({
  question,
  allQuestions,
  onChange,
  onPropertiesUpdate,
}: {
  question: Question;
  allQuestions: Question[];
  onChange: (logic: LogicRule[]) => void;
  onPropertiesUpdate: (props: Partial<QuestionProperties>) => void;
}) {
  const rules = question.logic;
  const operators = getOperatorsForType(question.type);
  const isChoiceType = (
    [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.DROPDOWN,
      QuestionType.YES_NO,
    ] as QuestionType[]
  ).includes(question.type);
  const choiceValues =
    question.type === QuestionType.YES_NO
      ? ["Yes", "No"]
      : question.properties.choices || [];

  const addRule = () => {
    const newRule: LogicRule = {
      id: crypto.randomUUID(),
      operator: isChoiceType ? "equals" : operators[0] || "is_answered",
      value: isChoiceType ? choiceValues[0] : undefined,
      action: { type: "end_form" },
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index: number, patch: Partial<LogicRule>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  // Stable ref for each question (real ID or temp client ID)
  const getRef = (q: Question, i: number) => q.id ?? `__new_${i}__`;

  // Jump targets — exclude current question, WELCOME_SCREEN, THANK_YOU_SCREEN
  const jumpTargets = allQuestions
    .map((q, i) => ({ q, i, ref: getRef(q, i) }))
    .filter(
      ({ q }) =>
        q !== question &&
        q.type !== QuestionType.WELCOME_SCREEN &&
        q.type !== QuestionType.THANK_YOU_SCREEN,
    );

  // Compute display numbers for targets
  const questionNumbers: number[] = [];
  let counter = 0;
  for (const q of allQuestions) {
    if (SCREEN_TYPES.includes(q.type)) {
      questionNumbers.push(0);
    } else {
      counter++;
      questionNumbers.push(counter);
    }
  }

  const getChoices = (): string[] => choiceValues;

  const getTargetLabel = (q: Question, i: number) => {
    const meta = getQuestionDisplayMeta(q);
    const num = questionNumbers[i];
    const isScreen = SCREEN_TYPES.includes(q.type);
    const unsavedTag = !q.id ? " (unsaved)" : "";
    return isScreen
      ? `${meta.label}${unsavedTag}`
      : `Q${num}: ${q.title || meta.label}${unsavedTag}`;
  };

  // Default destination
  const defaultDest = question.properties.defaultDestination as
    | { type: string; questionId?: string }
    | undefined;
  const defaultDestValue =
    defaultDest?.type === "end_form"
      ? "__end__"
      : defaultDest?.type === "jump_to" && defaultDest.questionId
        ? defaultDest.questionId
        : "__next__";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="size-4 text-muted-foreground" />
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Logic Rules
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Control where respondents go next based on their answer. Rules are
        checked top to bottom — first match wins. Questions skipped by a jump or
        by End form are not required.
      </p>

      {rules.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          No logic rules. Respondents will follow the default destination below.
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="space-y-2 rounded-lg border bg-muted/20 p-3"
          >
            {/* Row 1: IF answer [operator] [value] */}
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">
                {index === 0 ? "IF answer" : "OR answer"}
              </span>
              <Select
                value={rule.operator}
                onValueChange={(v) => {
                  const operator = v as LogicRule["operator"];
                  const needsValue = operatorNeedsValue(operator);
                  updateRule(index, {
                    operator,
                    value: needsValue
                      ? isChoiceType
                        ? choiceValues[0]
                        : rule.value
                      : undefined,
                  });
                }}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {OPERATOR_LABELS[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {operatorNeedsValue(rule.operator) &&
                (isChoiceType ? (
                  <Select
                    value={rule.value || undefined}
                    onValueChange={(v) => updateRule(index, { value: v })}
                  >
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getChoices().map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={rule.value || ""}
                    onChange={(e) =>
                      updateRule(index, { value: e.target.value })
                    }
                    placeholder="Enter value..."
                    className="h-8 flex-1 text-xs"
                  />
                ))}
            </div>

            {/* Row 2: THEN go to [target] */}
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs font-semibold text-muted-foreground">
                THEN go to
              </span>
              <Select
                value={
                  rule.action.type === "end_form"
                    ? "__end__"
                    : rule.action.questionId || undefined
                }
                onValueChange={(v) =>
                  updateRule(index, {
                    action:
                      v === "__end__"
                        ? { type: "end_form" }
                        : { type: "jump_to", questionId: v },
                  })
                }
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__end__">End form (submit)</SelectItem>
                  {jumpTargets.map(({ q, i, ref }) => (
                    <SelectItem key={ref} value={ref}>
                      {getTargetLabel(q, i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addRule} className="w-full">
        <Plus className="mr-1.5 size-3.5" />
        Add logic rule
      </Button>

      {/* Default destination (always shown) */}
      <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
        <span className="text-xs font-semibold text-muted-foreground">
          DEFAULT — If no rule matches, go to:
        </span>
        <Select
          value={defaultDestValue}
          onValueChange={(v) => {
            const dest =
              v === "__end__"
                ? { type: "end_form" as const }
                : v === "__next__"
                  ? { type: "next" as const }
                  : { type: "jump_to" as const, questionId: v };
            onPropertiesUpdate({ defaultDestination: dest });
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__next__">Continue to next question</SelectItem>
            <SelectItem value="__end__">End form (submit)</SelectItem>
            {jumpTargets.map(({ q, i, ref }) => (
              <SelectItem key={ref} value={ref}>
                {getTargetLabel(q, i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
