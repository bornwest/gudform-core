import Link from "next/link";

import { siteConfig } from "@/config/site";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata = {
  title: `Trust – ${siteConfig.name}`,
  description:
    "Where GudForm Cloud runs and which subprocessors process hosted data. This is not a DPA.",
};

const SUBPROCESSORS = [
  {
    name: "Vercel",
    use: "Application hosting and edge delivery",
    url: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Neon",
    use: "Postgres database for accounts, forms, and responses",
    url: "https://neon.tech/privacy-policy",
  },
  {
    name: "Stripe",
    use: "Billing for paid Cloud plans and optional form payments",
    url: "https://stripe.com/privacy",
  },
  {
    name: "Resend",
    use: "Transactional email (invites, notifications, auto-responders)",
    url: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Cloudflare",
    use: "Optional Turnstile bot checks and R2 object storage for uploads",
    url: "https://www.cloudflare.com/privacypolicy/",
  },
];

export default function TrustPage() {
  return (
    <>
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Trust
            </h1>
            <p className="mt-3 text-muted-foreground">
              Factual hosting details for GudForm Cloud. This page is not a
              Data Processing Agreement.
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <article className="prose prose-gray mx-auto max-w-3xl dark:prose-invert">
            <p>
              Self-hosted GudForm stores data in the Postgres and object storage
              you run. The table below applies to the hosted product at{" "}
              {siteConfig.url}.
            </p>
            <h2>Subprocessors</h2>
            <ul>
              {SUBPROCESSORS.map((item) => (
                <li key={item.name}>
                  <strong>{item.name}</strong> — {item.use}.{" "}
                  <Link href={item.url}>{item.name} privacy policy</Link>
                </li>
              ))}
            </ul>
            <h2>What this is not</h2>
            <p>
              We have not published a signed DPA or SOC 2 report here. If you
              need a DPA, email{" "}
              <a href={`mailto:${siteConfig.mailSupport}`}>
                {siteConfig.mailSupport}
              </a>
              .
            </p>
            <p>
              Related: <Link href="/privacy">Privacy Policy</Link> and{" "}
              <Link href="/terms">Terms</Link>.
            </p>
          </article>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
