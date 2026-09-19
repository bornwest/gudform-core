export type ProductEdition = "saas" | "oss";

function envEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

/**
 * Hosted gudform.com only. Self-host, Docker, and the public OSS tree never
 * set this. `NEXT_PUBLIC_EDITION=saas` is ignored without it.
 */
export function isSaasEdition(): boolean {
  return (
    envEnabled(process.env.GUDFORM_SAAS) ||
    envEnabled(process.env.NEXT_PUBLIC_GUDFORM_SAAS)
  );
}

export function isOssEdition(): boolean {
  return !isSaasEdition();
}

export function getEdition(): ProductEdition {
  return isSaasEdition() ? "saas" : "oss";
}

/** Google button: SaaS on by default; OSS off unless explicitly enabled. */
export function isGoogleAuthEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true") return true;
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH === "false") return false;
  return isSaasEdition();
}

/**
 * Hosted SaaS / premium surfaces that must 404 in the OSS edition.
 * Keep webhooks and the REST API available on self-host.
 */
export const SAAS_ONLY_PATHS = [
  "/pricing",
  "/free-pricing",
  "/dashboard/billing",
  "/dashboard/settings/payments",
  "/dashboard/integrations",
  "/admin/integrations",
  "/integrations",
  "/docs/integrations",
  "/api/webhooks/stripe",
  "/api/webhooks/stripe-connect",
] as const;

export function isSaasOnlyPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return SAAS_ONLY_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Core self-host entitlements. Payments and marketplace stay SaaS-only. */
export const OSS_PLAN_FEATURES = {
  maxForms: -1,
  maxResponsesPerForm: -1,
  maxTeamMembers: -1,
  customBranding: true,
  webhooks: true,
  apiAccess: true,
  prioritySupport: false,
  paymentCollection: false,
  maxStorageBytes: -1,
  fileRetentionDays: null as number | null,
};
