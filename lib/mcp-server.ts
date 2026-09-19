import { prisma } from "@/lib/db";
import { ensureDefaultCollection } from "@/lib/collections";
import { parseQuestionsPayload, replaceFormQuestions } from "@/lib/form-questions";
import { createCompletedFormResponse } from "@/lib/form-response";
import { generateSlug } from "@/lib/utils";
import type { ApiAuth } from "@/lib/api-auth";
import { MCP_TOOLS } from "@/lib/mcp-tools";
import { getEffectivePlanConfig } from "@/lib/subscription";
import { assertPlanFeature } from "@/lib/plan-gates";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

const PROTOCOL_VERSION = "2025-03-26";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

async function callTool(
  auth: ApiAuth,
  name: string,
  args: Record<string, unknown>,
) {
  switch (name) {
    case "list_forms": {
      const collectionId =
        typeof args.collectionId === "string" ? args.collectionId : undefined;
      const forms = await prisma.form.findMany({
        where: {
          userId: auth.userId,
          ...(collectionId ? { collectionId } : {}),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          collectionId: true,
          _count: { select: { questions: true, responses: { where: COUNTABLE_RESPONSE_WHERE } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      return textResult({ forms });
    }
    case "get_form_schema": {
      const formId = String(args.formId || "");
      const form = await prisma.form.findFirst({
        where: { id: formId, userId: auth.userId },
        include: { questions: { orderBy: { order: "asc" } } },
      });
      if (!form) return errorResult("Form not found");
      return textResult({ form });
    }
    case "create_form": {
      let collectionId =
        typeof args.collectionId === "string" ? args.collectionId : null;
      if (!collectionId) {
        const col = await ensureDefaultCollection(auth.userId);
        collectionId = col.id;
      }
      const form = await prisma.form.create({
        data: {
          title: typeof args.title === "string" ? args.title : "Untitled Form",
          description:
            typeof args.description === "string" ? args.description : null,
          slug: generateSlug(),
          userId: auth.userId,
          collectionId,
        },
      });
      if (args.questions) {
        const parsed = parseQuestionsPayload(args.questions);
        if (!parsed.ok) return errorResult(parsed.error);
        const questions = await replaceFormQuestions(form.id, parsed.questions);
        return textResult({ form: { ...form, questions } });
      }
      return textResult({ form });
    }
    case "set_questions": {
      const formId = String(args.formId || "");
      const owned = await prisma.form.findFirst({
        where: { id: formId, userId: auth.userId },
        select: { id: true },
      });
      if (!owned) return errorResult("Form not found");
      const parsed = parseQuestionsPayload(args.questions);
      if (!parsed.ok) return errorResult(parsed.error);
      const questions = await replaceFormQuestions(formId, parsed.questions);
      return textResult({ questions });
    }
    case "submit_response": {
      const formId = String(args.formId || "");
      const owned = await prisma.form.findFirst({
        where: { id: formId, userId: auth.userId },
        select: { id: true, status: true },
      });
      if (!owned) return errorResult("Form not found");
      if (owned.status === "CLOSED") return errorResult("Form is closed");
      const answers = args.answers;
      if (!Array.isArray(answers)) {
        return errorResult("answers must be an array");
      }
      const response = await createCompletedFormResponse(
        formId,
        answers as { questionId: string; value: string }[],
      );
      return textResult({ response });
    }
    case "set_webhook": {
      const formId = String(args.formId || "");
      const owned = await prisma.form.findFirst({
        where: { id: formId, userId: auth.userId },
        select: { id: true },
      });
      if (!owned) return errorResult("Form not found");
      const webhookUrl =
        typeof args.webhookUrl === "string" ? args.webhookUrl.trim() : "";
      if (webhookUrl) {
        const plan = await getEffectivePlanConfig(auth.userId);
        try {
          assertPlanFeature(plan, "webhooks", "Webhooks");
        } catch (err) {
          return errorResult(err instanceof Error ? err.message : "Webhooks unavailable");
        }
        if (!/^https:\/\//i.test(webhookUrl)) {
          return errorResult("webhookUrl must be an https URL");
        }
      }
      const form = await prisma.form.update({
        where: { id: formId },
        data: { webhookUrl: webhookUrl || null },
        select: { id: true, webhookUrl: true },
      });
      return textResult({ form });
    }
    default:
      return errorResult(`Unknown tool: ${name}`);
  }
}

export async function handleMcpJsonRpc(
  auth: ApiAuth,
  body: {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: Record<string, unknown>;
  },
) {
  const id = body.id ?? null;
  const method = body.method || "";
  const params = body.params || {};

  const result = async (value: unknown) => ({
    jsonrpc: "2.0" as const,
    id,
    result: value,
  });

  const error = (code: number, message: string) => ({
    jsonrpc: "2.0" as const,
    id,
    error: { code, message },
  });

  switch (method) {
    case "initialize":
      return result({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "gudform", version: "1.0.0" },
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return result({});
    case "ping":
      return result({});
    case "tools/list":
      return result({ tools: MCP_TOOLS });
    case "tools/call": {
      const name = String(params.name || "");
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      try {
        const toolResult = await callTool(auth, name, args);
        return result(toolResult);
      } catch (err) {
        return result(
          errorResult(err instanceof Error ? err.message : "Tool failed"),
        );
      }
    }
    default:
      return error(-32601, `Method not found: ${method}`);
  }
}
