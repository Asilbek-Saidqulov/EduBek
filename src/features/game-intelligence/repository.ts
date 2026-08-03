/** In-memory repository for Game Intelligence Platform. */
import type {
  TelemetryEvent, TelemetrySummary, BalanceFinding, BalanceReport,
  EconomyMetric, EconomyReport, DifficultyFinding, EducationalKPI,
  MetaTrend, PlayerSegmentation, MatchIntelligence, HealthAlert, LiveHealth,
  SimulationConfig, ABComparison, Recommendation, Heatmap,
  SeasonIntelligence, CompetitiveIntelligence,
} from "./types";

const telemetryEvents = new Map<string, TelemetryEvent[]>();
const telemetrySummaries = new Map<string, TelemetrySummary>();
const balanceFindings = new Map<string, BalanceFinding[]>();
const balanceReports = new Map<string, BalanceReport>();
const economyMetrics = new Map<string, EconomyMetric>();
const economyReports = new Map<string, EconomyReport>();
const difficultyFindings = new Map<string, DifficultyFinding[]>();
const educationalKPIs = new Map<string, EducationalKPI>();
const metaTrends = new Map<string, MetaTrend[]>();
const playerSegmentations = new Map<string, PlayerSegmentation>();
const matchIntelligence = new Map<string, MatchIntelligence>();
const healthAlerts = new Map<string, HealthAlert[]>();
const liveHealth = new Map<string, LiveHealth>();
const simulations = new Map<string, SimulationConfig>();
const abComparisons = new Map<string, ABComparison[]>();
const recommendations = new Map<string, Recommendation[]>();
const heatmaps = new Map<string, Heatmap[]>();
const seasonIntelligence = new Map<string, SeasonIntelligence>();
const competitiveIntelligence = new Map<string, CompetitiveIntelligence>();

export const storeTelemetryEvent = (e: TelemetryEvent) => { const l = telemetryEvents.get(e.matchId) ?? []; l.push(e); telemetryEvents.set(e.matchId, l); };
export const getTelemetryEvents = (matchId: string) => telemetryEvents.get(matchId) ?? [];
export const storeTelemetrySummary = (s: TelemetrySummary) => telemetrySummaries.set(s.matchId, s);
export const getTelemetrySummary = (matchId: string) => telemetrySummaries.get(matchId) ?? null;
export const storeBalanceFinding = (f: BalanceFinding) => { const l = balanceFindings.get(f.gameMode) ?? []; l.push(f); balanceFindings.set(f.gameMode, l); };
export const getBalanceFindings = (gameMode: string) => balanceFindings.get(gameMode) ?? [];
export const storeBalanceReport = (r: BalanceReport) => balanceReports.set(r.gameMode, r);
export const getBalanceReport = (gameMode: string) => balanceReports.get(gameMode) ?? null;
export const storeEconomyMetric = (m: EconomyMetric) => economyMetrics.set(m.resource, m);
export const getEconomyMetric = (resource: string) => economyMetrics.get(resource) ?? null;
export const storeEconomyReport = (r: EconomyReport) => economyReports.set("latest", r);
export const getEconomyReport = () => economyReports.get("latest") ?? null;
export const storeDifficultyFinding = (f: DifficultyFinding) => { const l = difficultyFindings.get("all") ?? []; l.push(f); difficultyFindings.set("all", l); };
export const getDifficultyFindings = () => difficultyFindings.get("all") ?? [];
export const storeEducationalKPI = (k: EducationalKPI) => educationalKPIs.set(k.userId, k);
export const getEducationalKPI = (userId: string) => educationalKPIs.get(userId) ?? null;
export const getAllEducationalKPIs = () => Array.from(educationalKPIs.values());
export const storeMetaTrend = (t: MetaTrend) => { const l = metaTrends.get(t.category) ?? []; l.push(t); metaTrends.set(t.category, l); };
export const getMetaTrends = (category: string) => metaTrends.get(category) ?? [];
export const storePlayerSegmentation = (s: PlayerSegmentation) => playerSegmentations.set(s.userId, s);
export const getPlayerSegmentation = (userId: string) => playerSegmentations.get(userId) ?? null;
export const storeMatchIntelligence = (m: MatchIntelligence) => matchIntelligence.set(m.matchId, m);
export const getMatchIntelligence = (matchId: string) => matchIntelligence.get(matchId) ?? null;
export const storeHealthAlert = (a: HealthAlert) => { const l = healthAlerts.get("all") ?? []; l.push(a); healthAlerts.set("all", l); };
export const getHealthAlerts = () => healthAlerts.get("all") ?? [];
export const storeLiveHealth = (h: LiveHealth) => liveHealth.set("current", h);
export const getLiveHealth = () => liveHealth.get("current") ?? null;
export const storeSimulation = (s: SimulationConfig) => simulations.set(s.id, s);
export const getSimulation = (id: string) => simulations.get(id) ?? null;
export const getAllSimulations = () => Array.from(simulations.values());
export const storeABComparison = (c: ABComparison) => { const l = abComparisons.get("all") ?? []; l.push(c); abComparisons.set("all", l); };
export const getABComparisons = () => abComparisons.get("all") ?? [];
export const storeRecommendation = (r: Recommendation) => { const l = recommendations.get("all") ?? []; l.push(r); recommendations.set("all", l); };
export const getRecommendations = () => recommendations.get("all") ?? [];
export const storeHeatmap = (h: Heatmap) => { const l = heatmaps.get(h.type) ?? []; l.push(h); heatmaps.set(h.type, l); };
export const getHeatmaps = (type: string) => heatmaps.get(type) ?? [];
export const storeSeasonIntelligence = (s: SeasonIntelligence) => seasonIntelligence.set(s.seasonId, s);
export const getSeasonIntelligence = (seasonId: string) => seasonIntelligence.get(seasonId) ?? null;
export const storeCompetitiveIntelligence = (c: CompetitiveIntelligence) => competitiveIntelligence.set("current", c);
export const getCompetitiveIntelligence = () => competitiveIntelligence.get("current") ?? null;

export function _resetRepositoryForTesting() {
  telemetryEvents.clear(); telemetrySummaries.clear(); balanceFindings.clear();
  balanceReports.clear(); economyMetrics.clear(); economyReports.clear();
  difficultyFindings.clear(); educationalKPIs.clear(); metaTrends.clear();
  playerSegmentations.clear(); matchIntelligence.clear(); healthAlerts.clear();
  liveHealth.clear(); simulations.clear(); abComparisons.clear();
  recommendations.clear(); heatmaps.clear(); seasonIntelligence.clear();
  competitiveIntelligence.clear();
}
