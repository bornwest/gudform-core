import { WEBHOOK_BLOCKED_DOMAINS } from "@/config/webhook-blocklist";
import { deliverWebhook } from "@/lib/webhooks";

export interface WebhookHealthResult {
  reachable: boolean;
  sslValid: boolean;
  blocked: boolean;
  error?: string;
}

/**
 * Check the health of a webhook URL: reachability, SSL, and blocklist.
 */
export async function checkWebhookHealth(
  url: string,
): Promise<WebhookHealthResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { reachable: false, sslValid: false, blocked: false, error: "Invalid URL" };
  }

  // Check blocklist
  const hostname = parsed.hostname.toLowerCase();
  if (WEBHOOK_BLOCKED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return { reachable: false, sslValid: false, blocked: true, error: "Domain is blocklisted" };
  }

  // Check SSL / reachability via HEAD request
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    const sslValid = parsed.protocol === "https:";

    return {
      reachable: true,
      sslValid,
      blocked: false,
    };
  } catch (err: any) {
    const message = err.message || "Network error";
    const isSslError =
      message.includes("certificate") ||
      message.includes("SSL") ||
      message.includes("TLS");

    return {
      reachable: false,
      sslValid: !isSslError,
      blocked: false,
      error: message,
    };
  }
}

/**
 * Check if a GitHub repo URL returns a 200 status.
 */
export async function checkGithubRepoExists(
  url: string,
): Promise<{ exists: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    return { exists: response.status === 200 };
  } catch (err: any) {
    return { exists: false, error: err.message || "Network error" };
  }
}

/**
 * Send a test webhook payload to a URL using the standard delivery mechanism.
 */
export async function sendTestWebhookPayload(
  webhookUrl: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const testPayload = {
    event: "test.ping",
    formId: "test_form_000",
    formTitle: "Test Form",
    responseId: "test_response_000",
    answers: [
      {
        questionId: "q1",
        question: "What is your name?",
        type: "SHORT_TEXT",
        answer: "Test User",
      },
      {
        questionId: "q2",
        question: "What is your email?",
        type: "EMAIL",
        answer: "test@example.com",
      },
    ],
    integration: {
      installationId: "test_install_000",
      config: {},
      credentials: null,
    },
    timestamp: new Date().toISOString(),
  };

  return deliverWebhook(webhookUrl, null, testPayload);
}
