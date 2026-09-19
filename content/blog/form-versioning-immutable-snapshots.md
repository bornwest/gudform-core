---
title: "Form Versioning That Doesn't Lie About History"
description: "GudForm form versioning uses immutable publish snapshots, pins answers to the version that collected them, and soft-deletes removed questions instead of wiping answer history"
date: "2026-09-15"
author: "GudForm Team"
published: true
---

Most form builders have a dirty secret: when you remove a question from a published form, the historical answers collected by that question disappear from your exports. The data still exists in the database, but you can't see what the question was or interpret the answers in context.

We just shipped form versioning for GudForm that fixes this. Every time you publish changes, the system creates an immutable snapshot of your form schema. Historical responses remember which version collected them, so you always see the correct question labels — even for questions you later removed or renamed.

## The Problem with Naive Versioning

When we first built GudForm, publishing a form with removed questions would hard-delete those questions from the database. Cascade delete would wipe all historical answers tied to them. This is fast to implement but catastrophic for data integrity.

Even form builders that soft-delete questions often fail to track **which version** of the form each response came from. So when you export responses, you see:

- Current question titles for all historical responses
- No indication when questions were removed or renamed
- Mixed data from different schema versions presented as if they were collected by the same form

If you renamed "Phone Number" to "Contact Number" three months ago, your historical CSV shows "Contact Number" for responses that never saw that label.

## How GudForm's Versioning Works

### 1. Immutable Version Snapshots

Every time you click **Publish** in the form builder, GudForm creates a `FormVersion` record containing a complete snapshot of your form schema:

- All question IDs, types, titles, and properties
- Question order and logic rules
- Creation timestamp

Version numbers increment sequentially: v1, v2, v3. These snapshots are immutable — they never change after creation.

### 2. Responses Pin to Versions

When someone submits a form, the response stores `formVersionId` pointing to the exact schema version that was live at submission time.

This means:

- **Historical labels are preserved.** Even if you rename or remove a question, old responses render with the title that was shown to the user.
- **Legacy responses still work.** Pre-versioning responses (before we shipped this feature) store `formVersionId: null` and fall back to current titles.

### 3. Soft-Delete for Removed Questions

When you remove a question from a published form, GudForm sets `deletedAt` on the question record instead of deleting it. The database foreign key from `answers` → `questions` is set to `RESTRICT`, so hard-deleting a question with existing answers will fail.

This enforces the soft-delete workflow and protects historical data at the database level.

## Breaking vs Compatible Changes

GudForm automatically classifies your changes on publish:

**Breaking changes:**
- Removed questions
- Changed question types (e.g., SHORT_TEXT → EMAIL)
- Making an optional question required
- Removing options from multiple choice questions
- Adding required questions

**Compatible changes:**
- Reordering questions
- Renaming questions
- Editing descriptions
- Adding optional questions
- Adding new options to multiple choice questions

The classification result includes a human-readable summary like:

> "Type changed from SHORT_TEXT to EMAIL; Removed: 'Phone Number'"

This makes it clear what impact your publish will have on existing integrations, webhooks, and API consumers.

## Try It Yourself

If you're using the hosted version at [gudform.com](https://gudform.com), versioning is already live. Here's how to see it in action:

1. **Publish a change** to a form with existing responses (rename a question or remove one)
2. **Submit a new response** to the updated form
3. **View your responses** — you'll see that old responses show the original question label, while new responses reflect the current schema

For self-hosters:

```bash
# Pull latest code
git pull origin dev

# Run the versioning migration
pnpm prisma migrate deploy

# Restart your instance
docker-compose restart
```

The migration is additive-only and backward compatible. Existing responses will show `version: legacy` in exports until you publish a new change.

## What's Next

Form versioning is foundational infrastructure for features we're building:

- **Webhook versioning:** Send the schema version ID in webhook payloads so integrations can handle breaking changes gracefully
- **API versioning:** Allow form submissions to target a specific version for backward compatibility
- **Analytics by version:** Track completion rates and field performance across schema iterations

The version snapshot system is already in place. Now we can layer smarter tooling on top.

If you're using GudForm and have ideas for version-aware features, open an issue on [GitHub](https://github.com/gudlab/gudform-core) — we'd love to hear how you're using forms in production.
