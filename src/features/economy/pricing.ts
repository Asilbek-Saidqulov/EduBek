/**
 * Server-Authoritative Pricing Policy & Quoting Engine
 * Guarantees that clients can never submit authoritative prices.
 */

import { Currency, OrderType, SubscriptionTier } from "./types";
import { AI_CREDIT_PACKS, SUBSCRIPTION_PLANS, CreditPackConfig } from "./constants";
import { ApiError } from "@/lib/errors";

export interface PricingQuote {
  type: OrderType;
  quotedAmountMinor: bigint;
  currency: Currency;
  pricingPolicyCode: string;
  pricingPolicyVersion: number;
  itemSummary: string;
  metadata: any;
}

export const CURRENT_PRICING_POLICY = {
  code: "EDUBEK_PRICING_2026_V1",
  version: 1,
};

/**
 * Quotes an AI Credit Pack strictly from server configuration.
 */
export function quoteCreditPack(packId: string): PricingQuote {
  const pack = AI_CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    throw new ApiError(404, `AI Credit Pack not found: ${packId}`, undefined, undefined, "PACK_NOT_FOUND");
  }

  return {
    type: "AI_CREDIT_PACK",
    quotedAmountMinor: pack.priceUzs,
    currency: "UZS",
    pricingPolicyCode: CURRENT_PRICING_POLICY.code,
    pricingPolicyVersion: CURRENT_PRICING_POLICY.version,
    itemSummary: `${pack.name} (${pack.units} AI Credits)`,
    metadata: {
      packId: pack.id,
      units: pack.units,
    },
  };
}

/**
 * Quotes a Subscription Plan strictly from server configuration.
 */
export function quoteSubscriptionPlan(tier: SubscriptionTier, period: "monthly" | "yearly" = "monthly"): PricingQuote {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan) {
    throw new ApiError(404, `Subscription Plan not found: ${tier}`, undefined, undefined, "PLAN_NOT_FOUND");
  }

  const amount = period === "yearly" ? plan.priceYearlyUzs : plan.priceMonthlyUzs;

  return {
    type: "SUBSCRIPTION",
    quotedAmountMinor: amount,
    currency: "UZS",
    pricingPolicyCode: CURRENT_PRICING_POLICY.code,
    pricingPolicyVersion: CURRENT_PRICING_POLICY.version,
    itemSummary: `${plan.name} (${period})`,
    metadata: {
      tier: plan.tier,
      period,
      monthlyQuota: plan.aiCreditsMonthly,
    },
  };
}

/**
 * Quotes a Marketplace Item based on validated listing price in UZS.
 */
export function quoteMarketplaceListing(listing: {
  id: string;
  title: string;
  sellerId: string;
  priceUzs: bigint | number;
}): PricingQuote {
  const priceMinor = typeof listing.priceUzs === "bigint" ? listing.priceUzs : BigInt(Math.round(listing.priceUzs));

  if (priceMinor < 0n) {
    throw new ApiError(400, "Marketplace item cannot have negative price", undefined, undefined, "INVALID_PRICE");
  }

  return {
    type: "MARKETPLACE_PRODUCT",
    quotedAmountMinor: priceMinor,
    currency: "UZS",
    pricingPolicyCode: CURRENT_PRICING_POLICY.code,
    pricingPolicyVersion: CURRENT_PRICING_POLICY.version,
    itemSummary: listing.title,
    metadata: {
      listingId: listing.id,
      sellerId: listing.sellerId,
    },
  };
}
