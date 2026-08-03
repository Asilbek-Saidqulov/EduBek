/** Systems 10, 11, 15, 17, 18 — Experiments, Recommendations, Dashboard, Developer, Admin. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeExperiment, getExperiment, getAllExperiments, storeRecommendation, getRecommendations, getAllFlags, getAllRollouts, getAllProfiles, getAllApprovals, getValidationResult, getConfig, getAllConfigs, getVersions } from "./repository";
import type { Experiment, ExperimentType, ExperimentStatus, ExperimentResult, ConfigRecommendation, ConfigDashboard, ConfigDeveloperIntegration, GameModeId, ConfigVersionStatus } from "./types";

const log = getLogger("game-config.experiments");

// ===== System 10 — Experiment Platform =====
export function createExperiment(input: {
  name: string; description: string; type: ExperimentType;
  configA: Record<string, unknown>; configB: Record<string, unknown>;
  startDate: string; endDate: string; createdBy: string;
}): Experiment {
  const e: Experiment = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, status: "draft",
    configA: input.configA, configB: input.configB,
    startDate: input.startDate, endDate: input.endDate,
    autoApply: false as const, results: null,
    createdBy: input.createdBy, createdAt: new Date().toISOString(),
  };
  storeExperiment(e);
  return e;
}

export function getExperimentById(id: string): Experiment | null { return getExperiment(id); }
export function listExperiments(): Experiment[] { return getAllExperiments(); }

export function startExperiment(id: string): Experiment | null {
  const e = getExperiment(id);
  if (!e || e.status !== "draft") return null;
  e.status = "running";
  log.info("experiment.started", { experimentId: id, type: e.type });
  return e;
}

export function pauseExperiment(id: string): Experiment | null {
  const e = getExperiment(id);
  if (!e || e.status !== "running") return null;
  e.status = "paused";
  return e;
}

export function completeExperiment(id: string, metricA: number, metricB: number): Experiment | null {
  const e = getExperiment(id);
  if (!e || (e.status !== "running" && e.status !== "paused")) return null;
  e.status = "completed";
  const difference = Math.round((metricB - metricA) * 100) / 100;
  const winner = Math.abs(difference) < 0.01 ? "tie" : metricB > metricA ? "B" : "A";
  const confidence = Math.min(1, Math.abs(difference) / 10);
  e.results = { metricA, metricB, difference, winner: winner as "A" | "B" | "tie", confidence: Math.round(confidence * 100) / 100, completedAt: new Date().toISOString() };
  log.info("experiment.completed", { experimentId: id, winner });
  return e;
}

export function cancelExperiment(id: string): Experiment | null {
  const e = getExperiment(id);
  if (!e || e.status === "completed") return null;
  e.status = "cancelled";
  return e;
}

export function supportsAllExperimentTypes(): ExperimentType[] { return ["ab", "multivariate", "shadow", "simulation", "dry_run"]; }

// ===== System 11 — Recommendation Integration =====
export function receiveRecommendation(input: {
  source: string; configId?: string | null; gameMode: GameModeId | "all";
  title: string; description: string; currentValue: unknown; suggestedValue: unknown;
}): ConfigRecommendation {
  const r: ConfigRecommendation = {
    id: randomUUID(), source: input.source, configId: input.configId ?? null,
    gameMode: input.gameMode, title: input.title, description: input.description,
    currentValue: input.currentValue, suggestedValue: input.suggestedValue,
    autoApplied: false as const, acknowledged: false, receivedAt: new Date().toISOString(),
  };
  storeRecommendation(r);
  log.info("recommendation.received", { source: input.source, title: input.title });
  return r;
}

export function getAllRecommendations(): ConfigRecommendation[] { return getRecommendations(); }
export function acknowledgeRecommendation(id: string): ConfigRecommendation | null {
  const recs = getRecommendations();
  const r = recs.find(x => x.id === id);
  if (!r) return null;
  r.acknowledged = true;
  return r;
}

// ===== System 15 — Configuration Dashboard =====
export function generateDashboard(): ConfigDashboard {
  const allConfigs = getAllConfigs();
  const currentVersions = allConfigs.map(c => ({ gameMode: c.gameMode, version: c.version, status: c.status as ConfigVersionStatus }));
  const activeFlags = getAllFlags().filter(f => f.enabled).length;
  const activeRollouts = getAllRollouts().filter(r => r.status === "in_progress").length;
  const activeExperiments = getAllExperiments().filter(e => e.status === "running").length;
  const pendingApprovals = getAllApprovals().filter(a => a.status === "draft" || a.status === "review").length;
  const recommendations = getRecommendations().filter(r => !r.acknowledged).length;
  let validationIssues = 0;
  for (const c of allConfigs) { const vr = getValidationResult(c.id, c.version); if (vr && !vr.valid) validationIssues++; }
  const health = validationIssues > 5 || pendingApprovals > 10 ? "critical" : validationIssues > 0 || pendingApprovals > 3 ? "warning" : "healthy";
  return {
    currentVersions, activeFlags, activeRollouts, activeExperiments,
    validationIssues, pendingApprovals, recommendations,
    health: health as "healthy" | "warning" | "critical", updatedAt: new Date().toISOString(),
  };
}

// ===== System 17 — Developer Integration =====
export function getDeveloperIntegration(): ConfigDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/game-config/status", method: "GET", description: "Platform status", authRequired: true },
      { path: "/api/game-config/configs", method: "GET", description: "List configs", authRequired: true },
      { path: "/api/game-config/versions", method: "GET", description: "List versions", authRequired: true },
      { path: "/api/game-config/flags", method: "GET", description: "List feature flags", authRequired: true },
      { path: "/api/game-config/profiles", method: "GET", description: "List balancing profiles", authRequired: true },
      { path: "/api/game-config/rollouts", method: "GET", description: "List rollouts", authRequired: true },
      { path: "/api/game-config/validation", method: "GET", description: "Validation results", authRequired: true },
      { path: "/api/game-config/experiments", method: "GET", description: "List experiments", authRequired: true },
      { path: "/api/game-config/history", method: "GET", description: "Deployment history", authRequired: true },
      { path: "/api/game-config/dashboard", method: "GET", description: "Configuration dashboard", authRequired: true },
    ],
    extensionHooks: [
      { id: "hook_config_published", name: "On Config Published", triggerEvent: "ConfigurationPublished" },
      { id: "hook_config_rolled_back", name: "On Config Rolled Back", triggerEvent: "ConfigurationRolledBack" },
      { id: "hook_flag_changed", name: "On Feature Flag Changed", triggerEvent: "FeatureFlagChanged" },
    ],
    sdkMetadata: { version: "1.0.0", language: "TypeScript", docsUrl: "https://docs.edubek.dev/config" },
  };
}

// ===== System 18 — Administration API =====
export function getStatus() {
  return {
    platform: "game-config",
    version: "1.0.0",
    totalConfigs: getAllConfigs().length,
    totalFlags: getAllFlags().length,
    totalProfiles: getAllProfiles().length,
    totalExperiments: getAllExperiments().length,
    totalRollouts: getAllRollouts().length,
    dashboard: generateDashboard(),
  };
}
