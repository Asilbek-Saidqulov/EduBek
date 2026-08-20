/**
 * EduBek — Subscription service.
 *
 * The subscription service is the platform-wide feature gate: it owns the
 * SubscriptionPlan catalogue, the user's current UserSubscription, and the
 * derived entitlement limits used by the rest of the codebase.
 *
 * Events published:
 *   • SUBSCRIPTION_STARTED   — when a user starts a new subscription
 *   • SUBSCRIPTION_CANCELLED — when a user cancels (still active until period end)
 *   • SUBSCRIPTION_UPGRADED  — when moving to a higher tier
 *   • SUBSCRIPTION_DOWNGRADED — when moving to a lower tier
 *   • SUBSCRIPTION_RENEWED   — when the current period is extended
 *   • FEATURE_LIMIT_REACHED  — when consumeUsage crosses the limit
 */
import { logger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import { can, PersonalPermission, type AuthContext } from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  FEATURE_LIMIT_REACHED,
  SUBSCRIPTION_CANCELLED,
  SUBSCRIPTION_DOWNGRADED,
  SUBSCRIPTION_RENEWED,
  SUBSCRIPTION_STARTED,
  SUBSCRIPTION_UPGRADED,
  type FeatureLimitReachedEvent,
  type SubscriptionEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import type {
  FeatureCheckResult,
  SubscriptionFeature,
  SubscriptionLimits,
  SubscriptionPlanDto,
  UserSubscriptionDto,
} from "./types";

const log = logger.child({ module: "subscription-service" });

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapPlan(p: any): SubscriptionPlanDto {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    currency: p.currency,
    features: p.features ? safeParse(p.features) : null,
    aiCreditsMonthly: p.aiCreditsMonthly,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapSubscription(s: any): UserSubscriptionDto {
  return {
    id: s.id,
    userId: s.userId,
    planId: s.planId,
    planTier: s.plan?.tier ?? "free",
    planName: s.plan?.name ?? "Free",
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
    autoRenew: s.autoRenew,
    stripeSubscriptionId: s.stripeSubscriptionId ?? null,
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
  };
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Defaults / Free tier fallback
// ---------------------------------------------------------------------------

/** Plan-tier ordering — used to decide whether a transition is an upgrade. */
const TIER_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  ultra: 3,
  enterprise: 4,
};

function tierRank(tier: string): number {
  return TIER_RANK[tier.toLowerCase()] ?? 0;
}

const FREE_PLAN_FALLBACK: SubscriptionPlanDto = {
  id: "free",
  name: "Free",
  tier: "free",
  priceMonthly: 0,
  priceYearly: 0,
  currency: "USD",
  features: {},
  aiCreditsMonthly: 5,
  isActive: true,
  createdAt: new Date(0).toISOString(),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getPlans(): Promise<SubscriptionPlanDto[]> {
  const plans = await repo.findPlans();
  return plans.map(mapPlan);
}

export async function getCurrentSubscription(
  ctx: AuthContext,
): Promise<UserSubscriptionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.SUBSCRIPTION_VIEW)) {
    throw forbidden("No permission to view subscription");
  }
  const sub = await repo.findActiveSubscription(ctx.userId);
  if (!sub) {
    return {
      id: "none",
      userId: ctx.userId,
      planId: FREE_PLAN_FALLBACK.id,
      planTier: FREE_PLAN_FALLBACK.tier,
      planName: FREE_PLAN_FALLBACK.name,
      status: "active",
      startedAt: new Date(0).toISOString(),
      currentPeriodEnd: null,
      autoRenew: false,
      stripeSubscriptionId: null,
      cancelledAt: null,
    };
  }
  return mapSubscription(sub);
}

export async function subscribe(
  ctx: AuthContext,
  planTier: string,
  billingCycle: "monthly" | "yearly",
): Promise<UserSubscriptionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.SUBSCRIPTION_MANAGE_SELF)) {
    throw forbidden("No permission to manage subscription");
  }
  const plan = await repo.findPlanByTier(planTier);
  if (!plan || !plan.isActive) throw notFound("Plan not found");
  if (plan.tier === "free") throw badRequest("Cannot subscribe to free plan");

  const existing = await repo.findActiveSubscription(ctx.userId);
  if (existing && existing.status === "active") {
    throw badRequest("Already subscribed — use upgrade/downgrade instead");
  }

  const periodEnd = new Date(
    Date.now() +
      (billingCycle === "yearly" ? 365 : 30) * 24 * 3600_000,
  );

  const sub = await repo.createSubscription({
    userId: ctx.userId,
    planId: plan.id,
    status: "active",
    currentPeriodEnd: periodEnd,
    autoRenew: true,
  });

  const dto = mapSubscription(sub);
  eventBus.publish(
    buildEvent<SubscriptionEvent>({
      type: SUBSCRIPTION_STARTED,
      actorId: ctx.userId,
      userId: ctx.userId,
      subscriptionId: sub.id,
      planId: plan.id,
      planTier: plan.tier,
      occurredAt: new Date(),
    }),
  );
  log.info("subscription.started", {
    userId: ctx.userId,
    planTier: plan.tier,
    billingCycle,
  });
  return dto;
}

