"use server";

import {
  Prisma,
  TemplateCategory,
  TemplatePricingType,
  TemplateStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { TemplateFormData } from "@/lib/types/template";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "template"
  );
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== UserRole.ADMIN) throw new Error("Admin only");
  return user;
}

// ---------------------------------------------------------------------------
// Public: Browse marketplace
// ---------------------------------------------------------------------------

export async function getMarketplaceTemplates(filters?: {
  category?: TemplateCategory;
  search?: string;
  pricingType?: TemplatePricingType;
}) {
  const where: Prisma.FormTemplateWhereInput = {
    status: "PUBLISHED" as TemplateStatus,
  };

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.pricingType) {
    where.pricingType = filters.pricingType;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.formTemplate.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      category: true,
      pricingType: true,
      pricingAmount: true,
      pricingCurrency: true,
      useCount: true,
      isOfficial: true,
      authorName: true,
      formData: true,
    },
    orderBy: [{ isOfficial: "desc" }, { useCount: "desc" }],
  });
}

export async function getTemplateBySlug(slug: string) {
  return prisma.formTemplate.findFirst({
    where: { slug, status: "PUBLISHED" as TemplateStatus },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      longDescription: true,
      icon: true,
      category: true,
      pricingType: true,
      pricingAmount: true,
      pricingCurrency: true,
      useCount: true,
      isOfficial: true,
      authorName: true,
      authorEmail: true,
      formData: true,
      authorId: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Authenticated: Use template (free)
// ---------------------------------------------------------------------------

export async function cloneTemplateAction(templateId: string) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return { error: "Unauthorized" } as const;
  }

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      name: true,
      pricingType: true,
      formData: true,
      status: true,
    },
  });

  if (!template || template.status !== "PUBLISHED") {
    return { error: "Template not found" } as const;
  }

  if (template.pricingType !== "FREE") {
    return { error: "This template requires purchase" } as const;
  }

  const formData = template.formData as unknown as TemplateFormData;

  // Create the form from the template
  const form = await prisma.form.create({
    data: {
      title: formData.title || template.name,
      description: formData.description,
      userId: user.id,
      themeColor: formData.themeColor || "#6366f1",
      backgroundColor: formData.backgroundColor || "#ffffff",
      themeMode: (formData.themeMode as any) || "LIGHT",
      showProgressBar: formData.showProgressBar ?? true,
      questions: {
        create: (formData.questions || []).map((q, i) => ({
          order: i,
          type: q.type as any,
          title: q.title,
          description: q.description,
          required: q.required,
          properties: q.properties || {},
          logic: q.logic || [],
        })),
      },
    },
  });

  // Record usage and increment count
  await prisma.$transaction([
    prisma.templateUse.create({
      data: {
        templateId: template.id,
        userId: user.id,
      },
    }),
    prisma.formTemplate.update({
      where: { id: template.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  return form;
}

// ---------------------------------------------------------------------------
// Authenticated: Export form as template
// ---------------------------------------------------------------------------

export async function exportFormAsTemplate(
  formId: string,
  data: {
    name: string;
    description: string;
    longDescription?: string;
    icon: string;
    category: TemplateCategory;
    pricingType?: TemplatePricingType;
    pricingAmount?: number;
    pricingCurrency?: string;
  },
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Load the form with questions
  const form = await prisma.form.findFirst({
    where: { id: formId, userId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!form) throw new Error("Form not found");

  // Snapshot form data
  const formData: TemplateFormData = {
    title: form.title,
    description: form.description,
    themeColor: form.themeColor,
    backgroundColor: form.backgroundColor,
    themeMode: form.themeMode,
    showProgressBar: form.showProgressBar,
    questions: form.questions.map((q) => ({
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      properties: (q.properties as Record<string, any>) || {},
      logic: Array.isArray(q.logic) ? (q.logic as any[]) : [],
    })),
  };

  // Generate unique slug
  let slug = generateSlug(data.name);
  const existing = await prisma.formTemplate.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  return prisma.formTemplate.create({
    data: {
      slug,
      name: data.name,
      description: data.description,
      longDescription: data.longDescription,
      icon: data.icon,
      category: data.category,
      formData: formData as unknown as Prisma.InputJsonValue,
      pricingType: data.pricingType || "FREE",
      pricingAmount: data.pricingAmount,
      pricingCurrency: data.pricingCurrency || "usd",
      authorId: user.id,
      authorName: user.name || "Anonymous",
      authorEmail: user.email || undefined,
      status: "DRAFT",
    },
  });
}

// ---------------------------------------------------------------------------
// Author: Manage own templates
// ---------------------------------------------------------------------------

export async function getMyTemplates() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  return prisma.formTemplate.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      category: true,
      status: true,
      useCount: true,
      pricingType: true,
      pricingAmount: true,
      pricingCurrency: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    longDescription?: string;
    icon?: string;
    category?: TemplateCategory;
    pricingType?: TemplatePricingType;
    pricingAmount?: number;
    pricingCurrency?: string;
  },
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const template = await prisma.formTemplate.findFirst({
    where: { id: templateId, authorId: user.id },
  });
  if (!template) throw new Error("Template not found");

  if (template.status !== "DRAFT" && template.status !== "REJECTED") {
    throw new Error("Cannot edit a published or in-review template");
  }

  return prisma.formTemplate.update({
    where: { id: templateId },
    data,
  });
}

export async function submitTemplateForReview(templateId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const template = await prisma.formTemplate.findFirst({
    where: { id: templateId, authorId: user.id },
  });
  if (!template) throw new Error("Template not found");

  if (template.status !== "DRAFT" && template.status !== "REJECTED") {
    throw new Error("Only draft or rejected templates can be submitted");
  }

  return prisma.formTemplate.update({
    where: { id: templateId },
    data: { status: "IN_REVIEW" },
  });
}

export async function deleteTemplateDraft(templateId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const template = await prisma.formTemplate.findFirst({
    where: { id: templateId, authorId: user.id },
  });
  if (!template) throw new Error("Template not found");

  if (template.status === "PUBLISHED") {
    throw new Error("Cannot delete a published template");
  }

  await prisma.formTemplate.delete({ where: { id: templateId } });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Paid template purchase
// ---------------------------------------------------------------------------

export async function purchaseTemplate(templateId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      slug: true,
      name: true,
      pricingType: true,
      pricingAmount: true,
      pricingCurrency: true,
      status: true,
      authorId: true,
    },
  });

  if (!template || template.status !== "PUBLISHED") {
    throw new Error("Template not found");
  }

  if (template.pricingType === "FREE") {
    throw new Error("This template is free — use it directly");
  }

  // Redirect to purchase API route
  return { templateId: template.id, slug: template.slug };
}

// ---------------------------------------------------------------------------
// Admin: Review templates
// ---------------------------------------------------------------------------

export async function getTemplatesForReview(statusFilter?: TemplateStatus) {
  await requireAdmin();

  const where = statusFilter ? { status: statusFilter } : {};

  return prisma.formTemplate.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      category: true,
      status: true,
      authorName: true,
      authorEmail: true,
      pricingType: true,
      pricingAmount: true,
      pricingCurrency: true,
      useCount: true,
      isOfficial: true,
      rejectionReason: true,
      formData: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function approveTemplate(templateId: string) {
  await requireAdmin();

  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template not found");

  return prisma.formTemplate.update({
    where: { id: templateId },
    data: { status: "PUBLISHED", rejectionReason: null },
  });
}

export async function rejectTemplate(templateId: string, reason?: string) {
  await requireAdmin();

  return prisma.formTemplate.update({
    where: { id: templateId },
    data: {
      status: "REJECTED",
      rejectionReason: reason || null,
    },
  });
}
