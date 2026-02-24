import Link from "next/link";

export const metadata = {
  title: "Integration Marketplace - GudForm Docs",
  description:
    "Build, publish, and sell integrations on the GudForm marketplace. Connect forms to any third-party service.",
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

export default function IntegrationsPage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">
        Integration Marketplace
      </h1>
      <p className="text-lg text-muted-foreground">
        The GudForm marketplace lets you install pre-built integrations or build
        and sell your own. Integrations receive form submission data via
        webhooks and can send data to third-party services.
      </p>

      <div className="not-prose my-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/10">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Available on all plans.</strong> Install integrations from the
          marketplace on any plan including Free and Starter. Building and
          publishing integrations requires a <strong>Pro</strong> or{" "}
          <strong>Business</strong> plan.
        </p>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* How Integrations Work                                         */}
      {/* ============================================================ */}
      <h2 id="how-it-works">How Integrations Work</h2>
      <p>GudForm integrations follow a simple event-driven model:</p>
      <ol>
        <li>
          <strong>Install:</strong> Users browse the marketplace and install an
          integration on their account.
        </li>
        <li>
          <strong>Configure:</strong> Users authenticate with the third-party
          service (OAuth) and map form fields to the integration.
        </li>
        <li>
          <strong>Activate:</strong> Users enable the integration on specific
          forms.
        </li>
        <li>
          <strong>Trigger:</strong> When a form response is submitted, GudForm
          sends the data to all active integrations via webhook.
        </li>
      </ol>

      <div className="not-prose my-6 rounded-lg border bg-muted/50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-500/10">
            <svg
              className="size-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold">Event Flow</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Form Submission &rarr; GudForm Webhook &rarr; Integration Endpoint
              &rarr; Third-Party Service (e.g. Google Sheets, Slack, Mailchimp)
            </p>
          </div>
        </div>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Building Integrations                                         */}
      {/* ============================================================ */}
      <h2 id="building">Building an Integration</h2>

      <h3>1. Integration Manifest</h3>
      <p>
        Every integration starts with a manifest that describes it to the
        marketplace. Create a <code>gudform-integration.json</code> file:
      </p>
      <CodeBlock title="gudform-integration.json" language="JSON">
        {`{
  "name": "Google Sheets",
  "slug": "google-sheets",
  "version": "1.0.0",
  "description": "Automatically add form responses as rows in Google Sheets",
  "author": {
    "name": "Your Company",
    "email": "dev@yourcompany.com",
    "url": "https://yourcompany.com"
  },
  "icon": "https://yourcdn.com/icons/google-sheets.svg",
  "category": "PRODUCTIVITY",
  "pricing": {
    "type": "free"
  },
  "auth": {
    "type": "oauth2",
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "scopes": ["https://www.googleapis.com/auth/spreadsheets"]
  },
  "webhookUrl": "https://your-server.com/webhooks/gudform",
  "configFields": [
    {
      "key": "spreadsheetId",
      "label": "Spreadsheet",
      "type": "text",
      "required": true,
      "helpText": "The ID of the Google Sheet to write to"
    },
    {
      "key": "sheetName",
      "label": "Sheet Name",
      "type": "text",
      "required": false,
      "default": "Sheet1"
    }
  ],
  "events": ["form.response.completed", "form.moved"]
}`}
      </CodeBlock>

      <h3 className="mt-8">2. Webhook Endpoint</h3>
      <p>
        Your integration receives form data via HTTP POST at the{" "}
        <code>webhookUrl</code> defined in your manifest. The payload follows
        the same format as <Link href="/docs/webhooks">GudForm webhooks</Link>:
      </p>
      <CodeBlock title="Incoming payload" language="JSON">
        {`{
  "event": "form.response.completed",
  "formId": "clx1234abcd",
  "formTitle": "Customer Feedback",
  "collectionId": "col_abc123",
  "collectionName": "Surveys",
  "responseId": "resp_abc123",
  "answers": [
    {
      "questionId": "q_001",
      "question": "What is your name?",
      "type": "SHORT_TEXT",
      "answer": "Jane Smith"
    },
    {
      "questionId": "q_002",
      "question": "Email",
      "type": "EMAIL",
      "answer": "jane@example.com"
    }
  ],
  "integration": {
    "installationId": "inst_xyz789",
    "config": {
      "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
      "sheetName": "Responses"
    },
    "credentials": {
      "access_token": "ya29.a0...",
      "refresh_token": "1//0..."
    }
  },
  "timestamp": "2025-01-20T14:32:15.000Z"
}`}
      </CodeBlock>

      <h3 className="mt-8">3. Process the Data</h3>
      <p>
        Your webhook handler should process the data and send it to the
        third-party service. Return a 200 status code on success.
      </p>
      <CodeBlock title="handler.ts" language="TypeScript">
        {`import { google } from "googleapis";

export async function POST(req: Request) {
  const payload = await req.json();
  const { answers, integration } = payload;
  const { config, credentials } = integration;

  // Initialize Google Sheets client
  const auth = new google.auth.OAuth2();
  auth.setCredentials(credentials);

  const sheets = google.sheets({ version: "v4", auth });

  // Map answers to a row
  const row = answers.map((a) => a.answer);

  // Append to spreadsheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: \`\${config.sheetName}!A:Z\`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
}`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Manifest Schema                                               */}
      {/* ============================================================ */}
      <h2 id="manifest">Manifest Reference</h2>

      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Field</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Required</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  name
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Display name in the marketplace</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  slug
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Unique URL-safe identifier</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  version
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Semver version string</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  description
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Short description (max 200 chars)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  author
                </code>
              </td>
              <td className="py-2 pr-4">object</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Author name, email, and website</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  icon
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">
                URL to integration icon (SVG recommended, 64x64)
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  category
                </code>
              </td>
              <td className="py-2 pr-4">enum</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">
                PRODUCTIVITY, CRM, MARKETING, COMMUNICATION, ANALYTICS, STORAGE,
                AUTOMATION, OTHER
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  pricing
                </code>
              </td>
              <td className="py-2 pr-4">object</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">
                Pricing model: free, one_time, or subscription
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  auth
                </code>
              </td>
              <td className="py-2 pr-4">object</td>
              <td className="py-2 pr-4">No</td>
              <td className="py-2">OAuth2 config or API key authentication</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  webhookUrl
                </code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">Endpoint to receive form events</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  configFields
                </code>
              </td>
              <td className="py-2 pr-4">array</td>
              <td className="py-2 pr-4">No</td>
              <td className="py-2">
                User-configurable settings for the integration
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  events
                </code>
              </td>
              <td className="py-2 pr-4">string[]</td>
              <td className="py-2 pr-4 text-red-500">Yes</td>
              <td className="py-2">
                Webhook events to subscribe to (e.g. form.response.completed,
                form.moved, collection.created)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Categories                                                    */}
      {/* ============================================================ */}
      <h2 id="categories">Categories</h2>
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        {[
          {
            name: "Productivity",
            slug: "PRODUCTIVITY",
            desc: "Google Sheets, Notion, Airtable",
          },
          { name: "CRM", slug: "CRM", desc: "HubSpot, Salesforce, Pipedrive" },
          {
            name: "Marketing",
            slug: "MARKETING",
            desc: "Mailchimp, ConvertKit, ActiveCampaign",
          },
          {
            name: "Communication",
            slug: "COMMUNICATION",
            desc: "Slack, Discord, Teams",
          },
          {
            name: "Analytics",
            slug: "ANALYTICS",
            desc: "Google Analytics, Mixpanel",
          },
          {
            name: "Storage",
            slug: "STORAGE",
            desc: "Google Drive, Dropbox, S3",
          },
          { name: "Automation", slug: "AUTOMATION", desc: "Zapier, Make, n8n" },
          { name: "Other", slug: "OTHER", desc: "Everything else" },
        ].map((cat) => (
          <div key={cat.slug} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {cat.slug}
              </code>
              <span className="font-medium">{cat.name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{cat.desc}</p>
          </div>
        ))}
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Pricing Models                                                */}
      {/* ============================================================ */}
      <h2 id="pricing">Pricing Models</h2>
      <p>
        Integrations can use one of three pricing models. GudForm takes a 20%
        platform fee on paid integrations.
      </p>

      <CodeBlock title="Free integration" language="JSON">
        {`{
  "pricing": {
    "type": "free"
  }
}`}
      </CodeBlock>

      <CodeBlock title="One-time purchase" language="JSON">
        {`{
  "pricing": {
    "type": "one_time",
    "amount": 999,
    "currency": "usd"
  }
}`}
      </CodeBlock>

      <CodeBlock title="Monthly subscription" language="JSON">
        {`{
  "pricing": {
    "type": "subscription",
    "amount": 499,
    "currency": "usd",
    "interval": "month"
  }
}`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Publishing                                                    */}
      {/* ============================================================ */}
      <h2 id="publishing">Publishing to the Marketplace</h2>

      <h3>Submission Process</h3>
      <ol>
        <li>
          <strong>Register as a developer</strong> in your{" "}
          <Link href="/dashboard/settings">account settings</Link>.
        </li>
        <li>
          <strong>Submit your integration</strong> via the developer dashboard
          with your manifest, icon, and a demo video or screenshots.
        </li>
        <li>
          <strong>Review:</strong> Our team reviews your integration for
          security, functionality, and marketplace guidelines.
        </li>
        <li>
          <strong>Publish:</strong> Once approved, your integration goes live on
          the marketplace.
        </li>
      </ol>

      <h3 className="mt-6">Requirements</h3>
      <ul>
        <li>HTTPS webhook endpoint</li>
        <li>
          Valid <code>gudform-integration.json</code> manifest
        </li>
        <li>SVG or high-resolution icon (min 128x128px)</li>
        <li>Description and setup instructions</li>
        <li>Webhook must respond within 10 seconds and return 2xx status</li>
        <li>Handle retry deliveries idempotently</li>
      </ul>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* OAuth                                                         */}
      {/* ============================================================ */}
      <h2 id="oauth">OAuth Flow for Integrations</h2>
      <p>
        When users install an integration that requires OAuth, GudForm handles
        the OAuth flow:
      </p>
      <ol>
        <li>User clicks &ldquo;Connect&rdquo; on your integration.</li>
        <li>
          GudForm redirects to your <code>auth.authorizationUrl</code> with the
          required scopes.
        </li>
        <li>User authorizes on the third-party service.</li>
        <li>
          The service redirects back to GudForm with an authorization code.
        </li>
        <li>
          GudForm exchanges the code for tokens using your{" "}
          <code>auth.tokenUrl</code>.
        </li>
        <li>
          Tokens are stored securely and passed to your webhook in the{" "}
          <code>integration.credentials</code> field.
        </li>
      </ol>

      <CodeBlock title="OAuth config in manifest" language="JSON">
        {`{
  "auth": {
    "type": "oauth2",
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "scopes": [
      "https://www.googleapis.com/auth/spreadsheets"
    ],
    "clientIdEnvVar": "GOOGLE_CLIENT_ID",
    "clientSecretEnvVar": "GOOGLE_CLIENT_SECRET"
  }
}`}
      </CodeBlock>

      <div className="not-prose my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/10">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Security note:</strong> OAuth credentials are encrypted at
          rest and only decrypted when delivering webhook events to your
          endpoint. GudForm never exposes raw tokens in the dashboard.
        </p>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Testing                                                       */}
      {/* ============================================================ */}
      <h2 id="testing">Testing Your Integration</h2>
      <ol>
        <li>
          <strong>Local development:</strong> Use <code>ngrok</code> or a
          similar tool to expose your local webhook endpoint.
        </li>
        <li>
          <strong>Test events:</strong> Use the &ldquo;Send test event&rdquo;
          button in the developer dashboard to trigger a sample webhook
          delivery.
        </li>
        <li>
          <strong>Webhook logs:</strong> View delivery attempts, payloads, and
          response codes in the developer dashboard.
        </li>
      </ol>

      <CodeBlock title="Test with curl" language="bash">
        {`curl -X POST https://your-server.com/webhooks/gudform \\
  -H "Content-Type: application/json" \\
  -H "X-GudForm-Signature: sha256=test" \\
  -d '{
    "event": "form.response.completed",
    "formId": "test_form_id",
    "formTitle": "Test Form",
    "collectionId": "test_collection_id",
    "collectionName": "Default",
    "responseId": "test_response_id",
    "answers": [
      {
        "questionId": "q1",
        "question": "Name",
        "type": "SHORT_TEXT",
        "answer": "Test User"
      }
    ],
    "integration": {
      "installationId": "test_install",
      "config": {},
      "credentials": {}
    },
    "timestamp": "2025-01-20T12:00:00.000Z"
  }'`}
      </CodeBlock>
    </article>
  );
}
