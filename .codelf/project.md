## GudForm

> A modern form builder SaaS platform with typeform-style conversational forms, integrations, payments, and team collaboration.

> Allows users to create, publish, and manage forms with rich question types, conditional logic, file uploads, and integrations like Google Sheets and Google Drive.

> Active development – production-ready core with ongoing feature additions.

> Solo/small team project.

> Next.js 14 App Router, TypeScript, Prisma ORM, NextAuth.js, Tailwind CSS, shadcn/ui, Stripe, Resend (email), Neon Postgres.


## Dependencies (from package.json)

* next (14.x): React framework with App Router
* react (18.x): UI library
* prisma / @prisma/client: Database ORM
* next-auth: Authentication (credentials, Google OAuth/OIDC)
* tailwindcss: Utility-first CSS
* @radix-ui/*: Headless accessible UI primitives (via shadcn/ui)
* stripe: Payment processing
* resend: Transactional email
* zod: Schema validation
* lucide-react: Icon library
* sonner: Toast notifications
* recharts: Chart library for analytics


## Development Environment

* Node.js (see .nvmrc)
* pnpm package manager
* Neon Postgres database (local dev via connection string)
* Husky + commitlint for git hooks
* ESLint + Prettier for code formatting
* `pnpm dev` to start dev server
* `pnpm build` to build for production
* `prisma db push` / `prisma migrate` for schema changes
* `npx tsx prisma/seed-templates.ts` to seed template data
* `npx tsx prisma/seed-integrations.ts` to seed integration data


## Structure

```
root
- .agents/skills/           # Agent skill definitions (neon-postgres, plugin-manager, skill-creator)
- actions/                  # Server actions for forms, integrations, auth, billing, teams, etc.
    - form-actions.ts       # Core form CRUD, save/publish questions, draft management
    - integration-actions.ts # Integration install/uninstall, OAuth
    - template-actions.ts   # Template management
    - stripe-actions.ts     # Stripe billing
    - team-actions.ts       # Team management
- app/
    - (auth)/               # Authentication pages (login, register, check-email)
    - (marketing)/          # Public marketing pages (landing, pricing, templates, integrations, docs)
    - (protected)/          # Authenticated pages
        - admin/            # Admin panel (users, templates, integrations management)
        - dashboard/        # User dashboard (forms, builder, responses, settings, billing, teams)
            - forms/[formId]/builder/ # Form builder; thank-you screen is always last and fixed; question editor, sidebar, logic editor
    - api/                  # API routes (auth, upload, webhooks, REST API v1, integrations OAuth)
    - f/[slug]/             # Public form rendering page
- auth.ts                   # NextAuth.js configuration (providers, callbacks, events)
- components/
    - form-renderer/        # Form rendering engine (handles all question types, validation, themes)
    - ui/                   # shadcn/ui components
    - dashboard/            # Dashboard layout components
    - billing/              # Billing components
    - teams/                # Team management components
- config/
    - default-templates.ts  # 20 form templates with full question definitions
    - default-integrations.ts # Integration definitions (Google Sheets, Google Drive, webhooks)
    - site.ts               # Site metadata
    - subscriptions.ts      # Subscription tiers
- lib/
    - integrations/         # Internal integration handlers (google-sheets-handler, google-drive-handler)
    - integration-delivery.ts # Webhook delivery + internal routing for integrations
    - google-drive.ts       # Google OAuth helpers and API
    - validations/          # Zod schemas and validation logic (form, auth, user)
    - types/                # TypeScript type definitions (logic, payment, template)
    - storage.ts            # File storage (R2/S3)
    - stripe.ts             # Stripe helpers
- prisma/
    - schema.prisma         # Database schema (User, Form, Question, Response, Integration, Team, etc.)
    - seed-templates.ts     # Template seeder
    - seed-integrations.ts  # Integration seeder
- sdk/                      # TypeScript and Python SDK for the API
- emails/                   # Email templates (magic link, form notification, auto-responder)
```
