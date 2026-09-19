import path from "node:path";

export function sanitizeStorageKey(key: string): string {
  if (!key || key.includes("\0")) {
    throw new Error("Invalid storage key");
  }
  const posix = key.replace(/\\/g, "/");
  const normalized = path.posix.normalize(posix);
  if (
    path.posix.isAbsolute(normalized) ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    normalized.split("/").some((segment) => segment === ".." || segment === "")
  ) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}
