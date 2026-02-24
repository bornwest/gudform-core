"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/actions/team-actions";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const teamId = await acceptInvite(token);
      toast.success("You have joined the team!");
      router.push(`/dashboard/teams/${teamId}`);
    } catch (err: any) {
      setError(err.message || "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Users className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Team Invitation</h1>
          <p className="mt-2 text-muted-foreground">
            You have been invited to join a team on GudForm.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full"
          size="lg"
        >
          {accepting ? "Joining..." : "Accept Invitation"}
        </Button>

        <p className="text-xs text-muted-foreground">
          You need to be signed in to accept this invitation.
        </p>
      </div>
    </div>
  );
}
