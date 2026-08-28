/**
 * Marketplace Entitlement & Commerce Engine
 * Enforces ownership access, anti-fraud rules, and purchase workflows.
 */

import { economyStore, StoredEntitlement } from "./store";
import { initiateCheckout } from "./payments";
import { assertMarketplacePurchasesEnabled } from "./kill-switches";
import { ApiError } from "@/lib/errors";

export interface CheckEntitlementResult {
  hasAccess: boolean;
  entitlementId?: string;
  grantedAt?: string;
  isOwner?: boolean;
}

/**
 * Checks whether a user owns an active entitlement to access a marketplace listing.
 */
export async function checkEntitlement(userId: string, listingId: string, sellerId?: string): Promise<CheckEntitlementResult> {
  // If the user is the creator/seller, they have natural ownership access
  if (sellerId && userId === sellerId) {
    return { hasAccess: true, isOwner: true };
  }

  const entitlementKey = `${userId}:${listingId}`;
  const entitlement = economyStore.entitlements.get(entitlementKey);

  if (entitlement && entitlement.status === "ACTIVE") {
    return {
      hasAccess: true,
      entitlementId: entitlement.id,
      grantedAt: entitlement.grantedAt.toISOString(),
      isOwner: false,
    };
  }

  return { hasAccess: false };
}

/**
 * Lists all active entitlements owned by a user.
 */
export function getUserEntitlements(userId: string): {
  id: string;
  listingId: string;
  orderId: string;
  grantedAt: string;
}[] {
  const list: any[] = [];
  for (const ent of economyStore.entitlements.values()) {
    if (ent.userId === userId && ent.status === "ACTIVE") {
      list.push({
        id: ent.id,
        listingId: ent.listingId,
        orderId: ent.orderId,
        grantedAt: ent.grantedAt.toISOString(),
      });
    }
  }
  return list;
}

export interface PurchaseMarketplaceItemParams {
  buyerId: string;
  listing: {
    id: string;
    title: string;
    sellerId: string;
    priceUzs: bigint | number;
  };
  returnUrl?: string;
}

/**
 * Initiates checkout for a marketplace educational product.
 */
export async function purchaseMarketplaceItem(params: PurchaseMarketplaceItemParams) {
  assertMarketplacePurchasesEnabled();

  if (params.buyerId === params.listing.sellerId) {
    throw new ApiError(400, "You cannot purchase your own educational listing", undefined, undefined, "SELF_PURCHASE_PROHIBITED");
  }

  // Check if buyer already owns an active entitlement
  const existing = await checkEntitlement(params.buyerId, params.listing.id);
  if (existing.hasAccess) {
    throw new ApiError(400, "You already own this educational resource", undefined, undefined, "ALREADY_OWNED");
  }

  return await initiateCheckout({
    userId: params.buyerId,
    itemType: "MARKETPLACE_PRODUCT",
    itemId: params.listing.id,
    returnUrl: params.returnUrl,
    customMetadata: {
      listing: params.listing,
    },
  });
}
