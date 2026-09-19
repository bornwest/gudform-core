import Link from "next/link";

import { siteConfig } from "@/config/site";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata = {
  title: `Privacy Policy – ${siteConfig.name}`,
  description: `Privacy Policy for ${siteConfig.name} – how we collect, use, and protect your data.`,
};

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </MaxWidthWrapper>
      </section>

      <section className="py-12 md:py-16">
        <MaxWidthWrapper>
          <article className="prose prose-gray mx-auto max-w-3xl dark:prose-invert">
            <p>
              This Privacy Policy describes how {siteConfig.name} ("we," "us," or "our") collects, uses, and
              protects your information when you use our form builder platform.
            </p>

            <h2 id="overview">1. Overview</h2>
            <p>
              {siteConfig.name} is a form builder that lets you create forms, collect responses, and integrate
              with your tools. We process data in two capacities: (1) as a controller for account and platform
              data, and (2) as a processor for form response data that you collect from your respondents.
            </p>

            <h2 id="data-we-collect">2. Data We Collect</h2>

            <h3>Account and Platform Data</h3>
            <p>When you sign up and use {siteConfig.name}, we collect:</p>
            <ul>
              <li>
                <strong>Account information</strong> — Name, email address, and (if you use email/password
                auth) a hashed password. If you sign up with OAuth (e.g., Google), we receive your email and
                name from the provider
              </li>
              <li>
                <strong>Billing information</strong> — For paid plans, Stripe processes payment details. We store
                Stripe customer and subscription IDs, but not full card numbers
              </li>
              <li>
                <strong>API keys</strong> — If you create API keys, we store hashed keys and metadata (e.g.,
                name, last used)
              </li>
              <li>
                <strong>Integration configuration</strong> — OAuth tokens, webhook URLs, and config for
                integrations you install (e.g., Google Sheets, Slack)
              </li>
              <li>
                <strong>Usage data</strong> — Form and response counts, feature usage, and basic analytics to
                operate and improve the Service
              </li>
              <li>
                <strong>Support communications</strong> — Emails and messages you send when contacting support
              </li>
            </ul>

            <h3>Form Response Data (Data You Collect)</h3>
            <p>
              When respondents submit your forms, we process that data on your behalf. This may include:
            </p>
            <ul>
              <li>Answers to form questions (text, choices, ratings, dates, etc.)</li>
              <li>File uploads (e.g., images, PDFs) stored securely</li>
              <li>
                <strong>Technical metadata</strong> — IP address, user agent, referrer (optional, used for
                analytics and fraud prevention)
              </li>
              <li>
                <strong>Payment data</strong> — If you collect payments via forms, Stripe processes the payment;
                we do not store full card details
              </li>
            </ul>
            <p>
              You are the data controller for form response data. We act as your processor and store/process it
              according to your instructions (e.g., delivery via webhooks, integrations).
            </p>

            <h2 id="how-we-use">3. How We Use Your Data</h2>
            <ul>
              <li>Provide, operate, and maintain the Service</li>
              <li>Process billing and subscriptions</li>
              <li>Deliver form responses to you (dashboard, exports, webhooks, integrations)</li>
              <li>Send transactional emails (e.g., magic links, receipts, notifications)</li>
              <li>Support your account and respond to inquiries</li>
              <li>Improve the Service and develop new features</li>
              <li>Detect and prevent abuse, fraud, and security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 id="third-parties">4. Third-Party Services</h2>
            <p>We use the following categories of third-party services:</p>
            <ul>
              <li>
                <strong>Hosting and database</strong> — Your data is stored on cloud infrastructure (e.g.,
                PostgreSQL/Neon, file storage)
              </li>
              <li>
                <strong>Authentication</strong> — OAuth providers (e.g., Google) for sign-in; we receive limited
                profile data
              </li>
              <li>
                <strong>Email</strong> — Resend (or similar) for transactional emails (magic links,
                notifications, auto-responders)
              </li>
              <li>
                <strong>Payments</strong> — Stripe for subscriptions and form payment collection; Stripe's
                privacy policy applies to payment data
              </li>
              <li>
                <strong>Analytics</strong> — Plausible Analytics (page analytics), Microsoft Clarity
                (session recordings and heatmaps), and Vercel Analytics (web vitals) to understand
                usage and improve the product
              </li>
            </ul>
            <p>
              Integrations you install (e.g., Google Sheets, Slack) may receive form response data according to
              your configuration. Their privacy policies apply to that processing.
            </p>

            <h2 id="data-retention">5. Data Retention</h2>
            <ul>
              <li>
                <strong>Account data</strong> — Retained while your account is active; deleted or anonymized
                after termination, subject to legal hold requirements
              </li>
              <li>
                <strong>Form response data</strong> — Retained until you delete it or close your account; you
                can export data before deleting
              </li>
              <li>
                <strong>Backups and logs</strong> — May be retained for a limited period for security and
                recovery
              </li>
            </ul>

            <h2 id="security">6. Security</h2>
            <p>
              We use industry-standard measures to protect your data, including encryption in transit (TLS) and
              at rest, access controls, and secure authentication. API keys are hashed. We do not use
              cookie-tracking for advertising.
            </p>

            <h2 id="your-rights">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> — Request a copy of your personal data</li>
              <li><strong>Rectification</strong> — Correct inaccurate data</li>
              <li><strong>Erasure</strong> — Request deletion of your personal data</li>
              <li><strong>Portability</strong> — Receive your data in a structured format</li>
              <li><strong>Object or restrict processing</strong> — In certain circumstances</li>
              <li><strong>Withdraw consent</strong> — Where processing is based on consent</li>
            </ul>
            <p>
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${siteConfig.mailSupport}`} className="underline underline-offset-4">
                {siteConfig.mailSupport}
              </a>
              . You may also delete your account from your account settings. If you are in the EEA/UK, you
              have the right to lodge a complaint with your supervisory authority.
            </p>

            <h2 id="data-controller">8. Data Controller Responsibilities (Form Creators)</h2>
            <p>
              When you collect data through forms, you are the data controller. You must:
            </p>
            <ul>
              <li>Provide a privacy notice to respondents explaining what you collect and why</li>
              <li>Obtain necessary consent or rely on a lawful basis (e.g., legitimate interest)</li>
              <li>Handle data subject requests (access, deletion, etc.) for your form responses</li>
              <li>Comply with applicable laws (GDPR, CCPA, etc.)</li>
            </ul>
            <p>
              We provide tools (e.g., data export, deletion) to help you fulfill these obligations.
            </p>

            <h2 id="cookies">9. Cookies and Similar Technologies</h2>

            <h3>Essential Cookies</h3>
            <p>
              These are always active and are required for the Service to function. They include
              authentication session cookies, CSRF tokens, security cookies, and the cookie consent
              preference itself.
            </p>

            <h3>Analytics Cookies (Opt-in)</h3>
            <p>
              These are only activated after you provide consent via the cookie banner:
            </p>
            <ul>
              <li>
                <strong>Plausible Analytics</strong> — Privacy-friendly page view analytics to
                understand which pages are visited and general usage trends. Does not collect personal
                data.
              </li>
              <li>
                <strong>Microsoft Clarity</strong> — Session recordings and heatmaps to understand how
                users interact with pages and improve UX. May set cookies for session identification.
              </li>
              <li>
                <strong>Vercel Analytics</strong> — Lightweight performance and web vitals analytics.
                Privacy-friendly and does not use cookies.
              </li>
            </ul>

            <h3>How to Manage Cookies</h3>
            <p>
              On your first visit a cookie consent banner lets you choose "Accept All" or "Essential
              Only." You can clear the <code>cookie_consent</code> cookie from your browser at any
              time to reset your choice. We do not use advertising or marketing cookies and never sell
              data to advertisers.
            </p>

            <h2 id="international">10. International Transfers</h2>
            <p>
              Your data may be processed in regions outside your country. We use appropriate safeguards (e.g.,
              Standard Contractual Clauses) for transfers from the EEA/UK where required.
            </p>

            <h2 id="children">11. Children</h2>
            <p>
              The Service is not intended for users under 16. We do not knowingly collect data from children.
              If you believe we have collected data from a child, contact us and we will delete it.
            </p>

            <h2 id="changes">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              email or through the Service. The "Last updated" date at the top reflects the most recent
              version.
            </p>

            <h2 id="contact">13. Contact</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at{" "}
              <a href={`mailto:${siteConfig.mailSupport}`} className="underline underline-offset-4">
                {siteConfig.mailSupport}
              </a>
              .
            </p>

            <hr className="my-10" />

            <p className="text-sm text-muted-foreground">
              <Link href="/" className="underline underline-offset-4">
                ← Back to {siteConfig.name}
              </Link>
            </p>
          </article>
        </MaxWidthWrapper>
      </section>
    </>
  );
}
