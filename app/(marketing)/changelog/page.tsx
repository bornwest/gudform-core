import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getChangelogEntries } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/shared/markdown-content";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata: Metadata = {
  title: "Changelog - GudForm",
  description:
    "See what's new in GudForm: product updates, new features, and improvements.",
};

export default function ChangelogPage() {
  const entries = getChangelogEntries();

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Changelog
            </h1>
            <p className="mt-3 text-muted-foreground">
              New features, improvements, and updates to GudForm.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Changelog entries */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl space-y-12">
            {entries.map((entry) => (
              <article
                key={entry.slug}
                className="rounded-2xl border p-8 transition-colors hover:border-green-300 dark:hover:border-green-500/50"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {entry.version && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      {entry.version}
                    </Badge>
                  )}
                  <time className="text-sm text-muted-foreground">
                    {formatDate(entry.date)}
                  </time>
                </div>
                <h2 className="mt-4 text-2xl font-bold">{entry.title}</h2>
                <div className="prose prose-gray mt-4 max-w-none dark:prose-invert prose-headings:text-base prose-headings:font-semibold prose-p:text-sm prose-ul:text-sm">
                  <MarkdownContent content={entry.content} />
                </div>
              </article>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
