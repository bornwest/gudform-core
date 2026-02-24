# Integrations Setup Guide

All OAuth integrations share the same callback URL:

```
https://<your-domain>/api/integrations/oauth/callback
```

---

## Google (Sheets + Drive)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable the **Google Sheets API** and **Google Drive API**.
3. Go to **APIs & Services → OAuth consent screen**.
   - Choose **External** user type (or Internal if G Suite only).
   - Fill in app name, support email, and developer contact.
   - Add scopes: `spreadsheets` (for Sheets) and `drive.file` (for Drive).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Authorised redirect URIs: `https://<your-domain>/api/integrations/oauth/callback`
5. Copy the **Client ID** and **Client Secret**.

**Environment variables:**
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App → From scratch**.
2. Go to **OAuth & Permissions**.
   - Add redirect URL: `https://<your-domain>/api/integrations/oauth/callback`
   - Add Bot Token Scopes: `chat:write`, `channels:read`
3. Go to **Basic Information** to find your **Client ID** and **Client Secret**.
4. Install the app to your workspace at least once to verify it works.

**Environment variables:**
```
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
```

---

## Mailchimp

1. Log in to Mailchimp, then go to **Account → Extras → Registered apps**.
2. Click **Register an app** (or navigate to [mailchimp.com/developer](https://mailchimp.com/developer/)).
3. Fill in the app details and set the redirect URI to:
   `https://<your-domain>/api/integrations/oauth/callback`
4. After saving, copy the **Client ID** and **Client Secret**.

**Environment variables:**
```
MAILCHIMP_CLIENT_ID=...
MAILCHIMP_CLIENT_SECRET=...
```

---

## HubSpot

1. Go to [developers.hubspot.com](https://developers.hubspot.com/) and create a developer account.
2. Create a new app under **Apps → Create app**.
3. Go to the app's **Auth** tab.
   - Add redirect URL: `https://<your-domain>/api/integrations/oauth/callback`
   - Add scopes: `crm.objects.contacts.write`, `crm.objects.deals.write`
4. Copy the **Client ID** and **Client Secret** from the **Auth** tab.

**Environment variables:**
```
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
```

---

## Zapier

Zapier requires no platform setup on your side. Users provide their own webhook URL from a Zap.

**User setup steps:**
1. In Zapier, create a new Zap.
2. Choose **Webhooks by Zapier** as the trigger and select **Catch Hook**.
3. Copy the generated webhook URL.
4. In GudForm, install the Zapier integration and paste the webhook URL into the **Zapier Webhook URL** field.

No environment variables required.

---

## Environment Variables Summary

| Variable                  | Required             | Used By                     |
| ------------------------- | -------------------- | --------------------------- |
| `GOOGLE_CLIENT_ID`        | Yes (already exists) | Google Sheets, Google Drive |
| `GOOGLE_CLIENT_SECRET`    | Yes (already exists) | Google Sheets, Google Drive |
| `SLACK_CLIENT_ID`         | Optional             | Slack                       |
| `SLACK_CLIENT_SECRET`     | Optional             | Slack                       |
| `MAILCHIMP_CLIENT_ID`     | Optional             | Mailchimp                   |
| `MAILCHIMP_CLIENT_SECRET` | Optional             | Mailchimp                   |
| `HUBSPOT_CLIENT_ID`       | Optional             | HubSpot                     |
| `HUBSPOT_CLIENT_SECRET`   | Optional             | HubSpot                     |

All new variables are optional — the app starts without them. If a user tries to install an integration whose provider credentials aren't configured, they receive a clear error message.
