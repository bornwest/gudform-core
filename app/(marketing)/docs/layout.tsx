import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { isOssEdition } from "@/config/edition";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface DocsLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs", title: "Introduction" },
      { href: "/docs/self-hosting", title: "Self-hosting" },
      { href: "/docs/api", title: "API Overview" },
      { href: "/docs/mcp", title: "MCP" },
    ],
  },
  {
    title: "REST API",
    items: [
      { href: "/docs/api#authentication", title: "Authentication" },
      { href: "/docs/api#forms", title: "Forms" },
      { href: "/docs/api#responses", title: "Responses" },
      { href: "/docs/api#errors", title: "Error Handling" },
      { href: "/docs/api#rate-limits", title: "Rate Limits" },
      { href: "/docs/mcp", title: "MCP Server" },
    ],
  },
  {
    title: "Webhooks",
    items: [
      { href: "/docs/webhooks", title: "Overview" },
      { href: "/docs/webhooks#events", title: "Events" },
      { href: "/docs/webhooks#security", title: "Verifying Signatures" },
      { href: "/docs/webhooks#retries", title: "Retry Policy" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { href: "/docs/integrations", title: "Marketplace" },
      { href: "/docs/integrations#building", title: "Building Integrations" },
      { href: "/docs/integrations#publishing", title: "Publishing" },
      { href: "/docs/integrations#oauth", title: "OAuth Flow" },
    ],
  },
];

export default function DocsLayout({ children }: DocsLayoutProps) {
  const links = isOssEdition()
    ? sidebarLinks.filter((section) => section.title !== "Integrations")
    : sidebarLinks;
  return (
    <MaxWidthWrapper className="py-10 md:py-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:w-64 lg:overflow-y-auto">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <nav className="space-y-6">
            {links.map((section) => (
              <div key={section.title}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </MaxWidthWrapper>
  );
}
