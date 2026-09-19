# GudForm OSS

Self-hosted core form system. Docker Compose is the supported install path.

## Included (OSS edition)

- Form builder and public form renderer
- Responses dashboard
- Collections and teams
- Auth (email/password; Google optional)
- REST API + webhooks
- Admin user management
- Local file storage

## Excluded (hosted SaaS / premium)

- Pricing page and subscription billing
- Stripe subscription and Stripe Connect
- Form payment collection
- Integrations marketplace (public + dashboard + admin review)

See `docs/oss-edition.md`.

## Self-hosting

- `Dockerfile` + `docker-compose.yml`
- `docs/self-hosting.md`

## Stack

- Next.js 16 / React 19
- Prisma + Postgres
- NextAuth v5
- Tailwind + shadcn/ui
