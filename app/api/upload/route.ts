import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getPlatformR2Client, getR2BucketName, getR2PublicUrl } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadLimiter = rateLimit({ interval: 60_000 });

const ALLOWED_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "text/csv",
  "text/plain",
  // Office
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function POST(req: NextRequest) {
  try {
    // Rate limit uploads — 20 per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = uploadLimiter.check(20, ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const formId = formData.get("formId") as string | null;

    if (!file || !formId) {
      return NextResponse.json(
        { error: "File and formId are required" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: images, PDF, Office docs, CSV." },
        { status: 400 },
      );
    }

    // Look up the form's owner
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 },
      );
    }

    // Generate a unique key
    const ext = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : "";
    const uuid = crypto.randomUUID();
    const key = `uploads/${formId}/${uuid}${ext}`;

    const s3 = getPlatformR2Client();
    const arrayBuffer = await file.arrayBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      }),
    );

    // Build the public URL
    const url = `${getR2PublicUrl()}/${key}`;

    // Create FileUpload record (no expiration for self-hosted)
    const expiresAt = null;
    await prisma.fileUpload.create({
      data: {
        userId: form.userId,
        formId,
        key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url,
        expiresAt,
      },
    });

    return NextResponse.json({
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
