# GudForm

Open-source conversational form builder (Typeform alternative) built with Next.js, Prisma, and Postgres.

Website: [gudform.com](https://gudform.com) · OSS repo: [gudlab/gudform-core](https://github.com/gudlab/gudform-core)

If this is useful, **[star the public repo](https://github.com/gudlab/gudform-core)** — that's the open-source edition. Issues and OSS PRs belong there, not on the private SaaS copy.

## Hosted vs self-host

| | Hosted SaaS | OSS / self-host |
|---|---|---|
| Builder, renderer, responses, teams | Yes | Yes (unlocked) |
| Unlimited forms and submissions | Yes (Free) | Yes |
| API + webhooks | Plan-gated | Unlocked |
| Billing, Stripe payments, integrations marketplace | Yes | Not in the public tree |

Self-host is **core only**. There is no env flag that turns a clone into GudForm Cloud. Details: [docs/oss-edition.md](docs/oss-edition.md) · [Self-hosting](docs/self-hosting.md)

## Quick start with Docker

```bash
git clone https://github.com/gudlab/gudform-core.git
cd gudform-core
docker compose up --build
```

Open [http://localhost:3080](http://localhost:3080), register with email and password, and create a form.

Health check: `GET /api/health`

## Local development without Docker

```bash
git clone https://github.com/gudlab/gudform-core.git
cd gudform-core
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm dev
```

Minimum: `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `DATABASE_URL`. Google, Resend, and R2 are optional.

## Scripts

- `pnpm dev` — development server
- `pnpm build` / `pnpm start` — production
- `pnpm lint` — ESLint
- `pnpm test` — Vitest
- `pnpm db:push` — push Prisma schema

## API and SDK

- REST API: `/api/v1`
- MCP: `POST /api/mcp` — docs at `/docs/mcp` (same page in this repo and on [gudform.com/docs/mcp](https://gudform.com/docs/mcp))
- TypeScript SDK: `npm install @gudlab/gudform` (source: `sdk/`)
- Python SDK: `pip install gudform` (source: `sdk/python/`)
- Docs: `/docs`, `/docs/api`, `/docs/mcp`, `/docs/webhooks`
- Agent index: `/llms.txt` · OpenAPI: `/openapi.yaml`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [SECURITY.md](SECURITY.md).

## Also from GudLab

Need scheduling next? Pair GudForm with [GudCal](https://www.gudcal.com) — open-source, agent-first booking (MCP + REST), self-hostable: [github.com/gudlab/gudcal-core](https://github.com/gudlab/gudcal-core)

## License

MIT — see [LICENSE.md](LICENSE.md).
