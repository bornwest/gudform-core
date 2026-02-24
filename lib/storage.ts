import { S3Client } from "@aws-sdk/client-s3";

import { env } from "@/env.mjs";

let _client: S3Client | null = null;

export function getPlatformR2Client(): S3Client {
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
  return env.R2_BUCKET_NAME;
}

export function getR2PublicUrl(): string {
  return env.R2_PUBLIC_URL.replace(/\/+$/, "");
}
