export type ScreenAlign = "left" | "center";
export type ScreenTitleSize = "sm" | "md" | "lg" | "xl";
export type ScreenDescriptionSize = "sm" | "md" | "lg";
export type ScreenImagePosition = "left" | "right";

/** Shown on the welcome screen when no image has been set. */
export const DEFAULT_WELCOME_IMAGE = "/_static/images/welcome-default.png";

/** Shown on a closed form's page when the owner hasn't set a message. */
export const DEFAULT_CLOSED_MESSAGE =
  "This form is no longer accepting responses.";

export interface ScreenFormat {
  align: ScreenAlign;
  titleSize: ScreenTitleSize;
  titleColor?: string;
  titleBold: boolean;
  descriptionSize: ScreenDescriptionSize;
  descriptionColor?: string;
  descriptionBold: boolean;
  /** Side image (welcome screen only; falls back to DEFAULT_WELCOME_IMAGE). */
  image?: string;
  imagePosition: ScreenImagePosition;
}

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface FormattedParagraph {
  lines: TextRun[][];
}

const TITLE_SIZES: ScreenTitleSize[] = ["sm", "md", "lg", "xl"];
const DESCRIPTION_SIZES: ScreenDescriptionSize[] = ["sm", "md", "lg"];

export function sanitizeHexColor(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function asAlign(value: unknown, fallback: ScreenAlign): ScreenAlign {
  return value === "left" || value === "center" ? value : fallback;
}

function asTitleSize(value: unknown, fallback: ScreenTitleSize): ScreenTitleSize {
  return TITLE_SIZES.includes(value as ScreenTitleSize)
    ? (value as ScreenTitleSize)
    : fallback;
}

function asDescriptionSize(
  value: unknown,
  fallback: ScreenDescriptionSize,
): ScreenDescriptionSize {
  return DESCRIPTION_SIZES.includes(value as ScreenDescriptionSize)
    ? (value as ScreenDescriptionSize)
    : fallback;
}

/**
 * Accept only http(s) URLs or same-origin absolute paths (e.g. /api/files/...)
 * so arbitrary schemes can't end up in an <img src>.
 */
export function sanitizeImageUrl(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? trimmed
      : undefined;
  } catch {
    return undefined;
  }
}

export function getScreenFormat(
  type: string,
  properties: Record<string, unknown> | null | undefined,
): ScreenFormat {
  const props = properties ?? {};
  const image =
    type === "WELCOME_SCREEN"
      ? (sanitizeImageUrl(props.image) ?? DEFAULT_WELCOME_IMAGE)
      : undefined;
  const centered = type === "WELCOME_SCREEN" || type === "THANK_YOU_SCREEN";
  return {
    // With a side image the copy reads better left-aligned next to it.
    align: asAlign(props.align, centered && !image ? "center" : "left"),
    titleSize: asTitleSize(props.titleSize, centered ? "lg" : "md"),
    titleColor: sanitizeHexColor(
      typeof props.titleColor === "string" ? props.titleColor : undefined,
    ),
    titleBold: props.titleBold === false ? false : true,
    descriptionSize: asDescriptionSize(
      props.descriptionSize,
      centered ? "lg" : "md",
    ),
    descriptionColor: sanitizeHexColor(
      typeof props.descriptionColor === "string"
        ? props.descriptionColor
        : undefined,
    ),
    descriptionBold: props.descriptionBold === true,
    image,
    imagePosition: props.imagePosition === "right" ? "right" : "left",
  };
}

export function parseRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[1] != null) {
      runs.push({ text: match[1], bold: true });
    } else if (match[2] != null) {
      runs.push({ text: match[2], italic: true });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex) });
  }
  return runs.filter((run) => run.text.length > 0);
}

export function parseFormattedText(input: string): FormattedParagraph[] {
  if (!input) return [];
  const normalized = input.replace(/\r\n/g, "\n");
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trimEnd())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => ({
      lines: paragraph.split("\n").map((line) => parseRuns(line)),
    }));
}

export function screenTitleClassName(format: ScreenFormat): string {
  const size =
    format.titleSize === "sm"
      ? "text-2xl sm:text-3xl"
      : format.titleSize === "md"
        ? "text-3xl sm:text-4xl"
        : format.titleSize === "xl"
          ? "text-5xl sm:text-6xl md:text-7xl"
          : "text-4xl sm:text-5xl md:text-6xl";
  const weight = format.titleBold ? "font-bold" : "font-normal";
  return `${size} tracking-tight ${weight}`;
}

export function screenDescriptionClassName(format: ScreenFormat): string {
  const size =
    format.descriptionSize === "sm"
      ? "text-sm sm:text-base"
      : format.descriptionSize === "lg"
        ? "text-lg sm:text-xl"
        : "text-base sm:text-lg";
  const weight = format.descriptionBold ? "font-semibold" : "font-normal";
  return `${size} ${weight}`;
}
