/**
 * EduBek — Platform-admin Zod schemas.
 */
import { z } from "zod";

export const updatePlatformSettingsBodySchema = z.object({
  marketplaceFeePercent: z.number().min(0).max(100).optional(),
  refundWindowDays: z.number().int().min(0).max(365).optional(),
  allowDuplicatePurchases: z.boolean().optional(),
  platformWalletUserId: z.string().min(1).optional(),
  defaultCurrency: z.string().length(3).optional(),
  requireListingApproval: z.boolean().optional(),
  freeTierAiCredits: z.number().int().min(0).optional(),
});
export type UpdatePlatformSettingsBody = z.infer<
  typeof updatePlatformSettingsBodySchema
>;

export const createCreatorTierBodySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/i, "Name must be alphanumeric, dash or underscore"),
  label: z.string().min(1).max(100),
  revenueShare: z.number().min(0).max(100).default(90),
  payoutFrequency: z.enum(["weekly", "biweekly", "monthly"]).default("monthly"),
  badgeIcon: z.string().max(20).optional(),
  featuredEligible: z.boolean().default(false),
  marketplacePriority: z.number().int().min(0).default(0),
  minEarnings: z.number().min(0).default(0),
  minSales: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
  isSystem: z.boolean().default(false),
});
export type CreateCreatorTierBody = z.infer<typeof createCreatorTierBodySchema>;

export const updateCreatorTierBodySchema = createCreatorTierBodySchema.partial();
export type UpdateCreatorTierBody = z.infer<typeof updateCreatorTierBodySchema>;

export const assignCreatorTierBodySchema = z.object({
  creatorId: z.string().min(1),
  tierName: z.string().min(1),
});
export type AssignCreatorTierBody = z.infer<typeof assignCreatorTierBodySchema>;
