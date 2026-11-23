/**
 * Google Tag Manager for public forms. An admin sets one container ID for the
 * whole site (Admin → Site settings); public form pages load it with
 * @next/third-parties' GoogleTagManager, and the forms push events to its
 * data layer (see lib/gtm-events.ts). GA4 and any other tags are set up in
 * GTM itself.
 *
 * This file only checks container IDs and is used on both server and client.
 */

export const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,16}$/;

/** Trims and uppercases what was typed ("gtm-abc123" → "GTM-ABC123"). */
export function normalizeGtmId(input: string): string {
  return input.trim().toUpperCase();
}

/** Returns an error message, or null when the ID is valid or empty. */
export function gtmIdError(id: string): string | null {
  if (!id) return null;
  return GTM_ID_PATTERN.test(id)
    ? null
    : "A Container ID looks like GTM-XXXXXXX";
}
