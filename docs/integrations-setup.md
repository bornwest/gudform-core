# Integrations Setup Guide

Complete step-by-step instructions to set up every seeded GudForm integration so users can install and use them.

---

## Table of Contents

1. [Global Prerequisites](#1-global-prerequisites)
2. [Google Drive (Storage)](#2-google-drive-storage)
3. [Google Sheets (Productivity)](#3-google-sheets-productivity)
4. [Slack (Communication)](#4-slack-communication)
5. [Mailchimp (Marketing)](#5-mailchimp-marketing)
6. [HubSpot (CRM)](#6-hubspot-crm)
7. [Zapier (Automation)](#7-zapier-automation)
8. [Seed the Marketplace](#8-seed-the-marketplace)
9. [Security & Credential Encryption](#9-security--credential-encryption)
10. [Verification Checklist](#10-verification-checklist)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Global Prerequisites

These steps apply to **all** integrations and must be done first.

### 1a. Generate an Encryption Key

All OAuth tokens are encrypted at rest with AES-256-GCM. You need one key for all integrations.

```bash
openssl rand -hex 32
```

Add the output to `.env.local`:

```env
ENCRYPTION_KEY=<your-64-character-hex-string>
```

> **Important:** Losing this key means every user must re-authorize their integrations. Never commit it to version control.

### 1b. Add the Integration OAuth Redirect URI

Every OAuth-based integration (Google Drive, Google Sheets, Slack, Mailchimp, HubSpot) shares a single callback URL. Your hosting domain must allow it.

**Production:**
```
https://yourdomain.com/api/integrations/oauth/callback
```

**Local development:**
```
http://localhost:3000/api/integrations/oauth/callback
```

You'll add this URL to each provider's developer console in the sections below.

### 1c. Existing Environment Variables

These should already be set from your initial GudForm setup:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com   # no trailing slash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 2. Google Drive (Storage)

Lets users upload form files to their own Google Drive with one click. No S3 credentials needed.

**Status:** Fully implemented. Works out of the box after setup.

### Step 1: Enable the Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select the **same project** used for GudForm Google login
3. Go to **APIs & Services > Library**
4. Search for **"Google Drive API"**
5. Click **Enable**

### Step 2: Add the Redirect URI

1. Go to **APIs & Services > Credentials**
2. Click your existing **OAuth 2.0 Client ID** (the one used for Google login)
3. Under **Authorized redirect URIs**, add:
   ```
   https://yourdomain.com/api/integrations/oauth/callback
   ```
4. Click **Save**

### Step 3: Update the OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Click **Edit App**
3. Go to the **Scopes** step
4. Click **Add or remove scopes**
5. Add: `https://www.googleapis.com/auth/drive.file`
6. Save

> This scope only allows GudForm to access files it creates. It cannot read or modify the user's existing Drive files.

### Step 4: (Production only) Submit for Google Verification

If your app is in **"Testing"** mode, only users listed under **Test users** can authorize. For production:

1. Go to **OAuth consent screen > Publishing status**
2. Click **Publish App**
3. Complete Google's verification process (may take days/weeks)
4. Until verified, users see a "This app isn't verified" warning — they can still click "Advanced > Go to app" to proceed

### New Environment Variables

None. Reuses existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### How It Works for Users

1. User visits the marketplace and clicks **"Connect Google Drive"**
2. Redirected to Google consent screen
3. After approval, redirected back to GudForm dashboard with "Connected" status
4. All file uploads from their forms now go to a **"GudForm Uploads"** folder in their Drive
5. Each file gets a public shareable link automatically

---

## 3. Google Sheets (Productivity)

Adds form responses as new rows in a Google Sheets spreadsheet.

**Status:** Webhook placeholder. Requires a webhook handler to be deployed.

### Step 1: Enable the Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Same project as above
3. Go to **APIs & Services > Library**
4. Search for **"Google Sheets API"**
5. Click **Enable**

### Step 2: Add Redirect URI

Already done in the Google Drive setup (Step 2 above). The same redirect URI serves all Google OAuth integrations.

### Step 3: Update the OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen > Scopes**
2. Add: `https://www.googleapis.com/auth/spreadsheets`
3. Save

### Step 4: Deploy the Webhook Handler

The Google Sheets integration is webhook-based. When a form is submitted, GudForm sends a POST request to the configured webhook URL with the form response data.

The seeded integration points to:
```
https://integrations.gudform.com/google-sheets
```

You need to deploy a service at that URL (or change it in the DB) that:

1. Receives the webhook payload:
   ```json
   {
     "event": "form.response.completed",
     "formId": "...",
     "responseId": "...",
     "data": { "field1": "value1", "field2": "value2" },
     "install": {
       "config": {
         "spreadsheetId": "...",
         "sheetName": "Sheet1",
         "includeTimestamp": true
       },
       "credentials": { "access_token": "...", "refresh_token": "..." }
     }
   }
   ```
2. Uses the credentials to authenticate with the Google Sheets API
3. Appends the response data as a new row to the configured spreadsheet

### New Environment Variables

None.

### User Configuration

After installing, users configure:
- **Spreadsheet** — the Google Sheet ID or URL
- **Sheet Name** — which tab (defaults to "Sheet1")
- **Include Timestamp** — whether to add a timestamp column

---

## 4. Slack (Communication)

Sends a formatted notification to a Slack channel on every form submission.

**Status:** Webhook placeholder. Requires a Slack app and webhook handler.

### Step 1: Create a Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **Create New App > From scratch**
3. Name: `GudForm Notifications` (or your preference)
4. Pick your workspace
5. Click **Create App**

### Step 2: Configure OAuth Scopes

1. In your Slack app settings, go to **OAuth & Permissions**
2. Under **Scopes > Bot Token Scopes**, add:
   - `chat:write` — post messages to channels
   - `channels:read` — list public channels
3. Under **Redirect URLs**, add:
   ```
   https://yourdomain.com/api/integrations/oauth/callback
   ```
4. Click **Save URLs**

### Step 3: Get Client Credentials

1. Go to **Basic Information** in your Slack app
2. Copy the **Client ID** and **Client Secret**
3. Add to `.env.local`:
   ```env
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   ```

> **Note:** These are not currently wired into GudForm's OAuth flow. The seeded Slack integration uses webhook delivery. To make Slack OAuth work end-to-end, you would need to extend the OAuth callback route to handle the `slack` provider, similar to how `google` is handled.

### Step 4: Deploy the Webhook Handler

The seeded integration points to:
```
https://integrations.gudform.com/slack
```

Deploy a service at that URL that:

1. Receives the form submission webhook payload
2. Uses the Slack Bot Token (from install credentials) to call `chat.postMessage`
3. Formats the form data based on the `messageTemplate` config (detailed/compact/minimal)
4. Posts to the configured `channelId`

### Step 5: Install the Slack App to Your Workspace

1. In your Slack app settings, go to **Install App**
2. Click **Install to Workspace**
3. Authorize the requested permissions

### New Environment Variables

```env
SLACK_CLIENT_ID=...        # from Slack app Basic Information
SLACK_CLIENT_SECRET=...    # from Slack app Basic Information
```

### User Configuration

After installing, users configure:
- **Channel** — Slack channel to post to (e.g., `#form-responses`)
- **Message Format** — detailed, compact, or minimal
- **Mention Users** — Slack user IDs to @mention (optional)

---

## 5. Mailchimp (Marketing)

Adds form respondents to a Mailchimp email audience automatically.

**Status:** Webhook placeholder. Requires a Mailchimp app and webhook handler.

### Step 1: Register a Mailchimp OAuth App

1. Go to [Mailchimp Developer](https://mailchimp.com/developer/)
2. Log in and go to **Registered Apps** (under your account menu)
3. Click **Register An App**
4. Fill in:
   - **App name:** `GudForm`
   - **App description:** Adds form respondents to your audience
   - **Company/Organization:** Your company
   - **App website:** `https://yourdomain.com`
   - **Redirect URI:**
     ```
     https://yourdomain.com/api/integrations/oauth/callback
     ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 2: Add Environment Variables

```env
MAILCHIMP_CLIENT_ID=...
MAILCHIMP_CLIENT_SECRET=...
```

> **Note:** Like Slack, Mailchimp OAuth is not yet wired into the generic OAuth callback. The integration currently uses webhook delivery.

### Step 3: Deploy the Webhook Handler

The seeded integration points to:
```
https://integrations.gudform.com/mailchimp
```

Deploy a service at that URL that:

1. Receives the form submission webhook payload
2. Extracts the email from the configured `emailField`
3. Calls the Mailchimp API to add/update a subscriber:
   - `PUT /lists/{audienceId}/members/{subscriberHash}`
   - Set `status` to `"subscribed"` (or `"pending"` if `doubleOptIn` is true)
   - Apply configured `tags`
4. Uses the Mailchimp API key or OAuth token from install credentials

### New Environment Variables

```env
MAILCHIMP_CLIENT_ID=...
MAILCHIMP_CLIENT_SECRET=...
```

### User Configuration

After installing, users configure:
- **Audience** — the Mailchimp list ID
- **Email Field** — which form field has the email
- **Double Opt-in** — require email confirmation (defaults to true)
- **Tags** — comma-separated tags for new subscribers

---

## 6. HubSpot (CRM)

Creates or updates HubSpot contacts and deals on form submission.

**Status:** Webhook placeholder. Requires a HubSpot app and webhook handler.

### Step 1: Create a HubSpot App

1. Go to [HubSpot Developer](https://developers.hubspot.com/)
2. Create a developer account (free) if you don't have one
3. Go to **Apps** and click **Create app**
4. Fill in:
   - **App name:** `GudForm`
   - **Description:** Creates contacts and deals from form submissions
   - **Logo:** Optional

### Step 2: Configure OAuth

1. In your HubSpot app, go to the **Auth** tab
2. Under **Redirect URLs**, add:
   ```
   https://yourdomain.com/api/integrations/oauth/callback
   ```
3. Under **Scopes**, add:
   - `crm.objects.contacts.write`
   - `crm.objects.deals.write`
4. Copy the **Client ID** and **Client Secret** from the **Auth** tab

### Step 3: Add Environment Variables

```env
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
```

> **Note:** Like the others, HubSpot OAuth is not yet wired into the generic OAuth callback. The integration currently uses webhook delivery.

### Step 4: Deploy the Webhook Handler

The seeded integration points to:
```
https://integrations.gudform.com/hubspot
```

Deploy a service at that URL that:

1. Receives the form submission webhook payload
2. If `createContact` is true:
   - Search for existing contact by email (`emailField`)
   - Create or update via `POST /crm/v3/objects/contacts`
3. If `createDeal` is true:
   - Create deal via `POST /crm/v3/objects/deals`
   - Associate with the contact
   - Set pipeline and deal stage from config
4. Uses the HubSpot OAuth token from install credentials

### New Environment Variables

```env
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
```

### User Configuration

After installing, users configure:
- **Create Contact** — create/update HubSpot contacts (defaults to true)
- **Create Deal** — also create deals (defaults to false)
- **Pipeline** — HubSpot pipeline ID (if creating deals)
- **Deal Stage** — initial deal stage ID
- **Email Field** — which form field has the contact email

---

## 7. Zapier (Automation)

Connects GudForm to 5,000+ apps via Zapier webhooks.

**Status:** Fully works. No provider setup needed from you. Users bring their own Zapier webhook URL.

### Step 1: Nothing

No developer console setup, no API keys, no OAuth, no webhook handler to deploy.

Zapier works via user-configured webhook URLs. When a user installs this integration, they paste their Zapier webhook URL. GudForm POSTs form submission data to that URL, and Zapier handles the rest.

### How It Works for Users

1. User creates a Zap at [zapier.com](https://zapier.com)
2. For the trigger, they choose **Webhooks by Zapier > Catch Hook**
3. Zapier gives them a webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/...`)
4. User installs the Zapier integration in GudForm and pastes the URL
5. On form submission, GudForm sends the data to Zapier
6. Zapier routes it to whatever app they configured (Slack, Trello, Notion, etc.)

### New Environment Variables

None.

### User Configuration

After installing, users configure:
- **Zapier Webhook URL** — the URL from their Zap's trigger
- **Include Metadata** — whether to include form ID, title, and response ID (defaults to true)

---

## 8. Seed the Marketplace

After completing the provider setup steps above, seed all integrations into the database:

```bash
npx dotenv-cli -e .env.local -- npx tsx prisma/seed-integrations.ts
```

This creates or updates 6 official integrations:

| # | Integration | Category | Auth | Provider Setup Required |
|---|-------------|----------|------|------------------------|
| 1 | Google Drive | Storage | OAuth (Google) | Yes - Google Cloud Console |
| 2 | Google Sheets | Productivity | OAuth (Google) | Yes - Google Cloud Console |
| 3 | Slack | Communication | OAuth (Slack) | Yes - Slack API |
| 4 | Mailchimp | Marketing | OAuth (Mailchimp) | Yes - Mailchimp Developer |
| 5 | HubSpot | CRM | OAuth (HubSpot) | Yes - HubSpot Developer |
| 6 | Zapier | Automation | None (webhook) | None |

The script is idempotent. Safe to re-run anytime.

> **Prerequisite:** At least one user must exist in the database before seeding. The script assigns the first admin (or first user) as the integration author.

---

## 9. Security & Credential Encryption

### How OAuth Tokens Are Protected

```
User clicks "Connect" in marketplace
        |
        v
Redirected to provider consent screen (Google, Slack, etc.)
        |
        v
Provider returns authorization code to GudForm callback
        |
        v
GudForm exchanges code for tokens (server-side, never exposed to browser)
        |
        v
Tokens encrypted with AES-256-GCM using ENCRYPTION_KEY
        |
        v
Encrypted string stored in DB: integration_installs.credentials
        |
        v
On use: decrypted in memory only, used for API call, then discarded
On refresh: new tokens re-encrypted and saved back to DB
```

### Encryption Details

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM (authenticated encryption) |
| Key | 256-bit, from `ENCRYPTION_KEY` env var |
| IV | Random 96-bit, unique per encryption |
| Auth tag | 128-bit (prevents tampering) |
| DB format | `iv:ciphertext:authTag` (all hex-encoded) |

### What Gets Encrypted

- OAuth access tokens
- OAuth refresh tokens
- Token expiry timestamps
- Any other credentials stored in `IntegrationInstall.credentials`

### Additional Security Layers

- Database connection uses SSL (`?sslmode=require`)
- OAuth `state` parameter prevents CSRF attacks
- Session verification in callback prevents token theft
- Each provider uses minimal scopes (e.g., `drive.file` not `drive`)
- Webhook payloads signed with HMAC-SHA256
- Tokens only live in memory during API calls

### OAuth Scopes Summary

| Integration | Scope | Access |
|-------------|-------|--------|
| Google Drive | `drive.file` | Only files created by GudForm |
| Google Sheets | `spreadsheets` | Read/write spreadsheets |
| Slack | `chat:write`, `channels:read` | Post messages, list channels |
| HubSpot | `crm.objects.contacts.write`, `crm.objects.deals.write` | Create/update contacts and deals |
| Mailchimp | (default) | Read/write audiences and subscribers |
| Zapier | None | User provides their own webhook URL |

---

## 10. Verification Checklist

### Global

- [ ] `ENCRYPTION_KEY` is set in `.env.local` (64 hex characters)
- [ ] Seed script ran: `npx dotenv-cli -e .env.local -- npx tsx prisma/seed-integrations.ts`
- [ ] All 6 integrations appear at `/integrations` with "Official" badge

### Google Drive

- [ ] Google Drive API enabled in Google Cloud Console
- [ ] `https://www.googleapis.com/auth/drive.file` scope added to consent screen
- [ ] Redirect URI added: `{NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`
- [ ] Clicking "Connect Google Drive" opens Google consent screen
- [ ] After authorization, redirected to dashboard with "Connected" status
- [ ] File upload on a form goes to user's Google Drive "GudForm Uploads" folder

### Google Sheets

- [ ] Google Sheets API enabled in Google Cloud Console
- [ ] `https://www.googleapis.com/auth/spreadsheets` scope added to consent screen
- [ ] Webhook handler deployed at `https://integrations.gudform.com/google-sheets`
- [ ] Form submission creates a new row in the configured spreadsheet

### Slack

- [ ] Slack app created at api.slack.com
- [ ] Bot scopes `chat:write` and `channels:read` configured
- [ ] Redirect URL added in Slack app settings
- [ ] `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` set in `.env.local`
- [ ] Webhook handler deployed at `https://integrations.gudform.com/slack`
- [ ] Form submission posts a message to the configured Slack channel

### Mailchimp

- [ ] App registered at mailchimp.com/developer
- [ ] Redirect URI added in Mailchimp app settings
- [ ] `MAILCHIMP_CLIENT_ID` and `MAILCHIMP_CLIENT_SECRET` set in `.env.local`
- [ ] Webhook handler deployed at `https://integrations.gudform.com/mailchimp`
- [ ] Form submission adds a subscriber to the configured audience

### HubSpot

- [ ] App created at developers.hubspot.com
- [ ] Scopes `crm.objects.contacts.write` and `crm.objects.deals.write` configured
- [ ] Redirect URL added in HubSpot app settings
- [ ] `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` set in `.env.local`
- [ ] Webhook handler deployed at `https://integrations.gudform.com/hubspot`
- [ ] Form submission creates a contact in HubSpot

### Zapier

- [ ] No setup needed
- [ ] User can install, paste a webhook URL, and form submissions trigger the Zap

---

## 11. Troubleshooting

### General OAuth Issues

**"Token exchange failed"**
- Verify the client ID and secret match the provider
- Ensure the redirect URI in the provider console **exactly** matches `{NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback` (no trailing slash, correct protocol)

**"Session mismatch. Please try again."**
- The user's browser session expired during the OAuth flow
- Have them try again from the marketplace

**"Invalid state parameter"**
- The OAuth state was corrupted in transit
- Usually caused by a proxy or middleware modifying query params

### Google Drive

**"Google Drive credentials missing"**
- User needs to reconnect from the marketplace
- If `ENCRYPTION_KEY` was rotated, old tokens can't be decrypted

**"Token refresh failed"**
- User may have revoked access at https://myaccount.google.com/permissions
- Refresh tokens expire after 6 months of inactivity for unverified apps
- User needs to reconnect

**"Drive folder search/creation failed"**
- Google Drive API is not enabled in Google Cloud Console
- The `drive.file` scope is not on the consent screen

### Google Sheets

**Webhook returns 404/500**
- Ensure the webhook handler is deployed and running at the configured URL
- Check that the spreadsheet ID in the user's config is valid

### Slack

**"channel_not_found" error**
- The bot needs to be invited to the channel first
- User should type `/invite @GudForm Notifications` in the target channel

**"not_authed" error**
- The Slack bot token has expired or been revoked
- User needs to reinstall the Slack app

### Mailchimp

**"Member Exists" or duplicate error**
- This is expected. Mailchimp upserts by default — existing subscribers get updated
- The webhook handler should use `PUT` (upsert) not `POST` (create)

**"Invalid Resource" error**
- The audience ID in the user's config is wrong
- Have the user find their audience ID in Mailchimp under Audience > Settings > Audience name and campaign defaults

### HubSpot

**"Contact already exists" error**
- The webhook handler should search for existing contacts by email first and update rather than create

**401 Unauthorized**
- The HubSpot access token expired and needs refreshing
- Check that the webhook handler refreshes tokens properly

### Zapier

**Zap not triggering**
- Verify the user's Zap is turned ON in Zapier
- Check that the webhook URL was pasted correctly (no extra spaces)
- Send a test submission and check the Zap's task history in Zapier

### Seed Script

**"No users found"**
- Create at least one user account before running the seed script
- Log in to GudForm first to create your account

---

## Environment Variables Summary

```env
# Already set (from initial GudForm setup):
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Required for integrations:
ENCRYPTION_KEY=...              # openssl rand -hex 32

# Required for Slack integration:
SLACK_CLIENT_ID=...             # from Slack app Basic Information
SLACK_CLIENT_SECRET=...         # from Slack app Basic Information

# Required for Mailchimp integration:
MAILCHIMP_CLIENT_ID=...         # from Mailchimp registered app
MAILCHIMP_CLIENT_SECRET=...     # from Mailchimp registered app

# Required for HubSpot integration:
HUBSPOT_CLIENT_ID=...           # from HubSpot app Auth tab
HUBSPOT_CLIENT_SECRET=...       # from HubSpot app Auth tab
```

> Google Drive and Google Sheets reuse the existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Zapier needs no credentials.
