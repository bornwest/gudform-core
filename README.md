# GudForm Core

Open-source form platform and Typeform alternative. Build beautiful, conversational forms and collect responses — self-hosted with all features unlocked.

## Features

- **Conversational form builder** — drag-and-drop with 13+ question types (text, email, multiple choice, file upload, rating, scales, and more)
- **Form theming** — per-form colors, light/dark mode, custom backgrounds
- **Response management** — analytics dashboard, filtering, CSV export
- **Payment collection** — charge respondents via Stripe (optional)
- **Auto-responder** — automatic confirmation emails to respondents
- **Custom branding** — remove "Powered by GudForm" footer
- **Teams** — role-based access control (Owner, Admin, Member)
- **Collections** — organize forms into groups
- **Webhooks** — trigger external services on form submission
- **REST API** — full API with API key authentication
- **File uploads** — S3-compatible storage (Cloudflare R2, MinIO, AWS S3)
- **TypeScript & Python SDKs** — under `sdk/`

## Quick Start with Docker Compose

The fastest way to get running:

```bash
# 1. Clone and configure
git clone https://github.com/cavewebs/gudform-core.git
cd gudform-core
cp .env.example .env

# 2. Edit .env with your values (see Environment Variables below)

# 3. Start everything
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and create your account.

## Manual Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+

### Steps

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Push database schema
pnpm db:push

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `AUTH_SECRET` | NextAuth secret. Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_KEY` | AES-256-GCM key. Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for emails |
| `R2_ACCOUNT_ID` | S3-compatible storage account ID |
| `R2_ACCESS_KEY_ID` | Storage access key |
| `R2_SECRET_ACCESS_KEY` | Storage secret key |
| `R2_BUCKET_NAME` | Storage bucket name |
| `R2_PUBLIC_URL` | Public URL for serving uploaded files |

### Optional — Payment Collection

| Variable | Description |
|----------|-------------|
| `STRIPE_API_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Optional — Misc

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Bearer token for `/api/cron/cleanup-files` |

## Storage Setup

GudForm uses S3-compatible storage for file uploads. You can use:

- **Cloudflare R2** (recommended for production)
- **MinIO** (great for local/self-hosted)
- **AWS S3** or any S3-compatible service

### MinIO (Local Development)

Add MinIO to your `docker-compose.yml`:

```yaml
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
```

Then set:
```env
R2_ACCOUNT_ID=minioadmin
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_BUCKET_NAME=gudform-uploads
R2_PUBLIC_URL=http://localhost:9000/gudform-uploads
```

Create the bucket via the MinIO console at [http://localhost:9001](http://localhost:9001).

## Payment Collection (Optional)

GudForm supports collecting payments on forms via Stripe. To enable:

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Set `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in your `.env`
4. Set up a webhook endpoint pointing to `https://your-domain.com/api/webhooks/stripe` for events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. In the form builder, toggle "Enable payments" and set amount/currency

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Regenerate Prisma client |

## Project Structure

```
app/              Next.js routes and pages
actions/          Server actions
components/       UI and feature components
prisma/           Database schema
config/           App configuration
lib/              Shared utilities
sdk/              TypeScript & Python SDK source
```

## API

REST API routes are at `/api/v1`. Generate an API key from **Settings > API Keys** in the dashboard.

- **Forms**: `GET/POST /api/v1/forms`, `GET/PATCH/DELETE /api/v1/forms/:id`
- **Responses**: `GET /api/v1/forms/:id/responses`
- **Collections**: `GET/POST /api/v1/collections`

See the in-app docs at `/docs/api` for full reference.

## Contributing

Issues and PRs are welcome.

1. Create a feature branch from `main`
2. Make focused changes
3. Run `pnpm lint` and verify the app boots locally
4. Open a pull request with implementation notes

## License

MIT — see [LICENSE.md](LICENSE.md).
