"use client";

import { useState } from "react";
import { TeamRole } from "@prisma/client";
import { MoreVertical, Shield, ShieldAlert, User, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { removeMember, updateMemberRole } from "@/actions/team-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: string;
  role: TeamRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MemberListProps {
  teamId: string;
  members: Member[];
  currentUserId: string;
  isOwnerOrAdmin: boolean;
}

const ROLE_BADGES: Record<TeamRole, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OWNER: { label: "Owner", variant: "default" },
  ADMIN: { label: "Admin", variant: "secondary" },
  MEMBER: { label: "Member", variant: "outline" },
};

export function MemberList({
  teamId,
  members,
  currentUserId,
  isOwnerOrAdmin,
}: MemberListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    setLoading(userId);
    try {
      await removeMember(teamId, userId);
      toast.success("Member removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, role: TeamRole) => {
    setLoading(userId);
    try {
      await updateMemberRole(teamId, userId, role);
      toast.success("Role updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-lg border">
      {members.map((member, i) => {
        const badge = ROLE_BADGES[member.role];
        const isCurrentUser = member.user.id === currentUserId;
        const isOwner = member.role === TeamRole.OWNER;

        return (
          <div
            key={member.id}
            className={`flex items-center justify-between px-4 py-3 ${
              i > 0 ? "border-t" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                {member.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.image}
                    alt=""
                    className="size-9 rounded-full"
                  />
                ) : (
                  <User className="size-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {member.user.name || "Unnamed"}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={badge.variant}>{badge.label}</Badge>

              {isOwnerOrAdmin && !isOwner && !isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={loading === member.user.id}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role !== TeamRole.ADMIN && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(member.user.id, TeamRole.ADMIN)
                        }
                      >
                        <ShieldAlert className="mr-2 size-4" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {member.role !== TeamRole.MEMBER && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleRoleChange(member.user.id, TeamRole.MEMBER)
                        }
                      >
                        <Shield className="mr-2 size-4" />
                        Make Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleRemove(member.user.id)}
                    >
                      <UserMinus className="mr-2 size-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
