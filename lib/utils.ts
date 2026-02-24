import { Metadata } from "next";
import { clsx, type ClassValue } from "clsx";
import ms from "ms";
import { twMerge } from "tailwind-merge";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.svg",
  noIndex = false,
  keywords: pageKeywords = [],
  canonical,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  /** Additional page-specific keywords merged with the base set. */
  keywords?: string[];
  /** Canonical URL path (e.g. "/integrations/slack"). Prepended with metadataBase. */
  canonical?: string;
} = {}): Metadata {
  const keywords = [
    "forms",
    "typeform alternative",
    "form builder",
    "survey",
    "GudForm",
    "interactive forms",
    "conversational forms",
    ...pageKeywords,
  ];

  return {
    title,
    description,
    keywords,
    authors: [{ name: "GudForm" }],
    creator: "GudForm",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical ?? siteConfig.url,
      title,
      description,
      siteName: "GudForm",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@gudformapp",
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    ...(canonical && {
      alternates: { canonical },
    }),
    ...(noIndex && {
      robots: { index: false, follow: false },
    }),
  };
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return "never";
  return `${ms(Date.now() - new Date(timestamp).getTime())}${timeOnly ? "" : " ago"
    }`;
};

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const json = await res.json();
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number;
      };
      error.status = res.status;
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }

  return res.json();
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Returns "white" or "black" depending on which contrasts better against the
 * given hex colour.  Uses the W3C relative luminance formula.
 *
 * The threshold is set slightly above the mathematical crossover (0.179) to
 * compensate for the perceptual darkness of blue/purple hues — human vision
 * has fewer S-cones so green/teal appear darker than their computed
 * luminance suggests.  0.22 keeps green (#22c55e) and teal (#14b8a6) on
 * the "white text" side without mis-classifying lighter colours like rose.
 */
export function contrastColor(hex: string): "white" | "black" {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const luminance =
    0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
    0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
    0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4);
  return luminance > 0.22 ? "black" : "white";
}
