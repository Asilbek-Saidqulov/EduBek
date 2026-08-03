/** Systems 4, 5, 6, 7 — Feature Flags, Balancing Profiles, Environment Config, Rollout Engine. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeFlag, getFlag, getAllFlags, storeProfile, getProfile, getAllProfiles, storeEnvironment, getEnvironment, getAllEnvironments, storeRollout, getRollout, getAllRollouts } from "./repository";
import type { FeatureFlag, FlagRolloutType, FlagEvaluation, BalancingProfile, ProfileType, EnvironmentConfig, EnvironmentType, Rollout, RolloutStrategy, RolloutStatus, GameModeId } from "./types";

const log = getLogger("game-config.flags");

// ===== System 4 — Feature Flag Platform =====
export function createFlag(input: {
  name: string; description: string; rolloutType?: FlagRolloutType; enabled?: boolean;
  percentage?: number; targetIds?: string[]; prerequisites?: string[]; dependencies?: string[];
  environment?: EnvironmentType;
}): FeatureFlag {
  const now = new Date().toISOString();
  const flag: FeatureFlag = {
    id: randomUUID(), name: input.name, description: input.description,
    rolloutType: input.rolloutType ?? "boolean", enabled: input.enabled ?? false,
    percentage: input.percentage ?? 0, targetIds: input.targetIds ?? [],
    prerequisites: input.prerequisites ?? [], dependencies: input.dependencies ?? [],
    environment: input.environment ?? "production", createdAt: now, updatedAt: now,
  };
  storeFlag(flag);
  return flag;
}

export function getFlagById(id: string): FeatureFlag | null { return getFlag(id); }
export function listFlags(): FeatureFlag[] { return getAllFlags(); }

export function enableFlag(id: string): FeatureFlag | null {
  const f = getFlag(id);
  if (!f) return null;
  f.enabled = true; f.updatedAt = new Date().toISOString();
  return f;
}
export function disableFlag(id: string): FeatureFlag | null {
  const f = getFlag(id);
  if (!f) return null;
  f.enabled = false; f.updatedAt = new Date().toISOString();
  return f;
}
export function emergencyDisable(id: string): FeatureFlag | null {
  const f = getFlag(id);
  if (!f) return null;
  f.enabled = false; f.rolloutType = "emergency_disable"; f.percentage = 0; f.updatedAt = new Date().toISOString();
  log.warn("flag.emergency_disable", { flagId: id });
  return f;
}
export function setFlagPercentage(id: string, pct: number): FeatureFlag | null {
  const f = getFlag(id);
  if (!f) return null;
  f.percentage = Math.max(0, Math.min(100, pct)); f.enabled = pct > 0; f.updatedAt = new Date().toISOString();
  return f;
}
export function setFlagTargets(id: string, targetIds: string[]): FeatureFlag | null {
  const f = getFlag(id);
  if (!f) return null;
  f.targetIds = targetIds; f.enabled = targetIds.length > 0; f.updatedAt = new Date().toISOString();
  return f;
}

export function evaluateFlag(flagId: string, context?: { userId?: string; organizationId?: string; schoolId?: string; environment?: EnvironmentType }): FlagEvaluation {
  const f = getFlag(flagId);
  if (!f) return { flagId, userId: context?.userId ?? null, enabled: false, reason: "Flag not found", evaluatedAt: new Date().toISOString() };
  if (!f.enabled) return { flagId, userId: context?.userId ?? null, enabled: false, reason: "Flag disabled", evaluatedAt: new Date().toISOString() };
  // Check prerequisites
  for (const prereq of f.prerequisites) { const pf = getFlag(prereq); if (!pf?.enabled) return { flagId, userId: context?.userId ?? null, enabled: false, reason: `Prerequisite ${prereq} not met`, evaluatedAt: new Date().toISOString() }; }
  switch (f.rolloutType) {
    case "boolean": return { flagId, userId: context?.userId ?? null, enabled: true, reason: "Boolean enabled", evaluatedAt: new Date().toISOString() };
    case "percentage": return { flagId, userId: context?.userId ?? null, enabled: f.percentage >= 100, reason: `Percentage: ${f.percentage}%`, evaluatedAt: new Date().toISOString() };
    case "organization": return { flagId, userId: context?.userId ?? null, enabled: context?.organizationId ? f.targetIds.includes(context.organizationId) : false, reason: "Org rollout", evaluatedAt: new Date().toISOString() };
    case "school": return { flagId, userId: context?.userId ?? null, enabled: context?.schoolId ? f.targetIds.includes(context.schoolId) : false, reason: "School rollout", evaluatedAt: new Date().toISOString() };
    case "environment": return { flagId, userId: context?.userId ?? null, enabled: context?.environment ? f.targetIds.includes(context.environment) : false, reason: "Environment rollout", evaluatedAt: new Date().toISOString() };
    case "emergency_disable": return { flagId, userId: context?.userId ?? null, enabled: false, reason: "Emergency disabled", evaluatedAt: new Date().toISOString() };
    default: return { flagId, userId: context?.userId ?? null, enabled: f.targetIds.length > 0, reason: "Target-based rollout", evaluatedAt: new Date().toISOString() };
  }
}

// ===== System 5 — Balancing Profiles =====
export function createProfile(input: {
  name: string; type: ProfileType; gameMode: GameModeId;
  configOverrides?: Record<string, unknown>; active?: boolean; createdBy: string;
}): BalancingProfile {
  const now = new Date().toISOString();
  const p: BalancingProfile = {
    id: randomUUID(), name: input.name, type: input.type, gameMode: input.gameMode,
    configOverrides: input.configOverrides ?? {}, active: input.active ?? false,
    createdBy: input.createdBy, createdAt: now, updatedAt: now,
  };
  storeProfile(p);
  return p;
}
export function getProfileById(id: string): BalancingProfile | null { return getProfile(id); }
export function listProfiles(): BalancingProfile[] { return getAllProfiles(); }
export function activateProfile(id: string): BalancingProfile | null {
  const p = getProfile(id);
  if (!p) return null;
  p.active = true; p.updatedAt = new Date().toISOString();
  return p;
}
export function deactivateProfile(id: string): BalancingProfile | null {
  const p = getProfile(id);
  if (!p) return null;
  p.active = false; p.updatedAt = new Date().toISOString();
  return p;
}

// ===== System 6 — Environment Configuration =====
export function createEnvironment(input: {
  environment: EnvironmentType; configs?: Record<string, unknown>; overrides?: Record<string, unknown>; active?: boolean;
}): EnvironmentConfig {
  const e: EnvironmentConfig = {
    id: randomUUID(), environment: input.environment,
    configs: input.configs ?? {}, overrides: input.overrides ?? {},
    active: input.active ?? true, updatedAt: new Date().toISOString(),
  };
  storeEnvironment(e);
  return e;
}
export function getEnvironmentById(id: string): EnvironmentConfig | null { return getEnvironment(id); }
export function listEnvironments(): EnvironmentConfig[] { return getAllEnvironments(); }
export function updateEnvironment(id: string, updates: Partial<EnvironmentConfig>): EnvironmentConfig | null {
  const e = getEnvironment(id);
  if (!e) return null;
  Object.assign(e, updates, { updatedAt: new Date().toISOString() });
  return e;
}

// ===== System 7 — Rollout Engine =====
export function createRollout(input: {
  configId: string; version: string; strategy: RolloutStrategy;
  percentage?: number; targetIds?: string[]; scheduledAt?: string | null; createdBy: string;
}): Rollout {
  const r: Rollout = {
    id: randomUUID(), configId: input.configId, version: input.version,
    strategy: input.strategy, status: "pending",
    percentage: input.percentage ?? 100, targetIds: input.targetIds ?? [],
    scheduledAt: input.scheduledAt ?? null, startedAt: null, completedAt: null,
    rolledBackAt: null, rolledBackBy: null,
    createdBy: input.createdBy, createdAt: new Date().toISOString(),
  };
  storeRollout(r);
  return r;
}
export function getRolloutById(id: string): Rollout | null { return getRollout(id); }
export function listRollouts(): Rollout[] { return getAllRollouts(); }

export function startRollout(id: string): Rollout | null {
  const r = getRollout(id);
  if (!r || r.status !== "pending") return null;
  r.status = "in_progress"; r.startedAt = new Date().toISOString();
  return r;
}
export function completeRollout(id: string): Rollout | null {
  const r = getRollout(id);
  if (!r || r.status !== "in_progress") return null;
  r.status = "completed"; r.completedAt = new Date().toISOString();
  return r;
}
export function rollbackRollout(id: string, rolledBackBy: string): Rollout | null {
  const r = getRollout(id);
  if (!r || r.status !== "completed") return null;
  r.status = "rolled_back"; r.rolledBackAt = new Date().toISOString(); r.rolledBackBy = rolledBackBy;
  return r;
}
export function cancelRollout(id: string): Rollout | null {
  const r = getRollout(id);
  if (!r || (r.status !== "pending" && r.status !== "in_progress")) return null;
  r.status = "cancelled";
  return r;
}

export function supportsAllRolloutStrategies(): RolloutStrategy[] { return ["canary", "percentage", "organization", "country", "region", "gradual", "instant", "scheduled"]; }
export function supportsAllFlagRolloutTypes(): FlagRolloutType[] { return ["boolean", "percentage", "organization", "school", "teacher", "player", "tournament", "region", "environment", "emergency_disable"]; }
export function supportsAllProfileTypes(): ProfileType[] { return ["casual", "classroom", "tournament", "olympiad", "practice", "demo", "custom"]; }
export function supportsAllEnvironments(): EnvironmentType[] { return ["development", "testing", "qa", "staging", "production", "sandbox", "local"]; }
