import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { getUserSettings } from "@/actions/update-user-settings";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { UserImageForm } from "@/components/forms/user-image-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserEmailInfo } from "@/components/settings/user-email-info";
import { NotificationPreferences } from "@/components/settings/notification-preferences";

export const metadata = constructMetadata({
  title: "Settings – GudForm",
  description: "Configure your account settings and notification preferences.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const settings = await getUserSettings();

  return (
    <>
      <DashboardHeader
        heading="Settings"
        text="Manage your account and notification preferences."
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <UserImageForm
          user={{
            id: user.id,
            name: settings.name,
            image: settings.image,
          }}
        />
        <UserEmailInfo
          email={settings.email}
          emailVerified={settings.emailVerified}
        />
        <NotificationPreferences
          notifyResponses={settings.notifyResponses}
          notifyStorage={settings.notifyStorage}
          marketingEmails={settings.marketingEmails}
        />
        <DeleteAccountSection />
      </div>
    </>
  );
}
