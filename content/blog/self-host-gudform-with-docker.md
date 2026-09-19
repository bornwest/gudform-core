---
title: "Self-Host GudForm with Docker in 5 Minutes"
description: "A quick guide to running your own GudForm instance with Docker Compose"
date: "2026-09-08"
author: "GudForm Team"
published: true
---

GudForm is designed to be self-hosted. Whether you want to keep form data on your own infrastructure or customize the platform for your team, running your own instance takes just a few minutes with Docker.

## Prerequisites

You'll need:

- Docker and Docker Compose installed
- A PostgreSQL database (or use our Docker Compose example)
- 10 minutes

## Quick Start with Docker Compose

Clone the repository:

```bash
git clone https://github.com/gudlab/gudform-core.git
cd gudform-core
```

Copy the example environment file:

```bash
cp .env.example .env
```

Update your `.env` with:

- `DATABASE_URL` pointing to your Postgres instance
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` set to your domain

Start the services:

```bash
docker-compose up -d
```

GudForm will be available at `http://localhost:3000`.

## Database Setup

Run migrations to set up your database schema:

```bash
docker-compose exec web pnpm prisma migrate deploy
```

Optionally seed default integrations:

```bash
docker-compose exec web pnpm db:seed-integrations
```

## Production Deployment

For production, you'll want to:

1. **Use a managed database** like [Neon](https://neon.tech) or AWS RDS
2. **Set up auth providers** (GitHub OAuth, email, etc.)
3. **Configure S3 storage** for file uploads
4. **Enable HTTPS** with a reverse proxy

The open-source edition includes all core features: conversational and classic display modes, webhooks, analytics, and the MCP server for AI agents.

## SaaS vs Self-Hosted

Our hosted version at [gudform.com](https://gudform.com) includes:

- Zero-config deployment
- Managed infrastructure
- Zapier, Make, and integration marketplace
- Team collaboration features

Self-hosting gives you full control, no usage limits, and the ability to customize the codebase.

## Community & Support

Join our [GitHub issues](https://github.com/gudlab/gudform-core/issues) for help with deployment, feature requests, or to share what you've built with GudForm.

We also accept contributions — check out `CONTRIBUTING.md` in the repo to get started.
