import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata = {
  title: "Templates - GudForm",
  description:
    "Browse form templates for surveys, feedback, registrations, and more. Clone a template and start collecting responses in minutes.",
};

const CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "SURVEY", label: "Survey" },
  { slug: "FEEDBACK", label: "Feedback" },
  { slug: "REGISTRATION", label: "Registration" },
  { slug: "APPLICATION", label: "Application" },
  { slug: "ORDER", label: "Order" },
  { slug: "QUIZ", label: "Quiz" },
  { slug: "LEAD_GENERATION", label: "Lead Gen" },
  { slug: "CONTACT", label: "Contact" },
  { slug: "HR", label: "HR" },
  { slug: "EDUCATION", label: "Education" },
  { slug: "HEALTHCARE", label: "Healthcare" },
  { slug: "OTHER", label: "Other" },
];

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  const where: any = { status: "PUBLISHED" };
  if (category && category !== "all") {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const templates = await prisma.formTemplate.findMany({
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

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-green-50/50 to-background py-16 dark:from-green-950/20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Form Templates
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with a professionally designed template and customize it to
              fit your needs. Free and premium templates available.
            </p>
          </div>

          {/* Search */}
          <form className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search templates..."
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </form>

          {/* Category pills */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={
                  cat.slug === "all"
                    ? "/templates"
                    : `/templates?category=${cat.slug}`
                }
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  (category || "all") === cat.slug
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "hover:border-green-300 hover:bg-muted",
                )}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Grid */}
      <section className="py-12">
        <MaxWidthWrapper>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <Sparkles className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No templates found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search or browse all categories."
                  : "Check back soon — new templates are added regularly."}
              </p>
              {search && (
                <Link
                  href="/templates"
                  className="mt-4 text-sm font-medium text-green-600 hover:underline dark:text-green-400"
                >
                  Clear search
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const formData = template.formData as any;
                const questionCount = Array.isArray(formData?.questions)
                  ? formData.questions.length
                  : 0;

                return (
                  <Link
                    key={template.id}
                    href={`/templates/${template.slug}`}
                    className="group flex flex-col rounded-xl border p-6 transition-all hover:border-green-300 hover:shadow-md dark:hover:border-green-500/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                        <span>{template.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold group-hover:text-green-600 dark:group-hover:text-green-400">
                            {template.name}
                          </h3>
                          {template.isOfficial && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              Official
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          by {template.authorName}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">
                          {template.category
                            .toLowerCase()
                            .replace("_", " ")}
                        </span>
                        <span>&middot;</span>
                        <span>{questionCount} questions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>
                          {template.useCount.toLocaleString()} uses
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {template.pricingType === "FREE"
                            ? "Free"
                            : `$${(template.pricingAmount! / 100).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Creator CTA */}
          <div className="mt-16 rounded-2xl border bg-gradient-to-r from-green-50 to-teal-50 p-8 text-center dark:from-green-950/20 dark:to-teal-950/20">
            <h3 className="text-xl font-bold">Share your form templates</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Export any form as a template and publish it to the marketplace.
              Free or paid — you choose.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/dashboard/templates"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                My Templates
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
