/** Systems 4, 5 — Offer Engine + Discount Engine. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeOffer, getOffer, getAllOffers,
  storeDiscount, getDiscount, getAllDiscounts,
  getProduct,
} from "./repository";
import type {
  Offer, OfferType, OfferStatus, OfferEligibility,
  Discount, DiscountType, DiscountTier, DiscountValidationResult,
} from "./types";

const log = getLogger("commerce.offers");

// ===== System 4 — Offer Engine =====

export function createOffer(input: {
  name: string; description: string;
  type: OfferType;
  productIds?: string[]; bundleIds?: string[];
  discountType: "percentage" | "fixed" | "tiered";
  discountValue: number;
  startDate: string; endDate: string;
  eligibility?: Partial<OfferEligibility>;
  maxRedemptions?: number | null;
  requiresApproval?: boolean;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): Offer {
  if (input.discountValue < 0) throw new Error("discountValue must be non-negative");
  if (new Date(input.endDate).getTime() <= new Date(input.startDate).getTime()) {
    throw new Error("endDate must be after startDate");
  }
  const now = new Date().toISOString();
  const offer: Offer = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type,
    status: input.requiresApproval ? "pending_approval" : "draft",
    productIds: input.productIds ?? [], bundleIds: input.bundleIds ?? [],
    discountType: input.discountType, discountValue: input.discountValue,
    startDate: input.startDate, endDate: input.endDate,
    eligibility: {
      organizationIds: input.eligibility?.organizationIds ?? null,
      regions: input.eligibility?.regions ?? null,
      roleTypes: input.eligibility?.roleTypes ?? null,
      minPurchases: input.eligibility?.minPurchases ?? null,
      maxPurchases: input.eligibility?.maxPurchases ?? null,
      firstPurchaseOnly: input.eligibility?.firstPurchaseOnly ?? false,
      couponCode: input.eligibility?.couponCode ?? null,
    },
    maxRedemptions: input.maxRedemptions ?? null, redemptionCount: 0,
    requiresApproval: input.requiresApproval ?? false,
    approvedBy: null, approvedAt: null,
    createdBy: input.createdBy, createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeOffer(offer);
  log.info("offer.created", { id: offer.id, type: offer.type, requiresApproval: offer.requiresApproval });
  return offer;
}

export function getOfferById(id: string): Offer | null { return getOffer(id); }
export function listOffers(status?: OfferStatus, type?: OfferType): Offer[] {
  let all = getAllOffers();
  if (status) all = all.filter(o => o.status === status);
  if (type) all = all.filter(o => o.type === type);
  return all;
}

export function approveOffer(offerId: string, approverId: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status !== "pending_approval") return null;
  o.status = "approved"; o.approvedBy = approverId; o.approvedAt = new Date().toISOString();
  o.updatedAt = new Date().toISOString();
  storeOffer(o);
  log.info("offer.approved", { id: offerId, approver: approverId });
  return o;
}

export function rejectOffer(offerId: string, reviewerId: string, reason: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status !== "pending_approval") return null;
  o.status = "rejected"; o.approvedBy = reviewerId;
  o.updatedAt = new Date().toISOString();
  o.metadata.rejectionReason = reason;
  storeOffer(o);
  return o;
}

export function activateOffer(offerId: string, actorId: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status !== "approved" && o.status !== "draft") return null;
  if (o.requiresApproval && o.status !== "approved") return null;
  const now = new Date();
  if (now.getTime() < new Date(o.startDate).getTime()) return null;
  if (now.getTime() > new Date(o.endDate).getTime()) {
    o.status = "expired"; o.updatedAt = now.toISOString();
    storeOffer(o);
    return null;
  }
  o.status = "active"; o.updatedAt = now.toISOString();
  storeOffer(o);
  log.info("offer.activated", { id: offerId, actor: actorId });
  return o;
}

export function expireOffer(offerId: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status !== "active") return null;
  o.status = "expired"; o.updatedAt = new Date().toISOString();
  storeOffer(o);
  return o;
}

export function retireOffer(offerId: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status === "retired") return null;
  o.status = "retired"; o.updatedAt = new Date().toISOString();
  storeOffer(o);
  return o;
}

export function redeemOffer(offerId: string): Offer | null {
  const o = getOffer(offerId);
  if (!o) return null;
  if (o.status !== "active") return null;
  if (o.maxRedemptions !== null && o.redemptionCount >= o.maxRedemptions) return null;
  o.redemptionCount += 1; o.updatedAt = new Date().toISOString();
  storeOffer(o);
  return o;
}

export function isOfferEligible(offer: Offer, ctx: {
  userId: string; organizationId?: string | null; region?: string | null;
  roleType?: string | null; purchaseCount: number; couponCode?: string | null;
}): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (offer.status !== "active") reasons.push("offer_not_active");
  const now = Date.now();
  if (now < new Date(offer.startDate).getTime()) reasons.push("not_started");
  if (now > new Date(offer.endDate).getTime()) reasons.push("expired");
  if (offer.eligibility.firstPurchaseOnly && ctx.purchaseCount > 0) reasons.push("not_first_purchase");
  if (offer.eligibility.organizationIds && ctx.organizationId && !offer.eligibility.organizationIds.includes(ctx.organizationId)) {
    reasons.push("organization_not_eligible");
  }
  if (offer.eligibility.regions && ctx.region && !offer.eligibility.regions.includes(ctx.region)) {
    reasons.push("region_not_eligible");
  }
  if (offer.eligibility.roleTypes && ctx.roleType && !offer.eligibility.roleTypes.includes(ctx.roleType)) {
    reasons.push("role_not_eligible");
  }
  if (offer.eligibility.minPurchases !== null && ctx.purchaseCount < offer.eligibility.minPurchases) {
    reasons.push("insufficient_purchases");
  }
  if (offer.eligibility.maxPurchases !== null && ctx.purchaseCount > offer.eligibility.maxPurchases) {
    reasons.push("exceeds_max_purchases");
  }
  if (offer.eligibility.couponCode && offer.eligibility.couponCode !== ctx.couponCode) {
    reasons.push("coupon_required");
  }
  if (offer.maxRedemptions !== null && offer.redemptionCount >= offer.maxRedemptions) {
    reasons.push("max_redemptions_reached");
  }
  return { eligible: reasons.length === 0, reasons };
}

export function supportsAllOfferTypes(): OfferType[] {
  return ["limited_time", "seasonal", "organization", "regional", "student", "teacher", "first_purchase", "returning_user", "campaign", "coupon", "manual"];
}
export function supportsAllOfferStatuses(): OfferStatus[] {
  return ["draft", "pending_approval", "approved", "active", "expired", "rejected", "retired"];
}

// ===== System 5 — Discount Engine =====

export function createDiscount(input: {
  name: string; type: DiscountType;
  value: number; currency?: string | null;
  tiers?: DiscountTier[];
  productIds?: string[] | null;
  organizationIds?: string[] | null;
  couponCode?: string | null;
  startDate: string; endDate: string;
  stackable?: boolean;
  maxRedemptions?: number | null;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): Discount {
  if (input.value < 0) throw new Error("value must be non-negative");
  if (new Date(input.endDate).getTime() <= new Date(input.startDate).getTime()) {
    throw new Error("endDate must be after startDate");
  }
  const now = new Date().toISOString();
  const discount: Discount = {
    id: randomUUID(), name: input.name, type: input.type,
    value: input.value, currency: input.currency ?? null,
    tiers: input.tiers ?? [],
    productIds: input.productIds ?? null,
    organizationIds: input.organizationIds ?? null,
    couponCode: input.couponCode ?? null,
    startDate: input.startDate, endDate: input.endDate,
    active: true, stackable: input.stackable ?? false,
    maxRedemptions: input.maxRedemptions ?? null, redemptionCount: 0,
    createdBy: input.createdBy, createdAt: now,
    metadata: input.metadata ?? {},
  };
  storeDiscount(discount);
  log.info("discount.created", { id: discount.id, type: discount.type });
  return discount;
}

export function getDiscountById(id: string): Discount | null { return getDiscount(id); }
export function listDiscounts(active?: boolean): Discount[] {
  const all = getAllDiscounts();
  return active === undefined ? all : all.filter(d => d.active === active);
}

export function deactivateDiscount(discountId: string): Discount | null {
  const d = getDiscount(discountId);
  if (!d) return null;
  d.active = false;
  storeDiscount(d);
  return d;
}

export function isDiscountValid(discount: Discount, ctx: {
  productId?: string; organizationId?: string | null; couponCode?: string | null;
  quantity: number; now: number;
}): { valid: boolean; reason: string | null } {
  if (!discount.active) return { valid: false, reason: "inactive" };
  if (ctx.now < new Date(discount.startDate).getTime()) return { valid: false, reason: "not_started" };
  if (ctx.now > new Date(discount.endDate).getTime()) return { valid: false, reason: "expired" };
  if (discount.productIds && ctx.productId && !discount.productIds.includes(ctx.productId)) {
    return { valid: false, reason: "product_not_eligible" };
  }
  if (discount.organizationIds && ctx.organizationId && !discount.organizationIds.includes(ctx.organizationId)) {
    return { valid: false, reason: "organization_not_eligible" };
  }
  if (discount.couponCode && discount.couponCode !== ctx.couponCode) {
    return { valid: false, reason: "coupon_required" };
  }
  if (discount.maxRedemptions !== null && discount.redemptionCount >= discount.maxRedemptions) {
    return { valid: false, reason: "max_redemptions_reached" };
  }
  return { valid: true, reason: null };
}

export function validateDiscounts(input: {
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  couponCode?: string | null;
  organizationId?: string | null;
  discountIds?: string[];
}): DiscountValidationResult {
  const now = Date.now();
  const applied: Array<{ discountId: string; name: string; amount: number }> = [];
  const errors: string[] = [];
  const originalTotal = input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  let totalSavings = 0;
  const candidateIds = input.discountIds ?? getAllDiscounts().map(d => d.id);
  for (const id of candidateIds) {
    const d = getDiscount(id);
    if (!d) { errors.push(`discount_not_found:${id}`); continue; }
    for (const item of input.items) {
      const v = isDiscountValid(d, {
        productId: item.productId, organizationId: input.organizationId,
        couponCode: input.couponCode, quantity: item.quantity, now,
      });
      if (!v.valid) {
        if (input.discountIds?.includes(id)) errors.push(`${id}:${v.reason}`);
        continue;
      }
      const lineTotal = item.unitPrice * item.quantity;
      let savings = 0;
      if (d.type === "percentage") {
        savings = (lineTotal * Math.min(d.value, 100)) / 100;
      } else if (d.type === "fixed") {
        savings = Math.min(d.value, lineTotal);
      } else if (d.type === "tiered" || d.type === "volume") {
        const tier = d.tiers.find(t => item.quantity >= t.minQuantity && (t.maxQuantity === null || item.quantity <= t.maxQuantity));
        if (tier) savings = (lineTotal * Math.min(tier.discountValue, 100)) / 100;
      } else if (d.type === "campaign" || d.type === "organization" || d.type === "academic") {
        savings = (lineTotal * Math.min(d.value, 100)) / 100;
      } else if (d.type === "coupon") {
        savings = (lineTotal * Math.min(d.value, 100)) / 100;
      }
      if (savings > 0) {
        applied.push({ discountId: d.id, name: d.name, amount: savings });
        totalSavings += savings;
        d.redemptionCount += 1;
        storeDiscount(d);
      }
    }
  }
  return {
    valid: errors.length === 0,
    appliedDiscounts: applied,
    originalTotal,
    discountedTotal: Math.max(0, originalTotal - totalSavings),
    totalSavings,
    errors,
  };
}

export function supportsAllDiscountTypes(): DiscountType[] {
  return ["percentage", "fixed", "tiered", "volume", "campaign", "coupon", "organization", "academic"];
}
