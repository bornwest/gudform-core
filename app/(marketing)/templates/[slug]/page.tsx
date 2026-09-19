import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, Star, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { isOssEdition } from "@/config/edition";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

import { TemplateActions } from "./template-actions";

interface TemplateDetailProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const templates = await prisma.formTemplate.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return templates.map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: TemplateDetailProps) {
  const { slug } = await params;
  const template = await prisma.formTemplate.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, description: true, category: true },
  });

  if (!template) return { title: "Template Not Found" };

  const category = template.category.toLowerCase().replace("_", " ");

  return constructMetadata({
    title: `${template.name} – Free Form Template | GudForm`,
    description: template.description,
    canonical: `/templates/${slug}`,
    keywords: [
      `${template.name} template`,
      `${template.name} form`,
      `free ${template.name} form template`,
      `${category} form template`,
      "free form template",
    ],
  });
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  WELCOME_SCREEN: "Welcome Screen",
  SHORT_TEXT: "Short Text",
  LONG_TEXT: "Long Text",
  MULTIPLE_CHOICE: "Multiple Choice",
  DROPDOWN: "Dropdown",
  EMAIL: "Email",
  NUMBER: "Number",
  PHONE: "Phone",
  DATE: "Date",
  RATING: "Rating",
  SCALE: "Scale",
  YES_NO: "Yes / No",
  FILE_UPLOAD: "File Upload",
  STATEMENT: "Statement",
  THANK_YOU_SCREEN: "Thank You Screen",
};

export default async function TemplateDetailPage({
  params,
}: TemplateDetailProps) {
  const { slug } = await params;

  const template = await prisma.formTemplate.findFirst({
    where: { slug, status: "PUBLISHED" },
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
      formData: true,
    },
  });

  if (!template) notFound();

  const formData = template.formData as any;
  const questions: any[] = Array.isArray(formData?.questions)
    ? formData.questions
    : [];

  return (
    <MaxWidthWrapper className="py-10 md:py-16">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: template.name,
            description: template.description,
            url: `${siteConfig.url}/templates/${template.slug}`,
            creator: {
              "@type": "Organization",
              name: "GudForm",
              url: siteConfig.url,
            },
            offers: {
              "@type": "Offer",
              price:
                template.pricingType === "FREE"
                  ? "0"
                  : String((template.pricingAmount || 0) / 100),
              priceCurrency: template.pricingCurrency ?? "USD",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />

      {/* Back link */}
      <Link
        href="/templates"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to templates
      </Link>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-start gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl">
              <span>{template.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {template.name}
                </h1>
                {template.isOfficial && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Official
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">
                by {template.authorName}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <p className="text-lg">{template.description}</p>
            {template.longDescription && (
              <p className="mt-4 text-muted-foreground">
                {template.longDescription}
              </p>
            )}
          </div>

          {/* Question preview */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold">
              Questions ({questions.length})
            </h2>
            <div className="mt-4 space-y-2">
              {questions.map((q: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{q.title}</p>
                    {q.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {q.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {QUESTION_TYPE_LABELS[q.type] || q.type}
                  </span>
                  {q.required && (
                    <span className="text-xs text-red-500">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Action card */}
          <div className="rounded-xl border p-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {template.pricingType === "FREE"
                  ? "Free"
                  : `$${((template.pricingAmount || 0) / 100).toFixed(2)}`}
              </div>
            </div>
            <TemplateActions
              templateId={template.id}
              pricingType={template.pricingType}
              slug={template.slug}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {template.useCount.toLocaleString()} uses
            </p>
          </div>

          {/* Details card */}
          <div className="rounded-xl border p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium capitalize">
                  {template.category.toLowerCase().replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Questions</dt>
                <dd className="font-medium">{questions.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pricing</dt>
                <dd className="font-medium capitalize">
                  {template.pricingType.toLowerCase().replace("_", " ")}
                </dd>
              </div>
            </dl>
          </div>

          {/* What you get */}
          <div className="rounded-xl border p-6">
            <h3 className="text-sm font-semibold">What you get</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                Pre-built form with {questions.length} questions
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                Custom theme and styling
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                Fully customizable after cloning
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                Ready to publish immediately
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
