import { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { isOssEdition } from "@/config/edition";
import { siteConfig } from "@/config/site";
import { saasPrisma } from "@/lib/saas-prisma";
import { getBlogPosts, getChangelogEntries } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const oss = isOssEdition();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs/api`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/mcp`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/openapi.yaml`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/trust`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare/typeform`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare/jotform`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare/google-forms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  if (!oss) {
    staticPages.push(
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/integrations`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/docs/integrations`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/free-pricing`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      },
    );
  }

  let integrationPages: MetadataRoute.Sitemap = [];
  let templatePages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];
  let changelogPages: MetadataRoute.Sitemap = [];

  // Blog and changelog content (always available)
  try {
    const blogPosts = getBlogPosts().filter((post) => post.published);
    blogPages = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const changelogEntries = getChangelogEntries();
    changelogPages = changelogEntries.map((entry) => ({
      url: `${baseUrl}/changelog#${entry.slug}`,
      lastModified: new Date(entry.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    // Content files may be unavailable
  }

  // Database-driven pages (may be unavailable at build time)
  try {
    if (!oss) {
      const integrations = await saasPrisma().integration.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      });
      integrationPages = integrations.map((i) => ({
        url: `${baseUrl}/integrations/${i.slug}`,
        lastModified: i.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }

    const templates = await prisma.formTemplate.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    templatePages = templates.map((t) => ({
      url: `${baseUrl}/templates/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // Database may be unavailable at build time (Docker/CI).
  }

  return [...staticPages, ...integrationPages, ...templatePages, ...blogPages, ...changelogPages];
}
