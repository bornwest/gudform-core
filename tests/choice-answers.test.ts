import { describe, expect, it } from "vitest";

import {
  CHOICE_SEPARATOR,
  answerContains,
  choiceAnswerIncludes,
  formatChoiceAnswerForDisplay,
  getSelectionHint,
  joinChoiceAnswer,
  parseChoiceAnswer,
  validateChoiceSelections,
} from "@/lib/choice-answers";

describe("parseChoiceAnswer", () => {
  it("returns an empty list for blank values", () => {
    expect(parseChoiceAnswer("")).toEqual([]);
    expect(parseChoiceAnswer("   ")).toEqual([]);
  });

  it("treats a single value as one selection", () => {
    expect(parseChoiceAnswer("Apples")).toEqual(["Apples"]);
  });

  it("splits multi-select answers on the separator", () => {
    expect(parseChoiceAnswer(`Apples${CHOICE_SEPARATOR}Bananas`)).toEqual([
      "Apples",
      "Bananas",
    ]);
  });
});

describe("joinChoiceAnswer", () => {
  it("joins selected options with the stored separator", () => {
    expect(joinChoiceAnswer(["Apples", "Bananas"])).toBe(
      `Apples${CHOICE_SEPARATOR}Bananas`,
    );
  });
});

describe("formatChoiceAnswerForDisplay", () => {
  it("renders multi-select answers as a readable list", () => {
    expect(
      formatChoiceAnswerForDisplay(`Apples${CHOICE_SEPARATOR}Bananas`),
    ).toBe("Apples, Bananas");
  });
});

describe("choice membership", () => {
  it("matches a selected option in a multi-select answer", () => {
    const answer = joinChoiceAnswer(["Apples", "Pears"]);
    expect(choiceAnswerIncludes(answer, "Apples")).toBe(true);
    expect(choiceAnswerIncludes(answer, "Bananas")).toBe(false);
  });

  it("does not treat a substring of another option as a match", () => {
    const answer = joinChoiceAnswer(["Pineapple", "Orange"]);
    expect(choiceAnswerIncludes(answer, "Apple")).toBe(false);
    expect(answerContains(answer, "Apple")).toBe(false);
  });

  it("keeps substring matching for ordinary text answers", () => {
    expect(answerContains("Pineapple pie", "Apple")).toBe(true);
  });
});

describe("getSelectionHint", () => {
  it("describes a fixed pick-X-of-N count", () => {
    expect(getSelectionHint({ minSelections: 2, maxSelections: 2 })).toBe(
      "Choose 2 options",
    );
  });

  it("describes a min and max range", () => {
    expect(getSelectionHint({ minSelections: 1, maxSelections: 3 })).toBe(
      "Choose 1 to 3 options",
    );
  });

  it("falls back to an open-ended hint", () => {
    expect(getSelectionHint({})).toBe("Choose as many as you like");
  });
});

describe("validateChoiceSelections", () => {
  const choices = ["A", "B", "C", "D"];

  it("rejects a single-select answer that is not a listed choice", () => {
    const result = validateChoiceSelections("Nope", {
      choices,
      allowMultiple: false,
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a valid multi-select answer", () => {
    const result = validateChoiceSelections(joinChoiceAnswer(["A", "C"]), {
      choices,
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 3,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects too few selections", () => {
    const result = validateChoiceSelections("A", {
      choices,
      allowMultiple: true,
      minSelections: 2,
      maxSelections: 3,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 2/i);
  });

  it("rejects too many selections", () => {
    const result = validateChoiceSelections(
      joinChoiceAnswer(["A", "B", "C", "D"]),
      {
        choices,
        allowMultiple: true,
        maxSelections: 2,
      },
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at most 2/i);
  });
});
