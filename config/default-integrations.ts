/**
 * Default (official) integrations that are seeded into the marketplace.
 *
 * These represent the 5 most common Typeform integrations and ship with
 * GudForm out of the box.
 */

export interface DefaultIntegration {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  category:
    | "PRODUCTIVITY"
    | "COMMUNICATION"
    | "MARKETING"
    | "CRM"
    | "AUTOMATION";
  webhookUrl: string;
  authConfig: Record<string, any> | null;
  configSchema: Record<string, any>[];
  events: string[];
}

export const DEFAULT_INTEGRATIONS: DefaultIntegration[] = [
  // ----------------------------------------------------------------
  // 1. Google Sheets
  // ----------------------------------------------------------------
  {
    slug: "google-sheets",
    name: "Google Sheets",
    description:
      "Automatically add form responses as new rows in a Google Sheets spreadsheet.",
    longDescription: `Connect your forms to Google Sheets for automatic data collection.

Every time someone submits your form, their answers are instantly added as a new row in your spreadsheet. No manual data entry needed.

**How it works:**
- Connect your Google account with one click
- Select or create a spreadsheet
- Map form fields to columns (or use automatic mapping)
- Responses flow in real-time

**Use cases:**
- Lead collection and tracking
- Event registrations
- Survey data analysis
- Order forms and inventory tracking
- Customer feedback databases`,
    icon: "📊",
    category: "PRODUCTIVITY",
    webhookUrl: "internal://google-sheets",
    authConfig: {
      type: "oauth2",
      provider: "google",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    },
    configSchema: [
      {
        key: "spreadsheetId",
        label: "Spreadsheet",
        type: "text",
        required: true,
        helpText: "The ID or URL of the Google Sheet to write to",
      },
      {
        key: "sheetName",
        label: "Sheet Name",
        type: "text",
        required: false,
        default: "Sheet1",
        helpText: "The name of the specific sheet tab (defaults to Sheet1)",
      },
      {
        key: "includeTimestamp",
        label: "Include Timestamp",
        type: "boolean",
        required: false,
        default: true,
        helpText: "Add a timestamp column for each response",
      },
    ],
    events: ["form.response.completed"],
  },

  // ----------------------------------------------------------------
  // 2. Slack
  // ----------------------------------------------------------------
  {
    slug: "slack",
    name: "Slack",
    description:
      "Get instant Slack notifications when someone submits your form.",
    longDescription: `Stay on top of form submissions with real-time Slack notifications.

Get a beautifully formatted message in your chosen Slack channel every time someone fills out your form. See answers at a glance without leaving Slack.

**How it works:**
- Connect your Slack workspace
- Choose a channel for notifications
- Customize which fields to show in the message
- Get notified instantly on every submission

**Use cases:**
- Support ticket notifications
- Lead alerts for sales teams
- Feedback monitoring
- Event registration alerts
- Team collaboration on incoming data`,
    icon: "💬",
    category: "COMMUNICATION",
    webhookUrl: "internal://slack",
    authConfig: {
      type: "oauth2",
      provider: "slack",
      scopes: ["chat:write", "channels:read"],
    },
    configSchema: [
      {
        key: "channelId",
        label: "Channel",
        type: "text",
        required: true,
        helpText:
          "The Slack channel to post notifications to (e.g., #form-responses)",
      },
      {
        key: "messageTemplate",
        label: "Message Format",
        type: "select",
        required: false,
        default: "detailed",
        options: ["detailed", "compact", "minimal"],
        helpText: "How much detail to include in each notification",
      },
      {
        key: "mentionUsers",
        label: "Mention Users",
        type: "text",
        required: false,
        helpText: "Slack user IDs to @mention (comma-separated)",
      },
    ],
    events: ["form.response.completed"],
  },

  // ----------------------------------------------------------------
  // 3. Mailchimp
  // ----------------------------------------------------------------
  {
    slug: "mailchimp",
    name: "Mailchimp",
    description:
      "Add form respondents to your Mailchimp email lists automatically.",
    longDescription: `Grow your email list automatically by connecting forms to Mailchimp.

Capture email addresses and subscriber data from your forms and add them directly to your Mailchimp audience. Perfect for lead magnets, newsletter signups, and email marketing campaigns.

**How it works:**
- Connect your Mailchimp account
- Select an audience (list)
- Map form fields to Mailchimp merge fields
- New subscribers are added automatically

**Use cases:**
- Newsletter signup forms
- Lead magnet delivery
- Webinar registration
- Content download gating
- Customer onboarding sequences`,
    icon: "📧",
    category: "MARKETING",
    webhookUrl: "internal://mailchimp",
    authConfig: {
      type: "oauth2",
      provider: "mailchimp",
      scopes: [],
    },
    configSchema: [
      {
        key: "audienceId",
        label: "Audience",
        type: "text",
        required: true,
        helpText: "The Mailchimp audience (list) ID to add subscribers to",
      },
      {
        key: "emailField",
        label: "Email Field",
        type: "text",
        required: true,
        helpText: "Which form field contains the subscriber's email address",
      },
      {
        key: "doubleOptIn",
        label: "Double Opt-in",
        type: "boolean",
        required: false,
        default: true,
        helpText: "Require subscribers to confirm via email before being added",
      },
      {
        key: "tags",
        label: "Tags",
        type: "text",
        required: false,
        helpText: "Comma-separated tags to apply to new subscribers",
      },
    ],
    events: ["form.response.completed"],
  },

  // ----------------------------------------------------------------
  // 4. HubSpot
  // ----------------------------------------------------------------
  {
    slug: "hubspot",
    name: "HubSpot",
    description:
      "Create and update HubSpot contacts and deals from form submissions.",
    longDescription: `Supercharge your CRM pipeline by connecting forms directly to HubSpot.

Every form submission creates or updates a contact in HubSpot, complete with all the data you collected. Optionally create deals to track your sales pipeline from the moment a lead fills out your form.

**How it works:**
- Connect your HubSpot account
- Choose to create contacts, deals, or both
- Map form fields to HubSpot properties
- Data syncs automatically on every submission

**Use cases:**
- Contact form to CRM pipeline
- Demo request forms → deal creation
- Customer intake forms
- Quote request forms
- Partnership inquiry tracking`,
    icon: "🟧",
    category: "CRM",
    webhookUrl: "internal://hubspot",
    authConfig: {
      type: "oauth2",
      provider: "hubspot",
      scopes: ["crm.objects.contacts.write", "crm.objects.deals.write"],
    },
    configSchema: [
      {
        key: "createContact",
        label: "Create Contact",
        type: "boolean",
        required: false,
        default: true,
        helpText: "Create or update a HubSpot contact on each submission",
      },
      {
        key: "createDeal",
        label: "Create Deal",
        type: "boolean",
        required: false,
        default: false,
        helpText: "Also create a deal in your pipeline",
      },
      {
        key: "pipeline",
        label: "Pipeline",
        type: "text",
        required: false,
        helpText: "HubSpot pipeline ID (required if creating deals)",
      },
      {
        key: "dealStage",
        label: "Deal Stage",
        type: "text",
        required: false,
        helpText: "Initial deal stage ID",
      },
      {
        key: "emailField",
        label: "Email Field",
        type: "text",
        required: true,
        helpText: "Which form field contains the contact email",
      },
    ],
    events: ["form.response.completed"],
  },

  // ----------------------------------------------------------------
  // 5. Zapier
  // ----------------------------------------------------------------
  {
    slug: "zapier",
    name: "Zapier",
    description: "Connect GudForm to 5,000+ apps through Zapier automations.",
    longDescription: `Unlock unlimited possibilities by connecting GudForm to Zapier.

Zapier acts as a bridge between GudForm and over 5,000 other apps. When someone submits your form, Zapier can trigger actions in any connected app — from sending emails and creating tasks to updating databases and posting on social media.

**How it works:**
- Install this integration and copy your webhook URL
- Create a Zap in Zapier with GudForm as the trigger
- Choose any action app (Gmail, Trello, Notion, Airtable, etc.)
- Map form fields to your action

**Popular Zaps:**
- Form → Trello card
- Form → Notion database row
- Form → Airtable record
- Form → Gmail auto-reply
- Form → Google Calendar event
- Form → Stripe payment link

**Why Zapier:**
No coding required. Build powerful multi-step automations with a visual interface. If Zapier supports it, GudForm can trigger it.`,
    icon: "⚡",
    category: "AUTOMATION",
    webhookUrl: "internal://zapier",
    authConfig: null, // Zapier uses webhook URL-based auth
    configSchema: [
      {
        key: "zapierWebhookUrl",
        label: "Zapier Webhook URL",
        type: "text",
        required: true,
        helpText:
          "The webhook URL from your Zap's trigger. Find this in Zapier when setting up a 'Webhooks by Zapier' trigger.",
      },
      {
        key: "includeMetadata",
        label: "Include Metadata",
        type: "boolean",
        required: false,
        default: true,
        helpText: "Include form ID, title, and response ID in the payload",
      },
    ],
    events: ["form.response.completed"],
  },

  // ----------------------------------------------------------------
  // 6. Google Drive
  // ----------------------------------------------------------------
  {
    slug: "google-drive-storage",
    name: "Google Drive",
    description:
      "Push form submission files and data to your Google Drive automatically.",
    longDescription: `Connect Google Drive to GudForm with one click and push form data to your own Google Drive account.

**How it works:**
- Connect your Google account with one click
- Files from form submissions are pushed to a "GudForm Uploads" folder
- Each form gets its own subfolder
- Files are accessible via shareable links

**Why Google Drive:**
- Files live in your own Google account
- 15 GB free storage included with every Google account
- Easy to share and manage files from Google Drive`,
    icon: "📁",
    category: "PRODUCTIVITY",
    webhookUrl: "internal://google-drive-storage",
    authConfig: {
      type: "oauth2",
      provider: "google",
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    },
    configSchema: [],
    events: ["form.response.completed"],
  },
];
