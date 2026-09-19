import { describe, expect, it } from "vitest";

import { joinChoiceAnswer } from "@/lib/choice-answers";
import {
  getReachedQuestionIds,
  matchesLogicRule,
  resolveLogicDestination,
} from "@/lib/form-logic";
import type { LogicRule } from "@/lib/types/logic";
import { validateAnswers } from "@/lib/validations/form";

function rule(
  operator: LogicRule["operator"],
  value: string | undefined,
  action: LogicRule["action"],
): LogicRule {
  return { id: "r1", operator, value, action };
}

function q(
  id: string,
  type: string,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    type,
    required: false,
    properties: {},
    logic: [] as LogicRule[],
    ...extra,
  };
}

describe("matchesLogicRule", () => {
  it("matches Yes/No equals case-insensitively", () => {
    expect(
      matchesLogicRule(rule("equals", "Yes", { type: "end_form" }), "Yes"),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("equals", "Yes", { type: "end_form" }), "yes"),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("equals", "Yes", { type: "end_form" }), "No"),
    ).toBe(false);
    expect(
      matchesLogicRule(rule("equals", "No", { type: "end_form" }), "No"),
    ).toBe(true);
  });

  it("does not match equals when the comparison value is missing", () => {
    expect(
      matchesLogicRule(rule("equals", undefined, { type: "end_form" }), "No"),
    ).toBe(false);
  });

  it("matches dropdown and single choice by exact option", () => {
    expect(
      matchesLogicRule(rule("equals", "Blue", { type: "end_form" }), "Blue"),
    ).toBe(true);
    expect(
      matchesLogicRule(
        rule("does_not_equal", "Blue", { type: "end_form" }),
        "Red",
      ),
    ).toBe(true);
  });

  it("matches multi-select when the option is one of the selected values", () => {
    const answer = joinChoiceAnswer(["Red", "Blue"]);
    expect(
      matchesLogicRule(rule("equals", "Red", { type: "end_form" }), answer),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("equals", "Green", { type: "end_form" }), answer),
    ).toBe(false);
    expect(
      matchesLogicRule(rule("contains", "Blue", { type: "end_form" }), answer),
    ).toBe(true);
  });

  it("matches short text contains without treating other options as a hit", () => {
    expect(
      matchesLogicRule(
        rule("contains", "acme", { type: "end_form" }),
        "I work at Acme",
      ),
    ).toBe(true);
    expect(
      matchesLogicRule(
        rule("does_not_contain", "acme", { type: "end_form" }),
        "I work at Globex",
      ),
    ).toBe(true);
  });

  it("compares number, rating, and scale numerically", () => {
    expect(
      matchesLogicRule(rule("greater_than", "3", { type: "end_form" }), "5"),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("less_than", "3", { type: "end_form" }), "2"),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("equals", "5", { type: "end_form" }), "5"),
    ).toBe(true);
    expect(
      matchesLogicRule(rule("equals", "5.0", { type: "end_form" }), "5"),
    ).toBe(true);
  });

  it("treats is_answered / is_not_answered by blankness", () => {
    expect(
      matchesLogicRule(rule("is_answered", undefined, { type: "end_form" }), "x"),
    ).toBe(true);
    expect(
      matchesLogicRule(
        rule("is_not_answered", undefined, { type: "end_form" }),
        "",
      ),
    ).toBe(true);
  });
});

describe("resolveLogicDestination", () => {
  const questions = [
    q("welcome", "WELCOME_SCREEN"),
    q("yn", "YES_NO", {
      logic: [
        rule("equals", "No", { type: "end_form" }),
        rule("equals", "Yes", { type: "jump_to", questionId: "email" }),
      ],
    }),
    q("email", "EMAIL", { required: true }),
    q("thanks", "THANK_YOU_SCREEN"),
  ];

  it("ends the form when Yes/No matches an end_form rule", () => {
    expect(
      resolveLogicDestination(questions[1], "No", questions, 1),
    ).toEqual({ type: "end" });
  });

  it("jumps when Yes/No matches a jump_to rule", () => {
    expect(
      resolveLogicDestination(questions[1], "Yes", questions, 1),
    ).toEqual({ type: "index", index: 2 });
  });

  it("uses defaultDestination end_form when no rule matches", () => {
    const question = q("yn", "YES_NO", {
      logic: [rule("equals", "Yes", { type: "jump_to", questionId: "email" })],
      properties: { defaultDestination: { type: "end_form" } },
    });
    expect(resolveLogicDestination(question, "No", questions, 1)).toEqual({
      type: "end",
    });
  });

  it("does not fall through to a later rule when a matched jump target is missing", () => {
    const question = q("yn", "YES_NO", {
      logic: [
        rule("equals", "No", { type: "jump_to", questionId: "missing" }),
        rule("is_answered", undefined, { type: "end_form" }),
      ],
    });
    expect(resolveLogicDestination(question, "No", questions, 1)).toEqual({
      type: "index",
      index: 2,
    });
  });

  it("goes to the next question when there is no logic", () => {
    expect(
      resolveLogicDestination(questions[2], "a@b.com", questions, 2),
    ).toEqual({ type: "index", index: 3 });
  });
});

describe("getReachedQuestionIds and skipped required fields", () => {
  const questions = [
    q("welcome", "WELCOME_SCREEN"),
    q("yn", "YES_NO", {
      required: true,
      logic: [rule("equals", "No", { type: "end_form" })],
    }),
    q("email", "EMAIL", { required: true }),
    q("thanks", "THANK_YOU_SCREEN"),
  ];

  it("does not treat skipped questions as reached after an early end", () => {
    const reached = getReachedQuestionIds(questions, [
      { questionId: "yn", value: "No" },
    ]);
    expect(reached.has("yn")).toBe(true);
    expect(reached.has("email")).toBe(false);
    expect(reached.has("thanks")).toBe(true);
  });

  it("allows submitting when a required question was skipped by Yes/No logic", () => {
    const result = validateAnswers(questions, [
      { questionId: "yn", value: "No" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("still requires questions that the path actually reaches", () => {
    const result = validateAnswers(questions, [
      { questionId: "yn", value: "Yes" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/EMAIL/i);
  });
});
