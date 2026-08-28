/**
 * Purchase Feature Module
 */

import { AuthContext, requireAuth } from "./auth";
import { checkEntitlement, getUserEntitlements, purchaseMarketplaceItem } from "./economy/marketplace";
import { processRefund } from "./economy/refunds";
import { getOrderDto } from "./economy/orders";

export async function listPurchases(ctx: AuthContext, limit = 20, offset = 0) {
  requireAuth(ctx);
  const entitlements = getUserEntitlements(ctx.userId);
  const paginated = entitlements.slice(offset, offset + limit);

  return {
    success: true,
    data: paginated,
    items: paginated,
    total: entitlements.length,
    timestamp: new Date().toISOString(),
  };
}

export async function purchase(ctx: AuthContext, listing: any, returnUrl?: string) {
  requireAuth(ctx);
  return await purchaseMarketplaceItem({
    buyerId: ctx.userId,
    listing,
    returnUrl,
  });
}

export async function refundPurchase(ctx: AuthContext, orderId: string, reason?: string) {
  requireAuth(ctx);
  return await processRefund({
    orderId,
    reason,
    initiatedBy: ctx.userId,
  });
}

export async function getPurchase(ctx: AuthContext, orderId: string) {
  requireAuth(ctx);
  return getOrderDto(orderId);
}
