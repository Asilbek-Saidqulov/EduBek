/**
 * EduBek — Analytics feature types.
 *
 * Two analytics views are exposed:
 *
 *   • PlatformAnalyticsDto — admin-only, the whole platform's KPIs
 *                            (revenue, GMV, wallet volume, top sellers, …).
 *   • CreatorAnalyticsDto  — a single creator's performance (impressions,
 *                            CTR, conversion, monthly history, …).
 */

export interface MonthlyPoint {
  month: string;
  value: number;
}

export interface TopCreatorStat {
  creatorId: string;
  displayName: string | null;
  earnings: number;
  sales: number;
  tier: string | null;
}

export interface TopResourceStat {
  resourceId: string;
  title: string;
  sales: number;
  revenue: number;
  views: number;
}

export interface TopOrganizationStat {
  orgId: string;
  name: string;
  members: number;
  purchases: number;
}

export interface PlatformAnalyticsDto {
  revenue: number;
  gmv: number;
  platformEarnings: number;
  creatorEarnings: number;
  walletVolume: number;
  purchases: number;
  refunds: number;
  activeSubscriptions: number;
  aiGenerations: number;
  marketplaceGrowth: number;
  dailyUsers: number;
  monthlyUsers: number;
  topCreators: TopCreatorStat[];
  topResources: TopResourceStat[];
  topOrganizations: TopOrganizationStat[];
}

export interface CreatorAnalyticsDto {
  creatorId: string;
  impressions: number;
  ctr: number;
  purchases: number;
  wishlistAdditions: number;
  favorites: number;
  downloads: number;
  revenue: number;
  refunds: number;
  conversion: number;
  monthlyHistory: MonthlyPoint[];
}

export interface MarketplaceGrowthDto {
  listingCount: number;
  publishedListings: number;
  creatorCount: number;
  buyerCount: number;
  gmv: number;
  gmvGrowthPercent: number;
  newListings30d: number;
  newBuyers30d: number;
}
