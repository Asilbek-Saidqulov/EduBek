/**
 * EduBek — Subscription feature barrel export.
 */
export {
  getPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  upgradeSubscription,
  downgradeSubscription,
  renewSubscription,
  getSubscriptionLimits,
  canUseFeature,
  consumeUsage,
  getRemainingUsage,
} from "./service";

export {
  createPlan,
  updatePlan,
  deletePlan as deletePlanRepo,
  findPlanById,
  findPlanByTier,
  findActiveSubscription,
  findExpiringSubscriptions,
} from "./repository";

export {
  createPlanBodySchema,
  updatePlanBodySchema,
  subscribeBodySchema,
  upgradeBodySchema,
  downgradeBodySchema,
  type CreatePlanBody,
  type UpdatePlanBody,
  type SubscribeBody,
  type UpgradeBody,
  type DowngradeBody,
} from "./schema";

export type {
  SubscriptionPlanDto,
  UserSubscriptionDto,
  SubscriptionLimits,
  SubscriptionFeature,
  FeatureCheckResult,
} from "./types";
