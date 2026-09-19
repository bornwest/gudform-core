export const MCP_TOOLS = [
  {
    name: "list_forms",
    description: "List forms in the authenticated GudForm account.",
    inputSchema: {
      type: "object",
      properties: {
        collectionId: { type: "string" },
      },
    },
  },
  {
    name: "get_form_schema",
    description:
      "Get a form including its questions. Use this before submitting answers.",
    inputSchema: {
      type: "object",
      required: ["formId"],
      properties: {
        formId: { type: "string" },
      },
    },
  },
  {
    name: "create_form",
    description:
      "Create a form. Optionally pass questions in the same call.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        collectionId: { type: "string" },
        questions: { type: "array", items: { type: "object" } },
      },
    },
  },
  {
    name: "set_questions",
    description:
      "Replace the question list on a form. Omit id on new questions.",
    inputSchema: {
      type: "object",
      required: ["formId", "questions"],
      properties: {
        formId: { type: "string" },
        questions: { type: "array", items: { type: "object" } },
      },
    },
  },
  {
    name: "submit_response",
    description:
      "Submit answers to a form you own. answers is [{ questionId, value }].",
    inputSchema: {
      type: "object",
      required: ["formId", "answers"],
      properties: {
        formId: { type: "string" },
        answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              questionId: { type: "string" },
              value: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "set_webhook",
    description:
      "Set or clear the completion webhook URL on a form you own. Requires a plan that includes webhooks.",
    inputSchema: {
      type: "object",
      required: ["formId"],
      properties: {
        formId: { type: "string" },
        webhookUrl: {
          type: "string",
          description: "HTTPS URL, or empty to clear",
        },
      },
    },
  },
] as const;

export function listMcpTools() {
  return MCP_TOOLS;
}
