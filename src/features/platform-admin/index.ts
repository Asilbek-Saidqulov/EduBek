/**
 * EduBek — Platform-admin feature barrel export.
 */
export {
  getPlatformSettings,
  updatePlatformSettings,
  manageSubscriptionPlans,
  listCreatorTiers,
  manageCreatorTiers,
  getPlatformRevenue,
  assignCreatorTier,
} from "./service";

export {
  updatePlatformSettingsBodySchema,
  createCreatorTierBodySchema,
  updateCreatorTierBodySchema,
  assignCreatorTierBodySchema,
  type UpdatePlatformSettingsBody,
  type CreateCreatorTierBody,
  type UpdateCreatorTierBody,
  type AssignCreatorTierBody,
} from "./schema";

export type {
  PlatformSettingsDto,
  PlatformRevenueDto,
  PlatformCreatorTierDto,
  PlatformCreatorTierAssignmentDto,
  AdminAction,
} from "./types";
