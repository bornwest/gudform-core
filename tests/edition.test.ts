import { afterEach, describe, expect, it } from "vitest";

import {
  OSS_PLAN_FEATURES,
  getEdition,
  isGoogleAuthEnabled,
  isOssEdition,
  isSaasEdition,
  isSaasOnlyPath,
} from "@/config/edition";

const keys = [
  "NEXT_PUBLIC_EDITION",
  "NEXT_PUBLIC_GOOGLE_AUTH",
  "GUDFORM_SAAS",
  "NEXT_PUBLIC_GUDFORM_SAAS",
] as const;

const originals: Record<string, string | undefined> = {};
for (const key of keys) {
  originals[key] = process.env[key];
}

afterEach(() => {
  for (const key of keys) {
    const value = originals[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function clearEditionEnv() {
  delete process.env.NEXT_PUBLIC_EDITION;
  delete process.env.GUDFORM_SAAS;
  delete process.env.NEXT_PUBLIC_GUDFORM_SAAS;
  delete process.env.NEXT_PUBLIC_GOOGLE_AUTH;
}

describe("edition", () => {
  it("defaults to oss (core) when hosted flags are unset", () => {
    clearEditionEnv();
    expect(getEdition()).toBe("oss");
    expect(isSaasEdition()).toBe(false);
    expect(isOssEdition()).toBe(true);
  });

  it("ignores NEXT_PUBLIC_EDITION=saas without GUDFORM_SAAS", () => {
    clearEditionEnv();
    process.env.NEXT_PUBLIC_EDITION = "saas";
    expect(isSaasEdition()).toBe(false);
    expect(getEdition()).toBe("oss");
  });

  it("enables hosted SaaS only with GUDFORM_SAAS or NEXT_PUBLIC_GUDFORM_SAAS", () => {
    clearEditionEnv();
    process.env.GUDFORM_SAAS = "1";
    expect(isSaasEdition()).toBe(true);
    expect(getEdition()).toBe("saas");

    clearEditionEnv();
    process.env.NEXT_PUBLIC_GUDFORM_SAAS = "true";
    expect(isSaasEdition()).toBe(true);
  });

  it("hides Google auth in OSS unless explicitly enabled", () => {
    clearEditionEnv();
    expect(isGoogleAuthEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_GOOGLE_AUTH = "true";
    expect(isGoogleAuthEnabled()).toBe(true);
  });

  it("shows Google auth by default when hosted SaaS is on", () => {
    clearEditionEnv();
    process.env.GUDFORM_SAAS = "true";
    expect(isGoogleAuthEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_GOOGLE_AUTH = "false";
    expect(isGoogleAuthEnabled()).toBe(false);
  });

  it("blocks SaaS billing, payments, and marketplace paths", () => {
    expect(isSaasOnlyPath("/pricing")).toBe(true);
    expect(isSaasOnlyPath("/pricing/")).toBe(true);
    expect(isSaasOnlyPath("/dashboard/billing")).toBe(true);
    expect(isSaasOnlyPath("/dashboard/settings/payments")).toBe(true);
    expect(isSaasOnlyPath("/dashboard/integrations/developer")).toBe(true);
    expect(isSaasOnlyPath("/integrations/slack")).toBe(true);
    expect(isSaasOnlyPath("/docs/integrations")).toBe(true);
    expect(isSaasOnlyPath("/api/webhooks/stripe-connect")).toBe(true);
  });

  it("keeps core product paths available in OSS", () => {
    expect(isSaasOnlyPath("/")).toBe(false);
    expect(isSaasOnlyPath("/dashboard")).toBe(false);
    expect(isSaasOnlyPath("/dashboard/settings/api-keys")).toBe(false);
    expect(isSaasOnlyPath("/docs/api")).toBe(false);
    expect(isSaasOnlyPath("/docs/webhooks")).toBe(false);
    expect(isSaasOnlyPath("/f/hello")).toBe(false);
    expect(isSaasOnlyPath("/api/v1/forms")).toBe(false);
    expect(isSaasOnlyPath("/invite/abc")).toBe(false);
  });

  it("unlocks self-host core features but not payment collection", () => {
    expect(OSS_PLAN_FEATURES.apiAccess).toBe(true);
    expect(OSS_PLAN_FEATURES.webhooks).toBe(true);
    expect(OSS_PLAN_FEATURES.customBranding).toBe(true);
    expect(OSS_PLAN_FEATURES.maxTeamMembers).toBe(-1);
    expect(OSS_PLAN_FEATURES.paymentCollection).toBe(false);
  });
});
