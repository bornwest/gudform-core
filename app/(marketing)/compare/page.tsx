import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { COMPARISONS } from "@/config/comparisons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata: Metadata = {
  title: "GudForm Alternatives & Comparisons - See How GudForm Compares",
  description:
    "Compare GudForm with Typeform, Jotform, Google Forms, and other form builders. See feature comparisons, pricing, and why teams switch to GudForm.",
};

export default function ComparePage() {
  const comparisons = Object.values(COMPARISONS);

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-green-50/60 to-background py-16 dark:from-green-950/20 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              How GudForm Compares
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              See how GudForm stacks up against other popular form builders.
              Open-source, unlimited submissions, and beautiful conversational
              forms.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Comparison cards */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {comparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group flex flex-col rounded-2xl border p-8 transition-all hover:border-green-300 hover:shadow-lg dark:hover:border-green-500/50"
              >
                <h2 className="text-xl font-bold group-hover:text-green-600 dark:group-hover:text-green-400">
                  GudForm vs {c.competitorName}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {c.competitorTagline}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                  Read comparison
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Ready to see for yourself?
            </p>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-4 bg-green-600 hover:bg-green-700",
              )}
            >
              Try GudForm Free
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
