/** System 2 — Subscription Engine. Reuses SubscriptionPlan + UserSubscription. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { SubscriptionInfo, SubscriptionEngineReport, PlanTier } from "./types";

const log = getLogger("subscription-engine");

export async function generateSubscriptionReport(): Promise<SubscriptionEngineReport> {
  const [plans, subs, activeCount] = await Promise.all([
    repo.fetchSubscriptionPlans(), repo.fetchUserSubscriptions(500), repo.countActiveSubscriptions(),
  ]);
  const planMap = new Map(plans.map(p => [p.id, p]));
  const subscriptions: SubscriptionInfo[] = subs.map(s => {
    const plan = planMap.get(s.planId);
    return {
      id: s.id, organizationId: null, userId: s.userId,
      tier: (plan?.tier ?? "free") as PlanTier,
      status: s.status as SubscriptionInfo["status"],
      seats: 1, usedSeats: 1,
      aiCreditsMonthly: plan?.aiCreditsMonthly ?? 0, aiCreditsUsed: 0,
      priceMonthly: plan?.priceMonthly ?? 0, priceYearly: plan?.priceYearly ?? 0,
      currency: plan?.currency ?? "USD",
      renewalAt: s.endDate?.toISOString() ?? null,
      startedAt: s.startDate?.toISOString() ?? s.createdAt.toISOString(),
    };
  });
  const totalActive = subscriptions.filter(s => s.status === "active").length;
  const totalTrialing = subscriptions.filter(s => s.status === "trialing").length;
  const totalCanceled = subscriptions.filter(s => s.status === "canceled").length;
  const byTier: Record<string, number> = {};
  for (const s of subscriptions) byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
  const totalMRR = subscriptions.filter(s => s.status === "active").reduce((sum, s) => sum + s.priceMonthly, 0);
  log.info("subscription.report_complete", { active: totalActive, mrr: totalMRR });
  return { generatedAt: new Date().toISOString(), subscriptions, totalActive: activeCount, totalTrialing, totalCanceled, byTier, totalMRR: Math.round(totalMRR * 100) / 100 };
}