export async function cancelSubscription(
  ctx: AuthContext,
): Promise<UserSubscriptionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.SUBSCRIPTION_MANAGE_SELF)) {
    throw forbidden("No permission to manage subscription");
  }
  const sub = await repo.findActiveSubscription(ctx.userId);
  if (!sub) throw notFound("No active subscription");
  if (sub.status === "cancelled") throw badRequest("Already cancelled");

  const updated = await repo.updateSubscriptionStatus(sub.id, {
    status: "cancelled",
    autoRenew: false,
    cancelledAt: new Date(),
  });

  const dto = mapSubscription(updated);
  eventBus.publish(
    buildEvent<SubscriptionEvent>({
      type: SUBSCRIPTION_CANCELLED,
      actorId: ctx.userId,
      userId: ctx.userId,
      subscriptionId: sub.id,
      planId: sub.planId,
      planTier: sub.plan?.tier,
      occurredAt: new Date(),
    }),
  );
  log.info("subscription.cancelled", { userId: ctx.userId });
  return dto;
}

export async function upgradeSubscription(
  ctx: AuthContext,
  newTier: string,
): Promise<UserSubscriptionDto> {
  return changeTier(ctx, newTier, "upgrade");
}

export async function downgradeSubscription(
  ctx: AuthContext,
  newTier: string,
): Promise<UserSubscriptionDto> {
  return changeTier(ctx, newTier, "downgrade");
}

async function changeTier(
  ctx: AuthContext,
  newTier: string,
  direction: "upgrade" | "downgrade",
): Promise<UserSubscriptionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.SUBSCRIPTION_MANAGE_SELF)) {
    throw forbidden("No permission to manage subscription");
  }
  const newPlan = await repo.findPlanByTier(newTier);
  if (!newPlan || !newPlan.isActive) throw notFound("Plan not found");

  const sub = await repo.findActiveSubscription(ctx.userId);
  if (!sub) throw notFound("No active subscription");
  const currentTier = sub.plan?.tier ?? "free";
  if (currentTier === newTier) throw badRequest("Already on this tier");

  const isUpgrade = tierRank(newTier) > tierRank(currentTier);
  if (direction === "upgrade" && !isUpgrade) {
    throw badRequest("Use downgrade endpoint to move to a lower tier");
  }
  if (direction === "downgrade" && isUpgrade) {
    throw badRequest("Use upgrade endpoint to move to a higher tier");
  }

  const updated = await repo.updateSubscriptionStatus(sub.id, {
    planId: newPlan.id,
    currentPeriodEnd: new Date(
      Date.now() + 30 * 24 * 3600_000,
    ),
  });

  const dto = mapSubscription(updated);
  const eventType =
    direction === "upgrade" ? SUBSCRIPTION_UPGRADED : SUBSCRIPTION_DOWNGRADED;
  eventBus.publish(
    buildEvent<SubscriptionEvent>({
      type: eventType,
      actorId: ctx.userId,
      userId: ctx.userId,
      subscriptionId: sub.id,
      planId: newPlan.id,
      planTier: newPlan.tier,
      occurredAt: new Date(),
    }),
  );
  log.info(`subscription.${direction}d`, {
    userId: ctx.userId,
    from: currentTier,
    to: newTier,
  });
  return dto;
}

export async function renewSubscription(
  ctx: AuthContext,
): Promise<UserSubscriptionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.SUBSCRIPTION_MANAGE_SELF)) {
    throw forbidden("No permission to manage subscription");
  }
  const sub = await repo.findActiveSubscription(ctx.userId);
  if (!sub) throw notFound("No active subscription");
  if (sub.status === "cancelled") throw badRequest("Cannot renew a cancelled subscription");

  const periodEnd =
    sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()
      ? new Date(sub.currentPeriodEnd.getTime() + 30 * 24 * 3600_000)
      : new Date(Date.now() + 30 * 24 * 3600_000);

  const updated = await repo.updateSubscriptionStatus(sub.id, {
    status: "active",
    currentPeriodEnd: periodEnd,
    cancelledAt: null,
  });

  const dto = mapSubscription(updated);
  eventBus.publish(
    buildEvent<SubscriptionEvent>({
      type: SUBSCRIPTION_RENEWED,
      actorId: ctx.userId,
      userId: ctx.userId,
      subscriptionId: sub.id,
      planId: sub.planId,
      planTier: sub.plan?.tier,
      occurredAt: new Date(),
    }),
  );
  log.info("subscription.renewed", { userId: ctx.userId });
  return dto;
}

// ---------------------------------------------------------------------------
// Limits / feature gate
// ---------------------------------------------------------------------------

export async function getSubscriptionLimits(
  ctx: AuthContext,
): Promise<SubscriptionLimits> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const sub = await repo.findActiveSubscription(ctx.userId);
  const plan = sub?.plan;
  return planToLimits(plan);
}

