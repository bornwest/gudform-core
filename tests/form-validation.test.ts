import { describe, expect, it } from "vitest";

import { joinChoiceAnswer } from "@/lib/choice-answers";
import { validateAnswers } from "@/lib/validations/form";

describe("validateAnswers multi-select", () => {
  const question = {
    id: "q1",
    type: "MULTIPLE_CHOICE",
    required: true,
    properties: {
      choices: ["Red", "Green", "Blue"],
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 2,
    },
  };

  it("accepts exactly X of N selected choices", () => {
    const result = validateAnswers([question], [
      { questionId: "q1", value: joinChoiceAnswer(["Red", "Blue"]) },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects a joined multi-select that the old single-choice check would fail", () => {
    const result = validateAnswers([question], [
      { questionId: "q1", value: joinChoiceAnswer(["Red", "Blue"]) },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("rejects the wrong number of selections", () => {
    const result = validateAnswers([question], [
      { questionId: "q1", value: "Red" },
    ]);
    expect(result.valid).toBe(false);
  });
});

describe("validateAnswers website fields", () => {
  const question = {
    id: "q1",
    type: "SHORT_TEXT",
    required: true,
    properties: { format: "url" },
  };

  it("accepts an http(s) website", () => {
    const result = validateAnswers([question], [
      { questionId: "q1", value: "https://example.com" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects a non-url value", () => {
    const result = validateAnswers([question], [
      { questionId: "q1", value: "not a website" },
    ]);
    expect(result.valid).toBe(false);
  });
});

describe("validateAnswers Other and ranking", () => {
  it("accepts an Other value when allowOther is on", () => {
    const result = validateAnswers(
      [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          required: true,
          properties: {
            choices: ["Email", "Slack"],
            allowOther: true,
          },
        },
      ],
      [{ questionId: "q1", value: "Other: PagerDuty" }],
    );
    expect(result.valid).toBe(true);
  });

  it("accepts a full ranking", () => {
    const result = validateAnswers(
      [
        {
          id: "q1",
          type: "MULTIPLE_CHOICE",
          required: true,
          properties: {
            choices: ["A", "B", "C"],
            ranking: true,
          },
        },
      ],
      [{ questionId: "q1", value: joinChoiceAnswer(["B", "A", "C"]) }],
    );
    expect(result.valid).toBe(true);
  });
});
