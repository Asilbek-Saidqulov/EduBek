/**
 * Subscription Lifecycle & Period-Bound Quota Engine
 */

import { SubscriptionTier } from "./types";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_CREDIT_EXPIRATION_DAYS } from "./constants";
import { economyStore, StoredUserSubscription } from "./store";
import { mintCreditLot } from "./lots";
import { initiateCheckout } from "./payments";
import { ApiError } from "@/lib/errors";

export interface UserSubscriptionDto {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: string;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  orderId?: string;
  planName: string;
  monthlyQuota: number;
}

export function getUserSubscription(userId: string): UserSubscriptionDto {
  let sub = economyStore.subscriptions.get(userId);
  const now = new Date();

  if (!sub) {
    // Default to FREE tier
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_CREDIT_EXPIRATION_DAYS * 86400000);
    sub = {
      id: `sub_${userId}`,
      userId,
      tier: "FREE",
      status: "ACTIVE",
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      autoRenew: false,
      updatedAt: now,
    };
    economyStore.subscriptions.set(userId, sub);
  }

  const plan = SUBSCRIPTION_PLANS[sub.tier] || SUBSCRIPTION_PLANS.FREE;

  return {
    id: sub.id,
    userId: sub.userId,
    tier: sub.tier,
    status: sub.status,
    startedAt: sub.startedAt.toISOString(),
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    autoRenew: sub.autoRenew,
    orderId: sub.orderId,
    planName: plan.name,
    monthlyQuota: plan.aiCreditsMonthly,
  };
}

export async function subscribeToPlan(userId: string, tier: SubscriptionTier, returnUrl?: string) {
  if (tier === "FREE") {
    const sub = getUserSubscription(userId);
    const storeSub = economyStore.subscriptions.get(userId)!;
    storeSub.tier = "FREE";
    storeSub.status = "ACTIVE";
    storeSub.autoRenew = false;
    storeSub.updatedAt = new Date();
    return { success: true, message: "Switched to Free plan" };
  }

  return await initiateCheckout({
    userId,
    itemType: "SUBSCRIPTION",
    itemId: tier,
    returnUrl,
  });
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
  const sub = economyStore.subscriptions.get(userId);
  if (!sub) {
    throw new ApiError(404, "No active subscription found", undefined, undefined, "SUBSCRIPTION_NOT_FOUND");
  }

  sub.autoRenew = false;
  sub.updatedAt = new Date();

  return {
    success: true,
    message: "Subscription auto-renewal disabled. You will retain plan features until the end of your billing period.",
  };
}

/**
 * Renews subscription period and idempotent monthly credit quota allocation.
 */
export async function renewSubscriptionPeriod(userId: string): Promise<UserSubscriptionDto> {
  const sub = economyStore.subscriptions.get(userId);
  if (!sub || sub.status !== "ACTIVE" || !sub.autoRenew) {
    throw new ApiError(400, "Cannot renew non-active or non-renewing subscription", undefined, undefined, "CANNOT_RENEW");
  }

  const now = new Date();
  const plan = SUBSCRIPTION_PLANS[sub.tier];
  const newPeriodEnd = new Date(now.getTime() + SUBSCRIPTION_CREDIT_EXPIRATION_DAYS * 86400000);

  sub.currentPeriodStart = now;
  sub.currentPeriodEnd = newPeriodEnd;
  sub.updatedAt = now;

  // Mint new quota lot
  await mintCreditLot({
    userId,
    source: "SUBSCRIPTION",
    units: plan.aiCreditsMonthly,
    subscriptionPeriodId: sub.id,
    expiresAt: newPeriodEnd,
  });

  return getUserSubscription(userId);
}
