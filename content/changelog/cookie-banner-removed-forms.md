---
title: "Cookie Banner Removed from Public Forms"
date: "2026-09-03"
version: "1.1.0"
---

The cookie consent banner no longer appears on public form pages (`/f/*`).

**What Changed:**
- Cookie banner disabled on all `/f/[slug]` routes
- Analytics still work for form owners (no PII collected)
- Cleaner UX for form respondents
- GDPR compliance maintained with minimal cookie footprint

**Why:**
Form respondents were seeing cookie banners before they could even start filling out forms. Since GudForm only uses essential cookies on public forms (no tracking or ad pixels), the banner was unnecessary friction.

**Technical Details:**
- Cookie banner component checks route and skips rendering on public forms
- Session cookies remain for form state persistence
- Dashboard and marketing pages still show banner where analytics cookies are used
