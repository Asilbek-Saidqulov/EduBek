/**
 * EduBek — Subscription feature Zod schemas.
 *
 * These schemas validate the request bodies of the subscription API routes.
 * They are kept thin on purpose — the service layer performs the deeper
 * business-rule validation (plan existence, billing-cycle transitions, …).
 */
import { z } from "zod";

export const createPlanBodySchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.string().min(1).max(50),
  priceMonthly: z.number().min(0).default(0),
  priceYearly: z.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  features: z.record(z.string(), z.unknown()).optional(),
  aiCreditsMonthly: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreatePlanBody = z.infer<typeof createPlanBodySchema>;

export const updatePlanBodySchema = createPlanBodySchema.partial();
export type UpdatePlanBody = z.infer<typeof updatePlanBodySchema>;

export const subscribeBodySchema = z.object({
  planTier: z.string().min(1),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});
export type SubscribeBody = z.infer<typeof subscribeBodySchema>;

export const upgradeBodySchema = z.object({
  newTier: z.string().min(1),
});
export type UpgradeBody = z.infer<typeof upgradeBodySchema>;

export const downgradeBodySchema = z.object({
  newTier: z.string().min(1),
});
export type DowngradeBody = z.infer<typeof downgradeBodySchema>;
