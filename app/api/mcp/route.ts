import { NextResponse } from "next/server";

import { authorizeApiRequest } from "@/lib/api-auth";
import { handleMcpJsonRpc } from "@/lib/mcp-server";

export async function GET() {
  return NextResponse.json({
    name: "gudform",
    transport: "streamable-http",
    endpoint: "/api/mcp",
    auth: "Authorization: Bearer ff_...",
    docs: "/docs/mcp",
  });
}

export async function POST(req: Request) {
  const gate = await authorizeApiRequest(req);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  const rpc = await handleMcpJsonRpc(gate.auth, body);
  return NextResponse.json(rpc);
}
