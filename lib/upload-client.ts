export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

/**
 * Upload a file for a form via /api/upload (browser only).
 * Throws an Error carrying the server's message when the upload is rejected.
 */
export async function uploadFile(
  file: File,
  formId: string,
): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("formId", formId);
  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw new Error("Upload failed. Please try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.url !== "string") {
    throw new Error(
      typeof data.error === "string" ? data.error : "Upload failed",
    );
  }
  return data as UploadResult;
}
