import { env } from "@/env.mjs";
import { requireGoogleOAuth } from "@/lib/google-env";
import { signOAuthState } from "@/lib/oauth-state";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  [key: string]: unknown;
}

export interface OAuthProvider {
  getAuthUrl(integrationId: string, userId: string, scopes?: string[]): string;
  exchangeCode(code: string): Promise<OAuthTokens>;
  refreshToken?(
    refreshToken: string,
  ): Promise<{ access_token: string; expires_at: number }>;
}

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

const googleProvider: OAuthProvider = {
  getAuthUrl(integrationId, userId, scopes = []) {
    const state = signOAuthState({ integrationId, userId, provider: "google" });
    const params = new URLSearchParams({
      client_id: requireGoogleOAuth().clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: requireGoogleOAuth().clientId,
        client_secret: requireGoogleOAuth().clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok)
      throw new Error(`Google token exchange failed: ${await res.text()}`);
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  },

  async refreshToken(refreshToken) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: requireGoogleOAuth().clientId,
        client_secret: requireGoogleOAuth().clientSecret,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok)
      throw new Error(`Google token refresh failed: ${await res.text()}`);
    const data = await res.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  },
};

// ---------------------------------------------------------------------------
// Slack
// ---------------------------------------------------------------------------

const slackProvider: OAuthProvider = {
  getAuthUrl(integrationId, userId, scopes = []) {
    if (!env.SLACK_CLIENT_ID)
      throw new Error("Slack OAuth is not configured (missing SLACK_CLIENT_ID)");
    const state = signOAuthState({ integrationId, userId, provider: "slack" });
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: scopes.join(","),
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params}`;
  },

  async exchangeCode(code) {
    if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET)
      throw new Error("Slack OAuth is not configured");
    const credentials = Buffer.from(
      `${env.SLACK_CLIENT_ID}:${env.SLACK_CLIENT_SECRET}`,
    ).toString("base64");
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ code, redirect_uri: REDIRECT_URI }),
    });
    if (!res.ok)
      throw new Error(`Slack token exchange failed: ${await res.text()}`);
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`);
    return {
      access_token: data.access_token,
      // Slack bot tokens do not expire
      expires_at: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600,
      team_id: data.team?.id as string,
      team_name: data.team?.name as string,
      bot_user_id: data.bot_user_id as string,
    };
  },
};

// ---------------------------------------------------------------------------
// Mailchimp
// ---------------------------------------------------------------------------

const mailchimpProvider: OAuthProvider = {
  getAuthUrl(integrationId, userId) {
    if (!env.MAILCHIMP_CLIENT_ID)
      throw new Error(
        "Mailchimp OAuth is not configured (missing MAILCHIMP_CLIENT_ID)",
      );
    const state = signOAuthState({
      integrationId,
      userId,
      provider: "mailchimp",
    });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.MAILCHIMP_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state,
    });
    return `https://login.mailchimp.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code) {
    if (!env.MAILCHIMP_CLIENT_ID || !env.MAILCHIMP_CLIENT_SECRET)
      throw new Error("Mailchimp OAuth is not configured");
    const res = await fetch("https://login.mailchimp.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.MAILCHIMP_CLIENT_ID,
        client_secret: env.MAILCHIMP_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });
    if (!res.ok)
      throw new Error(
        `Mailchimp token exchange failed: ${await res.text()}`,
      );
    const data = await res.json();

    // Fetch metadata to get the data-center prefix needed for API calls
    const metaRes = await fetch(
      "https://login.mailchimp.com/oauth2/metadata",
      { headers: { Authorization: `OAuth ${data.access_token}` } },
    );
    const meta = metaRes.ok ? await metaRes.json() : {};

    return {
      access_token: data.access_token,
      // Mailchimp tokens do not expire
      expires_at: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600,
      dc: meta.dc as string,
      api_endpoint: meta.api_endpoint as string,
    };
  },
};

// ---------------------------------------------------------------------------
// HubSpot
// ---------------------------------------------------------------------------

const hubspotProvider: OAuthProvider = {
  getAuthUrl(integrationId, userId, scopes = []) {
    if (!env.HUBSPOT_CLIENT_ID)
      throw new Error(
        "HubSpot OAuth is not configured (missing HUBSPOT_CLIENT_ID)",
      );
    const state = signOAuthState({
      integrationId,
      userId,
      provider: "hubspot",
    });
    const params = new URLSearchParams({
      client_id: env.HUBSPOT_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: scopes.join(" "),
      state,
    });
    return `https://app.hubspot.com/oauth/authorize?${params}`;
  },

  async exchangeCode(code) {
    if (!env.HUBSPOT_CLIENT_ID || !env.HUBSPOT_CLIENT_SECRET)
      throw new Error("HubSpot OAuth is not configured");
    const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });
    if (!res.ok)
      throw new Error(`HubSpot token exchange failed: ${await res.text()}`);
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 1800),
    };
  },

  async refreshToken(refreshToken) {
    if (!env.HUBSPOT_CLIENT_ID || !env.HUBSPOT_CLIENT_SECRET)
      throw new Error("HubSpot OAuth is not configured");
    const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok)
      throw new Error(`HubSpot token refresh failed: ${await res.text()}`);
    const data = await res.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 1800),
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const oauthProviders: Record<string, OAuthProvider> = {
  google: googleProvider,
  slack: slackProvider,
  mailchimp: mailchimpProvider,
  hubspot: hubspotProvider,
};

export function getProvider(name: string): OAuthProvider | null {
  return oauthProviders[name] ?? null;
}
