"use server";

import { UserRole } from "@prisma/client";

import { isSaasEdition } from "@/config/edition";
import { prisma } from "@/lib/db";
import { saasPrisma } from "@/lib/saas-prisma";
import { getCurrentUser } from "@/lib/session";
import { COUNTABLE_RESPONSE_WHERE } from "@/lib/response-counts";
import { SubscriptionPlan } from "@/config/subscriptions";

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

  const saas = isSaasEdition();
  const [
    totalUsers,
    totalForms,
    totalResponses,
    totalTeams,
    planCounts,
    recentUsers,
    recentForms,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.form.count(),
    prisma.formResponse.count(),
    prisma.team.count(),
    saas
      ? saasPrisma().subscription.groupBy({
          by: ["plan"],
          _count: { plan: true },
        })
      : Promise.resolve(
          [] as { plan: SubscriptionPlan; _count: { plan: number } }[],
        ),
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
        _count: { select: { responses: { where: COUNTABLE_RESPONSE_WHERE } } },
      },
    }),
  ]);

  const planDistribution: Record<string, number> = {
    FREE: 0,
    STARTER: 0,
    PRO: 0,
    BUSINESS: 0,
  };
  for (const p of planCounts) {
    planDistribution[p.plan] = p._count.plan;
  }

  let recentUsersWithPlan = recentUsers.map((u) => ({
    ...u,
    subscription: null as { plan: SubscriptionPlan } | null,
  }));
  if (saas && recentUsers.length > 0) {
    const subs = await saasPrisma().subscription.findMany({
      where: { userId: { in: recentUsers.map((u) => u.id) } },
      select: { userId: true, plan: true },
    });
    const byUser = new Map<string, { plan: SubscriptionPlan }>(
      subs.map((s: { userId: string; plan: SubscriptionPlan }) => [
        s.userId,
        { plan: s.plan },
      ]),
    );
    recentUsersWithPlan = recentUsers.map((u) => ({
      ...u,
      subscription: byUser.get(u.id) ?? null,
    }));
  }

  return {
    totalUsers,
    totalForms,
    totalResponses,
    totalTeams,
    planDistribution,
    recentUsers: recentUsersWithPlan,
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

  let usersWithSub = users.map((u) => ({
    ...u,
    subscription: null as {
      plan: SubscriptionPlan;
      stripeCurrentPeriodEnd: Date | null;
      stripeSubscriptionId: string | null;
    } | null,
  }));
  if (isSaasEdition() && users.length > 0) {
    const subs = await saasPrisma().subscription.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
      select: {
        userId: true,
        plan: true,
        stripeCurrentPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });
    const byUser = new Map<
      string,
      {
        plan: SubscriptionPlan;
        stripeCurrentPeriodEnd: Date | null;
        stripeSubscriptionId: string | null;
      }
    >(
      subs.map(
        (s: {
          userId: string;
          plan: SubscriptionPlan;
          stripeCurrentPeriodEnd: Date | null;
          stripeSubscriptionId: string | null;
        }) => [
          s.userId,
          {
            plan: s.plan,
            stripeCurrentPeriodEnd: s.stripeCurrentPeriodEnd,
            stripeSubscriptionId: s.stripeSubscriptionId,
          },
        ],
      ),
    );
    usersWithSub = users.map((u) => ({
      ...u,
      subscription: byUser.get(u.id) ?? null,
    }));
  }

  return {
    users: usersWithSub,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Gift / update subscription
// ---------------------------------------------------------------------------

export async function giftSubscription(
  userId: string,
  plan: SubscriptionPlan,
) {
  await requireAdmin();
  if (!isSaasEdition()) {
    throw new Error("Subscriptions are not available on self-host");
  }

  // Upsert subscription record — no Stripe involved for gifted plans
  const subscription = await saasPrisma().subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
    },
    update: {
      plan,
    },
  });

  return subscription;
}

export async function revokeSubscription(userId: string) {
  await requireAdmin();
  if (!isSaasEdition()) {
    throw new Error("Subscriptions are not available on self-host");
  }

  const subscription = await saasPrisma().subscription.findUnique({
    where: { userId },
  });

  if (!subscription) throw new Error("No subscription found");

  await saasPrisma().subscription.update({
    where: { userId },
    data: {
      plan: SubscriptionPlan.FREE,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  return { success: true };
}
