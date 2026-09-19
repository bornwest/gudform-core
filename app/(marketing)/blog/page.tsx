import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata: Metadata = {
  title: "Blog - GudForm",
  description:
    "Learn about conversational forms, AI agent integration, self-hosting, and building better user experiences with GudForm.",
};

export default function BlogPage() {
  const posts = getBlogPosts().filter((post) => post.published);

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-green-50/60 to-background py-16 dark:from-green-950/20 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Blog
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Guides, insights, and updates about building better forms with
              GudForm.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* Blog posts */}
      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border p-8 transition-all hover:border-green-300 hover:shadow-lg dark:hover:border-green-500/50"
              >
                <time className="text-sm text-muted-foreground">
                  {formatDate(post.date)}
                </time>
                <h2 className="mt-3 text-xl font-bold group-hover:text-green-600 dark:group-hover:text-green-400">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
                {post.author && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    By {post.author}
                  </p>
                )}
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                  Read article
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
