"use server";

import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== UserRole.ADMIN) throw new Error("Admin only");
  return user;
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export async function getAdminStats() {
  await requireAdmin();

  const [
    totalUsers,
    totalForms,
    totalResponses,
    totalTeams,
    recentUsers,
    recentForms,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.form.count(),
    prisma.formResponse.count(),
    prisma.team.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { responses: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    totalForms,
    totalResponses,
    totalTeams,
    recentUsers,
    recentForms,
  };
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export async function getAdminUsers(
  page = 1,
  pageSize = 20,
  search?: string,
) {
  await requireAdmin();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        role: true,
        _count: {
          select: {
            forms: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
