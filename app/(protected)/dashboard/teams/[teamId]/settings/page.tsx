"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { updateTeam, deleteTeam } from "@/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateTeam(teamId, { name: name.trim() });
      toast.success("Team name updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted");
      router.push("/dashboard/teams");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete team");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/teams/${teamId}`}>
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Team Settings</h2>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="space-y-2">
          <Label htmlFor="teamName">Team Name</Label>
          <div className="flex gap-2">
            <Input
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new team name"
            />
            <Button onClick={handleUpdateName} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 p-6 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you delete a team, there is no going back. All team forms will
            be unlinked from the team.
          </p>
          {confirmDelete ? (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-1.5 size-4" />
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-4 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Team
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
