# OSS vs hosted SaaS

GudForm is **two products that share a core**, not one app with a public `saas` switch.

| | Hosted ([gudform.com](https://gudform.com)) | Self-host (this core) |
|---|---|---|
| Source | Private `cavewebs/gudform` | [gudlab/gudform-core](https://github.com/gudlab/gudform-core) (filtered export) |
| Form builder + renderer | Yes | Yes |
| Teams, API, webhooks | Plan-gated | Unlocked |
| Remove branding | Paid | Unlocked |
| Billing / pricing | Yes | Not in this tree |
| Stripe Connect payments | Pro+ | Not included |
| Integrations marketplace | Yes | Not included |
| Paid template store | Yes | Built-in/free templates only |

Self-host gives you the **core**. Reselling or charging your own customers means you add **your** billing and marketplace, not ours.

There is no `NEXT_PUBLIC_EDITION=saas` unlock. Docker and `.env.example` cannot turn this tree into GudForm Cloud.

## Team invites

Invite someone by email from **Dashboard → Teams**. They get a link (`/invite/{token}`) that expires in 7 days.

- New users **create an account on that page** with the invited email.
- Existing users sign in with that email and are added to the team.
- After joining, the team is under **Dashboard → Teams**.

If Resend is not configured, the invite is still created: copy the link and send it yourself.

## Public repo

The public repo is an export of core files. SaaS routes, Stripe, the marketplace, and those Prisma models are stripped. Contributions are reviewed and cherry-picked into the private product; they do not auto-merge to gudform.com.
