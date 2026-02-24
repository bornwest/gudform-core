"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { TeamRole } from "@prisma/client";
import { toast } from "sonner";

import { inviteToTeam } from "@/actions/team-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteMemberDialogProps {
  teamId: string;
}

export function InviteMemberDialog({ teamId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const invite = await inviteToTeam(teamId, email.trim(), role);
      const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard!");
      setOpen(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1.5 size-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Generate an invite link for a new team member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as TeamRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={sending || !email.trim()}
          >
            {sending ? "Creating invite..." : "Create Invite Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
