import { NextResponse } from "next/server";

import { getEdition } from "@/config/edition";

export async function GET() {
  return NextResponse.json({
    ok: true,
    edition: getEdition(),
  });
}
