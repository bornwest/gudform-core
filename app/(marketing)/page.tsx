import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BotMessageSquare,
  CheckCircle2,
  Code2,
  GitBranch,
  GripVertical,
  Layers3,
  MessageSquare,
  Paintbrush,
  Plug2,
  Sparkles,
  Timer,
  Users2,
  Webhook,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn, constructMetadata } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AgentCollabMockup } from "@/components/agent-collab-mockup";
import { DemoFormMockup } from "@/components/demo-form-mockup";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

// ---------------------------------------------------------------------------
// Page data
// ---------------------------------------------------------------------------

const features = [
  {
    icon: MessageSquare,
    title: "Conversational UX",
    description: "One question at a time, like a real conversation",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop Builder",
    description: "Build forms visually, no coding required",
  },
  {
    icon: GitBranch,
    title: "Conditional logic",
    description:
      "Branch and skip questions based on answers. Personalized for every respondent",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    description:
      "See responses as they come in. Understand your audience instantly",
  },
  {
    icon: Paintbrush,
    title: "Custom Branding",
    description: "Match your brand colors and style",
  },
  {
    icon: Code2,
    title: "Integrations & embed",
    description:
      "Webhooks, API, marketplace. Embed in any site. Connect your stack",
  },
];

const workflowSteps = [
  {
    step: "Step 1",
    title: "Build in minutes",
    description:
      "Start from scratch or duplicate a proven template, then shape your flow with drag-and-drop.",
    icon: Layers3,
  },
  {
    step: "Step 2",
    title: "Personalize each path",
    description:
      "Use conditional logic to ask only relevant questions, increasing completion and response quality.",
    icon: GitBranch,
  },
  {
    step: "Step 3",
    title: "Act on every response",
    description:
      "Send data to your stack instantly through webhooks, API, and integrations so teams can move faster.",
    icon: Timer,
  },
];

const openSourcePillars = [
  {
    title: "Transparent by default",
    description:
      "Review the product code, audit behavior, and understand exactly how responses are handled.",
  },
  {
    title: "Community-powered",
    description:
      "Contribute improvements, ship fixes faster, and shape the roadmap in public.",
  },
  {
    title: "Your stack, your rules",
    description:
      "Use GudForm as-is or adapt it to your internal workflows when your team needs custom control.",
  },
];

const useCases = [
  {
    title: "Lead qualification",
    description:
      "Route high-intent prospects automatically and collect everything your sales team needs in one pass.",
    points: [
      "Conditional follow-up questions",
      "CRM-ready response payloads",
      "Auto-notify your team in real time",
    ],
  },
  {
    title: "Customer research",
    description:
      "Capture rich qualitative feedback with less drop-off than traditional long-form surveys.",
    points: [
      "Conversational, one-question UI",
      "Device-friendly completion flows",
      "Response trends and analytics",
    ],
  },
  {
    title: "Internal operations",
    description:
      "Standardize requests, approvals, and team intake workflows with branded forms anyone can use.",
    points: [
      "Reusable form collections",
      "Team-level access controls",
      "Payments and integrations when needed",
    ],
  },
];

const valueProps = [
  {
    icon: Users2,
    title: "Team-ready",
    description: "Shared collections and access controls for collaboration.",
  },
  {
    icon: Code2,
    title: "Developer-friendly",
    description: "Integrate via API, webhooks, and embeddable forms.",
  },
  {
    icon: BarChart3,
    title: "Insight-first",
    description: "Track responses and completion trends in real time.",
  },
  {
    icon: Paintbrush,
    title: "Brand aligned",
    description: "Match your visual identity with custom themes and styling.",
  },
];

const agentCapabilities = [
  {
    icon: BotMessageSquare,
    label: "MCP Server",
    description:
      "AI agents discover, read, and submit forms natively via the Model Context Protocol.",
  },
  {
    icon: Code2,
    label: "REST API",
    description:
      "Full programmatic access for any AI framework, automation tool, or custom integration.",
  },
  {
    icon: Webhook,
    label: "Webhooks",
    description:
      "Push every response to agents in real time. Trigger downstream workflows instantly.",
  },
  {
    icon: Plug2,
    label: "Structured data",
    description:
      "Every answer is typed, validated, and ready for AI processing — no parsing required.",
  },
];

// ---------------------------------------------------------------------------
// Metadata  (default = agent hero)
// ---------------------------------------------------------------------------

