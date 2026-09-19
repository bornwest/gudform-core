---
title: "Improved Embed Share UX & Production URL Fix"
date: "2026-09-07"
version: "1.1.5"
---

We've improved the embed experience with better share UI and fixed a critical production URL issue.

**What's Fixed:**
- Production embed URLs now use correct domain (no more localhost leaks)
- Embed code modal shows accurate preview URLs
- Copy button for embed snippet with success feedback

**UX Improvements:**
- New embed settings panel with code preview
- Choose between iframe and script embed types
- Pre-configured height options (compact/auto/tall)
- Auto-resize message handler for responsive iframe height
- Max-width and overflow fixes for embedded forms
- Preview SSO warning when testing on Vercel preview URLs

**Technical Changes:**
- Embed URLs now respect `NEXT_PUBLIC_APP_URL` environment variable via `getPublicBaseUrl()`
- Added URL validation in production builds
- Improved error messaging for misconfigured domains
- `?embed=1` query parameter for embed-optimized rendering
