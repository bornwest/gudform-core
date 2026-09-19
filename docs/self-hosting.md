# Self-hosting GudForm

GudForm's open-source edition runs with Docker. It includes the form builder, public forms, responses, teams, API keys, and webhooks. It does **not** include hosted billing, Stripe payment collection, or the integrations marketplace. See [OSS vs SaaS](./oss-edition.md).

## Docker Compose (recommended)

From the repo root:

```bash
docker compose up --build
```

Then open [http://localhost:3080](http://localhost:3080). Compose publishes the app on **3080** and Postgres on **5433** so they do not collide with a local `pnpm dev` on 3000 or host Postgres on 5432.

- Postgres: `localhost:5433` (user/password/db: `gudform`)
- App: `localhost:3080` (container still listens on 3000)
- Uploads: Docker volume `uploads`
- First user: register with email and password (email verification is skipped when Resend is not configured)

Change `AUTH_SECRET` before exposing the stack beyond localhost.

## Minimum environment

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the app |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Recommended in Docker | Set to `true` |
| `AUTH_URL` | Recommended in Docker | Public URL, e.g. `http://localhost:3080` |
| `DATABASE_URL` | Yes | Postgres connection string |
| `STORAGE_DRIVER` | No | Defaults to `local` when R2 is unset |

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` plus `NEXT_PUBLIC_GOOGLE_AUTH=true`, `RESEND_API_KEY`, Cloudflare R2 variables, `TURNSTILE_SECRET` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public form bot check; omit both to skip).

Team invites: set `RESEND_API_KEY` to email join links. Without it, copy the invite URL from the team page.

## Without Docker

```bash
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm dev
```

Use a local Postgres instance and set `DATABASE_URL`.

## Health check

`GET /api/health` returns `{ ok: true, edition: "oss" | "saas" }`.
