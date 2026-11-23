import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import {
  getLocalStoragePath,
  getSignedS3FileUrl,
  getStorageDriver,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/storage";
import { sanitizeStorageKey } from "@/lib/storage-path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (getStorageDriver() === "r2") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { key: segments } = await params;
  let key: string;
  try {
    key = sanitizeStorageKey(segments.join("/"));
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (getStorageDriver() === "s3") {
    return redirectToSignedS3Url(key);
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

/**
 * S3 files are private: redirect to a short-lived signed URL. Only files the
 * app uploaded (those with a FileUpload record) are signed, so other objects
 * in the bucket can't be reached through this route.
 */
async function redirectToSignedS3Url(key: string) {
  const upload = await prisma.fileUpload.findUnique({
    where: { key },
    select: { fileName: true, mimeType: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getSignedS3FileUrl(key, {
    fileName: upload.fileName,
    contentType: upload.mimeType,
  });
  const res = NextResponse.redirect(url, 302);
  // Cache the redirect for less time than the signed URL lasts.
  res.headers.set(
    "Cache-Control",
    `private, max-age=${Math.floor(SIGNED_URL_TTL_SECONDS / 2)}`,
  );
  return res;
}
