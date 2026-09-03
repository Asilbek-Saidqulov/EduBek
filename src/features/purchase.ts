import type { AuthContext } from "@/features/auth";
import { requireAuth } from "@/features/auth";
import { db } from "@/lib/db";
import { conflict, notFound } from "@/lib/errors";
import { assertMarketplacePurchasesEnabled } from "@/features/economy/kill-switches";
import { assertNoClientPrice, splitMarketplaceGross } from "@/features/economy/policy";

/**
 * Marketplace is UZS only. AI credits cannot buy listings.
 * Price and seller come from the listing snapshot, never the client body.
 */
export async function purchase(ctx: AuthContext, listingId: string, clientBody?: unknown) {
  requireAuth(ctx);
  assertMarketplacePurchasesEnabled();
  assertNoClientPrice(clientBody);

  const listing = await db.marketplaceListing.findUnique({ where: { id: listingId } });
  if (!listing) throw notFound("Listing not found");
  if (!["published", "approved"].includes(listing.status)) throw conflict("Listing is not for sale");
  if (listing.sellerId === ctx.userId) throw conflict("SELF_DEAL_FORBIDDEN");

  const existing = await db.marketplacePurchase.findFirst({
    where: { buyerId: ctx.userId!, listingId },
  });
  if (existing) throw conflict("Already purchased");

  const grossUzs = BigInt(Math.max(0, Math.round(Number(listing.priceFiat || 0))));
  const split = splitMarketplaceGross(grossUzs);

  const row = await db.marketplacePurchase.create({
    data: {
      buyerId: ctx.userId!,
      listingId: listing.id,
      amountPaid: Number(split.grossUzs),
      currency: "UZS",
      eduTokensSpent: 0,
    },
  });

  return {
    success: true,
    currency: "UZS",
    purchase: row,
    snapshot: {
      listingId: listing.id,
      title: listing.title,
      sellerId: listing.sellerId,
      currency: "UZS",
      ...Object.fromEntries(Object.entries(split).map(([k, v]) => [k, v.toString()])),
    },
    note: "Creator share is pending UZS, not AI credits. Payouts stay off until KYC.",
  };
}

export async function listPurchases(ctx: AuthContext) {
  requireAuth(ctx);
  const items = await db.marketplacePurchase.findMany({
    where: { buyerId: ctx.userId! },
    include: { listing: true },
    orderBy: { purchasedAt: "desc" },
  });
  return { success: true, items };
}

export async function getPurchase(ctx: AuthContext, id: string) {
  requireAuth(ctx);
  const row = await db.marketplacePurchase.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!row) throw notFound("Purchase not found");
  if (row.buyerId !== ctx.userId && !ctx.platformRoles?.includes("ADMIN")) {
    throw notFound("Purchase not found");
  }
  return row;
}

export async function refundPurchase(ctx: AuthContext, id: string) {
  requireAuth(ctx);
  const row = await getPurchase(ctx, id);
  return {
    success: false,
    code: "REFUND_DISABLED",
    message: "Marketplace refunds stay off until the UZS refund path is live.",
    purchaseId: row.id,
  };
}