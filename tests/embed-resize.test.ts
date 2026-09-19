import { describe, expect, it } from "vitest";

import {
  EMBED_RESIZE_TYPE,
  embedResizeMessage,
  isEmbedResizeMessage,
} from "@/lib/embed-protocol";

describe("embed resize protocol", () => {
  it("builds a message the parent script can apply", () => {
    expect(embedResizeMessage(842)).toEqual({
      type: EMBED_RESIZE_TYPE,
      height: 842,
    });
  });

  it("ignores unrelated postMessage payloads", () => {
    expect(isEmbedResizeMessage({ type: "other", height: 10 })).toBe(false);
    expect(isEmbedResizeMessage({ type: EMBED_RESIZE_TYPE, height: 0 })).toBe(
      false,
    );
    expect(isEmbedResizeMessage({ type: EMBED_RESIZE_TYPE, height: 400 })).toBe(
      true,
    );
  });
});
