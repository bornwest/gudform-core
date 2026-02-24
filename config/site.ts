import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "GudForm",
  description:
    "Beautiful forms that feel like a conversation. Build stunning, interactive forms in minutes. The free, open-source Typeform alternative.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/timchosen",
    github: "https://github.com/cavewebs/gudform",
  },
  mailSupport: "support@gudform.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Product",
    items: [
      { title: "Features", href: "/#features" },
      { title: "Docs", href: "/docs" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Getting Started", href: "/docs#getting-started" },
      { title: "API Docs", href: "/docs/api" },
      { title: "Webhooks", href: "/docs/webhooks" },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "GitHub", href: "https://github.com/cavewebs/gudform" },
      { title: "Contact", href: "mailto:support@gudform.com" },
    ],
  },
];
