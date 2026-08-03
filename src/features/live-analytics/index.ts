/**
 * EduBek — Live Quiz Analytics feature barrel export.
 */
export {
  getSessionAnalytics,
  getPlatformAnalytics,
  getLiveUpdate,
  // Phase 4C.1 additive
  getPerQuestionAnalytics,
  getPerGameModeAnalytics,
} from "./service";

export {
  analyticsQuerySchema,
  type AnalyticsQuery,
} from "./schema";

export type {
  SessionAnalyticsDto,
  PlatformAnalyticsDto,
  LiveAnalyticsUpdateDto,
  PerQuestionAnalyticsDto,
  PerGameModeAnalyticsDto,
} from "./types";
