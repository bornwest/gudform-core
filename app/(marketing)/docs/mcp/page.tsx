import Link from "next/link";

export const metadata = {
  title: "MCP - GudForm Docs",
  description:
    "Connect AI agents to GudForm with the Model Context Protocol. List forms, read schema, create questions, and submit responses.",
};

export default function McpDocsPage() {
  return (
    <article className="prose prose-gray max-w-none dark:prose-invert">
      <h1 className="text-4xl font-bold tracking-tight">MCP server</h1>
      <p className="text-lg text-muted-foreground">
        GudForm exposes an MCP endpoint so agents can build and fill forms with
        the same API key you use for REST. This page ships in the public core
        at{" "}
        <a href="https://github.com/gudlab/gudform-core">
          gudlab/gudform-core
        </a>
        . Tag that repo when the tool list changes so Cloud and self-host stay
        aligned.
      </p>

      <h2>Endpoint</h2>
      <ul>
        <li>
          Self-host / this tree: <code>POST /api/mcp</code> on your app URL
        </li>
        <li>
          Cloud: <code>POST https://gudform.com/api/mcp</code>
        </li>
      </ul>
      <p>
        Send <code>Authorization: Bearer ff_...</code>. Create a key under{" "}
        <Link href="/dashboard/settings/api-keys">API Keys</Link>.
      </p>

      <h2>Tools</h2>
      <ul>
        <li>
          <code>list_forms</code> — forms in the account
        </li>
        <li>
          <code>get_form_schema</code> — form plus questions
        </li>
        <li>
          <code>create_form</code> — create a form, optionally with questions
        </li>
        <li>
          <code>set_questions</code> — replace the question list
        </li>
        <li>
          <code>submit_response</code> — submit answers
        </li>
        <li>
          <code>set_webhook</code> — set or clear the form completion webhook
        </li>
      </ul>

      <h2>MCP clients</h2>
      <pre>
        <code>{`{
  "mcpServers": {
    "gudform": {
      "url": "https://your-host/api/mcp",
      "headers": {
        "Authorization": "Bearer ff_your_key"
      }
    }
  }
}`}</code>
      </pre>
      <p>
        Same rate limits as the REST API. Spec:{" "}
        <Link href="/openapi.yaml">/openapi.yaml</Link>. Index for crawlers:{" "}
        <Link href="/llms.txt">/llms.txt</Link>.
      </p>
    </article>
  );
}
