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
    github: "https://github.com/gudlab/gudform-core",
  },
  mailSupport: "support@gudform.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Product",
    items: [
      { title: "Features", href: "/#features" },
      { title: "Pricing", href: "/pricing", saasOnly: true },
      { title: "Templates", href: "/templates" },
      { title: "Integrations", href: "/integrations", saasOnly: true },
      { title: "Developer Docs", href: "/docs" },
      { title: "Free Plan", href: "/free-pricing", saasOnly: true },
    ],
  },
  {
    title: "Integrations",
    saasOnly: true,
    items: [
      { title: "Google Sheets", href: "/integrations/google-sheets" },
      { title: "Google Drive", href: "/integrations/google-drive-storage" },
      { title: "Slack", href: "/integrations/slack" },
      { title: "HubSpot", href: "/integrations/hubspot" },
      { title: "Mailchimp", href: "/integrations/mailchimp" },
      { title: "Zapier", href: "/integrations/zapier" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Getting Started", href: "/docs#getting-started" },
      { title: "API Docs", href: "/docs/api" },
      { title: "MCP", href: "/docs/mcp" },
      { title: "Webhooks", href: "/docs/webhooks" },
      { title: "Integrations Guide", href: "/docs/integrations", saasOnly: true },
      { title: "Blog", href: "/blog" },
      { title: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Compare",
    items: [
      { title: "GudForm vs Typeform", href: "/compare/typeform" },
      { title: "GudForm vs Jotform", href: "/compare/jotform" },
      { title: "GudForm vs Google Forms", href: "/compare/google-forms" },
      { title: "All Comparisons", href: "/compare" },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "GitHub", href: siteConfig.links.github },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
      { title: "Trust", href: "/trust" },
      { title: "Contact", href: "mailto:support@gudform.com" },
    ],
  },
];
