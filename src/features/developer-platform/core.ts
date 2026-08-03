/** Systems 1-8: Registry, Manifests, SDK, Capabilities, Sandbox, Permissions, Lifecycle, Dependencies. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeExtension, getExtension, getExtensionByKey, getAllExtensions,
  storeManifest, getManifest, getManifestByExtension, getAllManifests,
  storeSdk, getSdk, getSdkByKey, getAllSdks,
  storeCapability, getCapability, getCapabilityByKey, getAllCapabilities,
  storeSandbox, getSandbox, getSandboxByExtension, getAllSandboxes,
  storePermission, getPermission, getAllPermissions, getPermissionsByExtension,
  storeLifecycleEvent, getLifecycleEvents, storeLifecycleState, getLifecycleState, getAllLifecycleStates,
} from "./repository";
import type {
  ExtensionRegistryEntry, ExtensionType, ExtensionStatus,
  PluginManifest, SdkEntry, SdkLanguage,
  ApiCapability, SandboxPolicy,
  ExtensionPermission, PermissionStatus,
  LifecycleEvent, LifecycleAction, LifecycleState, LifecycleState_ as LifecycleStateRecord,
  DependencyCheckResult, DependencyNode,
} from "./types";
import { publishDeveloperEvent } from "./event-bus-bridge";

const log = getLogger("developer.core");

// ===== System 1 — Extension Registry =====
export function registerExtension(input: {
  key: string; name: string; type: ExtensionType;
  namespace: string; ownerId: string; signature: string;
  status?: ExtensionStatus; metadata?: Record<string, unknown>;
}): ExtensionRegistryEntry {
  if (getExtensionByKey(input.key)) throw new Error(`Extension key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const ext: ExtensionRegistryEntry = {
    id: randomUUID(), key: input.key, name: input.name, type: input.type,
    status: input.status ?? "registered", namespace: input.namespace, ownerId: input.ownerId,
    signature: input.signature, version: 1,
    createdAt: now, updatedAt: now, deprecatedAt: null, removedAt: null,
    metadata: input.metadata ?? {},
  };
  storeExtension(ext);
  return ext;
}
export function getExtensionById(id: string) { return getExtension(id); }
export function getExtensionByKeyStr(key: string) { return getExtensionByKey(key); }
export function listExtensions(type?: ExtensionType, status?: ExtensionStatus) {
  let all = getAllExtensions();
  if (type) all = all.filter(e => e.type === type);
  if (status) all = all.filter(e => e.status === status);
  return all;
}
export function suspendExtension(id: string) {
  const e = getExtension(id); if (!e) return null;
  e.status = "suspended"; e.updatedAt = new Date().toISOString(); e.version += 1;
  storeExtension(e); return e;
}
export function deprecateExtension(id: string) {
  const e = getExtension(id); if (!e) return null;
  e.status = "deprecated"; e.updatedAt = new Date().toISOString(); e.version += 1; e.deprecatedAt = e.updatedAt;
  storeExtension(e); return e;
}
export function removeExtension(id: string) {
  const e = getExtension(id); if (!e) return null;
  e.status = "removed"; e.updatedAt = new Date().toISOString(); e.version += 1; e.removedAt = e.updatedAt;
  storeExtension(e); return e;
}
export function supportsAllExtensionTypes() { return ["plugin", "sdk", "theme", "integration", "widget", "cli_tool"]; }
export function supportsAllExtensionStatuses() { return ["draft", "registered", "active", "suspended", "deprecated", "removed"]; }

// ===== System 2 — Plugin Manifest Platform =====
export function createManifest(input: {
  extensionId: string; version: string; name: string; description?: string;
  author: string; capabilities?: string[]; permissions?: string[];
  dependencies?: Array<{ extensionKey: string; versionRange: string }>;
  minPlatformVersion: string; maxPlatformVersion?: string | null;
  entryPoint: string; iconUrl?: string | null; homepageUrl?: string | null;
  license?: string; metadata?: Record<string, unknown>;
}): PluginManifest {
  const now = new Date().toISOString();
  const m: PluginManifest = {
    id: randomUUID(), extensionId: input.extensionId,
    version: input.version, name: input.name, description: input.description ?? "",
    author: input.author, capabilities: input.capabilities ?? [], permissions: input.permissions ?? [],
    dependencies: input.dependencies ?? [],
    compatibility: { minPlatformVersion: input.minPlatformVersion, maxPlatformVersion: input.maxPlatformVersion ?? null },
    entryPoint: input.entryPoint, iconUrl: input.iconUrl ?? null, homepageUrl: input.homepageUrl ?? null,
    license: input.license ?? "MIT", semanticVersion: input.version,
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeManifest(m);
  return m;
}
export function getManifestById(id: string) { return getManifest(id); }
export function getManifestForExtension(extId: string) { return getManifestByExtension(extId); }
export function listManifests() { return getAllManifests(); }

// ===== System 3 — SDK Registry =====
export function registerSdk(input: {
  key: string; name: string; language: SdkLanguage; version: string;
  downloadUrl?: string | null; docsUrl?: string | null; minPlatformVersion: string;
  active?: boolean; metadata?: Record<string, unknown>;
}): SdkEntry {
  if (getSdkByKey(input.key)) throw new Error(`SDK key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const sdk: SdkEntry = {
    id: randomUUID(), key: input.key, name: input.name, language: input.language,
    version: input.version, downloadUrl: input.downloadUrl ?? null, docsUrl: input.docsUrl ?? null,
    minPlatformVersion: input.minPlatformVersion, active: input.active ?? true,
    deprecatedAt: null, createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeSdk(sdk);
  publishDeveloperEvent("SdkPublished", null, { sdkId: sdk.id, language: sdk.language });
  return sdk;
}
export function getSdkById(id: string) { return getSdk(id); }
export function listSdks(language?: SdkLanguage, active?: boolean) {
  let all = getAllSdks();
  if (language) all = all.filter(s => s.language === language);
  if (active !== undefined) all = all.filter(s => s.active === active);
  return all;
}
export function deprecateSdk(id: string) {
  const s = getSdk(id); if (!s) return null;
  s.active = false; s.deprecatedAt = new Date().toISOString(); s.updatedAt = s.deprecatedAt;
  storeSdk(s);
  publishDeveloperEvent("SdkDeprecated", null, { sdkId: s.id });
  return s;
}
export function supportsAllSdkLanguages() { return ["typescript", "python", "rust", "go", "java", "rest", "websocket"]; }

// ===== System 4 — API Capability Registry =====
export function registerCapability(input: {
  key: string; name: string; description?: string;
  scopes?: string[]; permissions?: string[];
  rateLimitPerMinute?: number; rateLimitPerHour?: number;
  documentationRef?: string | null; active?: boolean;
  metadata?: Record<string, unknown>;
}): ApiCapability {
  if (getCapabilityByKey(input.key)) throw new Error(`Capability key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const cap: ApiCapability = {
    id: randomUUID(), key: input.key, name: input.name, description: input.description ?? "",
    scopes: input.scopes ?? [], permissions: input.permissions ?? [],
    rateLimitPerMinute: input.rateLimitPerMinute ?? 100, rateLimitPerHour: input.rateLimitPerHour ?? 1000,
    documentationRef: input.documentationRef ?? null, active: input.active ?? true,
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeCapability(cap);
  return cap;
}
export function getCapabilityById(id: string) { return getCapability(id); }
export function listCapabilities(active?: boolean) {
  const all = getAllCapabilities();
  return active === undefined ? all : all.filter(c => c.active === active);
}

// ===== System 5 — Extension Sandbox =====
export function createSandboxPolicy(input: {
  extensionId: string;
  executionIsolation?: "isolated" | "shared" | "forbidden";
  memoryLimitMb?: number; cpuLimitPercent?: number; timeoutMs?: number;
  filesystemAccess?: "none" | "read" | "read_write";
  networkAccess?: "none" | "egress" | "full";
  allowedHosts?: string[]; metadata?: Record<string, unknown>;
}): SandboxPolicy {
  const now = new Date().toISOString();
  const policy: SandboxPolicy = {
    id: randomUUID(), extensionId: input.extensionId,
    executionIsolation: input.executionIsolation ?? "isolated",
    memoryLimitMb: input.memoryLimitMb ?? 128,
    cpuLimitPercent: input.cpuLimitPercent ?? 25,
    timeoutMs: input.timeoutMs ?? 5000,
    filesystemAccess: input.filesystemAccess ?? "none",
    networkAccess: input.networkAccess ?? "none",
    allowedHosts: input.allowedHosts ?? [],
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeSandbox(policy);
  return policy;
}
export function getSandboxById(id: string) { return getSandbox(id); }
export function getSandboxForExtension(extId: string) { return getSandboxByExtension(extId); }
export function listSandboxes() { return getAllSandboxes(); }

// ===== System 6 — Permission Model =====
export function requestPermission(input: {
  extensionId: string; capability: string; scope: string;
  metadata?: Record<string, unknown>;
}): ExtensionPermission {
  const perm: ExtensionPermission = {
    id: randomUUID(), extensionId: input.extensionId,
    capability: input.capability, scope: input.scope,
    status: "pending", requestedAt: new Date().toISOString(),
    approvedBy: null, approvedAt: null, revokedAt: null, reason: null,
    metadata: input.metadata ?? {},
  };
  storePermission(perm);
  return perm;
}
export function getPermissionById(id: string) { return getPermission(id); }
export function listPermissions(status?: PermissionStatus) {
  const all = getAllPermissions();
  return status ? all.filter(p => p.status === status) : all;
}
export function listPermissionsForExtension(extId: string) { return getPermissionsByExtension(extId); }
export function approvePermission(id: string, approverId: string) {
  const p = getPermission(id); if (!p) return null;
  if (p.status !== "pending") return null;
  p.status = "approved"; p.approvedBy = approverId; p.approvedAt = new Date().toISOString();
  storePermission(p); return p;
}
export function rejectPermission(id: string, reviewerId: string, reason: string) {
  const p = getPermission(id); if (!p) return null;
  if (p.status !== "pending") return null;
  p.status = "rejected"; p.approvedBy = reviewerId; p.reason = reason;
  storePermission(p); return p;
}
export function revokePermission(id: string, reason: string) {
  const p = getPermission(id); if (!p) return null;
  if (p.status !== "approved") return null;
  p.status = "revoked"; p.revokedAt = new Date().toISOString(); p.reason = reason;
  storePermission(p); return p;
}
export function supportsAllPermissionStatuses() { return ["pending", "approved", "rejected", "revoked"]; }

// ===== System 7 — Lifecycle Manager =====
const VALID_LIFECYCLE_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  installed: ["enabled", "disabled", "removed"],
  enabled: ["disabled", "suspended", "updating", "removed"],
  disabled: ["enabled", "removed"],
  suspended: ["enabled", "disabled", "removed"],
  updating: ["enabled", "rolling_back", "disabled"],
  rolling_back: ["enabled", "disabled"],
  removed: [],
};

export function canTransitionLifecycle(from: LifecycleState, to: LifecycleState) {
  return VALID_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function installExtension(input: {
  extensionId: string; version: string; actorId: string; reason?: string;
}): LifecycleStateRecord {
  const now = new Date().toISOString();
  const state: LifecycleStateRecord = {
    extensionId: input.extensionId, state: "installed",
    currentVersion: input.version, previousVersion: null,
    installedAt: now, lastStateChangeAt: now, health: "unknown",
  };
  storeLifecycleState(state);
  recordLifecycleEvent(input.extensionId, "install", null, "installed", input.version, input.actorId, input.reason ?? "Installed");
  publishDeveloperEvent("ExtensionInstalled", input.actorId, { extensionId: input.extensionId, version: input.version });
  return state;
}

function recordLifecycleEvent(extId: string, action: LifecycleAction, from: LifecycleState | null, to: LifecycleState, version: string, actorId: string, reason: string) {
  const evt: LifecycleEvent = {
    id: randomUUID(), extensionId: extId, action, fromState: from, toState: to,
    version, actorId, reason, occurredAt: new Date().toISOString(), correlationId: randomUUID(),
  };
  storeLifecycleEvent(evt);
}

export function transitionLifecycle(extId: string, to: LifecycleState, actorId: string, reason: string, version?: string): LifecycleStateRecord | null {
  const state = getLifecycleState(extId);
  if (!state) return null;
  if (!canTransitionLifecycle(state.state, to)) return null;
  const from = state.state;
  const now = new Date().toISOString();
  state.state = to;
  if (version && to === "updating") { state.previousVersion = state.currentVersion; state.currentVersion = version; }
  if (to === "rolling_back" && state.previousVersion) { state.currentVersion = state.previousVersion; state.previousVersion = null; }
  state.lastStateChangeAt = now;
  storeLifecycleState(state);
  const action: LifecycleAction = to === "enabled" ? "enable" : to === "disabled" ? "disable" : to === "suspended" ? "suspend" : to === "updating" ? "update" : to === "rolling_back" ? "rollback" : to === "removed" ? "remove" : "install";
  recordLifecycleEvent(extId, action, from, to, state.currentVersion, actorId, reason);
  // Publish events
  if (to === "enabled") publishDeveloperEvent("ExtensionEnabled", actorId, { extensionId: extId });
  if (to === "disabled") publishDeveloperEvent("ExtensionDisabled", actorId, { extensionId: extId });
  if (to === "updating") publishDeveloperEvent("ExtensionUpdated", actorId, { extensionId: extId, version: state.currentVersion });
  if (to === "rolling_back") publishDeveloperEvent("ExtensionRolledBack", actorId, { extensionId: extId, version: state.currentVersion });
  if (to === "removed") publishDeveloperEvent("ExtensionRemoved", actorId, { extensionId: extId });
  return state;
}

export function getLifecycleStateForExtension(extId: string) { return getLifecycleState(extId); }
export function getLifecycleHistory(extId: string) { return getLifecycleEvents(extId); }
export function listLifecycleStates() { return getAllLifecycleStates(); }
export function supportsAllLifecycleStates() { return ["installed", "enabled", "disabled", "suspended", "updating", "rolling_back", "removed"]; }
export function supportsAllLifecycleActions() { return ["install", "enable", "disable", "suspend", "update", "rollback", "remove"]; }

// ===== System 8 — Dependency Manager =====
export function checkDependencies(nodes: DependencyNode[]): DependencyCheckResult {
  const circular: string[] = [];
  const missing: string[] = [];
  const conflicts: Array<{ extensionKey: string; required: string; found: string }> = [];
  // Check circular dependencies
  const visited = new Set<string>();
  const inStack = new Set<string>();
  function dfs(key: string, path: string[]) {
    if (inStack.has(key)) { circular.push([...path, key].join(" -> ")); return; }
    if (visited.has(key)) return;
    visited.add(key); inStack.add(key);
    const node = nodes.find(n => n.extensionKey === key);
    if (node) {
      for (const dep of node.dependencies) {
        const depNode = nodes.find(n => n.extensionKey === dep.extensionKey);
        if (!depNode) { if (!missing.includes(dep.extensionKey)) missing.push(dep.extensionKey); }
        else { dfs(dep.extensionKey, [...path, key]); }
      }
    }
    inStack.delete(key);
  }
  for (const n of nodes) dfs(n.extensionKey, []);
  // Version conflicts (simplified)
  for (const n of nodes) {
    for (const dep of n.dependencies) {
      const depNode = nodes.find(d => d.extensionKey === dep.extensionKey);
      if (depNode && !dep.resolved) {
        // Simple check: if versionRange doesn't match version (simplified)
      }
    }
  }
  return { valid: circular.length === 0 && missing.length === 0, circularDependencies: circular, missingDependencies: missing, versionConflicts: conflicts };
}
