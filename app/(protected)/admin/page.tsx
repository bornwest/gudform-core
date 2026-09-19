import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/actions/admin-actions";
import { UserRole } from "@prisma/client";
import { ArrowRight, FileText, Inbox, Users, Users2 } from "lucide-react";

import { SubscriptionPlan } from "@/config/subscriptions";

import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";

export const metadata = {
  title: "Admin Panel",
  description: "GudForm admin dashboard",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");

  const stats = await getAdminStats();

  return (
    <div>
      <DashboardHeader
        heading="Admin Panel"
        text="Platform overview and management."
      />

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
              <Users className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2.5 dark:bg-teal-900/30">
              <FileText className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Forms</p>
              <p className="text-2xl font-bold">{stats.totalForms}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
              <Inbox className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
              <p className="text-2xl font-bold">{stats.totalResponses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
              <Users2 className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Teams</p>
              <p className="text-2xl font-bold">{stats.totalTeams}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">
          Subscription Distribution
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          {(
            [
              {
                plan: "FREE",
                label: "Free",
                color: "bg-gray-100 dark:bg-gray-800",
              },
              {
                plan: "STARTER",
                label: "Starter",
                color: "bg-green-100 dark:bg-green-900/30",
              },
              {
                plan: "PRO",
                label: "Pro",
                color: "bg-green-100 dark:bg-green-900/30",
              },
              {
                plan: "BUSINESS",
                label: "Business",
                color: "bg-teal-100 dark:bg-teal-900/30",
              },
            ] as const
          ).map(({ plan, label, color }) => (
            <Card key={plan} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
                >
                  {stats.planDistribution[plan]} users
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold">
                {stats.totalUsers > 0
                  ? Math.round(
                      ((stats.planDistribution[plan] || 0) / stats.totalUsers) *
                        100,
                    )
                  : 0}
                %
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Recent Users */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <Card>
            <div className="divide-y">
              {stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {u.name || "Unnamed"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {u.subscription?.plan || "FREE"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt.toISOString())}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentUsers.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No users yet
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Forms */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Forms</h3>
          </div>
          <Card>
            <div className="divide-y">
              {stats.recentForms.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{f.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      by {f.user.name || f.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {f._count.responses} responses
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(f.createdAt.toISOString())}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentForms.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No forms yet
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
