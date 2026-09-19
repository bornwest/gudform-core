import Link from "next/link";
import { Users } from "lucide-react";

import { getInvitePreview } from "@/actions/team-actions";
import { getCurrentUser } from "@/lib/session";
import { InviteAcceptClient } from "@/components/teams/invite-accept-client";

export const metadata = {
  title: "Team invitation",
  description: "Create an account or sign in to join this team.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitePreview(token);
  const user = await getCurrentUser();

  if (preview.status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="mx-auto w-full max-w-md space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Invitation unavailable</h1>
          <p className="text-muted-foreground">
            {preview.status === "expired"
              ? "This invitation has expired. Ask a team admin to send a new one."
              : "This invitation is invalid or has already been used."}
          </p>
          <Link href="/login" className="text-sm text-green-600 hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InviteAcceptClient
      token={token}
      teamName={preview.teamName}
      invitedEmail={preview.email}
      signedInEmail={user?.email ?? null}
    />
  );
}