export async function canUseFeature(
  ctx: AuthContext,
  feature: SubscriptionFeature,
): Promise<FeatureCheckResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const limits = await getSubscriptionLimits(ctx);
  const limit = featureLimit(limits, feature);
  // Hard-gated features (boolean) cannot be used at all when disabled.
  if (limit === 0) {
    return {
      feature,
      allowed: false,
      limit: 0,
      current: 0,
      remaining: 0,
      reason: "Feature not available on your plan",
    };
  }
  const current = await currentUsage(ctx.userId, feature);
  const remaining = Math.max(0, limit - current);
  const allowed = current < limit;
  return {
    feature,
    allowed,
    limit,
    current,
    remaining,
    reason: allowed ? undefined : "Monthly quota reached",
  };
}

export async function consumeUsage(
  ctx: AuthContext,
  feature: SubscriptionFeature,
  amount = 1,
): Promise<void> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  // Fire-and-forget — usage tracking should never block the calling flow.
  const limits = await getSubscriptionLimits(ctx);
  const limit = featureLimit(limits, feature);
  if (limit <= 0) return;

  // Persist the usage itself. `currentUsage()` (below) counts
  // AnalyticsEvent rows for this feature to derive the caller's usage
  // this month — but nothing ever wrote one, so every call to
  // `canUseFeature`/`getRemainingUsage` saw 0 usage and the monthly
  // quota could never actually be reached. `amount` extra rows are
  // recorded so metered features (e.g. bulk operations) count
  // correctly against the same query `currentUsage()` runs.
  try {
    const { db } = await import("@/lib/db");
    const events = Array.from({ length: Math.max(1, Math.floor(amount)) }, () => ({
      userId: ctx.userId!,
      eventName: feature,
      occurredAt: new Date(),
    }));
    await db.analyticsEvent.createMany({ data: events });
  } catch (err) {
    log.warn("usage_record_failed", {
      userId: ctx.userId,
      feature,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const current = await currentUsage(ctx.userId, feature);
  if (current >= limit) {
    eventBus.publish(
      buildEvent<FeatureLimitReachedEvent>({
        type: FEATURE_LIMIT_REACHED,
        actorId: ctx.userId,
        userId: ctx.userId,
        feature,
        limit,
        current,
        occurredAt: new Date(),
      }),
    );
  }
}

export async function getRemainingUsage(
  ctx: AuthContext,
  feature: SubscriptionFeature,
): Promise<number> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const limits = await getSubscriptionLimits(ctx);
  const limit = featureLimit(limits, feature);
  if (limit <= 0) return 0;
  const current = await currentUsage(ctx.userId, feature);
  return Math.max(0, limit - current);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function planToLimits(plan: any): SubscriptionLimits {
  const features = plan?.features ? safeParse(plan.features) : {};
  const tier = (plan?.tier ?? "free").toLowerCase();
  return {
    aiCredits: plan?.aiCreditsMonthly ?? 0,
    resourceLimit: numFeature(features, "resourceLimit", tier === "free" ? 25 : 1000),
    marketplacePublish: tier !== "free",
    collections: numFeature(features, "collections", tier === "free" ? 3 : 50),
    organizations: numFeature(features, "organizations", tier === "free" ? 1 : 10),
    teamMembers: numFeature(features, "teamMembers", tier === "free" ? 1 : 25),
    premiumAI: tier === "ultra" || tier === "enterprise",
    premiumTemplates: tier !== "free",
    monthlyQuotas: {
      ai_generate: plan?.aiCreditsMonthly ?? 0,
      collection_create: numFeature(features, "collections", tier === "free" ? 3 : 50),
      organization_create: numFeature(features, "organizations", tier === "free" ? 1 : 10),
      marketplace_publish: tier === "free" ? 5 : 1000,
    },
  };
}

function numFeature(
  features: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const v = features[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function featureLimit(
  limits: SubscriptionLimits,
  feature: SubscriptionFeature,
): number {
  switch (feature) {
    case "ai_generate":
      return limits.aiCredits;
    case "ai_premium":
      return limits.premiumAI ? 1 : 0;
    case "marketplace_publish":
      return limits.marketplacePublish ? limits.monthlyQuotas.marketplace_publish ?? 0 : 0;
    case "premium_templates":
      return limits.premiumTemplates ? 1 : 0;
    case "collection_create":
      return limits.monthlyQuotas.collection_create ?? limits.collections;
    case "organization_create":
      return limits.monthlyQuotas.organization_create ?? limits.organizations;
    default:
      return 0;
  }
}

/**
 * Best-effort usage counter. We use AnalyticsEvent rows as the source of truth
 * — every feature use publishes an event, and we count the matching rows for
 * the current calendar month. If the table is unavailable (e.g. a fresh
 * sandbox DB) we gracefully degrade to 0.
 */
async function currentUsage(
  userId: string,
  feature: SubscriptionFeature,
): Promise<number> {
  try {
    const { db } = await import("@/lib/db");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const count = await db.analyticsEvent.count({
      where: {
        userId,
        eventName: feature,
        occurredAt: { gte: startOfMonth },
      },
    });
    return count;
  } catch (err) {
    log.warn("usage_count_failed", {
      userId,
      feature,
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
