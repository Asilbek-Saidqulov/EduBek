/**
 * EduBek — Analytics feature barrel export.
 */
export {
  getPlatformAnalytics,
  getCreatorAnalytics,
  getMarketplaceGrowth,
} from "./service";

export type {
  PlatformAnalyticsDto,
  CreatorAnalyticsDto,
  MarketplaceGrowthDto,
  MonthlyPoint,
  TopCreatorStat,
  TopResourceStat,
  TopOrganizationStat,
} from "./types";
