"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/actions/team-actions";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UserAuthForm } from "@/components/forms/user-auth-form";

export function InviteAcceptClient({
  token,
  teamName,
  invitedEmail,
  signedInEmail,
}: {
  token: string;
  teamName: string;
  invitedEmail: string;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = Boolean(signedInEmail);
  const emailMatches =
    signedInEmail?.toLowerCase() === invitedEmail.toLowerCase();

  useEffect(() => {
    if (!signedIn || !emailMatches) return;
    let cancelled = false;
    (async () => {
      setAccepting(true);
      try {
        const teamId = await acceptInvite(token);
        if (cancelled) return;
        toast.success(`You have joined ${teamName}.`);
        router.push(`/dashboard/teams/${teamId}`);
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to accept invite",
          );
          setAccepting(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, emailMatches, token, teamName, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-8 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Join {teamName}</h1>
          <p className="mt-2 text-muted-foreground">
            You were invited as <strong>{invitedEmail}</strong>. Create an
            account or sign in with that email, then you will find the team
            under Dashboard → Teams.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {signedIn && !emailMatches && (
          <p className="text-center text-sm text-muted-foreground">
            You are signed in as {signedInEmail}. Sign out and use{" "}
            {invitedEmail} to accept this invite.{" "}
            <Link href="/dashboard" className="text-green-600 hover:underline">
              Go to dashboard
            </Link>
          </p>
        )}

        {signedIn && emailMatches && (
          <Button disabled={accepting} className="w-full" size="lg">
            {accepting ? "Joining..." : "Joining team..."}
          </Button>
        )}

        {!signedIn && (
          <>
            <UserAuthForm
              type="register"
              defaultEmail={invitedEmail}
              emailReadOnly
              inviteToken={token}
            />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account, or want to continue with Google?{" "}
              <Link
                href={`/login?from=${encodeURIComponent(`/invite/${token}`)}`}
                className="text-green-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
