"use client";

import { cn } from "@/lib/utils";
import { parseFormattedText } from "@/lib/screen-format";

export function FormattedText({
  text,
  as: Tag = "div",
  className,
  style,
}: {
  text: string;
  as?: "h1" | "h2" | "p" | "div";
  className?: string;
  style?: React.CSSProperties;
}) {
  const blocks = parseFormattedText(text);
  if (blocks.length === 0) return null;

  return (
    <Tag className={className} style={style}>
      {blocks.map((block, i) => (
        <span key={i} className={cn("block", i > 0 && "mt-[0.75em]")}>
          {block.lines.map((line, li) => (
            <span key={li} className={cn(li > 0 && "block")}>
              {line.map((run, ri) => (
                <span
                  key={ri}
                  className={cn(run.bold && "font-bold", run.italic && "italic")}
                >
                  {run.text}
                </span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
