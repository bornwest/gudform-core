import Link from "next/link";

export const metadata = {
  title: "Self-hosting - GudForm Docs",
  description:
    "Run GudForm with Docker. The OSS edition includes the builder, responses, teams, API, and webhooks. Billing, Stripe payments, and the integrations marketplace are hosted-only.",
};

export default function SelfHostingDocsPage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">Self-hosting</h1>
      <p className="text-lg text-muted-foreground">
        GudForm core runs with Docker Compose: builder, public forms,
        responses, teams, API keys, and webhooks. Hosted billing, Stripe
        payment collection, and the integrations marketplace are not included.
        See{" "}
        <Link href="/docs">developer docs</Link> for the API.
      </p>

      <h2>Docker Compose</h2>
      <p>From the repository root:</p>
      <div className="not-prose overflow-hidden rounded-lg border border-gray-200 bg-gray-950 text-sm dark:border-gray-800">
        <pre className="overflow-x-auto p-4 text-gray-300">
          <code>{`docker compose up --build`}</code>
        </pre>
      </div>
      <p>
        The default compose file publishes the app at{" "}
        <a href="http://localhost:3080">http://localhost:3080</a> and Postgres
        at <code>localhost:5433</code> so they do not collide with a local{" "}
        <code>pnpm dev</code> on port 3000.
      </p>
      <ul>
        <li>
          Health check: <code>GET /api/health</code> returns{" "}
          <code>{`{ "ok": true, "edition": "oss" }`}</code>
        </li>
        <li>
          Register with email and password. Email verification is skipped when
          Resend is not configured.
        </li>
        <li>
          Change <code>AUTH_SECRET</code> before exposing the stack beyond
          localhost.
        </li>
      </ul>

      <h2>Required environment</h2>
      <ul>
        <li>
          <code>NEXT_PUBLIC_APP_URL</code> — public URL of the app
        </li>
        <li>
          <code>AUTH_SECRET</code> — <code>openssl rand -base64 32</code>
        </li>
        <li>
          <code>DATABASE_URL</code> — Postgres connection string
        </li>
        <li>
          <code>AUTH_TRUST_HOST=true</code> and <code>AUTH_URL</code> — set these
          in Docker / behind a reverse proxy
        </li>
      </ul>
      <p>
        Google, Resend, and R2 are optional. Hosted gudform.com is a separate
        private product; this Docker image is core only.
      </p>
    </article>
  );
}
