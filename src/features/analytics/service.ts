/**
 * EduBek — Analytics service.
 *
 * Composes repository aggregates into the two DTOs exposed to the API:
 *   • PlatformAnalyticsDto — admin-only, whole-platform KPIs
 *   • CreatorAnalyticsDto  — a creator's own performance
 *
 * Authorization is enforced here (admin / analytics.view for platform,
 * analytics.view_own for creator). The service never trusts a caller-
 * supplied creatorId for the creator endpoint — it always uses the
 * authenticated user's id, so creators can only see their own numbers.
 */
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PlatformPermission,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type {
  CreatorAnalyticsDto,
  MarketplaceGrowthDto,
  PlatformAnalyticsDto,
  TopCreatorStat,
  TopOrganizationStat,
  TopResourceStat,
} from "./types";

// ---------------------------------------------------------------------------
// Platform analytics (admin-only)
// ---------------------------------------------------------------------------

export async function getPlatformAnalytics(
  ctx: AuthContext,
): Promise<PlatformAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.ANALYTICS_VIEW)) {
    throw forbidden("Admin only — analytics.view required");
  }

  const [
    revenue,
    gmv,
    platformEarnings,
    creatorEarnings,
    walletVolume,
    purchases,
    refunds,
    subs,
    aiGen,
    growth,
    dau,
    mau,
    topCreatorsRaw,
    topResourcesRaw,
    topOrgsRaw,
  ] = await Promise.all([
    repo.platformRevenue(),
    repo.platformGMV(),
    repo.platformEarnings(),
    repo.creatorEarningsTotal(),
    repo.walletVolume(),
    repo.purchaseCount(),
    repo.refundCount(),
    repo.activeSubscriptions(),
    repo.aiGenerations(),
    repo.marketplaceGrowthPercent(),
    repo.dailyActiveUsers(),
    repo.monthlyActiveUsers(),
    repo.topCreators(10),
    repo.topResources(10),
    repo.topOrganizations(10),
  ]);

  // Resolve the topCreators' sales counts in parallel.
  const topCreators: TopCreatorStat[] = await Promise.all(
    topCreatorsRaw.map(async (c) => ({
      creatorId: c.userId,
      displayName: c.displayName,
      earnings: c.totalEarnings,
      sales: await repo.creatorSalesCount(c.userId),
      tier: c.platformTier?.tier?.name ?? null,
    })),
  );

  const topResources: TopResourceStat[] = await Promise.all(
    topResourcesRaw.map(async (r) => {
      const { sales, revenue } = await repo.resourceRevenue(r.id);
      return {
        resourceId: r.id,
        title: r.title,
        sales,
        revenue,
        views: r.viewCount,
      };
    }),
  );

  const topOrganizations: TopOrganizationStat[] = await Promise.all(
    topOrgsRaw.map(async (o) => ({
      orgId: o.id,
      name: o.name,
      members: o._count.memberships,
      purchases: await repo.orgPurchaseCount(o.id),
    })),
  );

  return {
    revenue,
    gmv,
    platformEarnings,
    creatorEarnings,
    walletVolume,
    purchases,
    refunds,
    activeSubscriptions: subs,
    aiGenerations: aiGen,
    marketplaceGrowth: growth,
    dailyUsers: dau,
    monthlyUsers: mau,
    topCreators,
    topResources,
    topOrganizations,
  };
}

// ---------------------------------------------------------------------------
// Creator analytics (self-only)
// ---------------------------------------------------------------------------

export async function getCreatorAnalytics(
  ctx: AuthContext,
): Promise<CreatorAnalyticsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ANALYTICS_VIEW_OWN)) {
    throw forbidden("No permission to view own analytics");
  }

  // Confirm the caller actually has a creator profile.
  const creator = await db.creator.findUnique({
    where: { userId: ctx.userId },
    select: { userId: true },
  });
  if (!creator) throw notFound("Creator profile not found");

  const [agg, sales, refunds, wishlist, views, monthly] = await Promise.all([
    repo.creatorListingsAggregate(ctx.userId),
    repo.creatorSales(ctx.userId),
    repo.creatorRefunds(ctx.userId),
    repo.creatorWishlistAdditions(ctx.userId),
    repo.creatorListingViews(ctx.userId),
    repo.creatorMonthlyHistory(ctx.userId, 12),
  ]);

  const impressions = views;
  const ctr = impressions > 0 ? Math.round((sales.purchases / impressions) * 10000) / 100 : 0;
  const conversion =
    impressions > 0 ? Math.round((sales.purchases / impressions) * 10000) / 100 : 0;

  return {
    creatorId: ctx.userId,
    impressions,
    ctr,
    purchases: sales.purchases,
    wishlistAdditions: wishlist,
    favorites: agg.favorites,
    downloads: agg.downloads,
    revenue: sales.revenue,
    refunds,
    conversion,
    monthlyHistory: monthly,
  };
}

// ---------------------------------------------------------------------------
// Marketplace growth (admin-only)
// ---------------------------------------------------------------------------

export async function getMarketplaceGrowth(
  ctx: AuthContext,
): Promise<MarketplaceGrowthDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.ANALYTICS_VIEW)) {
    throw forbidden("Admin only — analytics.view required");
  }

  const [listings, creators, buyers, gmv, growth, newListings, newBuyers] =
    await Promise.all([
      repo.marketplaceListingCount(),
      repo.creatorCount(),
      repo.buyerCount(),
      repo.platformGMV(),
      repo.marketplaceGrowthPercent(),
      repo.newListings30d(),
      repo.newBuyers30d(),
    ]);

  return {
    listingCount: listings.total,
    publishedListings: listings.published,
    creatorCount: creators,
    buyerCount: buyers,
    gmv,
    gmvGrowthPercent: growth,
    newListings30d: newListings,
    newBuyers30d: newBuyers,
  };
}
