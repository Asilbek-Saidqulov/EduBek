/**
 * EduBek — Analytics repository.
 *
 * All aggregation queries for platform-wide and per-creator analytics.
 * Kept in one file so the SQL surface is easy to audit and so that the
 * service can compose them without re-querying the DB.
 *
 * Every function returns plain numbers / arrays — the service is responsible
 * for shaping them into DTOs.
 */
import { db } from "@/lib/db";

const DAY_MS = 86_400_000;
const thirtyDaysAgo = () => new Date(Date.now() - 30 * DAY_MS);

// ---------------------------------------------------------------------------
// Platform-wide aggregates
// ---------------------------------------------------------------------------

/** Total revenue from completed transactions (grossAmount, captured). */
export async function platformRevenue(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "captured", type: { in: ["purchase", "subscription", "topup"] } },
    _sum: { grossAmount: true },
  });
  return r._sum.grossAmount ?? 0;
}

/** Gross merchandise value — sum of all marketplace purchase amounts. */
export async function platformGMV(): Promise<number> {
  const r = await db.mpPurchase.aggregate({
    where: { status: "completed" },
    _sum: { pricePaid: true },
  });
  return r._sum.pricePaid ?? 0;
}

/** Platform's cut — sum of platformFee on captured transactions. */
export async function platformEarnings(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "captured" },
    _sum: { platformFee: true },
  });
  return r._sum.platformFee ?? 0;
}

/** Sum of sellerAmount on captured transactions. */
export async function creatorEarningsTotal(): Promise<number> {
  const r = await db.transaction.aggregate({
    where: { status: "captured" },
    _sum: { sellerAmount: true },
  });
  return r._sum.sellerAmount ?? 0;
}

/** Wallet volume — absolute sum of every EduToken ledger delta. */
export async function walletVolume(): Promise<number> {
  const rows = await db.eduTokenLedger.findMany({
    select: { delta: true },
  });
  return rows.reduce((sum, r) => sum + Math.abs(r.delta), 0);
}

/** Total completed marketplace purchases. */
export async function purchaseCount(): Promise<number> {
  return db.mpPurchase.count({ where: { status: "completed" } });
}

/** Total refunds (any status — pending + completed). */
export async function refundCount(): Promise<number> {
  return db.marketplaceRefund.count();
}

/** Active subscription count. */
export async function activeSubscriptions(): Promise<number> {
  return db.userSubscription.count({ where: { status: "active" } });
}

/** Total AI requests in the last 30 days (sum of AiUsageLog.requests). */
export async function aiGenerations(): Promise<number> {
  const r = await db.aiUsageLog.aggregate({
    where: { day: { gte: thirtyDaysAgo() } },
    _sum: { requests: true },
  });
  return r._sum.requests ?? 0;
}

/** Daily active users — distinct users with an AnalyticsEvent in last 24h. */
export async function dailyActiveUsers(): Promise<number> {
  const since = new Date(Date.now() - DAY_MS);
  return db.analyticsEvent
    .findMany({
      where: { occurredAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    })
    .then((rows) => rows.length);
}

/** Monthly active users — distinct users with an event in last 30 days. */
export async function monthlyActiveUsers(): Promise<number> {
  const since = thirtyDaysAgo();
  return db.analyticsEvent
    .findMany({
      where: { occurredAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    })
    .then((rows) => rows.length);
}

/** Marketplace growth — percent change in 30-day GMV vs the prior 30 days. */
export async function marketplaceGrowthPercent(): Promise<number> {
  const now = Date.now();
  const recentStart = new Date(now - 30 * DAY_MS);
  const priorStart = new Date(now - 60 * DAY_MS);
  const recentStart2 = new Date(now - 30 * DAY_MS);
  const [recent, prior] = await Promise.all([
    db.mpPurchase.aggregate({
      where: { status: "completed", createdAt: { gte: recentStart } },
      _sum: { pricePaid: true },
    }),
    db.mpPurchase.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: priorStart, lt: recentStart2 },
      },
      _sum: { pricePaid: true },
    }),
  ]);
  const r = recent._sum.pricePaid ?? 0;
  const p = prior._sum.pricePaid ?? 0;
  if (p === 0) return r > 0 ? 100 : 0;
  return Math.round(((r - p) / p) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// Top-N rankings
// ---------------------------------------------------------------------------

export async function topCreators(limit = 10) {
  return db.creator.findMany({
    orderBy: { totalEarnings: "desc" },
    take: limit,
    select: {
      userId: true,
      displayName: true,
      totalEarnings: true,
      platformTier: { select: { tier: { select: { name: true } } } },
    },
  });
}

export async function creatorSalesCount(creatorId: string): Promise<number> {
  return db.mpPurchase.count({
    where: { creatorId, status: "completed" },
  });
}

export async function topResources(limit = 10) {
  return db.mpListing.findMany({
    where: { status: "published" },
    orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      downloadCount: true,
      viewCount: true,
      creatorId: true,
    },
  });
}

