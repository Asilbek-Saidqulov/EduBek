/**
 * EduBek — Subscription repository.
 *
 * The ONLY layer in this feature that imports `db`. The service composes
 * these primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";
import type { CreatePlanBody, UpdatePlanBody } from "./schema";

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function findPlans(includeInactive = false) {
  return db.subscriptionPlan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { priceMonthly: "asc" },
  });
}

export async function findPlanById(id: string) {
  return db.subscriptionPlan.findUnique({ where: { id } });
}

export async function findPlanByTier(tier: string) {
  return db.subscriptionPlan.findUnique({ where: { tier } });
}

export async function createPlan(input: CreatePlanBody) {
  return db.subscriptionPlan.create({
    data: {
      name: input.name,
      tier: input.tier,
      priceMonthly: input.priceMonthly,
      priceYearly: input.priceYearly,
      currency: input.currency,
      features: input.features ? JSON.stringify(input.features) : null,
      aiCreditsMonthly: input.aiCreditsMonthly,
      isActive: input.isActive,
    },
  });
}

export async function updatePlan(id: string, input: UpdatePlanBody) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.tier !== undefined) data.tier = input.tier;
  if (input.priceMonthly !== undefined) data.priceMonthly = input.priceMonthly;
  if (input.priceYearly !== undefined) data.priceYearly = input.priceYearly;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.features !== undefined)
    data.features = input.features ? JSON.stringify(input.features) : null;
  if (input.aiCreditsMonthly !== undefined)
    data.aiCreditsMonthly = input.aiCreditsMonthly;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  return db.subscriptionPlan.update({ where: { id }, data });
}

export async function deletePlan(id: string) {
  return db.subscriptionPlan.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// User subscriptions
// ---------------------------------------------------------------------------

export async function findActiveSubscription(userId: string) {
  return db.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "past_due"] },
    },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function findSubscriptionById(id: string) {
  return db.userSubscription.findUnique({
    where: { id },
    include: { plan: true },
  });
}

export async function findSubscriptionsByUser(userId: string) {
  return db.userSubscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function createSubscription(data: {
  userId: string;
  planId: string;
  status?: string;
  currentPeriodEnd?: Date;
  autoRenew?: boolean;
  stripeSubscriptionId?: string;
}) {
  return db.userSubscription.create({
    data: {
      userId: data.userId,
      planId: data.planId,
      status: data.status ?? "active",
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      autoRenew: data.autoRenew ?? false,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
    },
    include: { plan: true },
  });
}

export async function updateSubscriptionStatus(
  id: string,
  data: {
    status?: string;
    currentPeriodEnd?: Date;
    autoRenew?: boolean;
    cancelledAt?: Date | null;
    planId?: string;
    stripeSubscriptionId?: string | null;
  },
) {
  return db.userSubscription.update({
    where: { id },
    data,
    include: { plan: true },
  });
}

export async function findExpiringSubscriptions(withinHours: number) {
  const cutoff = new Date(Date.now() + withinHours * 3600_000);
  return db.userSubscription.findMany({
    where: {
      status: "active",
      autoRenew: false,
      currentPeriodEnd: { lte: cutoff, gte: new Date() },
    },
    include: { plan: true },
  });
}
