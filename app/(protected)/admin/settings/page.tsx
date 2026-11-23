import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/site-settings";
import { DashboardHeader } from "@/components/dashboard/header";
import { GtmSettings } from "@/components/admin/gtm-settings";

export const metadata = {
  title: "Site settings",
  description: "Settings for the whole site",
};

export default async function SiteSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");

  const settings = await getSiteSettings();

  return (
    <>
      <DashboardHeader
        heading="Site settings"
        text="Settings that apply to every form on this site."
      />
      <div className="divide-y divide-muted pb-10">
        <GtmSettings initialId={settings.gtmContainerId ?? ""} />
      </div>
    </>
  );
}
