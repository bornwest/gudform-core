import Link from "next/link";

import { siteConfig } from "@/config/site";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export const metadata = {
  title: `Terms of Service – ${siteConfig.name}`,
  description: `Terms of Service for ${siteConfig.name} – form builder, subscriptions, payments, and acceptable use.`,
};

export default function TermsPage() {
  return (
    <>
      <section className="border-b bg-muted/20 py-16 md:py-20">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Terms of Service
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
              Welcome to {siteConfig.name}. By using our form builder platform, you agree to these Terms of Service.
              Please read them carefully.
            </p>

            <h2 id="acceptance">1. Acceptance of Terms</h2>
            <p>
              By creating an account, building forms, collecting responses, or otherwise using {siteConfig.name}
              ("Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service. If you
              use the Service on behalf of an organization, you represent that you have authority to bind that
              organization.
            </p>

            <h2 id="description">2. Description of Service</h2>
            <p>
              {siteConfig.name} is a form builder platform that provides:
            </p>
            <ul>
              <li>
                <strong>Form creation and building</strong> — Drag-and-drop builder, multiple question types, welcome
                and thank-you screens, conditional logic (branching and skip logic), and custom themes
              </li>
              <li>
                <strong>Response collection</strong> — Conversational, one-question-at-a-time forms; response storage;
                analytics and export
              </li>
              <li>
                <strong>Collections and organization</strong> — Organize forms into collections
              </li>
              <li>
                <strong>Team collaboration</strong> — Share access via teams with roles (Owner, Admin, Member)
              </li>
              <li>
                <strong>Integrations</strong> — Webhooks, REST API, API keys, and integrations marketplace (e.g.,
                Google Sheets, Slack, Mailchimp, HubSpot, Zapier)
              </li>
              <li>
                <strong>Payment collection</strong> — Stripe Connect for collecting payments via forms (Pro and
                Business plans)
              </li>
              <li>
                <strong>Embedding</strong> — Embed forms on your website or share via direct link
              </li>
              <li>
                <strong>Auto-responder emails</strong> — Send confirmation emails to respondents (Business plan)
              </li>
            </ul>

            <h2 id="accounts">3. Accounts and Registration</h2>
            <p>
              You must create an account to use the Service. You may sign up with email (including magic link) or
              OAuth (e.g., Google). You are responsible for maintaining the security of your account credentials.
              You must provide accurate information and notify us of any unauthorized access.
            </p>

            <h2 id="subscriptions">4. Subscriptions and Payments</h2>
            <p>
              We offer Free, Starter, Pro, and Business plans. Subscriptions are billed monthly via Stripe. By
              upgrading, you authorize us to charge your payment method. Fees are non-refundable except where
              required by law or as stated in our refund policy. We may change pricing with at least 30 days'
              notice; continued use after changes constitutes acceptance.
            </p>

            <h2 id="acceptable-use">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable law or regulation</li>
              <li>Collect personal data without proper consent or in violation of privacy laws</li>
              <li>Send spam, phishing, or misleading content</li>
              <li>Harass, abuse, or discriminate against others</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Circumvent security, rate limits, or usage restrictions</li>
              <li>Resell or sublicense the Service without our written consent</li>
              <li>Use the Service for illegal or fraudulent purposes</li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these terms. You are responsible for the content
              of your forms and the data you collect.
            </p>

            <h2 id="data-and-responsibility">6. Your Data and Responsibilities</h2>
            <p>
              You retain ownership of your form content and response data. You are responsible for ensuring you
              have the legal right to collect data and that your use complies with applicable laws (including
              GDPR, CCPA, and other privacy regulations). We act as a data processor for the data you collect
              through forms; you are the data controller.
            </p>

            <h2 id="intellectual-property">7. Intellectual Property</h2>
            <p>
              We grant you a limited, non-exclusive license to use the Service as intended. We retain all rights
              to the {siteConfig.name} platform, branding, and technology. You may not copy, modify, or create
              derivative works of our software or branding without permission. {siteConfig.name} is open source;
              certain components may be subject to their respective licenses.
            </p>

            <h2 id="third-parties">8. Third-Party Services</h2>
            <p>
              The Service integrates with Stripe (payments), Resend (email), OAuth providers,
              analytics tools (Plausible Analytics, Microsoft Clarity, Vercel Analytics), and
              third-party integrations. Your use of those services is subject to their respective
              terms and privacy policies. We are not responsible for third-party services.
            </p>

            <h2 id="api-and-webhooks">9. API and Webhooks</h2>
            <p>
              Starter, Pro and Business plans include access to the REST API and webhooks. You must use API keys securely
              and not share them. You agree to comply with our rate limits and API documentation. Webhook
              signatures must be verified for security.
            </p>

            <h2 id="termination">10. Termination</h2>
            <p>
              You may cancel your account at any time. We may suspend or terminate access for violation of these
              terms, non-payment, or at our discretion. Upon termination, we may delete your data after a
              reasonable retention period. You may export your data before terminating.
            </p>

            <h2 id="disclaimers">11. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, EXPRESS OR
              IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. WE DO NOT GUARANTEE
              UNINTERRUPTED, ERROR-FREE, OR SECURE OPERATION.
            </p>

            <h2 id="limitation">12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR
              GOODWILL. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS
              PRECEDING THE CLAIM (OR $100 IF YOU PAID NOTHING).
            </p>

            <h2 id="indemnification">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from
              your use of the Service, your forms, your data collection, or your violation of these terms.
            </p>

            <h2 id="changes">14. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or
              through the Service. Your continued use after the effective date constitutes acceptance. If you
              do not agree, you must stop using the Service.
            </p>

            <h2 id="governing-law">15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which we operate, without regard to
              conflict of law principles. Any disputes shall be resolved in the courts of that jurisdiction.
            </p>

            <h2 id="analytics">17. Analytics and Cookies</h2>
            <p>
              We use analytics tools (Plausible Analytics, Microsoft Clarity, Vercel Analytics) to
              understand usage patterns and improve the Service. Non-essential analytics cookies are
              only activated after you provide consent via the cookie banner. You may withdraw consent
              at any time by clearing your cookies or adjusting your browser settings. See our{" "}
              <Link href="/privacy#cookies" className="underline underline-offset-4">
                Privacy Policy
              </Link>{" "}
              for full details on cookies and analytics.
            </p>

            <h2 id="contact">18. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
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
