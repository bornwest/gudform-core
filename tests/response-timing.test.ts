import { describe, expect, it } from "vitest";

import { parseResponseTiming } from "@/lib/form-response";

describe("parseResponseTiming", () => {
  it("returns empty options for a plain submission", () => {
    expect(parseResponseTiming({ answers: [] })).toEqual({ ok: true, options: {} });
  });

  it("treats completedAt null as in progress", () => {
    const r = parseResponseTiming({
      completedAt: null,
      startedAt: "2026-09-12T10:00:00Z",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.options.partial).toBe(true);
      expect(r.options.completedAt).toBeUndefined();
      expect(r.options.startedAt?.toISOString()).toBe("2026-09-12T10:00:00.000Z");
    }
  });

  it("treats a completedAt date as completed", () => {
    const r = parseResponseTiming({
      startedAt: "2026-09-12T10:00:00Z",
      completedAt: "2026-09-12T10:05:00Z",
    });
    expect(r.ok && r.options.partial).toBeFalsy();
  });

  it("uses completedAt as startedAt when no start is given", () => {
    const r = parseResponseTiming({ completedAt: "2026-09-12T10:00:00Z" });
    expect(r.ok && r.options.startedAt?.toISOString()).toBe("2026-09-12T10:00:00.000Z");
  });

  it("rejects bad input", () => {
    expect(parseResponseTiming({ startedAt: "nope" }).ok).toBe(false);
    expect(parseResponseTiming({ startedAt: 5 }).ok).toBe(false);
    expect(
      parseResponseTiming({
        startedAt: "2026-09-12T10:00:00Z",
        completedAt: "2026-09-11T10:00:00Z",
      }).ok,
    ).toBe(false);
  });
});
