import Link from "next/link";
import {
  ArrowRight,
  Code2,
  FolderOpen,
  Globe,
  Key,
  Puzzle,
  Webhook,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Developer Documentation - GudForm",
  description:
    "Learn how to integrate with GudForm using our REST API, webhooks, and integration marketplace.",
};

const quickLinks = [
  {
    icon: Key,
    title: "API Authentication",
    description: "Generate API keys and authenticate requests",
    href: "/docs/api#authentication",
  },
  {
    icon: Code2,
    title: "REST API Reference",
    description: "Full reference for forms, collections, and responses",
    href: "/docs/api",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Organize forms into collections with team-based access",
    href: "/docs/api#collections",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Receive real-time events when forms are submitted",
    href: "/docs/webhooks",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    description: "Build and publish integrations on the marketplace",
    href: "/docs/integrations",
  },
];

export default function DocsPage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">
        GudForm Developer Documentation
      </h1>
      <p className="text-lg text-muted-foreground">
        Everything you need to integrate with GudForm, build custom workflows,
        and create integrations for the marketplace.
      </p>

      {/* Quick Links Grid */}
      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-4 rounded-xl border p-5 transition-all hover:border-green-300 hover:shadow-sm dark:hover:border-green-500/50"
          >
            <div className="rounded-lg bg-green-50 p-2.5 dark:bg-green-500/10">
              <link.icon className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400">
                {link.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <hr className="my-10" />

      {/* Getting Started */}
      <h2 id="getting-started">Getting Started</h2>

      <h3>1. Create an API Key</h3>
      <p>
        Navigate to{" "}
        <Link
          href="/dashboard/settings/api-keys"
          className="text-green-600 hover:underline dark:text-green-400"
        >
          Dashboard &rarr; Settings &rarr; API Keys
        </Link>{" "}
        and generate a new key. API keys start with <code>ff_</code> and are
        used as Bearer tokens in all API requests.
      </p>

      <h3>2. Make Your First Request</h3>
      <div className="not-prose overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-sm dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
          <span className="text-xs font-medium text-gray-400">
            List your forms
          </span>
          <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-400">
            GET
          </span>
        </div>
        <pre className="overflow-x-auto p-4 text-gray-300">
          <code>{`curl -X GET https://gudform.com/api/v1/forms \\
  -H "Authorization: Bearer ff_your_api_key_here" \\
  -H "Content-Type: application/json"`}</code>
        </pre>
      </div>

      <h3>3. Explore the API</h3>
      <p>
        The GudForm REST API is organized around standard REST conventions. All
        responses return JSON. We support CRUD operations on forms and
        collections, plus read access to form responses.
      </p>

      <div className="not-prose mt-4">
        <Link
          href="/docs/api"
          className={cn(
            buttonVariants({ size: "lg", rounded: "lg" }),
            "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md",
          )}
        >
          View Full API Reference
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>

      <hr className="my-10" />

      {/* Base URL */}
      <h2 id="base-url">Base URL</h2>
      <p>All API endpoints use the following base URL:</p>
      <div className="not-prose overflow-hidden rounded-lg border border-gray-200 bg-gray-950 dark:border-gray-800">
        <pre className="p-4 text-sm text-gray-300">
          <code>https://gudform.com/api/v1</code>
        </pre>
      </div>

      <hr className="my-10" />

      {/* SDKs */}
      <h2 id="sdks">Client Libraries</h2>
      <p>
        Use our API with any HTTP client. We also provide typed helpers to speed
        up integration:
      </p>
      <div className="not-prose overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-sm dark:border-gray-800">
        <div className="border-b border-gray-800 px-4 py-2">
          <span className="text-xs font-medium text-gray-400">
            Install via npm
          </span>
        </div>
        <pre className="overflow-x-auto p-4 text-gray-300">
          <code>{`npm install @gudform/sdk`}</code>
        </pre>
      </div>
      <div className="not-prose mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-sm dark:border-gray-800">
        <div className="border-b border-gray-800 px-4 py-2">
          <span className="text-xs font-medium text-gray-400">Quick usage</span>
        </div>
        <pre className="overflow-x-auto p-4 text-gray-300">
          <code>{`import { GudForm } from "@gudform/sdk";

const client = new GudForm({ apiKey: "ff_your_key" });

// List forms
const { forms } = await client.forms.list();

// List forms in a specific collection
const { forms: filtered } = await client.forms.list({
  collectionId: "collection_id",
});

// List collections
const { collections } = await client.collections.list();

// Get responses
const { responses } = await client.forms.responses("form_id", {
  page: 1,
  limit: 50,
});`}</code>
        </pre>
      </div>

      <hr className="my-10" />

      {/* Changelog */}
      <h2 id="changelog">API Changelog</h2>
      <div className="not-prose space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              v1.1
            </span>
            <span className="text-sm text-muted-foreground">
              Current &mdash; Stable
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              &bull; New <strong>Collections API</strong> &mdash; full CRUD for
              organizing forms into collections
            </li>
            <li>
              &bull; Forms now include{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                collectionId
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                collection
              </code>{" "}
              in responses
            </li>
            <li>
              &bull; Filter forms by collection via{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                ?collectionId=
              </code>{" "}
              query parameter
            </li>
            <li>&bull; Move forms between collections via PATCH</li>
            <li>
              &bull; Updated <strong>Free plan</strong> &mdash; unlimited forms
              and submissions (teams, API, and webhooks available on paid tiers)
            </li>
          </ul>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              v1.0
            </span>
            <span className="text-sm text-muted-foreground">Stable</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Initial API release with forms CRUD, responses read access, webhook
            events, payment fields, and integration marketplace support.
          </p>
        </div>
      </div>
    </article>
  );
}
