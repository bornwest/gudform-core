import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/env.mjs";
import { sanitizeStorageKey } from "@/lib/storage-path";

let _client: S3Client | null = null;
let _s3Client: S3Client | null = null;

export type StorageDriver = "s3" | "r2" | "local";

type S3Config = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  keyPrefix: string | null;
};

/** AWS S3 settings, or null unless all four S3 credentials are set. */
function getS3Config(): S3Config | null {
  const { S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME } = env;
  if (!S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
    return null;
  }
  return {
    region: S3_REGION,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    bucket: S3_BUCKET_NAME,
    keyPrefix: env.S3_KEY_PREFIX?.replace(/^\/+|\/+$/g, "") || null,
  };
}

/** True when uploads go to AWS S3, i.e. all four S3 credentials are set. */
export function isUsingS3(): boolean {
  return getS3Config() !== null;
}

/** Folder new uploads go under: "uploads", or "uploads/<S3_KEY_PREFIX>" on S3. */
export function getUploadsFolder(): string {
  const keyPrefix = getS3Config()?.keyPrefix;
  return keyPrefix ? `uploads/${keyPrefix}` : "uploads";
}

function requireS3Config(): S3Config {
  const config = getS3Config();
  if (!config) {
    throw new Error("AWS S3 is not configured");
  }
  return config;
}

/** AWS S3 wins whenever its credentials are set; otherwise R2 or local disk. */
export function getStorageDriver(): StorageDriver {
  if (isUsingS3()) return "s3";
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

function getS3Client(): S3Client {
  if (!_s3Client) {
    const { region, accessKeyId, secretAccessKey } = requireS3Config();
    _s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _s3Client;
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

/**
 * The URL saved for an uploaded file. S3 files get an app URL
 * (`/api/files/<key>`) that redirects to a short-lived signed URL, so the
 * bucket can stay private and saved links never expire.
 */
export function getPublicFileUrl(key: string): string {
  const safeKey = sanitizeStorageKey(key);
  if (getStorageDriver() === "r2") {
    return `${getR2PublicUrl()}/${safeKey}`;
  }
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/api/files/${safeKey}`;
}

/** How long a signed S3 download URL stays valid. */
export const SIGNED_URL_TTL_SECONDS = 300;

/** Quote a filename for Content-Disposition, with an RFC 5987 UTF-8 form. */
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/**
 * A short-lived signed GET URL for an object in the S3 bucket. `fileName`
 * sets the name the browser uses when the file is saved.
 */
export async function getSignedS3FileUrl(
  key: string,
  options: { fileName?: string; contentType?: string } = {},
): Promise<string> {
  const safeKey = sanitizeStorageKey(key);
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: requireS3Config().bucket,
      Key: safeKey,
      ResponseContentDisposition: options.fileName
        ? contentDisposition(options.fileName)
        : undefined,
      ResponseContentType: options.contentType,
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );
}

export async function putStoredObject(options: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const key = sanitizeStorageKey(options.key);

  if (isUsingS3()) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: requireS3Config().bucket,
        Key: key,
        Body: options.body,
        ContentType: options.contentType,
      }),
    );
    return { key, url: getPublicFileUrl(key) };
  }

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
