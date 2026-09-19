import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  X,
} from "lucide-react";

import { COMPARISONS } from "@/config/comparisons";
import { isOssEdition } from "@/config/edition";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface ComparePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(COMPARISONS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) return { title: "Comparison Not Found" };

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      type: "website",
    },
    alternates: {
      canonical: `/compare/${slug}`,
    },
  };
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <Check className="size-4" /> Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400">
        <X className="size-4" /> No
      </span>
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) notFound();

  // Group features by category
  const featureCategories: Record<
    string,
    typeof data.features
  > = {};
  for (const f of data.features) {
    if (!featureCategories[f.category]) {
      featureCategories[f.category] = [];
    }
    featureCategories[f.category].push(f);
  }

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: data.metaTitle,
            description: data.metaDescription,
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: data.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          }),
        }}
      />

      {/* Breadcrumb */}
      <section className="border-b bg-muted/30 py-3">
        <MaxWidthWrapper>
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-foreground">
              {data.heroTitle}
            </span>
          </nav>
        </MaxWidthWrapper>
      </section>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-green-50/60 to-background py-16 dark:from-green-950/20 md:py-24">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {data.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {data.heroDescription}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-green-600 hover:bg-green-700",
                )}
              >
                Try GudForm Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
              {isOssEdition() ? (
                <Link
                  href="/docs/self-hosting"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Self-hosting docs
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  See Pricing
                </Link>
              )}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Introduction */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {data.intro}
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Quick overview: strengths & weaknesses */}
      <section className="border-y bg-muted/20 py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="grid gap-8 md:grid-cols-2">
            {/* GudForm advantages */}
            <div className="rounded-2xl border bg-background p-8">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Check className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Why choose GudForm</h2>
              </div>
              <ul className="mt-6 space-y-3">
                {data.gudformAdvantages.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitor limitations */}
            <div className="rounded-2xl border bg-background p-8">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Minus className="size-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold">
                  {data.competitorName} limitations
                </h2>
              </div>
              <ul className="mt-6 space-y-3">
                {data.competitorWeaknesses.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <X className="mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {data.competitorName} strengths
                </h3>
                <ul className="mt-3 space-y-2">
                  {data.competitorStrengths.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Feature comparison table */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Feature-by-feature comparison
            </h2>
            <p className="mt-3 text-center text-muted-foreground">
              See exactly how GudForm stacks up against{" "}
              {data.competitorName}.
            </p>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-4 pr-8 text-left text-sm font-semibold">
                      Feature
                    </th>
                    <th className="px-4 pb-4 text-center text-sm font-semibold text-green-600 dark:text-green-400">
                      GudForm
                    </th>
                    <th className="pb-4 pl-4 text-center text-sm font-semibold text-muted-foreground">
                      {data.competitorName}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(featureCategories).map(
                    ([category, features]) => (
                      <tbody key={category}>
                        <tr>
                          <td
                            colSpan={3}
                            className="pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            {category}
                          </td>
                        </tr>
                        {features.map((f, i) => (
                          <tr
                            key={i}
                            className="border-b last:border-b-0"
                          >
                            <td className="py-3 pr-8 text-sm">
                              {f.name}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <FeatureCell value={f.gudform} />
                            </td>
                            <td className="py-3 pl-4 text-center text-sm">
                              <FeatureCell value={f.competitor} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Pricing comparison */}
      <section className="border-y bg-muted/20 py-12 md:py-16">
        <MaxWidthWrapper>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Pricing comparison
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            See how much you save with GudForm.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* GudForm pricing */}
            <div className="rounded-2xl border-2 border-green-500 bg-background p-8">
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400">
                GudForm
              </h3>
              <div className="mt-4 space-y-3">
                {data.pricingComparison.gudform.map((plan) => (
                  <div
                    key={plan.plan}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{plan.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.note}
                      </p>
                    </div>
                    <span className="text-sm font-bold">{plan.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor pricing */}
            <div className="rounded-2xl border bg-background p-8">
              <h3 className="text-lg font-bold text-muted-foreground">
                {data.competitorName}
              </h3>
              <div className="mt-4 space-y-3">
                {data.pricingComparison.competitor.map((plan) => (
                  <div
                    key={plan.plan}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{plan.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.note}
                      </p>
                    </div>
                    <span className="text-sm font-bold">{plan.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>

            <div className="mt-10 space-y-6">
              {data.faq.map((item, i) => (
                <div key={i} className="rounded-xl border p-6">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Other comparisons */}
      <section className="border-t bg-muted/20 py-12">
        <MaxWidthWrapper>
          <h2 className="text-center text-xl font-bold">
            Other comparisons
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {Object.values(COMPARISONS)
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className={cn(
                    "rounded-lg border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:border-green-300 hover:bg-green-50 dark:hover:border-green-500/50 dark:hover:bg-green-900/20",
                  )}
                >
                  GudForm vs {c.competitorName}
                </Link>
              ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-r from-green-50 to-teal-50 py-16 dark:from-green-950/20 dark:to-teal-950/20 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {data.ctaTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {data.ctaDescription}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-green-600 hover:bg-green-700",
                )}
              >
                Get Started Free
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                href="/templates"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                )}
              >
                Browse Templates
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
