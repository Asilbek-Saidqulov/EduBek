/**
 * EduBek — Platform-admin feature types.
 *
 * These DTOs are returned by the admin-only endpoints (settings, revenue
 * breakdown, creator-tier management). All admin endpoints require the
 * caller to hold `PlatformPermission.PLATFORM_ADMIN` (or be a superadmin).
 */

export interface PlatformSettingsDto {
  /** Marketplace platform fee percentage (0-100). */
  marketplaceFeePercent: number;
  /** Number of days a buyer has to request a refund. */
  refundWindowDays: number;
  /** Whether a buyer can buy the same listing more than once. */
  allowDuplicatePurchases: boolean;
  /** User id that owns the platform wallet (receives fees). */
  platformWalletUserId: string;
  /** Default currency code for new transactions. */
  defaultCurrency: string;
  /** Whether new marketplace listings require admin approval. */
  requireListingApproval: boolean;
  /** Free-tier monthly AI credit allowance. */
  freeTierAiCredits: number;
}

export interface PlatformRevenueDto {
  total: number;
  marketplace: number;
  subscriptions: number;
  topups: number;
  payouts: number;
  refunds: number;
  platformEarnings: number;
  creatorEarnings: number;
}

export interface PlatformCreatorTierDto {
  id: string;
  name: string;
  label: string;
  revenueShare: number;
  payoutFrequency: string;
  badgeIcon: string | null;
  featuredEligible: boolean;
  marketplacePriority: number;
  minEarnings: number;
  minSales: number;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
}

export interface PlatformCreatorTierAssignmentDto {
  id: string;
  creatorId: string;
  tierId: string;
  tierName: string;
  assignedAt: string;
  assignedBy: string | null;
}

export type AdminAction = "create" | "update" | "delete" | "deactivate" | "activate";
