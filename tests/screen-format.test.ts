import { describe, expect, it } from "vitest";

import {
  getScreenFormat,
  parseFormattedText,
  sanitizeHexColor,
} from "@/lib/screen-format";

describe("sanitizeHexColor", () => {
  it("accepts 3 and 6 digit hex colors", () => {
    expect(sanitizeHexColor("#fff")).toBe("#fff");
    expect(sanitizeHexColor("#112233")).toBe("#112233");
  });

  it("rejects non-hex values", () => {
    expect(sanitizeHexColor("red")).toBeUndefined();
    expect(sanitizeHexColor("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeHexColor("")).toBeUndefined();
  });
});

describe("parseFormattedText", () => {
  it("splits blank lines into paragraphs", () => {
    const blocks = parseFormattedText("Hello\n\nWorld");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.lines[0]?.[0]?.text).toBe("Hello");
    expect(blocks[1]?.lines[0]?.[0]?.text).toBe("World");
  });

  it("keeps single newlines as line breaks in the same paragraph", () => {
    const blocks = parseFormattedText("Hello\nWorld");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.lines).toHaveLength(2);
  });

  it("marks bold and italic runs", () => {
    const blocks = parseFormattedText("Say **hello** and *thanks*");
    const runs = blocks[0]?.lines[0] ?? [];
    expect(runs).toEqual([
      { text: "Say " },
      { text: "hello", bold: true },
      { text: " and " },
      { text: "thanks", italic: true },
    ]);
  });
});

describe("getScreenFormat", () => {
  it("centers welcome and thank-you screens by default", () => {
    expect(getScreenFormat("WELCOME_SCREEN", {}).align).toBe("center");
    expect(getScreenFormat("THANK_YOU_SCREEN", {}).align).toBe("center");
    expect(getScreenFormat("WELCOME_SCREEN", {}).titleBold).toBe(true);
  });

  it("left-aligns statements by default", () => {
    expect(getScreenFormat("STATEMENT", {}).align).toBe("left");
  });

  it("honors explicit formatting overrides", () => {
    const format = getScreenFormat("WELCOME_SCREEN", {
      align: "left",
      titleSize: "sm",
      titleColor: "#112233",
      titleBold: false,
      descriptionSize: "lg",
      descriptionColor: "#abcdef",
      descriptionBold: true,
    });
    expect(format.align).toBe("left");
    expect(format.titleSize).toBe("sm");
    expect(format.titleColor).toBe("#112233");
    expect(format.titleBold).toBe(false);
    expect(format.descriptionSize).toBe("lg");
    expect(format.descriptionColor).toBe("#abcdef");
    expect(format.descriptionBold).toBe(true);
  });
});
