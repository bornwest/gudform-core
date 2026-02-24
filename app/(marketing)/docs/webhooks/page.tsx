export const metadata = {
  title: "Webhooks - GudForm Docs",
  description:
    "Receive real-time notifications when forms are submitted. Learn about webhook events, security, and retry policies.",
};

function CodeBlock({
  title,
  language,
  children,
}: {
  title?: string;
  language?: string;
  children: string;
}) {
  return (
    <div className="not-prose overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-sm dark:border-gray-800">
      {title && (
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
          <span className="text-xs font-medium text-gray-400">{title}</span>
          {language && (
            <span className="text-xs text-gray-500">{language}</span>
          )}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-gray-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">Webhooks</h1>
      <p className="text-lg text-muted-foreground">
        Webhooks let you receive real-time HTTP notifications when events happen
        on your forms. Configure a webhook URL in your form settings and GudForm
        will POST event data to your endpoint.
      </p>

      <div className="not-prose my-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/10">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Requires Starter plan or higher.</strong> Configure webhooks in
          your form&rsquo;s builder under Settings &rarr; Webhooks.
        </p>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Setup                                                         */}
      {/* ============================================================ */}
      <h2 id="setup">Setting Up Webhooks</h2>
      <ol>
        <li>
          Open your form in the builder and go to the <strong>Settings</strong>{" "}
          sidebar.
        </li>
        <li>
          Scroll to the <strong>Webhooks</strong> section.
        </li>
        <li>Enter your endpoint URL (must be HTTPS in production).</li>
        <li>
          Optionally add a <strong>Webhook Secret</strong> to verify signatures.
        </li>
        <li>Save &mdash; GudForm will start posting events immediately.</li>
      </ol>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Events                                                        */}
      {/* ============================================================ */}
      <h2 id="events">Events</h2>

      <h3>form.response.completed</h3>
      <p>
        Fired when a form response is fully submitted (and payment confirmed, if
        applicable). This is the primary event for processing form data.
      </p>
      <CodeBlock title="Payload" language="JSON">
        {`{
  "event": "form.response.completed",
  "formId": "clx1234abcd",
  "formTitle": "Customer Feedback",
  "collectionId": "col_abc123",
  "collectionName": "Surveys",
  "responseId": "resp_abc123",
  "answers": [
    {
      "question": "What is your name?",
      "answer": "Jane Smith"
    },
    {
      "question": "Rate your experience",
      "answer": "5"
    },
    {
      "question": "Any additional feedback?",
      "answer": "Great product, love the UI!"
    }
  ],
  "timestamp": "2025-01-20T14:32:15.000Z"
}`}
      </CodeBlock>

      <h3 className="mt-8">Planned Events</h3>
      <p>The following events are planned for future releases:</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Event</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.response.started
                </code>
              </td>
              <td className="py-2">Respondent began filling out a form</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.response.payment.completed
                </code>
              </td>
              <td className="py-2">Payment for a response was confirmed</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.response.payment.failed
                </code>
              </td>
              <td className="py-2">Payment for a response failed or expired</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.published
                </code>
              </td>
              <td className="py-2">Form was published</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.closed
                </code>
              </td>
              <td className="py-2">Form was closed</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  form.moved
                </code>
              </td>
              <td className="py-2">Form was moved to a different collection</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  collection.created
                </code>
              </td>
              <td className="py-2">A new collection was created</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  collection.deleted
                </code>
              </td>
              <td className="py-2">A collection was deleted</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Headers                                                       */}
      {/* ============================================================ */}
      <h2 id="headers">Request Headers</h2>
      <p>Every webhook request includes these headers:</p>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Header</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  Content-Type
                </code>
              </td>
              <td className="py-2">
                Always <code>application/json</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  User-Agent
                </code>
              </td>
              <td className="py-2">
                <code>GudForm-Webhook/1.0</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  X-GudForm-Signature
                </code>
              </td>
              <td className="py-2">
                HMAC-SHA256 signature (when secret is configured)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Security / Signature Verification                             */}
      {/* ============================================================ */}
      <h2 id="security">Verifying Webhook Signatures</h2>
      <p>
        If you configure a webhook secret, every request will include an{" "}
        <code>X-GudForm-Signature</code> header containing an HMAC-SHA256 digest
        of the request body. Always verify this signature to ensure the request
        is from GudForm.
      </p>

      <h3>Signature Format</h3>
      <CodeBlock title="Header value">
        {`X-GudForm-Signature: sha256=a1b2c3d4e5f6...`}
      </CodeBlock>

      <h3>Verification Example (Node.js)</h3>
      <CodeBlock title="verify-webhook.ts" language="TypeScript">
        {`import crypto from "crypto";

function verifySignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expected = \`sha256=\${expectedSig}\`;

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

// In your webhook handler:
app.post("/webhooks/gudform", (req, res) => {
  const signature = req.headers["x-gudform-signature"];
  const body = JSON.stringify(req.body);

  if (!verifySignature(body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process the webhook...
  const { event, formId, answers } = req.body;
  console.log(\`Received \${event} for form \${formId}\`);

  res.status(200).json({ received: true });
});`}
      </CodeBlock>

      <h3>Verification Example (Python)</h3>
      <CodeBlock title="verify_webhook.py" language="Python">
        {`import hmac
import hashlib

def verify_signature(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, f"sha256={expected}")

# In your Flask handler:
@app.route("/webhooks/gudform", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-GudForm-Signature", "")
    if not verify_signature(request.data, signature, WEBHOOK_SECRET):
        return {"error": "Invalid signature"}, 401

    data = request.json
    print(f"Received {data['event']} for form {data['formId']}")
    return {"received": True}`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Retries                                                       */}
      {/* ============================================================ */}
      <h2 id="retries">Retry Policy</h2>
      <p>
        If your endpoint returns a non-2xx status code or times out, GudForm
        will retry the delivery:
      </p>

      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Attempt</th>
              <th className="pb-2 pr-4 font-medium">Delay</th>
              <th className="pb-2 font-medium">Timeout</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">1st (initial)</td>
              <td className="py-2 pr-4">Immediate</td>
              <td className="py-2">10 seconds</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">2nd retry</td>
              <td className="py-2 pr-4">1 second</td>
              <td className="py-2">10 seconds</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">3rd retry</td>
              <td className="py-2 pr-4">4 seconds</td>
              <td className="py-2">10 seconds</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        After 3 failed attempts, the delivery is marked as failed. We recommend
        implementing idempotent handlers using the <code>responseId</code> as a
        deduplication key.
      </p>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Best Practices                                                */}
      {/* ============================================================ */}
      <h2 id="best-practices">Best Practices</h2>
      <ol>
        <li>
          <strong>Return 200 quickly.</strong> Process webhook data
          asynchronously (e.g. add to a queue) and return 200 immediately.
        </li>
        <li>
          <strong>Verify signatures.</strong> Always validate the{" "}
          <code>X-GudForm-Signature</code> header when a secret is configured.
        </li>
        <li>
          <strong>Handle duplicates.</strong> Use <code>responseId</code> as an
          idempotency key — the same event may be delivered more than once.
        </li>
        <li>
          <strong>Use HTTPS.</strong> Webhook URLs should use HTTPS in
          production to protect data in transit.
        </li>
        <li>
          <strong>Monitor failures.</strong> Log failed deliveries and set up
          alerts for repeated failures.
        </li>
      </ol>
    </article>
  );
}
