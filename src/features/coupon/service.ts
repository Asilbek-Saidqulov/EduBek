/**
 * EduBek — Coupon service.
 *
 * Validates and redeems coupon codes against prospective purchases. The
 * validation rules cover the full Phase 3C matrix: expiry, total usage cap,
 * per-user cap, minimum purchase, first-purchase-only, and creator-only.
 *
 * Events published:
 *   • COUPON_CREATED  — admin creates a coupon
 *   • COUPON_REDEEMED — a user successfully redeems a coupon
 */
import { logger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PlatformPermission,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  COUPON_CREATED,
  COUPON_REDEEMED,
  type CouponEvent,
  type CouponRedeemedEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import type { CreateCouponBody } from "./schema";
import type {
  CouponDto,
  CouponScope,
  CouponType,
  CouponUsageDto,
  CouponValidationResult,
} from "./types";

const log = logger.child({ module: "coupon-service" });

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCoupon(c: any): CouponDto {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? null,
    type: c.type as CouponType,
    value: c.value,
    currency: c.currency,
    scope: c.scope as CouponScope,
    minPurchase: c.minPurchase,
    maxUsage: c.maxUsage,
    maxUsagePerUser: c.maxUsagePerUser,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
    creatorOnly: c.creatorOnly,
    firstPurchaseOnly: c.firstPurchaseOnly,
    createdById: c.createdById ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapUsage(u: any): CouponUsageDto {
  return {
    id: u.id,
    couponId: u.couponId,
    userId: u.userId,
    orderId: u.orderId ?? null,
    discountAmount: u.discountAmount,
    createdAt: u.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCoupons(
  ctx: AuthContext,
  includeInactive = false,
): Promise<CouponDto[]> {
  // Anyone authenticated may list active coupons (e.g. to see what's
  // redeemable); only admins may see inactive ones.
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (includeInactive && !can(ctx, PlatformPermission.COUPON_MANAGE)) {
    throw forbidden("Admin only");
  }
  if (!includeInactive && !can(ctx, PersonalPermission.COUPON_VIEW)) {
    throw forbidden("No permission to view coupons");
  }
  const coupons = await repo.findCoupons(includeInactive);
  return coupons.map(mapCoupon);
}

export async function createCoupon(
  ctx: AuthContext,
  input: CreateCouponBody,
): Promise<CouponDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.COUPON_MANAGE)) {
    throw forbidden("Admin only");
  }
  const existing = await repo.findCouponByCode(input.code);
  if (existing) throw badRequest("Coupon code already exists");
  if (input.type === "percentage" && (input.value < 0 || input.value > 100)) {
    throw badRequest("Percentage value must be between 0 and 100");
  }

  const coupon = await repo.createCoupon(input, ctx.userId);
  const dto = mapCoupon(coupon);
  eventBus.publish(
    buildEvent<CouponEvent>({
      type: COUPON_CREATED,
      actorId: ctx.userId,
      couponId: coupon.id,
      code: coupon.code,
      occurredAt: new Date(),
    }),
  );
  log.info("coupon.created", { code: coupon.code, userId: ctx.userId });
  return dto;
}

export async function validateCoupon(
  ctx: AuthContext,
  code: string,
  amount: number,
  scope?: CouponScope,
): Promise<CouponValidationResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.COUPON_REDEEM)) {
    throw forbidden("No permission to redeem coupons");
  }
  const coupon = await repo.findCouponByCode(code);
  if (!coupon) {
    return { valid: false, coupon: null, discountAmount: 0, reason: "Coupon not found" };
  }
  const dto = mapCoupon(coupon);

  if (!dto.isActive) {
    return { valid: false, coupon: dto, discountAmount: 0, reason: "Coupon is not active" };
  }
  if (dto.expiresAt && new Date(dto.expiresAt) < new Date()) {
    return { valid: false, coupon: dto, discountAmount: 0, reason: "Coupon has expired" };
  }
  if (scope && dto.scope !== "platform" && dto.scope !== scope) {
    return { valid: false, coupon: dto, discountAmount: 0, reason: `Coupon is for ${dto.scope} only` };
  }
  if (amount < dto.minPurchase) {
    return {
      valid: false,
      coupon: dto,
      discountAmount: 0,
      reason: `Minimum purchase of ${dto.minPurchase} required`,
    };
  }

  // Total usage cap
  if (dto.maxUsage > 0) {
    const used = await repo.countUsage(coupon.id);
    if (used >= dto.maxUsage) {
      return { valid: false, coupon: dto, discountAmount: 0, reason: "Coupon usage limit reached" };
    }
  }

  // Per-user cap
  if (dto.maxUsagePerUser > 0) {
    const userUsed = await repo.countUsageByUser(coupon.id, ctx.userId);
    if (userUsed >= dto.maxUsagePerUser) {
      return { valid: false, coupon: dto, discountAmount: 0, reason: "You have already used this coupon" };
    }
  }

  // First-purchase-only
  if (dto.firstPurchaseOnly) {
    const hasPurchased = await repo.userHasAnyPurchase(ctx.userId);
    if (hasPurchased) {
      return { valid: false, coupon: dto, discountAmount: 0, reason: "Coupon is for first purchase only" };
    }
  }

  // Creator-only
  if (dto.creatorOnly) {
    const isCreator = await repo.userIsCreator(ctx.userId);
    if (!isCreator) {
      return { valid: false, coupon: dto, discountAmount: 0, reason: "Coupon is for creators only" };
    }
  }

  const discount = calculateDiscount(dto, amount);
  return { valid: true, coupon: dto, discountAmount: discount };
}

export async function redeemCoupon(
  ctx: AuthContext,
  code: string,
  orderId: string,
  amount: number,
): Promise<CouponValidationResult & { usage: CouponUsageDto | null }> {
  // validateCoupon already throws unauthorized() when there's no user, but
  // TypeScript can't see through that — capture the user id locally so the
  // event payload is statically typed as a string.
  const userId = ctx.userId;
  if (!userId) throw unauthorized("Authentication required");
  const validation = await validateCoupon(ctx, code, amount);
  if (!validation.valid || !validation.coupon) {
    return { ...validation, usage: null };
  }
  const usage = await repo.createUsage({
    couponId: validation.coupon.id,
    userId,
    orderId,
    discountAmount: validation.discountAmount,
  });
  const usageDto = mapUsage(usage);
  eventBus.publish(
    buildEvent<CouponRedeemedEvent>({
      type: COUPON_REDEEMED,
      actorId: userId,
      couponId: validation.coupon.id,
      code: validation.coupon.code,
      userId,
      orderId,
      discountAmount: validation.discountAmount,
      occurredAt: new Date(),
    }),
  );
  log.info("coupon.redeemed", {
    code: validation.coupon.code,
    userId,
    orderId,
    discount: validation.discountAmount,
  });
  return { ...validation, usage: usageDto };
}

export function calculateDiscount(coupon: CouponDto, amount: number): number {
  switch (coupon.type) {
    case "percentage":
      return Math.min(amount, Math.round((amount * coupon.value) / 100));
    case "fixed":
      return Math.min(amount, coupon.value);
    case "free_purchase":
      return amount;
    case "ai_credits":
      // AI-credit coupons don't reduce a purchase amount — they grant credits.
      // When applied to a purchase the discount is 0; the credit grant is
      // handled by the caller (e.g. the AI workspace).
      return 0;
    default:
      return 0;
  }
}
