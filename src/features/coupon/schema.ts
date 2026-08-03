/**
 * EduBek — Coupon feature Zod schemas.
 */
import { z } from "zod";

export const couponScopeSchema = z.enum([
  "marketplace",
  "subscription",
  "ai",
  "platform",
]);
export const couponTypeSchema = z.enum([
  "percentage",
  "fixed",
  "free_purchase",
  "ai_credits",
]);

export const createCouponBodySchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric, dash or underscore"),
  description: z.string().max(500).optional(),
  type: couponTypeSchema,
  value: z.number().min(0),
  currency: z.string().length(3).default("EDU"),
  scope: couponScopeSchema.default("marketplace"),
  minPurchase: z.number().min(0).default(0),
  maxUsage: z.number().int().min(0).default(0),
  maxUsagePerUser: z.number().int().min(0).default(1),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  creatorOnly: z.boolean().default(false),
  firstPurchaseOnly: z.boolean().default(false),
});
export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;

export const validateCouponBodySchema = z.object({
  code: z.string().min(1),
  amount: z.number().min(0),
  scope: couponScopeSchema.optional(),
});
export type ValidateCouponBody = z.infer<typeof validateCouponBodySchema>;

export const redeemCouponBodySchema = validateCouponBodySchema.extend({
  orderId: z.string().min(1),
});
export type RedeemCouponBody = z.infer<typeof redeemCouponBodySchema>;
