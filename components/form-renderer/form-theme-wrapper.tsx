"use client";

import { contrastColor } from "@/lib/utils";

interface FormThemeWrapperProps {
  bgColor: string;
  children: React.ReactNode;
  fillViewport?: boolean;
}

/**
 * Wraps the form renderer and sets `color-scheme` on the container so that
 * native form controls (date pickers, scrollbars, etc.) use the appropriate
 * light or dark chrome.
 *
 * This component intentionally does NOT apply a `.dark` CSS class — the form
 * renderer uses its own colour-token system (FormColors context) that is
 * fully independent of the page-level Tailwind dark mode.
 */
export function FormThemeWrapper({
  bgColor,
  children,
  fillViewport = true,
}: FormThemeWrapperProps) {
  const bgIsDark = contrastColor(bgColor) === "white";

  return (
    <div
      className={fillViewport ? "min-h-screen" : "min-h-0"}
      style={{ colorScheme: bgIsDark ? "dark" : "light" }}
    >
      {children}
    </div>
  );
}