export async function resourceRevenue(
  listingId: string,
): Promise<{ sales: number; revenue: number }> {
  const r = await db.mpPurchase.aggregate({
    where: { listingId, status: "completed" },
    _sum: { pricePaid: true },
    _count: true,
  });
  return { sales: r._count, revenue: r._sum.pricePaid ?? 0 };
}

export async function topOrganizations(limit = 10) {
  return db.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      _count: { select: { memberships: true } },
    },
  });
}

export async function orgPurchaseCount(orgId: string): Promise<number> {
  // Org purchases = purchases where the buyer is a member of the org.
  const members = await db.organizationMembership.findMany({
    where: { orgId, status: "active" },
    select: { userId: true },
  });
  if (members.length === 0) return 0;
  return db.mpPurchase.count({
    where: { buyerId: { in: members.map((m) => m.userId) } },
  });
}

// ---------------------------------------------------------------------------
// Creator analytics (per-user)
// ---------------------------------------------------------------------------

export async function creatorListingsAggregate(creatorId: string) {
  const r = await db.mpListing.aggregate({
    where: { creatorId },
    _sum: { viewCount: true, favoriteCount: true, downloadCount: true },
  });
  return {
    impressions: r._sum.viewCount ?? 0,
    favorites: r._sum.favoriteCount ?? 0,
    downloads: r._sum.downloadCount ?? 0,
  };
}

export async function creatorSales(creatorId: string) {
  const r = await db.mpPurchase.aggregate({
    where: { creatorId, status: "completed" },
    _sum: { pricePaid: true },
    _count: true,
  });
  return { purchases: r._count, revenue: r._sum.pricePaid ?? 0 };
}

export async function creatorRefunds(creatorId: string): Promise<number> {
  // Refunds on this creator's purchases — we look up their purchases first.
  const r = await db.mpPurchase.aggregate({
    where: { creatorId, status: "refunded" },
    _count: true,
  });
  return r._count;
}

export async function creatorWishlistAdditions(
  creatorId: string,
): Promise<number> {
  return db.mpWishlist.count({
    where: { listing: { creatorId } },
  });
}

export async function creatorListingViews(creatorId: string): Promise<number> {
  const r = await db.mpListing.aggregate({
    where: { creatorId },
    _sum: { viewCount: true },
  });
  return r._sum.viewCount ?? 0;
}

export async function creatorMonthlyHistory(
  creatorId: string,
  months = 12,
): Promise<{ month: string; value: number }[]> {
  const since = new Date(Date.now() - months * 30 * DAY_MS);
  const rows = await db.creatorEarning.findMany({
    where: { creatorId, createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const m = r.createdAt.toISOString().slice(0, 7);
    buckets.set(m, (buckets.get(m) ?? 0) + r.amount);
  }
  return Array.from(buckets.entries()).map(([month, value]) => ({
    month,
    value,
  }));
}

// ---------------------------------------------------------------------------
// Marketplace growth (admin overview)
// ---------------------------------------------------------------------------

export async function marketplaceListingCount(): Promise<{
  total: number;
  published: number;
}> {
  const [total, published] = await Promise.all([
    db.mpListing.count(),
    db.mpListing.count({ where: { status: "published" } }),
  ]);
  return { total, published };
}

export async function creatorCount(): Promise<number> {
  return db.creator.count();
}

export async function buyerCount(): Promise<number> {
  return db.mpPurchase
    .findMany({ distinct: ["buyerId"], select: { buyerId: true } })
    .then((rows) => rows.length);
}

export async function newListings30d(): Promise<number> {
  return db.mpListing.count({ where: { createdAt: { gte: thirtyDaysAgo() } } });
}

export async function newBuyers30d(): Promise<number> {
  const since = thirtyDaysAgo();
  return db.mpPurchase
    .findMany({
      where: { createdAt: { gte: since } },
      distinct: ["buyerId"],
      select: { buyerId: true },
    })
    .then((rows) => rows.length);
}
