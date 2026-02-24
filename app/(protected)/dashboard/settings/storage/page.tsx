import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, HardDrive } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getStorageUsage } from "@/actions/storage-actions";
import { DashboardHeader } from "@/components/dashboard/header";

export const metadata = {
  title: "Storage Settings",
  description: "View your file storage usage.",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default async function StorageSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const usage = await getStorageUsage();

  const limitDisplay =
    usage.maxBytes === -1 ? "Unlimited" : formatBytes(usage.maxBytes);
  const retentionDisplay =
    usage.retentionDays === null
      ? "Unlimited"
      : `${usage.retentionDays} days`;

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <DashboardHeader
        heading="Storage"
        text="View your file storage usage and limits."
      />

      <div className="rounded-xl border p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <HardDrive className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">File Storage</h3>
            <p className="text-sm text-muted-foreground">
              {usage.planName} plan
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Usage bar */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-medium">
                {formatBytes(usage.totalBytes)} / {limitDisplay}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.usagePercent >= 90
                    ? "bg-destructive"
                    : usage.usagePercent >= 70
                      ? "bg-yellow-500"
                      : "bg-primary"
                }`}
                style={{ width: `${Math.min(usage.usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Files uploaded</p>
              <p className="mt-1 text-2xl font-semibold">{usage.fileCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Space used</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatBytes(usage.totalBytes)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">File retention</p>
              <p className="mt-1 text-2xl font-semibold">{retentionDisplay}</p>
            </div>
          </div>

          {/* Upgrade CTA */}
          {usage.maxBytes !== -1 && usage.usagePercent >= 70 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {usage.usagePercent >= 90
                  ? "You're almost out of storage space."
                  : "You're using most of your storage."}
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Upgrade your plan for more storage and longer file retention.
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-yellow-800 underline hover:no-underline dark:text-yellow-200"
              >
                View plans
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
