import { describe, expect, it } from "vitest";

import { sanitizeStorageKey } from "@/lib/storage-path";

describe("sanitizeStorageKey", () => {
  it("accepts nested upload keys", () => {
    expect(sanitizeStorageKey("uploads/form-1/abc.pdf")).toBe(
      "uploads/form-1/abc.pdf",
    );
  });

  it("rejects path traversal", () => {
    expect(() => sanitizeStorageKey("../etc/passwd")).toThrow();
    expect(() => sanitizeStorageKey("uploads/../../secret")).toThrow();
    expect(() => sanitizeStorageKey("/absolute")).toThrow();
  });
});
