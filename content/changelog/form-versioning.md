---
title: "Form Versioning & History"
date: "2026-09-12"
version: "1.3.0"
---

Form versioning is now live! Every time you publish changes to a form, GudForm automatically creates an immutable version snapshot. Historical responses remember which version they were submitted against, so you always see the correct question labels — even for questions you later removed or renamed.

**What's New:**
- Immutable version snapshots created on publish
- Responses pin to `formVersionId` for historical accuracy
- Soft-delete for removed questions (preserves historical answers)
- Breaking vs compatible change classification on publish
- Version labels in response exports and CSV downloads

**Why It Matters:**
When you remove or rename a question from a published form, historical responses still show the original question label that was presented to the user. No more mystery data from deleted fields or misleading exports where old answers show under new question titles.

**Technical Details:**
- Version snapshots are immutable — they never change after creation
- Responses store `formVersionId` to preserve schema context
- Soft-delete with database `RESTRICT` protects historical data
- Breaking changes: removed questions, type changes, required toggles, removed options
- Compatible changes: reordering, renaming, editing descriptions, adding optional questions
