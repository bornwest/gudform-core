import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getTeams } from "@/actions/team-actions";
import { DashboardHeader } from "@/components/dashboard/header";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";

export const metadata = {
  title: "Teams",
  description: "Manage your teams and workspaces",
};

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const teams = await getTeams();

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <DashboardHeader heading="Teams" text="Create and manage your teams.">
        <CreateTeamDialog />
      </DashboardHeader>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">No teams yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a team to collaborate with others on forms.
            </p>
          </div>
          <CreateTeamDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <a
              key={team.id}
              href={`/dashboard/teams/${team.id}`}
              className="group rounded-xl border p-6 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-primary">
                    {team.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {team.members[0]?.role || "Member"}
                  </p>
                </div>
                <Users className="size-5 text-muted-foreground" />
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span>{team._count.members} members</span>
                <span>{team._count.forms} forms</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
