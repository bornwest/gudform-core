import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { getLocalStoragePath, getStorageDriver } from "@/lib/storage";
import { sanitizeStorageKey } from "@/lib/storage-path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (getStorageDriver() !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { key: segments } = await params;
  let key: string;
  try {
    key = sanitizeStorageKey(segments.join("/"));
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(getLocalStoragePath(), key);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
