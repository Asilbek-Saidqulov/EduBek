/** Systems 1, 2, 3, 12, 13, 14 — Config Registry, Versioning, Loader, Approval, Deployment, Rollback. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeConfig, getConfig, getAllConfigs, storeVersion, getVersions, getVersion,
  storeCache, getCache, storeApproval, getApproval, getAllApprovals,
  storeDeployment, getDeployments, storeRollback, getRollbacks,
} from "./repository";
import type {
  GameConfig, GameModeId, ConfigVersion, ConfigVersionStatus, ConfigDiff,
  LoadedConfig, ApprovalWorkflow, ApprovalStatus, ApprovalHistoryEntry,
  DeploymentRecord, RollbackRecord,
} from "./types";

const log = getLogger("game-config.registry");

// ===== System 1 — Configuration Registry =====
export function createConfig(input: {
  gameMode: GameModeId; name: string; version?: string; data?: Record<string, unknown>;
  description?: string; createdBy: string;
}): GameConfig {
  const now = new Date().toISOString();
  const config: GameConfig = {
    id: randomUUID(), gameMode: input.gameMode, name: input.name,
    version: input.version ?? "1.0.0", status: "draft",
    data: input.data ?? {}, description: input.description ?? "",
    createdBy: input.createdBy, createdAt: now, updatedAt: now,
  };
  storeConfig(config);
  // Auto-create initial version
  createVersion(config.id, config.version, "Initial version", input.createdBy);
  log.info("config.created", { id: config.id, gameMode: input.gameMode });
  return config;
}

export function getConfigById(id: string): GameConfig | null { return getConfig(id); }
export function listConfigs(gameMode?: GameModeId): GameConfig[] {
  const all = getAllConfigs();
  return gameMode ? all.filter(c => c.gameMode === gameMode) : all;
}
export function updateConfig(id: string, updates: Partial<GameConfig>): GameConfig | null {
  const c = getConfig(id);
  if (!c) return null;
  Object.assign(c, updates, { updatedAt: new Date().toISOString() });
  storeConfig(c);
  return c;
}

// ===== System 2 — Configuration Versioning =====
export function createVersion(configId: string, version: string, changelog: string, createdBy: string, parentVersion?: string | null): ConfigVersion {
  const v: ConfigVersion = {
    id: randomUUID(), configId, version, status: "draft",
    parentVersion: parentVersion ?? null, changelog, createdBy,
    createdAt: new Date().toISOString(), approvedBy: null, approvedAt: null,
    isRollbackTarget: false, diff: null,
  };
  storeVersion(v);
  return v;
}

export function getVersionsForConfig(configId: string): ConfigVersion[] { return getVersions(configId); }
export function getConfigVersion(configId: string, version: string): ConfigVersion | null { return getVersion(configId, version); }

const VALID_VERSION_TRANSITIONS: Record<ConfigVersionStatus, ConfigVersionStatus[]> = {
  draft: ["testing", "archived"],
  testing: ["approved", "draft", "archived"],
  approved: ["live", "archived"],
  live: ["deprecated", "archived"],
  deprecated: ["archived"],
  archived: [],
};

export function transitionVersion(configId: string, version: string, toStatus: ConfigVersionStatus, actorId: string): ConfigVersion | null {
  const v = getVersion(configId, version);
  if (!v) return null;
  if (!VALID_VERSION_TRANSITIONS[v.status]?.includes(toStatus)) return null;
  v.status = toStatus;
  if (toStatus === "approved") { v.approvedBy = actorId; v.approvedAt = new Date().toISOString(); }
  if (toStatus === "live") v.isRollbackTarget = true;
  return v;
}

export function canTransitionVersion(from: ConfigVersionStatus, to: ConfigVersionStatus): boolean {
  return VALID_VERSION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function computeDiff(dataA: Record<string, unknown>, dataB: Record<string, unknown>): ConfigDiff {
  const added: string[] = [], removed: string[] = [], modified: string[] = [];
  for (const k of Object.keys(dataB)) { if (!(k in dataA)) added.push(k); else if (JSON.stringify(dataA[k]) !== JSON.stringify(dataB[k])) modified.push(k); }
  for (const k of Object.keys(dataA)) { if (!(k in dataB)) removed.push(k); }
  return { added, removed, modified };
}

// ===== System 3 — Live Configuration Loader =====
export function loadConfig(configId: string, version?: string): LoadedConfig | null {
  const config = getConfig(configId);
  if (!config) return null;
  const targetVersion = version ?? config.version;
  const cached = getCache(configId);
  if (cached && cached.version === targetVersion) {
    return { configId, version: targetVersion, loadedAt: new Date().toISOString(), source: "cache", data: cached.data, valid: true };
  }
  // Fallback to config data
  return { configId, version: targetVersion, loadedAt: new Date().toISOString(), source: "fallback", data: config.data, valid: true };
}

export function cacheConfig(configId: string, version: string, data: Record<string, unknown>): void {
  storeCache({ configId, version, cachedAt: new Date().toISOString(), data });
}

// ===== System 12 — Approval Workflow =====
const VALID_APPROVAL_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ["review", "archive"], review: ["testing", "draft", "archive"],
  testing: ["approval", "review", "archive"], approval: ["deployment", "testing", "archive"],
  deployment: ["archive", "rollback"], rollback: ["deployment", "archive"], archive: [],
};

export function createApproval(configId: string, version: string, submittedBy: string): ApprovalWorkflow {
  const now = new Date().toISOString();
  const aw: ApprovalWorkflow = {
    id: randomUUID(), configId, version, status: "draft",
    submittedBy, reviewedBy: null, reviewNote: null, history: [], createdAt: now, updatedAt: now,
  };
  storeApproval(aw);
  return aw;
}

export function transitionApproval(approvalId: string, toStatus: ApprovalStatus, actorId: string, note: string): ApprovalWorkflow | null {
  const aw = getApproval(approvalId);
  if (!aw) return null;
  if (!VALID_APPROVAL_TRANSITIONS[aw.status]?.includes(toStatus)) return null;
  const entry: ApprovalHistoryEntry = { id: randomUUID(), fromStatus: aw.status, toStatus, actorId, note, timestamp: new Date().toISOString() };
  aw.history.push(entry);
  aw.status = toStatus; aw.reviewedBy = actorId; aw.reviewNote = note;
  aw.updatedAt = entry.timestamp;
  return aw;
}

export function canTransitionApproval(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return VALID_APPROVAL_TRANSITIONS[from]?.includes(to) ?? false;
}
export function getApprovalById(id: string): ApprovalWorkflow | null { return getApproval(id); }
export function listApprovals(): ApprovalWorkflow[] { return getAllApprovals(); }

// ===== System 13 — Deployment History =====
export function recordDeployment(input: {
  configId: string; version: string; deployedBy: string; reason: string;
  approvalId?: string | null; impact?: string;
}): DeploymentRecord {
  const d: DeploymentRecord = {
    id: randomUUID(), configId: input.configId, version: input.version,
    deployedBy: input.deployedBy, deployedAt: new Date().toISOString(),
    reason: input.reason, approvalId: input.approvalId ?? null,
    rolledBack: false, rolledBackAt: null, impact: input.impact ?? "none",
  };
  storeDeployment(d);
  log.info("deployment.recorded", { configId: input.configId, version: input.version });
  return d;
}
export function getDeploymentHistory(configId: string): DeploymentRecord[] { return getDeployments(configId); }

// ===== System 14 — Rollback Platform =====
export function rollbackConfig(input: {
  configId: string; fromVersion: string; toVersion: string; rolledBackBy: string;
  reason: string; scheduled?: boolean;
}): RollbackRecord {
  const r: RollbackRecord = {
    id: randomUUID(), configId: input.configId, fromVersion: input.fromVersion,
    toVersion: input.toVersion, rolledBackBy: input.rolledBackBy,
    rolledBackAt: new Date().toISOString(), reason: input.reason,
    automatic: false as const, scheduled: input.scheduled ?? false,
  };
  storeRollback(r);
  // Update config version
  const config = getConfig(input.configId);
  if (config) { config.version = input.toVersion; config.updatedAt = new Date().toISOString(); storeConfig(config); }
  log.info("rollback.executed", { configId: input.configId, from: input.fromVersion, to: input.toVersion });
  return r;
}
export function getRollbackHistory(configId: string): RollbackRecord[] { return getRollbacks(configId); }
