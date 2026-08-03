/**
 * EduBek — Coupon repository.
 *
 * The only layer that imports `db` for this feature.
 */
import { db } from "@/lib/db";
import type { CreateCouponBody } from "./schema";

export async function findCouponById(id: string) {
  return db.coupon.findUnique({ where: { id } });
}

export async function findCouponByCode(code: string) {
  return db.coupon.findUnique({ where: { code } });
}

export async function findCoupons(includeInactive = false) {
  return db.coupon.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoupon(
  input: CreateCouponBody,
  createdById?: string,
) {
  return db.coupon.create({
    data: {
      code: input.code,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      currency: input.currency,
      scope: input.scope,
      minPurchase: input.minPurchase,
      maxUsage: input.maxUsage,
      maxUsagePerUser: input.maxUsagePerUser,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive,
      creatorOnly: input.creatorOnly,
      firstPurchaseOnly: input.firstPurchaseOnly,
      createdById: createdById ?? null,
    },
  });
}

export async function updateCoupon(id: string, data: Record<string, unknown>) {
  return db.coupon.update({ where: { id }, data });
}

export async function deleteCoupon(id: string) {
  return db.coupon.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Usages
// ---------------------------------------------------------------------------

export async function createUsage(data: {
  couponId: string;
  userId: string;
  orderId?: string | null;
  discountAmount: number;
}) {
  return db.couponUsage.create({
    data: {
      couponId: data.couponId,
      userId: data.userId,
      orderId: data.orderId ?? null,
      discountAmount: data.discountAmount,
    },
  });
}

export async function findUsageByUser(couponId: string, userId: string) {
  return db.couponUsage.findMany({ where: { couponId, userId } });
}

export async function countUsage(couponId: string) {
  return db.couponUsage.count({ where: { couponId } });
}

export async function countUsageByUser(couponId: string, userId: string) {
  return db.couponUsage.count({ where: { couponId, userId } });
}

/** True when the user has at least one marketplace purchase (used for firstPurchaseOnly). */
export async function userHasAnyPurchase(userId: string): Promise<boolean> {
  const count = await db.mpPurchase.count({ where: { buyerId: userId } });
  return count > 0;
}

/** True when the user has a creator profile (used for creatorOnly). */
export async function userIsCreator(userId: string): Promise<boolean> {
  const c = await db.creator.findUnique({ where: { userId } });
  return c !== null;
}
