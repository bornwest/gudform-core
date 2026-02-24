import { redirect } from "next/navigation";
import { listApiKeys } from "@/actions/api-key-actions";

import { getCurrentUser } from "@/lib/session";
import { DashboardHeader } from "@/components/dashboard/header";
import { ApiKeyManager } from "@/components/settings/api-key-manager";

export const metadata = {
  title: "API Keys",
  description: "Manage your API keys",
};

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const apiKeys = await listApiKeys();

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <DashboardHeader
        heading="API Keys"
        text="Manage your API keys for programmatic access to GudForm."
      />
      <ApiKeyManager initialKeys={apiKeys} />
    </div>
  );
}
