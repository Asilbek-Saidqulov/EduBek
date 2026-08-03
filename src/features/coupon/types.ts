/**
 * EduBek — Coupon feature types.
 *
 * Phase 3C introduces a promotion/coupon engine that supports percentage,
 * fixed-amount, free-purchase, and AI-credit coupons. Coupons can be scoped
 * to the marketplace, subscriptions, AI usage, or the whole platform.
 */

export type CouponType =
  | "percentage"
  | "fixed"
  | "free_purchase"
  | "ai_credits";

export type CouponScope =
  | "marketplace"
  | "subscription"
  | "ai"
  | "platform";

/** A coupon definition (admin-managed). */
export interface CouponDto {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  currency: string;
  scope: CouponScope;
  minPurchase: number;
  maxUsage: number;
  maxUsagePerUser: number;
  expiresAt: string | null;
  isActive: boolean;
  creatorOnly: boolean;
  firstPurchaseOnly: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A coupon redemption record. */
export interface CouponUsageDto {
  id: string;
  couponId: string;
  userId: string;
  orderId: string | null;
  discountAmount: number;
  createdAt: string;
}

/** The result of validating a coupon against a prospective purchase. */
export interface CouponValidationResult {
  valid: boolean;
  coupon: CouponDto | null;
  discountAmount: number;
  reason?: string;
}
