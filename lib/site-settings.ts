import { prisma } from "@/lib/db";
import { gtmIdError } from "@/lib/gtm";

const SITE_SETTINGS_ID = 1;

/** The site-wide settings row, or defaults before an admin has saved any. */
export async function getSiteSettings(): Promise<{
  gtmContainerId: string | null;
}> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { gtmContainerId: true },
  });
  return { gtmContainerId: settings?.gtmContainerId ?? null };
}

/** The GTM container ID to load on public forms, if one is set and valid. */
export async function getGtmContainerId(): Promise<string | null> {
  const { gtmContainerId } = await getSiteSettings();
  return gtmContainerId && !gtmIdError(gtmContainerId) ? gtmContainerId : null;
}

export async function saveSiteSettings(data: { gtmContainerId: string | null }) {
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...data },
    update: data,
  });
}
