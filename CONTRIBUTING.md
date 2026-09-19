# Contributing

Thanks for contributing to GudForm.

Public work happens on [gudlab/gudform-core](https://github.com/gudlab/gudform-core). Star that repo, open issues there, and send OSS PRs there. `cavewebs/gudform` is the private SaaS copy that ships [gudform.com](https://gudform.com).

The public repo is a **filtered core export**. Hosted billing, Stripe, and the integrations marketplace stay in this private tree.

Wanted public PRs are cherry-picked into the private product. They do not auto-merge to gudform.com.

## Before you start

1. Open an issue for anything larger than a typo.
2. Keep PRs focused. One problem per PR.
3. Do not add hosted billing, Stripe Connect, or marketplace code to the public tree.
4. Do not invent a new hosted SKU. Cloud Free stays unlimited forms and submissions; paid tiers remain Starter $5 / Pro $19 / Business $49 for webhooks, branding, teams, storage, and Stripe collection.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm dev
```

Or with Docker:

```bash
docker compose up --build
```

Open http://localhost:3080 (Compose) or http://localhost:3000 (`pnpm dev`).

Required env: `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `DATABASE_URL`. Google, Resend, and R2 are optional.

Never commit `.env`, `.env.local`, or `.env.loc`. Those files are gitignored on purpose.

## Checks

- `pnpm lint`
- `pnpm tsc --noEmit`
- `pnpm test`

## Publishing private → `gudlab/gudform-core`

Private `cavewebs/gudform` and public `gudlab/gudform-core` do **not** share commit SHAs. After a SaaS change lands on `main`, the public edition is a **filtered tree sync**. Do not rely on memory; use the script.

From a clean `main` on `cavewebs/gudform`:

```bash
# Preview the public tree (no push)
./scripts/sync-oss.sh

# Create branch sync/YYYYMMDD on gudlab/gudform-core and push
./scripts/sync-oss.sh --push
```

The script:

1. Runs `scripts/oss-export.mjs` (rsync + Prisma strip + secret wipe)
2. Clones `gudlab/gudform-core`
3. Copies the export onto it
4. Opens a topic branch so you can PR into public `main`

Do not `git push` this private remote's `main` directly onto `gudform-core` — the histories diverged, and a raw push can leak hosted-only files.

After the public PR merges, set GitHub metadata if it drifted:

```bash
gh api -X PATCH repos/gudlab/gudform-core \
  -f homepage='https://gudform.com' \
  -f description='Beautiful forms that feel like a conversation. The free, open-source alternative to Typeform and Tally.'

gh api -X PUT repos/gudlab/gudform-core/topics \
  -H 'Accept: application/vnd.github+json' \
  -f names[]='forms' \
  -f names[]='form-builder' \
  -f names[]='typeform-alternative' \
  -f names[]='tally-alternative' \
  -f names[]='conversational-forms' \
  -f names[]='mcp' \
  -f names[]='nextjs' \
  -f names[]='self-hosted' \
  -f names[]='typescript' \
  -f names[]='prisma' \
  -f names[]='docker' \
  -f names[]='surveys'
```

Tag the public repo when MCP or REST docs change so [gudform.com/docs/mcp](https://gudform.com/docs/mcp) can point at that release, not only Cloud.

Optional later: repo secret `OSS_SYNC_TOKEN` (PAT that can push to `gudlab/gudform-core`) and **Actions → Sync OSS** (`workflow_dispatch`). That pushes a `sync/<run_id>` branch. It does not merge to public `main`.

## License

Contributions are accepted under MIT. See [LICENSE.md](LICENSE.md). Relicensing the public core to a source-available license (for example BSL 1.1, as GudCal uses) is a product decision — do not do it in a routine sync.

See `docs/oss-edition.md`.
