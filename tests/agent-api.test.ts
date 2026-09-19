import { describe, expect, it } from "vitest";

import { parseQuestionsPayload } from "@/lib/form-questions";
import { listMcpTools } from "@/lib/mcp-tools";
import { rateLimit } from "@/lib/rate-limit";
import { questionSchema } from "@/lib/validations/form";

describe("question write payload", () => {
  it("accepts a valid question list", () => {
    const parsed = parseQuestionsPayload([
      { type: "SHORT_TEXT", title: "Name", required: true },
      { type: "EMAIL", title: "Email", required: true },
    ]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.questions).toHaveLength(2);
    }
  });

  it("defaults a missing title", () => {
    const parsed = parseQuestionsPayload([{ type: "WELCOME_SCREEN" }]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.questions[0]?.title).toBe("");
    }
  });

  it("rejects a non-array", () => {
    expect(parseQuestionsPayload({})).toEqual({
      ok: false,
      error: "questions must be an array",
    });
  });

  it("rejects an unknown question type", () => {
    expect(questionSchema.safeParse({ type: "NOPE", title: "x" }).success).toBe(
      false,
    );
  });
});

describe("MCP tools", () => {
  it("exposes list, schema, create, set_questions, and submit", () => {
    const names = listMcpTools().map((t) => t.name);
    expect(names).toEqual([
      "list_forms",
      "get_form_schema",
      "create_form",
      "set_questions",
      "submit_response",
      "set_webhook",
    ]);
  });
});

describe("API rate limiter", () => {
  it("allows up to the limit then blocks", () => {
    const limiter = rateLimit({ interval: 60_000 });
    expect(limiter.check(2, "key-a").success).toBe(true);
    expect(limiter.check(2, "key-a").success).toBe(true);
    expect(limiter.check(2, "key-a").success).toBe(false);
    expect(limiter.check(2, "key-b").success).toBe(true);
  });
});
