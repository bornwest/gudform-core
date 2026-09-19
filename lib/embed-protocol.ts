export const EMBED_RESIZE_TYPE = "gudform:resize";

export type EmbedResizeMessage = {
  type: typeof EMBED_RESIZE_TYPE;
  height: number;
};

export function embedResizeMessage(height: number): EmbedResizeMessage {
  return { type: EMBED_RESIZE_TYPE, height: Math.max(1, Math.round(height)) };
}

export function isEmbedResizeMessage(
  data: unknown,
): data is EmbedResizeMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as { type?: unknown; height?: unknown };
  return (
    message.type === EMBED_RESIZE_TYPE &&
    typeof message.height === "number" &&
    Number.isFinite(message.height) &&
    message.height > 0
  );
}
