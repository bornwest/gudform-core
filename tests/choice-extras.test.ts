import { describe, expect, it } from "vitest";

import {
  OTHER_PREFIX,
  formatOtherAnswer,
  isOtherAnswer,
  parseOtherAnswer,
  validateChoiceSelections,
  validateRankingAnswer,
} from "@/lib/choice-answers";

describe("choice Other", () => {
  it("accepts a custom Other value when allowOther is on", () => {
    const result = validateChoiceSelections(formatOtherAnswer("PagerDuty"), {
      choices: ["Email", "Slack"],
      allowOther: true,
    });
    expect(result.valid).toBe(true);
    expect(isOtherAnswer(formatOtherAnswer("PagerDuty"))).toBe(true);
    expect(parseOtherAnswer(formatOtherAnswer("PagerDuty"))).toBe("PagerDuty");
  });

  it("rejects a custom value when allowOther is off", () => {
    const result = validateChoiceSelections(formatOtherAnswer("PagerDuty"), {
      choices: ["Email", "Slack"],
      allowOther: false,
    });
    expect(result.valid).toBe(false);
  });

  it("rejects an empty Other value", () => {
    const result = validateChoiceSelections(OTHER_PREFIX, {
      choices: ["Email"],
      allowOther: true,
    });
    expect(result.valid).toBe(false);
  });
});

describe("ranking", () => {
  it("accepts every option ordered exactly once", () => {
    const result = validateRankingAnswer("B|||A|||C", ["A", "B", "C"]);
    expect(result.valid).toBe(true);
  });

  it("rejects a missing or duplicated option", () => {
    expect(validateRankingAnswer("A|||B", ["A", "B", "C"]).valid).toBe(false);
    expect(validateRankingAnswer("A|||B|||B", ["A", "B", "C"]).valid).toBe(
      false,
    );
  });
});
