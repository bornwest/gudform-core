import { MetadataRoute } from "next";

import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/docs/", "/llms.txt", "/openapi.yaml"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/f/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
