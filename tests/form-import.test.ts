import { describe, expect, it } from "vitest";

import { importFormDefinition } from "@/lib/form-import";

describe("importFormDefinition", () => {
  it("imports a Typeform-style fields payload", () => {
    const result = importFormDefinition({
      title: "Launch survey",
      fields: [
        {
          type: "short_text",
          title: "Name",
          validations: { required: true },
        },
        {
          type: "multiple_choice",
          title: "Plan",
          properties: {
            choices: [{ label: "Free" }, { label: "Paid" }],
            allow_multiple_selection: true,
          },
        },
        { type: "email", title: "Email" },
        { type: "yes_no", title: "Ready?" },
        { type: "statement", title: "Almost done" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toBe("Launch survey");
    expect(result.questions.map((q) => q.type)).toEqual([
      "SHORT_TEXT",
      "MULTIPLE_CHOICE",
      "EMAIL",
      "YES_NO",
      "STATEMENT",
    ]);
    expect(result.questions[1]?.properties.allowMultiple).toBe(true);
    expect(result.questions[1]?.properties.choices).toEqual(["Free", "Paid"]);
    expect(result.questions[0]?.required).toBe(true);
  });

  it("imports a GudForm-style questions array", () => {
    const result = importFormDefinition({
      title: "Direct",
      questions: [
        { type: "EMAIL", title: "Work email", required: true },
        {
          type: "DROPDOWN",
          title: "Size",
          properties: { choices: ["1-10", "11-50"] },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]?.type).toBe("EMAIL");
  });

  it("imports Google Forms items when present", () => {
    const result = importFormDefinition({
      info: { title: "Google export" },
      items: [
        {
          title: "Your name",
          questionItem: { question: { required: true, textQuestion: {} } },
        },
        {
          title: "Pick one",
          questionItem: {
            question: {
              choiceQuestion: {
                type: "RADIO",
                options: [{ value: "A" }, { value: "B" }],
              },
            },
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toBe("Google export");
    expect(result.questions[0]?.type).toBe("SHORT_TEXT");
    expect(result.questions[1]?.type).toBe("MULTIPLE_CHOICE");
    expect(result.questions[1]?.properties.choices).toEqual(["A", "B"]);
  });

  it("rejects empty or unknown payloads", () => {
    expect(importFormDefinition({}).ok).toBe(false);
    expect(importFormDefinition("nope").ok).toBe(false);
  });
});
