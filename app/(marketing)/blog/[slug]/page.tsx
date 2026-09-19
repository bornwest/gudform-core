import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBlogPost, getBlogPosts } from "@/lib/content";
import { constructMetadata, formatDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/shared/markdown-content";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return constructMetadata({
    title: `${post.title} - GudForm Blog`,
    description: post.description,
    canonical: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <>
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Blog
            </Link>
            <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-muted-foreground">
              <time className="text-sm">{formatDate(post.date)}</time>
              {post.author && (
                <>
                  <span className="text-sm">•</span>
                  <span className="text-sm">By {post.author}</span>
                </>
              )}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <article className="prose prose-gray mx-auto max-w-3xl dark:prose-invert">
            <MarkdownContent content={post.content} />
          </article>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
