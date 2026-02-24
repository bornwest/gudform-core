import * as React from "react";
import Link from "next/link";

import { footerLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

import { NewsletterForm } from "../forms/newsletter-form";
import { Icons } from "../shared/icons";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="container grid max-w-6xl grid-cols-2 gap-6 py-14 sm:grid-cols-3 md:grid-cols-7">
        {footerLinks.map((section) => (
          <div key={section.title}>
            <span className="text-sm font-medium text-foreground">
              {section.title}
            </span>
            <ul className="mt-4 list-inside space-y-3">
              {section.items?.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-full flex flex-col items-start sm:col-span-3 md:col-span-2 md:items-end">
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t py-4">
        <div className="container flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Copyright &copy; 2026. All rights reserved.
          </span>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Concepted by{" "}
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Timchosen
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Open source on{" "}
            <Link
              href="https://github.com/cavewebs/gudform"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            <Link
              href="https://buymeacoffee.com/timchosen"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
             Buy me a coffee
            </Link>
          </p>

          <div className="flex items-center gap-3">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              <Icons.gitHub className="size-5" />
            </Link>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
