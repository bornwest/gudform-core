import Link from "next/link";

export const metadata = {
  title: "API Reference - GudForm Docs",
  description:
    "Complete REST API reference for GudForm. Manage forms, questions, and responses programmatically.",
};

/* ------------------------------------------------------------------ */
/* Reusable components for code blocks and endpoint descriptions       */
/* ------------------------------------------------------------------ */

function EndpointBadge({
  method,
  path,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
}) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-900/50 text-emerald-400",
    POST: "bg-green-900/50 text-green-400",
    PATCH: "bg-amber-900/50 text-amber-400",
    DELETE: "bg-red-900/50 text-red-400",
  };

  return (
    <div className="not-prose flex items-center gap-3 overflow-x-auto rounded-lg border border-gray-200 bg-gray-950 px-4 py-3 dark:border-gray-800">
      <span
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${colors[method]}`}
      >
        {method}
      </span>
      <code className="text-sm text-gray-300">{path}</code>
    </div>
  );
}

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

function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; desc: string }[];
}) {
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Parameter</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Required</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {p.name}
                </code>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-red-500">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="py-2 text-muted-foreground">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ApiReferencePage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">REST API Reference</h1>
      <p className="text-lg text-muted-foreground">
        The GudForm API lets you manage forms, collections, and responses
        programmatically. All endpoints require authentication.
      </p>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Authentication                                                */}
      {/* ============================================================ */}
      <h2 id="authentication">Authentication</h2>
      <p>
        Authenticate requests by including your API key in the{" "}
        <code>Authorization</code> header as a Bearer token. Generate keys from{" "}
        <Link href="/dashboard/settings/api-keys">
          Dashboard &rarr; API Keys
        </Link>
        .
      </p>
      <CodeBlock title="Header format">
        {`Authorization: Bearer ff_your_api_key_here`}
      </CodeBlock>
      <p>
        All API keys start with <code>ff_</code>. Keep your keys secure &mdash;
        they grant full access to your account&rsquo;s forms and responses.
      </p>

      <div className="not-prose my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/10">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          API access requires a <strong>Pro</strong> or{" "}
          <strong>Business</strong> plan.
        </p>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Forms                                                         */}
      {/* ============================================================ */}
      <h2 id="forms">Forms</h2>

      {/* --- List Forms -------------------------------------------- */}
      <h3 id="list-forms">List Forms</h3>
      <p>
        Returns all forms owned by the authenticated user, ordered by last
        updated. Optionally filter by collection.
      </p>
      <EndpointBadge method="GET" path="/api/v1/forms" />

      <h4>Query Parameters</h4>
      <ParamTable
        params={[
          {
            name: "collectionId",
            type: "string",
            required: false,
            desc: "Filter forms by collection ID",
          },
        ]}
      />

      <h4>Response</h4>
      <CodeBlock title="200 OK" language="JSON">
        {`{
  "forms": [
    {
      "id": "clx1234abcd",
      "title": "Customer Feedback",
      "description": "Collect feedback from customers",
      "slug": "customer-feedback",
      "status": "PUBLISHED",
      "collectionId": "col_abc123",
      "collection": {
        "id": "col_abc123",
        "name": "Surveys"
      },
      "themeColor": "#6366f1",
      "backgroundColor": "#ffffff",
      "themeMode": "LIGHT",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-20T14:30:00.000Z",
      "publishedAt": "2025-01-16T09:00:00.000Z",
      "_count": {
        "responses": 142,
        "questions": 8
      }
    }
  ]
}`}
      </CodeBlock>

      {/* --- Create Form ------------------------------------------- */}
      <h3 id="create-form" className="mt-10">
        Create Form
      </h3>
      <p>
        Creates a new form in your account. If no <code>collectionId</code> is
        provided, the form is placed in your default collection.
      </p>
      <EndpointBadge method="POST" path="/api/v1/forms" />

      <h4>Request Body</h4>
      <ParamTable
        params={[
          {
            name: "title",
            type: "string",
            required: false,
            desc: 'Form title (defaults to "Untitled Form")',
          },
          {
            name: "description",
            type: "string",
            required: false,
            desc: "Form description",
          },
          {
            name: "collectionId",
            type: "string",
            required: false,
            desc: "Collection to place the form in (defaults to your default collection)",
          },
        ]}
      />

      <CodeBlock title="Request" language="JSON">
        {`{
  "title": "Event Registration",
  "description": "Register for our upcoming workshop",
  "collectionId": "col_abc123"
}`}
      </CodeBlock>

      <CodeBlock title="201 Created" language="JSON">
        {`{
  "form": {
    "id": "clx5678efgh",
    "title": "Event Registration",
    "description": "Register for our upcoming workshop",
    "slug": "event-registration-abc123",
    "status": "DRAFT",
    "collectionId": "col_abc123",
    "createdAt": "2025-01-21T12:00:00.000Z"
  }
}`}
      </CodeBlock>

      {/* --- Get Form ---------------------------------------------- */}
      <h3 id="get-form" className="mt-10">
        Get Form
      </h3>
      <p>Retrieve a single form with all questions.</p>
      <EndpointBadge method="GET" path="/api/v1/forms/:formId" />

      <h4>Path Parameters</h4>
      <ParamTable
        params={[
          {
            name: "formId",
            type: "string",
            required: true,
            desc: "The form ID",
          },
        ]}
      />

      <CodeBlock title="200 OK" language="JSON">
        {`{
  "form": {
    "id": "clx1234abcd",
    "title": "Customer Feedback",
    "status": "PUBLISHED",
    "collectionId": "col_abc123",
    "collection": {
      "id": "col_abc123",
      "name": "Surveys"
    },
    "paymentEnabled": true,
    "paymentAmount": 1000,
    "paymentCurrency": "usd",
    "paymentDescription": "Consultation fee",
    "questions": [
      {
        "id": "q_001",
        "order": 0,
        "type": "WELCOME_SCREEN",
        "title": "Welcome!",
        "description": "Thanks for taking our survey",
        "required": false,
        "properties": {}
      },
      {
        "id": "q_002",
        "order": 1,
        "type": "SHORT_TEXT",
        "title": "What is your name?",
        "description": null,
        "required": true,
        "properties": { "placeholder": "John Doe" }
      },
      {
        "id": "q_003",
        "order": 2,
        "type": "RATING",
        "title": "Rate your experience",
        "required": true,
        "properties": { "maxRating": 5 }
      }
    ],
    "_count": { "responses": 142 }
  }
}`}
      </CodeBlock>

      {/* --- Update Form ------------------------------------------- */}
      <h3 id="update-form" className="mt-10">
        Update Form
      </h3>
      <p>
        Update form properties. Use <code>collectionId</code> to move a form
        between collections.
      </p>
      <EndpointBadge method="PATCH" path="/api/v1/forms/:formId" />

      <h4>Request Body</h4>
      <ParamTable
        params={[
          {
            name: "title",
            type: "string",
            required: false,
            desc: "Form title",
          },
          {
            name: "description",
            type: "string",
            required: false,
            desc: "Form description",
          },
          {
            name: "status",
            type: "string",
            required: false,
            desc: '"DRAFT", "PUBLISHED", or "CLOSED"',
          },
          {
            name: "collectionId",
            type: "string",
            required: false,
            desc: "Move form to a different collection",
          },
          {
            name: "themeColor",
            type: "string",
            required: false,
            desc: "Hex color code (e.g. #6366f1)",
          },
          {
            name: "backgroundColor",
            type: "string",
            required: false,
            desc: "Hex background color",
          },
          {
            name: "showProgressBar",
            type: "boolean",
            required: false,
            desc: "Show progress indicator",
          },
          {
            name: "redirectUrl",
            type: "string",
            required: false,
            desc: "URL to redirect after submission",
          },
          {
            name: "notifyOnResponse",
            type: "boolean",
            required: false,
            desc: "Email notification on new response",
          },
        ]}
      />

      <CodeBlock title="Request — move form to a collection" language="JSON">
        {`{
  "collectionId": "col_def456"
}`}
      </CodeBlock>

      {/* --- Delete Form ------------------------------------------- */}
      <h3 id="delete-form" className="mt-10">
        Delete Form
      </h3>
      <p>
        Permanently deletes a form and all its questions and responses. This
        action cannot be undone.
      </p>
      <EndpointBadge method="DELETE" path="/api/v1/forms/:formId" />

      <CodeBlock title="200 OK" language="JSON">
        {`{ "deleted": true }`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Responses                                                     */}
      {/* ============================================================ */}
      <h2 id="responses">Responses</h2>

      <h3 id="list-responses">List Responses</h3>
      <p>
        Retrieve paginated responses for a form. Each response includes all
        answers with their associated question details.
      </p>
      <EndpointBadge method="GET" path="/api/v1/forms/:formId/responses" />

      <h4>Query Parameters</h4>
      <ParamTable
        params={[
          {
            name: "page",
            type: "integer",
            required: false,
            desc: "Page number (default: 1)",
          },
          {
            name: "limit",
            type: "integer",
            required: false,
            desc: "Results per page (default: 50, max: 100)",
          },
        ]}
      />

      <CodeBlock title="200 OK" language="JSON">
        {`{
  "responses": [
    {
      "id": "resp_abc123",
      "formId": "clx1234abcd",
      "startedAt": "2025-01-20T14:30:00.000Z",
      "completedAt": "2025-01-20T14:32:15.000Z",
      "paymentStatus": "COMPLETED",
      "paymentAmount": 1000,
      "paymentCurrency": "usd",
      "answers": [
        {
          "id": "ans_001",
          "questionId": "q_002",
          "value": "Jane Smith",
          "question": {
            "id": "q_002",
            "title": "What is your name?",
            "type": "SHORT_TEXT"
          }
        },
        {
          "id": "ans_002",
          "questionId": "q_003",
          "value": "5",
          "question": {
            "id": "q_003",
            "title": "Rate your experience",
            "type": "RATING"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "totalPages": 3
  }
}`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Collections                                                    */}
      {/* ============================================================ */}
      <h2 id="collections">Collections</h2>
      <p>
        Collections let you organize forms into groups. Every account has a
        default collection that cannot be renamed or deleted. Forms are always
        placed in a collection &mdash; new forms go to the default collection
        unless you specify otherwise.
      </p>

      {/* --- List Collections --------------------------------------- */}
      <h3 id="list-collections">List Collections</h3>
      <p>
        Returns all collections for the authenticated user, ordered by default
        collection first then alphabetically.
      </p>
      <EndpointBadge method="GET" path="/api/v1/collections" />

      <CodeBlock title="200 OK" language="JSON">
        {`{
  "collections": [
    {
      "id": "col_abc123",
      "name": "Default",
      "isDefault": true,
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-20T14:00:00.000Z",
      "_count": {
        "forms": 5,
        "teams": 0
      }
    },
    {
      "id": "col_def456",
      "name": "Surveys",
      "isDefault": false,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-18T12:00:00.000Z",
      "_count": {
        "forms": 3,
        "teams": 2
      }
    }
  ]
}`}
      </CodeBlock>

      {/* --- Create Collection -------------------------------------- */}
      <h3 id="create-collection" className="mt-10">
        Create Collection
      </h3>
      <p>Creates a new collection.</p>
      <EndpointBadge method="POST" path="/api/v1/collections" />

      <h4>Request Body</h4>
      <ParamTable
        params={[
          {
            name: "name",
            type: "string",
            required: true,
            desc: "Collection name (1-50 characters)",
          },
        ]}
      />

      <CodeBlock title="Request" language="JSON">
        {`{
  "name": "Marketing Forms"
}`}
      </CodeBlock>

      <CodeBlock title="201 Created" language="JSON">
        {`{
  "collection": {
    "id": "col_ghi789",
    "name": "Marketing Forms",
    "isDefault": false,
    "createdAt": "2025-01-21T12:00:00.000Z",
    "updatedAt": "2025-01-21T12:00:00.000Z"
  }
}`}
      </CodeBlock>

      {/* --- Get Collection ----------------------------------------- */}
      <h3 id="get-collection" className="mt-10">
        Get Collection
      </h3>
      <p>Retrieve a single collection with all its forms.</p>
      <EndpointBadge method="GET" path="/api/v1/collections/:collectionId" />

      <h4>Path Parameters</h4>
      <ParamTable
        params={[
          {
            name: "collectionId",
            type: "string",
            required: true,
            desc: "The collection ID",
          },
        ]}
      />

      <CodeBlock title="200 OK" language="JSON">
        {`{
  "collection": {
    "id": "col_def456",
    "name": "Surveys",
    "isDefault": false,
    "forms": [
      {
        "id": "clx1234abcd",
        "title": "Customer Feedback",
        "slug": "customer-feedback",
        "status": "PUBLISHED",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-20T14:30:00.000Z",
        "_count": { "responses": 142, "questions": 8 }
      }
    ],
    "_count": { "forms": 1, "teams": 2 }
  }
}`}
      </CodeBlock>

      {/* --- Update Collection -------------------------------------- */}
      <h3 id="update-collection" className="mt-10">
        Update Collection
      </h3>
      <p>Rename a collection. The default collection cannot be renamed.</p>
      <EndpointBadge method="PATCH" path="/api/v1/collections/:collectionId" />

      <h4>Request Body</h4>
      <ParamTable
        params={[
          {
            name: "name",
            type: "string",
            required: true,
            desc: "New collection name (1-50 characters)",
          },
        ]}
      />

      <CodeBlock title="Request" language="JSON">
        {`{
  "name": "Customer Surveys"
}`}
      </CodeBlock>

      {/* --- Delete Collection -------------------------------------- */}
      <h3 id="delete-collection" className="mt-10">
        Delete Collection
      </h3>
      <p>
        Deletes a collection. The default collection cannot be deleted. When a
        collection is deleted, all its forms are moved back to the default
        collection automatically.
      </p>
      <EndpointBadge method="DELETE" path="/api/v1/collections/:collectionId" />

      <CodeBlock title="200 OK" language="JSON">
        {`{ "deleted": true }`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Question Types                                                */}
      {/* ============================================================ */}
      <h2 id="question-types">Question Types</h2>
      <p>
        Each question has a <code>type</code> field indicating the kind of
        input. The <code>properties</code> object varies by type.
      </p>

      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Description</th>
              <th className="pb-2 font-medium">Properties</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  WELCOME_SCREEN
                </code>
              </td>
              <td className="py-2 pr-4">Intro screen</td>
              <td className="py-2">
                <code>buttonText</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  SHORT_TEXT
                </code>
              </td>
              <td className="py-2 pr-4">Single-line text</td>
              <td className="py-2">
                <code>placeholder</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  LONG_TEXT
                </code>
              </td>
              <td className="py-2 pr-4">Multi-line text</td>
              <td className="py-2">
                <code>placeholder</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  EMAIL
                </code>
              </td>
              <td className="py-2 pr-4">Email address</td>
              <td className="py-2">
                <code>placeholder</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  NUMBER
                </code>
              </td>
              <td className="py-2 pr-4">Numeric input</td>
              <td className="py-2">
                <code>placeholder, min, max</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  PHONE
                </code>
              </td>
              <td className="py-2 pr-4">Phone number</td>
              <td className="py-2">
                <code>placeholder</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  DATE
                </code>
              </td>
              <td className="py-2 pr-4">Date picker</td>
              <td className="py-2">&mdash;</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  RATING
                </code>
              </td>
              <td className="py-2 pr-4">Star rating</td>
              <td className="py-2">
                <code>maxRating</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  SCALE
                </code>
              </td>
              <td className="py-2 pr-4">Numeric scale</td>
              <td className="py-2">
                <code>scaleMin, scaleMax, scaleMinLabel, scaleMaxLabel</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  YES_NO
                </code>
              </td>
              <td className="py-2 pr-4">Boolean choice</td>
              <td className="py-2">&mdash;</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  MULTIPLE_CHOICE
                </code>
              </td>
              <td className="py-2 pr-4">Select from options</td>
              <td className="py-2">
                <code>choices, allowMultiple</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  DROPDOWN
                </code>
              </td>
              <td className="py-2 pr-4">Dropdown menu</td>
              <td className="py-2">
                <code>choices</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  FILE_UPLOAD
                </code>
              </td>
              <td className="py-2 pr-4">File attachment</td>
              <td className="py-2">
                <code>maxFileSizeMB</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  STATEMENT
                </code>
              </td>
              <td className="py-2 pr-4">Read-only text</td>
              <td className="py-2">
                <code>buttonText</code>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  THANK_YOU_SCREEN
                </code>
              </td>
              <td className="py-2 pr-4">Completion screen</td>
              <td className="py-2">
                <code>buttonText, showButton</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Errors                                                        */}
      {/* ============================================================ */}
      <h2 id="errors">Error Handling</h2>
      <p>
        The API uses standard HTTP status codes. Errors return a JSON object
        with an <code>error</code> field containing a human-readable message.
      </p>

      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Meaning</th>
              <th className="pb-2 font-medium">Example</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4 font-mono">400</td>
              <td className="py-2 pr-4">Bad Request</td>
              <td className="py-2">Invalid parameters</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4 font-mono">401</td>
              <td className="py-2 pr-4">Unauthorized</td>
              <td className="py-2">Missing or invalid API key</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4 font-mono">404</td>
              <td className="py-2 pr-4">Not Found</td>
              <td className="py-2">Form or resource not found</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4 font-mono">429</td>
              <td className="py-2 pr-4">Rate Limited</td>
              <td className="py-2">Too many requests</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4 font-mono">500</td>
              <td className="py-2 pr-4">Server Error</td>
              <td className="py-2">Internal error</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock title="Error response format" language="JSON">
        {`{
  "error": "Form not found"
}`}
      </CodeBlock>

      <hr className="my-8" />

      {/* ============================================================ */}
      {/* Rate Limits                                                   */}
      {/* ============================================================ */}
      <h2 id="rate-limits">Rate Limits</h2>
      <p>API requests are rate-limited per API key:</p>

      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">API Access</th>
              <th className="pb-2 pr-4 font-medium">Rate Limit</th>
              <th className="pb-2 font-medium">Burst</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4">Free</td>
              <td className="py-2 pr-4 text-red-500">No</td>
              <td className="py-2 pr-4">&mdash;</td>
              <td className="py-2">&mdash;</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">Starter ($5/mo)</td>
              <td className="py-2 pr-4 text-red-500">No</td>
              <td className="py-2 pr-4">&mdash;</td>
              <td className="py-2">&mdash;</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">Pro</td>
              <td className="py-2 pr-4 text-emerald-500">Yes</td>
              <td className="py-2 pr-4">100 requests/min</td>
              <td className="py-2">200 requests</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4">Business</td>
              <td className="py-2 pr-4 text-emerald-500">Yes</td>
              <td className="py-2 pr-4">500 requests/min</td>
              <td className="py-2">1000 requests</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        When rate-limited, the API returns <code>429 Too Many Requests</code>{" "}
        with a <code>Retry-After</code> header indicating seconds to wait.
      </p>
    </article>
  );
}