export const metadata = constructMetadata({
  title: `${siteConfig.name} – Forms for humans and AI agents`,
  description:
    "GudForm is the form layer for the agentic web. AI agents and humans collaborate through the same form via MCP, REST API, and webhooks. Beautiful conversational UI. Structured data out.",
  keywords: [
    "AI agent forms",
    "MCP form server",
    "agentic forms",
    "form API",
    "form webhooks",
  ],
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const isTypeformVariant = v === "typeform";

  return (
    <>
      {/* ================================================================
          HERO — agent (default) or typeform variant (?v=typeform)
          ================================================================ */}

      {isTypeformVariant ? (
        /* ── Typeform variant hero ────────────────────────────────────── */
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <div className="size-[600px] rounded-full bg-gradient-to-br from-green-400/20 via-teal-400/20 to-emerald-400/20 blur-3xl" />
            </div>
            <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3">
              <div className="size-[400px] rounded-full bg-gradient-to-tl from-green-400/10 via-teal-400/10 to-transparent blur-3xl" />
            </div>
          </div>

          <MaxWidthWrapper className="pb-16 pt-24 md:pb-24 md:pt-36">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
                <Sparkles className="size-4 text-green-500" />
                <span>The free, open-source Typeform alternative</span>
              </div>

              <h1 className="animate-fade-up text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Beautiful forms that feel <br className="hidden sm:inline" />
                like a{" "}
                <span className="text-gradient_green-teal">conversation</span>
              </h1>

              <p className="mt-6 max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground [animation-delay:100ms] md:text-xl">
                Build conversational forms that feel like a real chat, convert
                at higher rates, and plug directly into your workflows.
              </p>
              <p className="mt-3 max-w-2xl animate-fade-up text-sm text-muted-foreground [animation-delay:150ms] md:text-base">
                Free to start. Open source from day one.
              </p>

              <div className="mt-10 flex animate-fade-up flex-col gap-4 [animation-delay:200ms] sm:flex-row">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg", rounded: "full" }),
                    "bg-gradient-to-r from-green-500 to-teal-600 px-8 text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30",
                  )}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({
                      size: "lg",
                      variant: "outline",
                      rounded: "full",
                    }),
                    "px-8",
                  )}
                >
                  Compare Plans
                </Link>
              </div>

              <div className="mt-16 w-full max-w-3xl animate-fade-up [animation-delay:400ms]">
                <DemoFormMockup />
              </div>
            </div>
          </MaxWidthWrapper>
        </section>
      ) : (
        /* ── Agent hero (default) ─────────────────────────────────────── */
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4">
              <div className="size-[700px] rounded-full bg-gradient-to-br from-green-400/15 via-teal-400/15 to-violet-400/10 blur-3xl" />
            </div>
            <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/4">
              <div className="size-[400px] rounded-full bg-gradient-to-tr from-teal-400/10 via-green-400/10 to-transparent blur-3xl" />
            </div>
          </div>

          <MaxWidthWrapper className="pb-16 pt-24 md:pb-24 md:pt-36">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  </span>
                  Open Source · AI-native · MCP · REST API · Webhooks
                </span>
              </div>

              {/* Headline — max-width on xl+ so text wraps to 3 lines */}
              <h1 className="mx-auto max-w-full animate-fade-up text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-3xl">
                Forms for humans{" "}
                <span className="relative whitespace-nowrap">
                  <span className="text-gradient_green-teal">
                    and AI agents
                  </span>
                </span>
                , <br className="hidden sm:inline" />
                working together
              </h1>

              {/* Subheadline */}
              <p className="mt-6 max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground [animation-delay:100ms] md:text-xl">
                Forms were designed before agents existed. GudForm is what
                they'd look like if you built them today. Conversational for
                humans. MCP, REST API, and webhooks for AI.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex animate-fade-up flex-col gap-4 [animation-delay:200ms] sm:flex-row">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg", rounded: "full" }),
                    "bg-gradient-to-r from-green-500 to-teal-600 px-8 text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30",
                  )}
                >
                  Start Building Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
                <Link
                  href="/docs/api"
                  className={cn(
                    buttonVariants({
                      size: "lg",
                      variant: "outline",
                      rounded: "full",
                    }),
                    "px-8",
                  )}
                >
                  Read the Docs
                </Link>
              </div>

              {/* Mockup */}
              <div className="mt-16 flex w-full animate-fade-up justify-center [animation-delay:400ms]">
                <AgentCollabMockup />
              </div>
            </div>
          </MaxWidthWrapper>
        </section>
      )}

      {/* ================================================================
          Agent capabilities strip  (only on agent hero variant)
          ================================================================ */}
      {!isTypeformVariant && (
        <section className="border-t bg-muted/20 py-16 md:py-20">
          <MaxWidthWrapper>
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-gradient_green-teal mb-3 font-semibold">
                Native AI Infrastructure
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Every connection an AI agent needs
              </h2>
              <p className="mt-3 text-muted-foreground">
                GudForm exposes your forms as first-class resources — readable,
                submittable, and observable by any agent or automation.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {agentCapabilities.map((cap) => (
                <div
                  key={cap.label}
                  className="rounded-xl border bg-background p-6 shadow-sm"
                >
                  <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 p-3">
                    <cap.icon className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">{cap.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Human + Agent collaboration callout */}
            <div className="mt-12 overflow-hidden rounded-2xl border bg-gradient-to-r from-green-500/5 via-teal-500/5 to-violet-500/5 p-8">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h3 className="text-xl font-bold">
                    Humans and agents, in the same loop
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    An AI agent can pre-fill a form, flag missing fields, and
                    route the response — while a human reviews and approves
                    through the same conversational interface. No extra
                    infrastructure needed.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "Agent discovers forms via MCP tool listing",
                      "Agent reads the schema, validates its data, then submits",
                      "Humans receive a beautiful conversational form experience",
                      "Both paths deliver the same typed, validated response object",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-muted-foreground">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-background p-6 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full border-2 border-violet-500/30 bg-violet-500/10">
                        <BotMessageSquare className="size-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        AI Agent
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-green-600 dark:text-green-400">
                      <span className="text-lg">↔</span>
                      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold">
                        GudForm
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
                        <Users2 className="size-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Human
                      </span>
                    </div>
                  </div>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    The same form works for both. GudForm handles routing,
                    validation, and delivery — you just build the form.
                  </p>
                </div>
              </div>
            </div>
          </MaxWidthWrapper>
        </section>
      )}

      {/* ================================================================
          Features
          ================================================================ */}
      <section id="features" className="border-t bg-muted/30 py-20 md:py-28">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-gradient_green-teal mb-4 font-semibold">
              Features
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to build great forms
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features that make creating and managing forms a breeze
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-background p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 p-3">
                  <feature.icon className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* ================================================================
          Workflow
          ================================================================ */}
      <section className="border-t py-20 md:py-28">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-gradient_green-teal mb-4 font-semibold">
              How It Works
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              From idea to actionable data in three steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A focused builder experience for teams that need responses quickly
              and cleanly.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border bg-background p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {step.step}
                  </span>
                  <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 p-2.5">
                    <step.icon className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      {/* ================================================================
          Open Source
          ================================================================ */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-gradient_green-teal mb-4 font-semibold">
              Open Source
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Open-source foundation, product-grade experience
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Inspired by the transparency-first model you see in products like
              Cal.com, GudForm is built in public and ready for community
              contribution.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {openSourcePillars.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border bg-background p-7 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ rounded: "full", size: "lg" }),
                "gap-2 px-8",
              )}
            >
              <Icons.gitHub className="size-4" />
              View on GitHub
            </Link>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* ================================================================
          Use Cases
          ================================================================ */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <MaxWidthWrapper>
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-gradient_green-teal mb-4 font-semibold">
              Built For Real Teams
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Use GudForm across the entire customer journey
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One platform for lead capture, feedback loops, and internal ops.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-2xl border bg-background p-7 shadow-sm"
              >
                <h3 className="text-xl font-semibold">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {useCase.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {useCase.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-muted-foreground">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  rounded: "full",
                  size: "lg",
                }),
                "px-8",
              )}
            >
              See Plan Comparison
            </Link>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* ================================================================
          Value Section
          ================================================================ */}
      <section className="border-t py-20 md:py-28">
        <MaxWidthWrapper>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="text-gradient_green-teal mb-4 font-semibold">
                Why GudForm
              </div>
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Designed to increase completion without sacrificing depth
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Keep respondents focused with one-question screens, then enrich
                responses with branching logic and context-aware prompts.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Question-by-question UX that reduces form fatigue",
                  "Conditional paths that adapt to each respondent",
                  "Fast delivery into your stack with webhooks and API",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {valueProps.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border bg-muted/30 p-5"
                >
                  <item.icon className="size-5 text-green-600 dark:text-green-400" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </MaxWidthWrapper>
      </section>

      {/* ================================================================
          CTA
          ================================================================ */}
      <section className="border-t">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-r from-green-400/20 via-teal-400/20 to-emerald-400/20 blur-3xl" />
            </div>
          </div>

          <MaxWidthWrapper className="py-20 md:py-28">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {isTypeformVariant
                  ? "Ready for forms that convert?"
                  : "Build the form layer for your AI stack"}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {isTypeformVariant
                  ? "Join thousands of teams using GudForm to create beautiful, conversational forms that get more responses."
                  : "One form. Beautiful for humans. Structured for agents. Free to start."}
              </p>
              <div className="mt-8">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg", rounded: "full" }),
                    "bg-gradient-to-r from-green-500 to-teal-600 px-8 text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30",
                  )}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>
          </MaxWidthWrapper>
        </div>
      </section>
    </>
  );
}
