import { siteConfig } from "@/config/site";

export async function GET() {
  const base = siteConfig.url.replace(/\/+$/, "");
  const body = `# GudForm

GudForm is an open-source conversational form builder (Typeform alternative).
Humans fill forms in the browser. Agents use the REST API and MCP.

## Docs

- Product: ${base}
- Developer docs: ${base}/docs
- REST API: ${base}/docs/api
- MCP: ${base}/docs/mcp
- Webhooks: ${base}/docs/webhooks
- Self-hosting: ${base}/docs/self-hosting
- OpenAPI: ${base}/openapi.yaml

## Agent access

- REST base: ${base}/api/v1
- Auth: Authorization: Bearer ff_<key>
- MCP: POST ${base}/api/mcp (same Bearer key)
- Tools: list_forms, get_form_schema, create_form, set_questions, submit_response, set_webhook

Create API keys at ${base}/dashboard/settings/api-keys
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
