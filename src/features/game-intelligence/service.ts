/** Game Intelligence Platform service — composes all 18 systems. */
export {
  recordTelemetry, getMatchTelemetry, computeTelemetrySummary, getTelemetrySummaryForMatch,
  recordBalanceFinding, getBalanceFindingsForMode, generateBalanceReport,
  recordEconomyMetric, getEconomyMetricFor, generateEconomyReport, getLatestEconomyReport,
  recordDifficultyFinding, getAllDifficultyFindings, getDifficultyByIssue,
  recordEducationalKPI, getEducationalKPIForUser, listAllEducationalKPIs,
  recordMetaTrend, getMetaTrendsForCategory,
  segmentPlayer, getSegmentationForUser, supportsAllSegments,
} from "./telemetry-balance";

export {
  computeMatchIntelligence, getMatchIntelligenceRecord,
  raiseHealthAlert, getAllHealthAlerts, getUnresolvedAlerts, resolveAlert,
  computeLiveHealth, getCurrentLiveHealth,
  createSimulation, runSimulation, getSimulationById, listSimulations,
  createABComparison, listABComparisons,
  generateRecommendation, getAllRecommendations, getRecommendationsByPriority, getRecommendationsByKind,
  generateHeatmap, getHeatmapsByType, supportsAllHeatmapTypes,
  recordSeasonIntelligence, getSeasonIntel,
  recordCompetitiveIntelligence, getCurrentCompetitiveIntelligence,
  generateIntelligenceDashboard, getDeveloperIntegration,
} from "./intelligence-dashboard";

export {
  subscribeIntelligence, unsubscribeIntelligence, isIntelligenceSubscribed,
  getBridgeProcessedCount, publishIntelligenceEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

export { _resetRepositoryForTesting } from "./repository";
