import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getTeamById } from "@/actions/team-actions";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { MemberList } from "@/components/teams/member-list";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";
import { Badge } from "@/components/ui/badge";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await getTeamById(teamId);
  if (!team) notFound();

  const currentMember = team.members.find((m) => m.user.id === user.id);
  const isOwnerOrAdmin =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/teams">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{team.name}</h2>
            <Badge variant="secondary">{team._count.members} members</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {team._count.forms} forms
          </p>
        </div>
        {isOwnerOrAdmin && (
          <div className="flex gap-2">
            <InviteMemberDialog teamId={teamId} />
            <Link href={`/dashboard/teams/${teamId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="mr-1.5 size-4" />
                Settings
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Members</h3>
        <MemberList
          teamId={teamId}
          members={team.members}
          currentUserId={user.id!}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Team Forms</h3>
        {team.forms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No forms assigned to this team yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {team.forms.map((form) => (
              <Link
                key={form.id}
                href={`/dashboard/forms/${form.id}/builder`}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <h4 className="font-medium">{form.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form._count.responses} responses
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
