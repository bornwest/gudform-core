import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/env.mjs";
import { sanitizeStorageKey } from "@/lib/storage-path";

let _client: S3Client | null = null;

export type StorageDriver = "r2" | "local";

export function getStorageDriver(): StorageDriver {
  if (env.STORAGE_DRIVER === "local") return "local";
  if (env.STORAGE_DRIVER === "r2") return "r2";
  if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
    return "r2";
  }
  return "local";
}

export function getLocalStoragePath(): string {
  return env.STORAGE_LOCAL_PATH || path.join(process.cwd(), "uploads");
}

export function getPlatformR2Client(): S3Client {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("Cloudflare R2 is not configured");
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

export function getR2BucketName(): string {
  if (!env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }
  return env.R2_BUCKET_NAME;
}

export function getR2PublicUrl(): string {
  if (!env.R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL is not configured");
  }
  return env.R2_PUBLIC_URL.replace(/\/+$/, "");
}

export function getPublicFileUrl(key: string): string {
  const safeKey = sanitizeStorageKey(key);
  if (getStorageDriver() === "r2") {
    return `${getR2PublicUrl()}/${safeKey}`;
  }
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/api/files/${safeKey}`;
}

export async function putStoredObject(options: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const key = sanitizeStorageKey(options.key);

  if (getStorageDriver() === "r2") {
    const s3 = getPlatformR2Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        Body: options.body,
        ContentType: options.contentType,
      }),
    );
    return { key, url: getPublicFileUrl(key) };
  }

  const diskPath = path.join(getLocalStoragePath(), key);
  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, options.body);
  return { key, url: getPublicFileUrl(key) };
}
