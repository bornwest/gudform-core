"use server";

import crypto from "crypto";

import { revalidatePath } from "next/cache";
import { TeamRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getEffectivePlanConfig } from "@/lib/subscription";
import { sendTeamInviteEmail } from "@/lib/team-invite-mail";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";

function generateTeamSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

export async function createTeam(name: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Check plan allows teams
  const planConfig = await getEffectivePlanConfig(user.id);
  if (planConfig.features.maxTeamMembers === 0) {
    throw new Error("Your plan does not support teams. Upgrade to Pro or Business to create teams.");
  }

  const team = await prisma.team.create({
    data: {
      name,
      slug: generateTeamSlug(name),
      members: {
        create: {
          userId: user.id,
          role: TeamRole.OWNER,
        },
      },
    },
  });

  revalidatePath("/dashboard/teams");
  return team;
}

export async function getTeams() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  return prisma.team.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      _count: { select: { members: true, forms: true } },
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeamById(teamId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      members: { some: { userId: user.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      forms: {
        include: { _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE } } } },
        orderBy: { updatedAt: "desc" },
      },
      collectionTeams: {
        include: {
          collection: {
            select: { id: true, name: true },
          },
        },
      },
      _count: { select: { members: true, forms: true } },
    },
  });

  return team;
}

export async function updateTeam(teamId: string, data: { name?: string }) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });
  if (!member) throw new Error("Permission denied");

  const updated = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  revalidatePath(`/dashboard/teams/${teamId}`);
  return updated;
}

export async function deleteTeam(teamId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, role: TeamRole.OWNER },
  });
  if (!member) throw new Error("Only the owner can delete the team");

  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/dashboard/teams");
}

export async function inviteToTeam(
  teamId: string,
  email: string,
  role: TeamRole = TeamRole.MEMBER,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });
  if (!member) throw new Error("Permission denied");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  if (!team) throw new Error("Team not found");

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (existingMember) throw new Error("User is already a member");
  }

  const existingInvite = await prisma.teamInvite.findFirst({
    where: { teamId, email: normalizedEmail },
  });
  if (existingInvite) {
    await prisma.teamInvite.delete({ where: { id: existingInvite.id } });
  }

  const invite = await prisma.teamInvite.create({
    data: {
      teamId,
      email: normalizedEmail,
      role,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  let emailSent = false;
  try {
    emailSent = await sendTeamInviteEmail({
      to: normalizedEmail,
      teamName: team.name,
      inviterName: user.name || user.email || "A teammate",
      token: invite.token,
    });
  } catch (error) {
    console.error("Failed to send team invite email", error);
  }

  revalidatePath(`/dashboard/teams/${teamId}`);
  return { ...invite, emailSent };
}

export async function getInvitePreview(token: string) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  if (!invite) return { status: "invalid" as const };
  if (invite.expiresAt < new Date()) {
    return { status: "expired" as const };
  }

  return {
    status: "ok" as const,
    email: invite.email,
    teamName: invite.team.name,
    role: invite.role,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptInviteForUser(
  userId: string,
  email: string,
  token: string,
) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
  });

  if (!invite) throw new Error("Invalid invite");
  if (invite.expiresAt < new Date()) {
    await prisma.teamInvite.delete({ where: { id: invite.id } });
    throw new Error("Invite has expired");
  }

  if (email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error(
      `This invitation was sent to ${invite.email}. Use that email to join.`,
    );
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId } },
  });
  if (existing) {
    await prisma.teamInvite.delete({ where: { id: invite.id } });
    return invite.teamId;
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: invite.role,
      },
    }),
    prisma.teamInvite.delete({ where: { id: invite.id } }),
  ]);

  revalidatePath("/dashboard/teams");
  return invite.teamId;
}

export async function acceptInvite(token: string) {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) {
    throw new Error("Sign in to accept this invitation.");
  }
  return acceptInviteForUser(user.id, user.email, token);
}

export async function removeMember(teamId: string, userId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const actorMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });
  if (!actorMember) throw new Error("Permission denied");

  // Prevent removing the owner
  const targetMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (targetMember?.role === TeamRole.OWNER) {
    throw new Error("Cannot remove the team owner");
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  revalidatePath(`/dashboard/teams/${teamId}`);
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole,
) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const actorMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, role: TeamRole.OWNER },
  });
  if (!actorMember) throw new Error("Only the owner can change roles");

  if (role === TeamRole.OWNER) {
    throw new Error("Cannot assign owner role");
  }

  await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role },
  });

  revalidatePath(`/dashboard/teams/${teamId}`);
}

export async function getTeamForms(teamId: string) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id },
  });
  if (!member) throw new Error("Not a member of this team");

  return prisma.form.findMany({
    where: { teamId },
    include: {
      _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE }, questions: true } },
      user: { select: { name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
