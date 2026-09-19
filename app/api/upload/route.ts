import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { putStoredObject } from "@/lib/storage";
import { checkStorageLimit, getEffectivePlanConfig } from "@/lib/subscription";

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

    // Check storage limit
    const storageCheck = await checkStorageLimit(form.userId, file.size);
    if (!storageCheck.allowed) {
      return NextResponse.json(
        { error: "Storage limit reached. The form owner needs to upgrade their plan." },
        { status: 413 },
      );
    }

    // Generate a unique key
    const ext = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : "";
    const uuid = crypto.randomUUID();
    const key = `uploads/${formId}/${uuid}${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { url } = await putStoredObject({
      key,
      body: Buffer.from(arrayBuffer),
      contentType: file.type,
    });

    const planConfig = await getEffectivePlanConfig(form.userId);
    const retentionDays = planConfig.features.fileRetentionDays;
    const expiresAt = retentionDays
      ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
      : null;

    // Create FileUpload record
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
