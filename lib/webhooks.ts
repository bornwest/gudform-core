import crypto from "crypto";

export async function deliverWebhook(
  url: string,
  secret: string | null,
  payload: Record<string, any>,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "GudForm-Webhook/1.0",
  };

  if (secret) {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    headers["X-GudForm-Signature"] = `sha256=${signature}`;
  }

  const maxRetries = 3;
  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (err: any) {
      lastError = err.message || "Network error";
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  return { success: false, error: lastError };
}
