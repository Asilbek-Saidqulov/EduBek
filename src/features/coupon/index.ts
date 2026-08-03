/**
 * EduBek — Coupon feature barrel export.
 */
export {
  getCoupons,
  createCoupon,
  validateCoupon,
  redeemCoupon,
  calculateDiscount,
} from "./service";

export {
  createCouponBodySchema,
  validateCouponBodySchema,
  redeemCouponBodySchema,
  couponScopeSchema,
  couponTypeSchema,
  type CreateCouponBody,
  type ValidateCouponBody,
  type RedeemCouponBody,
} from "./schema";

export type {
  CouponDto,
  CouponUsageDto,
  CouponValidationResult,
  CouponType,
  CouponScope,
} from "./types";
