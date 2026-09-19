---
title: "Book a call after form submit (GudForm → GudCal)"
description: "After someone submits a GudForm, send them to a GudCal booking page. Link + webhook pattern — no native-embed claims. Demo: https://www.gudcal.com/demo/meeting"
date: "2026-09-15"
author: "GudForm Team"
published: true
---

# Book a call after form submit (GudForm → GudCal)

You already collected structured answers. Next step is often a conversation — a demo, intake call, or consult.

GudForm and GudCal are siblings in the GudLab open-source stack: forms for humans and agents, scheduling with MCP + REST. Here's a minimal "submit → book" path that works today without a custom integration.

## 1. Build the intake form in GudForm

Keep it short: name, email, what they need, optional notes. Use webhooks or the thank-you redirect so you can hand off cleanly after submit.

## 2. Point the thank-you / next step at GudCal

Use a GudCal booking URL as the post-submit destination (thank-you button, redirect, or confirmation email CTA).

**Public demo you can try now:**

- Guest book (canonical example): https://www.gudcal.com/demo/meeting
- Demo index: https://www.gudcal.com/demo
- Also: `/demo/quick-chat`, `/demo/consultation`

For production, swap the demo URL for your own GudCal event type once you've self-hosted or signed up.

## 3. Prefer webhook when you need the payload downstream

If an agent or CRM should see the answers *before* the call:

1. GudForm webhook fires on submit with the typed response
2. Your automation stores/forwards the payload
3. The human still lands on GudCal to pick a slot

Same form data, clearer handoff. Agents can use GudForm MCP/REST on the form side and GudCal MCP/REST on the calendar side — no paywall on core for either product.

## What this is (and isn't)

This recipe is a **link + webhook pattern**, not a claim that GudForm has a one-click native GudCal embed yet. When a deeper integration ships, we'll document it. For now, the honest path is: collect with GudForm, book with GudCal.

## Try the pieces

- Forms: https://www.gudform.com
- Scheduling demo: https://www.gudcal.com/demo/meeting
- GudCal source: https://github.com/gudlab/gudcal-core
