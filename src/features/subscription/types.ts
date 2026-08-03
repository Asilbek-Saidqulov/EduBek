/**
 * EduBek — Subscription feature types.
 *
 * Phase 3C introduces a platform-level subscription system (Free / Pro / Ultra)
 * that gates premium features and AI usage. These DTOs are the wire contract
 * between the API routes and any frontend client.
 */

/** A subscribable plan (Free, Pro, Ultra, …). */
export interface SubscriptionPlanDto {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: Record<string, unknown> | null;
  aiCreditsMonthly: number;
  isActive: boolean;
  createdAt: string;
  /** Phase 4E.5: Translation key for the plan name (additive). */
  displayNameKey?: string;
  /** Phase 4E.5: Translation key for the plan description (additive). */
  descriptionKey?: string;
  /** Phase 4E.5: Available languages for this plan (additive). */
  availableLanguages?: string[];
}

/** A user's subscription record. */
export interface UserSubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  planTier: string;
  planName: string;
  status: string;
  startedAt: string;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  providerSubscriptionId: string | null;
  cancelledAt: string | null;
}

/** Usage / entitlement limits derived from a plan. */
export interface SubscriptionLimits {
  aiCredits: number;
  resourceLimit: number;
  marketplacePublish: boolean;
  collections: number;
  organizations: number;
  teamMembers: number;
  premiumAI: boolean;
  premiumTemplates: boolean;
  monthlyQuotas: Record<string, number>;
}

/** Features that can be gated by a subscription plan. */
export type SubscriptionFeature =
  | "ai_generate"
  | "ai_premium"
  | "marketplace_publish"
  | "premium_templates"
  | "collection_create"
  | "organization_create";

/** Result of a feature-gate check. */
export interface FeatureCheckResult {
  feature: string;
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  reason?: string;
}
