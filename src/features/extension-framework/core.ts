/** Systems 1-12: Extension Registry, Plugin Registry, Manifest, SDK Registry, Capability Registry, Hook Registry, Permission Model, Sandbox Metadata, Compatibility, Dependencies, Lifecycle, Marketplace. */
import { randomUUID } from "node:crypto";
import {
  storeExtension, getExtension, getExtensionByKey, getExtensionBySlug, getAllExtensions,
  storePlugin, getPlugin, getPluginByKey, getPluginBySlug, getAllPlugins,
  storeManifest, getManifest, getManifestByExtension, getAllManifests,
  storeSdk, getSdk, getSdkByKey, getAllSdks,
  storeCapability, getCapability, getCapabilityByKey, getAllCapabilities,
  storeHook, getHook, getHookByKey, getAllHooks,
  storePermissionDef, getPermissionDef, getPermissionDefByKey, getAllPermissionDefs,
  storePermissionGrant, getPermissionGrant, getAllPermissionGrants,
  storeSandboxPolicy, getSandboxPolicy, getSandboxPolicyByExtension, getAllSandboxPolicies,
  storeCompatibility, getCompatibility, getAllCompatibility,
  storeDependencyNode, getDependencyNode, getDependencyNodeByExtension, getAllDependencyNodes,
  appendLifecycleRecord, getLifecycleRecord, getAllLifecycleRecords,
  storeMarketplaceListing, getMarketplaceListing, getMarketplaceListingByExtension, getAllMarketplaceListings,
} from "./repository";
import type {
  ExtensionRegistryEntry, ExtensionStatus, ExtensionVisibility,
  PluginRegistryEntry, PluginStatus, PluginCategory,
  ExtensionManifest, HookType, EntryPointType,
  SdkEntry, SdkStatus, SdkLanguage,
  CapabilityEntry, CapabilityScope, CapabilityStatus,
  HookEntry,
  ExtensionPermission, PermissionGrant, PermissionStatus, PermissionCategory,
  SandboxPolicy, NetworkPolicy, SandboxHealthStatus,
  CompatibilityEntry, CompatibilityVerdict,
  DependencyNode, DependencyResolution,
  LifecycleRecord, LifecycleState, LifecycleTransition,
  MarketplaceListing, MarketplaceListingStatus,
} from "./types";
import { publishExtensionEvent } from "./event-bus-bridge";

// System 1 — Extension Registry
export function registerExtension(input: { key: string; name: string; slug: string; ownerId: string; organizationId?: string | null; version?: string; visibility?: ExtensionVisibility; sdkId?: string | null; metadata?: Record<string, unknown> }): ExtensionRegistryEntry {
  if (getExtensionByKey(input.key)) throw new Error(`Extension key already exists: ${input.key}`);
  if (getExtensionBySlug(input.slug)) throw new Error(`Extension slug already exists: ${input.slug}`);
  const now = new Date().toISOString();
  const e: ExtensionRegistryEntry = {
    id: randomUUID(), key: input.key, name: input.name, slug: input.slug,
    ownerId: input.ownerId, organizationId: input.organizationId ?? null,
    version: input.version ?? "0.1.0", status: "registered",
    visibility: input.visibility ?? "private",
    manifestId: null, sdkId: input.sdkId ?? null,
    publishedAt: null, installedAt: null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeExtension(e);
  publishExtensionEvent("ExtensionRegistered", null, { extensionId: e.id, key: e.key, ownerId: e.ownerId });
  return e;
}
export function getExtensionById(id: string) { return getExtension(id); }
export function getExtensionByKeyOrSlug(keyOrSlug: string) { return getExtensionByKey(keyOrSlug) ?? getExtensionBySlug(keyOrSlug); }
export function listExtensions(status?: ExtensionStatus, visibility?: ExtensionVisibility) {
  let all = getAllExtensions();
  if (status) all = all.filter(e => e.status === status);
  if (visibility) all = all.filter(e => e.visibility === visibility);
  return all;
}
export function activateExtension(id: string) { const e = getExtension(id); if (!e) return null; e.status = "active"; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function disableExtension(id: string) { const e = getExtension(id); if (!e) return null; e.status = "disabled"; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function suspendExtension(id: string) { const e = getExtension(id); if (!e) return null; e.status = "suspended"; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function removeExtension(id: string) { const e = getExtension(id); if (!e) return null; e.status = "removed"; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function setExtensionVersion(id: string, version: string) { const e = getExtension(id); if (!e) return null; e.version = version; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function linkExtensionManifest(id: string, manifestId: string) { const e = getExtension(id); if (!e) return null; e.manifestId = manifestId; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function linkExtensionSdk(id: string, sdkId: string) { const e = getExtension(id); if (!e) return null; e.sdkId = sdkId; e.updatedAt = new Date().toISOString(); storeExtension(e); return e; }
export function publishExtensionToMarketplace(id: string) { const e = getExtension(id); if (!e) return null; e.visibility = "public"; e.publishedAt = new Date().toISOString(); e.updatedAt = e.publishedAt; storeExtension(e); return e; }
export function supportsAllExtensionStatuses(): ExtensionStatus[] { return ["registered", "active", "disabled", "suspended", "removed"]; }
export function supportsAllExtensionVisibilities(): ExtensionVisibility[] { return ["private", "unlisted", "public"]; }

// System 2 — Plugin Registry
export function registerPlugin(input: { key: string; name: string; slug: string; publisherId: string; category: PluginCategory; version?: string; extensionId?: string | null; tags?: string[]; metadata?: Record<string, unknown> }): PluginRegistryEntry {
  if (getPluginByKey(input.key)) throw new Error(`Plugin key already exists: ${input.key}`);
  if (getPluginBySlug(input.slug)) throw new Error(`Plugin slug already exists: ${input.slug}`);
  const now = new Date().toISOString();
  const p: PluginRegistryEntry = {
    id: randomUUID(), key: input.key, name: input.name, slug: input.slug,
    publisherId: input.publisherId, category: input.category,
    status: "draft", version: input.version ?? "0.1.0",
    extensionId: input.extensionId ?? null,
    tags: input.tags ?? [], downloads: 0, rating: 0,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storePlugin(p);
  return p;
}
export function getPluginById(id: string) { return getPlugin(id); }
export function listPlugins(status?: PluginStatus, category?: PluginCategory) {
  let all = getAllPlugins();
  if (status) all = all.filter(p => p.status === status);
  if (category) all = all.filter(p => p.category === category);
  return all;
}
export function submitPlugin(id: string) { const p = getPlugin(id); if (!p) return null; p.status = "submitted"; p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function approvePlugin(id: string) { const p = getPlugin(id); if (!p) return null; p.status = "approved"; p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function rejectPlugin(id: string) { const p = getPlugin(id); if (!p) return null; p.status = "rejected"; p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function archivePlugin(id: string) { const p = getPlugin(id); if (!p) return null; p.status = "archived"; p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function incrementPluginDownloads(id: string) { const p = getPlugin(id); if (!p) return null; p.downloads += 1; p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function ratePlugin(id: string, rating: number) { const p = getPlugin(id); if (!p) return null; p.rating = Math.max(0, Math.min(5, rating)); p.updatedAt = new Date().toISOString(); storePlugin(p); return p; }
export function supportsAllPluginStatuses(): PluginStatus[] { return ["draft", "submitted", "approved", "rejected", "archived"]; }
export function supportsAllPluginCategories(): PluginCategory[] { return ["tool", "integration", "theme", "language-pack", "content-pack", "dashboard", "automation", "other"]; }

// System 3 — Extension Manifest
export function createManifest(input: { extensionId: string; version: string; displayName: string; description: string; entryPoints?: Array<{ id: string; type: EntryPointType; path: string }>; permissions?: Array<{ name: string; reason: string; required: boolean }>; hooks?: Array<{ id: string; type: HookType; priority: number }>; dependencies?: Array<{ extensionKey: string; versionRange: string; optional: boolean }>; capabilities?: string[]; minPlatformVersion: string; sdkVersion: string; configSchema?: Record<string, unknown> | null }): ExtensionManifest {
  const now = new Date().toISOString();
  const m: ExtensionManifest = {
    id: randomUUID(), extensionId: input.extensionId, version: input.version,
    displayName: input.displayName, description: input.description,
    entryPoints: input.entryPoints ?? [],
    permissions: input.permissions ?? [],
    hooks: input.hooks ?? [],
    dependencies: input.dependencies ?? [],
    capabilities: input.capabilities ?? [],
    minPlatformVersion: input.minPlatformVersion,
    sdkVersion: input.sdkVersion,
    configSchema: input.configSchema ?? null,
    createdAt: now, updatedAt: now,
  };
  storeManifest(m);
  linkExtensionManifest(input.extensionId, m.id);
  return m;
}
export function getManifestById(id: string) { return getManifest(id); }
export function getManifestForExtension(extensionId: string) { return getManifestByExtension(extensionId); }
export function listManifests() { return getAllManifests(); }
export function updateManifest(id: string, patch: Partial<Pick<ExtensionManifest, "displayName" | "description" | "minPlatformVersion" | "sdkVersion" | "configSchema">>) {
  const m = getManifest(id); if (!m) return null;
  if (patch.displayName !== undefined) m.displayName = patch.displayName;
  if (patch.description !== undefined) m.description = patch.description;
  if (patch.minPlatformVersion !== undefined) m.minPlatformVersion = patch.minPlatformVersion;
  if (patch.sdkVersion !== undefined) m.sdkVersion = patch.sdkVersion;
  if (patch.configSchema !== undefined) m.configSchema = patch.configSchema;
  m.updatedAt = new Date().toISOString();
  storeManifest(m);
  return m;
}
export function addManifestPermission(id: string, perm: { name: string; reason: string; required: boolean }) { const m = getManifest(id); if (!m) return null; m.permissions.push(perm); m.updatedAt = new Date().toISOString(); storeManifest(m); return m; }
export function addManifestHook(id: string, hook: { id: string; type: HookType; priority: number }) { const m = getManifest(id); if (!m) return null; m.hooks.push(hook); m.updatedAt = new Date().toISOString(); storeManifest(m); return m; }
export function addManifestDependency(id: string, dep: { extensionKey: string; versionRange: string; optional: boolean }) { const m = getManifest(id); if (!m) return null; m.dependencies.push(dep); m.updatedAt = new Date().toISOString(); storeManifest(m); return m; }
export function addManifestEntryPoint(id: string, ep: { id: string; type: EntryPointType; path: string }) { const m = getManifest(id); if (!m) return null; m.entryPoints.push(ep); m.updatedAt = new Date().toISOString(); storeManifest(m); return m; }
export function supportsAllHookTypes(): HookType[] { return ["lifecycle", "event", "ui", "platform"]; }
export function supportsAllEntryPointTypes(): EntryPointType[] { return ["main", "background", "webview", "settings", "command"]; }

// System 4 — SDK Registry
export function registerSdk(input: { key: string; name: string; version: string; language: SdkLanguage; supportedApis?: string[]; minPlatformVersion: string; downloadUrl?: string | null; docsUrl?: string | null; metadata?: Record<string, unknown> }): SdkEntry {
  if (getSdkByKey(input.key)) throw new Error(`SDK key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const s: SdkEntry = {
    id: randomUUID(), key: input.key, name: input.name, version: input.version,
    language: input.language, status: "draft",
    supportedApis: input.supportedApis ?? [],
    minPlatformVersion: input.minPlatformVersion,
    publishedAt: null, deprecatedAt: null,
    downloadUrl: input.downloadUrl ?? null, docsUrl: input.docsUrl ?? null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeSdk(s);
  return s;
}
export function getSdkById(id: string) { return getSdk(id); }
export function listSdks(status?: SdkStatus, language?: SdkLanguage) {
  let all = getAllSdks();
  if (status) all = all.filter(s => s.status === status);
  if (language) all = all.filter(s => s.language === language);
  return all;
}
export function publishSdk(id: string) {
  const s = getSdk(id); if (!s) return null;
  s.status = "active"; s.publishedAt = new Date().toISOString();
  s.updatedAt = s.publishedAt; storeSdk(s);
  publishExtensionEvent("SDKPublished", null, { sdkId: s.id, key: s.key, version: s.version });
  return s;
}
export function deprecateSdk(id: string) { const s = getSdk(id); if (!s) return null; s.status = "deprecated"; s.deprecatedAt = new Date().toISOString(); s.updatedAt = s.deprecatedAt; storeSdk(s); return s; }
export function retireSdk(id: string) { const s = getSdk(id); if (!s) return null; s.status = "retired"; s.updatedAt = new Date().toISOString(); storeSdk(s); return s; }
export function addSdkSupportedApi(id: string, api: string) { const s = getSdk(id); if (!s) return null; if (!s.supportedApis.includes(api)) s.supportedApis.push(api); s.updatedAt = new Date().toISOString(); storeSdk(s); return s; }
export function supportsAllSdkStatuses(): SdkStatus[] { return ["draft", "active", "deprecated", "retired"]; }
export function supportsAllSdkLanguages(): SdkLanguage[] { return ["typescript", "javascript", "python", "java", "go", "csharp", "php", "rust"]; }

// System 5 — Capability Registry
export function registerCapability(input: { key: string; name: string; scope: CapabilityScope; description: string; extensionKey?: string | null; requiredPermission?: string | null; status?: CapabilityStatus }): CapabilityEntry {
  if (getCapabilityByKey(input.key)) throw new Error(`Capability key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const c: CapabilityEntry = {
    id: randomUUID(), key: input.key, name: input.name,
    scope: input.scope, status: input.status ?? "active",
    description: input.description,
    extensionKey: input.extensionKey ?? null,
    requiredPermission: input.requiredPermission ?? null,
    createdAt: now, updatedAt: now,
  };
  storeCapability(c);
  return c;
}
export function getCapabilityById(id: string) { return getCapability(id); }
export function listCapabilities(scope?: CapabilityScope, status?: CapabilityStatus) {
  let all = getAllCapabilities();
  if (scope) all = all.filter(c => c.scope === scope);
  if (status) all = all.filter(c => c.status === status);
  return all;
}
export function restrictCapability(id: string) { const c = getCapability(id); if (!c) return null; c.status = "restricted"; c.updatedAt = new Date().toISOString(); storeCapability(c); return c; }
export function deprecateCapability(id: string) { const c = getCapability(id); if (!c) return null; c.status = "deprecated"; c.updatedAt = new Date().toISOString(); storeCapability(c); return c; }
export function supportsAllCapabilityScopes(): CapabilityScope[] { return ["platform", "extension", "user", "system"]; }
export function supportsAllCapabilityStatuses(): CapabilityStatus[] { return ["active", "deprecated", "restricted"]; }

// System 6 — Hook Registry
export function registerHook(input: { key: string; name: string; type: HookType; triggerEvent?: string | null; extensionKey: string; priority?: number; description?: string; active?: boolean }): HookEntry {
  if (getHookByKey(input.key)) throw new Error(`Hook key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const h: HookEntry = {
    id: randomUUID(), key: input.key, name: input.name,
    type: input.type, triggerEvent: input.triggerEvent ?? null,
    extensionKey: input.extensionKey, priority: input.priority ?? 100,
    description: input.description ?? "", active: input.active ?? true,
    createdAt: now, updatedAt: now,
  };
  storeHook(h);
  publishExtensionEvent("HookRegistered", null, { hookId: h.id, key: h.key, extensionKey: h.extensionKey, type: h.type });
  return h;
}
export function getHookById(id: string) { return getHook(id); }
export function listHooks(type?: HookType, activeOnly?: boolean) {
  let all = getAllHooks();
  if (type) all = all.filter(h => h.type === type);
  if (activeOnly) all = all.filter(h => h.active);
  return all;
}
export function setHookActive(id: string, active: boolean) { const h = getHook(id); if (!h) return null; h.active = active; h.updatedAt = new Date().toISOString(); storeHook(h); return h; }
export function setHookPriority(id: string, priority: number) { const h = getHook(id); if (!h) return null; h.priority = priority; h.updatedAt = new Date().toISOString(); storeHook(h); return h; }

// System 7 — Permission Model
export function registerPermissionDef(input: { key: string; name: string; category: PermissionCategory; description: string; scope: string; riskLevel: "low" | "medium" | "high" | "critical" }): ExtensionPermission {
  if (getPermissionDefByKey(input.key)) throw new Error(`Permission key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const p: ExtensionPermission = {
    id: randomUUID(), key: input.key, name: input.name,
    category: input.category, description: input.description,
    scope: input.scope, riskLevel: input.riskLevel,
    createdAt: now, updatedAt: now,
  };
  storePermissionDef(p);
  return p;
}
export function getPermissionDefById(id: string) { return getPermissionDef(id); }
export function listPermissionDefs(category?: PermissionCategory) {
  const all = getAllPermissionDefs();
  return category ? all.filter(p => p.category === category) : all;
}
export function requestPermission(input: { extensionId: string; permissionKey: string; requestedBy: string; reason?: string | null; expiresAt?: string | null }): PermissionGrant {
  const now = new Date().toISOString();
  const g: PermissionGrant = {
    id: randomUUID(), extensionId: input.extensionId,
    permissionKey: input.permissionKey, status: "requested",
    requestedBy: input.requestedBy, approvedBy: null,
    reason: input.reason ?? null,
    requestedAt: now, decidedAt: null,
    expiresAt: input.expiresAt ?? null,
    correlationId: randomUUID(),
  };
  storePermissionGrant(g);
  return g;
}
export function getPermissionGrantById(id: string) { return getPermissionGrant(id); }
export function listPermissionGrants(extensionId?: string, status?: PermissionStatus) {
  let all = getAllPermissionGrants();
  if (extensionId) all = all.filter(g => g.extensionId === extensionId);
  if (status) all = all.filter(g => g.status === status);
  return all;
}
export function approvePermission(id: string, approverId: string) {
  const g = getPermissionGrant(id); if (!g || g.status !== "requested") return null;
  g.status = "granted"; g.approvedBy = approverId;
  g.decidedAt = new Date().toISOString(); storePermissionGrant(g);
  publishExtensionEvent("PermissionGranted", approverId, { grantId: g.id, extensionId: g.extensionId, permissionKey: g.permissionKey });
  return g;
}
export function denyPermission(id: string, reviewerId: string) {
  const g = getPermissionGrant(id); if (!g || g.status !== "requested") return null;
  g.status = "denied"; g.approvedBy = reviewerId;
  g.decidedAt = new Date().toISOString(); storePermissionGrant(g);
  return g;
}
export function revokePermission(id: string, reviewerId: string) {
  const g = getPermissionGrant(id); if (!g || g.status !== "granted") return null;
  g.status = "revoked"; g.approvedBy = reviewerId;
  g.decidedAt = new Date().toISOString(); storePermissionGrant(g);
  publishExtensionEvent("PermissionRevoked", reviewerId, { grantId: g.id, extensionId: g.extensionId, permissionKey: g.permissionKey });
  return g;
}
export function expirePermission(id: string) {
  const g = getPermissionGrant(id); if (!g) return null;
  g.status = "expired"; g.decidedAt = new Date().toISOString(); storePermissionGrant(g);
  return g;
}
export function supportsAllPermissionStatuses(): PermissionStatus[] { return ["requested", "granted", "denied", "revoked", "expired"]; }
export function supportsAllPermissionCategories(): PermissionCategory[] { return ["read", "write", "execute", "admin", "network", "storage", "identity"]; }

// System 8 — Sandbox Metadata
export function createSandboxPolicy(input: { extensionId: string; cpuLimit: number; memoryLimitMb: number; storageLimitMb: number; timeoutMs: number; networkPolicy?: NetworkPolicy; networkAllowlist?: string[]; filesystemIsolated?: boolean; maxConcurrentExecutions?: number; healthStatus?: SandboxHealthStatus }): SandboxPolicy {
  const now = new Date().toISOString();
  const s: SandboxPolicy = {
    id: randomUUID(), extensionId: input.extensionId,
    cpuLimit: input.cpuLimit, memoryLimitMb: input.memoryLimitMb,
    storageLimitMb: input.storageLimitMb, timeoutMs: input.timeoutMs,
    networkPolicy: input.networkPolicy ?? "none",
    networkAllowlist: input.networkAllowlist ?? [],
    filesystemIsolated: input.filesystemIsolated ?? true,
    maxConcurrentExecutions: input.maxConcurrentExecutions ?? 1,
    healthStatus: input.healthStatus ?? "unknown",
    createdAt: now, updatedAt: now,
  };
  storeSandboxPolicy(s);
  return s;
}
export function getSandboxPolicyById(id: string) { return getSandboxPolicy(id); }
export function getSandboxPolicyForExtension(extensionId: string) { return getSandboxPolicyByExtension(extensionId); }
export function listSandboxPolicies(health?: SandboxHealthStatus) {
  const all = getAllSandboxPolicies();
  return health ? all.filter(s => s.healthStatus === health) : all;
}
export function updateSandboxHealth(id: string, status: SandboxHealthStatus) { const s = getSandboxPolicy(id); if (!s) return null; s.healthStatus = status; s.updatedAt = new Date().toISOString(); storeSandboxPolicy(s); return s; }
export function setNetworkAllowlist(id: string, allowlist: string[]) { const s = getSandboxPolicy(id); if (!s) return null; s.networkAllowlist = allowlist; s.networkPolicy = allowlist.length > 0 ? "allowlist" : s.networkPolicy; s.updatedAt = new Date().toISOString(); storeSandboxPolicy(s); return s; }
export function supportsAllNetworkPolicies(): NetworkPolicy[] { return ["none", "allowlist", "open"]; }
export function supportsAllSandboxHealthStatuses(): SandboxHealthStatus[] { return ["unknown", "healthy", "degraded", "failing"]; }

// System 9 — Compatibility Engine
export function recordCompatibility(input: { extensionKey: string; extensionVersion: string; platformVersion: string; sdkVersion: string; verdict: CompatibilityVerdict; notes?: string | null; testedAt?: string | null }): CompatibilityEntry {
  const now = new Date().toISOString();
  const c: CompatibilityEntry = {
    id: randomUUID(), extensionKey: input.extensionKey,
    extensionVersion: input.extensionVersion,
    platformVersion: input.platformVersion, sdkVersion: input.sdkVersion,
    verdict: input.verdict, notes: input.notes ?? null,
    testedAt: input.testedAt ?? null,
    createdAt: now, updatedAt: now,
  };
  storeCompatibility(c);
  publishExtensionEvent("CompatibilityVerified", null, { entryId: c.id, extensionKey: c.extensionKey, verdict: c.verdict });
  return c;
}
export function getCompatibilityById(id: string) { return getCompatibility(id); }
export function listCompatibility(verdict?: CompatibilityVerdict) {
  const all = getAllCompatibility();
  return verdict ? all.filter(c => c.verdict === verdict) : all;
}
export function findCompatibility(extensionKey: string, extensionVersion: string, platformVersion: string) {
  return getAllCompatibility().find(c => c.extensionKey === extensionKey && c.extensionVersion === extensionVersion && c.platformVersion === platformVersion) ?? null;
}
export function supportsAllCompatibilityVerdicts(): CompatibilityVerdict[] { return ["compatible", "incompatible", "untested", "deprecated"]; }
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(n => parseInt(n, 10) || 0);
  const pb = b.split(".").map(n => parseInt(n, 10) || 0);
  const max = Math.max(pa.length, pb.length);
  for (let i = 0; i < max; i++) {
    const va = pa[i] ?? 0; const vb = pb[i] ?? 0;
    if (va > vb) return 1; if (va < vb) return -1;
  }
  return 0;
}

// System 10 — Dependency Manager
export function evaluateDependencies(input: { extensionKey: string; version: string; dependencies: Array<{ extensionKey: string; versionRange: string; optional: boolean }> }): DependencyNode {
  const deps = input.dependencies.map(d => {
    const installedExt = getExtensionByKey(d.extensionKey);
    let resolution: DependencyResolution = "missing";
    if (installedExt) {
      if (installedExt.status === "removed") {
        resolution = "missing";
      } else if (matchesVersionRange(installedExt.version, d.versionRange)) {
        resolution = "satisfied";
      } else {
        resolution = "version_conflict";
      }
    }
    return { ...d, resolution };
  });
  const visited = new Set<string>();
  const stack: string[] = [];
  let hasCycle = false;
  const cyclePath: string[] = [];
  function dfs(key: string, path: string[]) {
    if (path.includes(key)) { hasCycle = true; cyclePath.push(...path.slice(path.indexOf(key)), key); return; }
    if (visited.has(key)) return;
    visited.add(key);
    const node = getDependencyNodeByExtension(key);
    if (node) {
      for (const dep of node.dependencies) { if (!dep.optional) dfs(dep.extensionKey, [...path, key]); }
    }
  }
  dfs(input.extensionKey, []);
  const node: DependencyNode = {
    id: randomUUID(), extensionKey: input.extensionKey, version: input.version,
    dependencies: deps, hasCycle, cyclePath,
    evaluatedAt: new Date().toISOString(),
  };
  storeDependencyNode(node);
  return node;
}
export function getDependencyNodeById(id: string) { return getDependencyNode(id); }
export function getDependencyNodeForExtension(extensionKey: string) { return getDependencyNodeByExtension(extensionKey); }
export function listDependencyNodes() { return getAllDependencyNodes(); }
export function matchesVersionRange(version: string, range: string): boolean {
  // Supports: "1.2.3", "^1.2.3", "~1.2.3", ">=1.2.3", "1.x", "1.2.x", "*"
  if (range === "*" || range === "") return true;
  if (range.startsWith("^")) {
    const base = range.slice(1);
    const baseParts = base.split(".").map(n => parseInt(n, 10) || 0);
    return compareVersions(version, base) >= 0 && parseInt(version.split(".")[0], 10) === baseParts[0];
  }
  if (range.startsWith("~")) {
    const base = range.slice(1);
    const baseParts = base.split(".").map(n => parseInt(n, 10) || 0);
    return compareVersions(version, base) >= 0 && parseInt(version.split(".")[0], 10) === baseParts[0] && parseInt(version.split(".")[1] ?? "0", 10) === (baseParts[1] ?? 0);
  }
  if (range.startsWith(">=")) return compareVersions(version, range.slice(2)) >= 0;
  if (range.includes(".x")) {
    const prefix = range.replace(/\.x$/, "").split(".").map(n => parseInt(n, 10) || 0);
    const vParts = version.split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < prefix.length; i++) { if (vParts[i] !== prefix[i]) return false; }
    return true;
  }
  return compareVersions(version, range) === 0;
}
export function supportsAllDependencyResolutions(): DependencyResolution[] { return ["satisfied", "missing", "version_conflict", "circular"]; }

// System 11 — Extension Lifecycle
export function recordLifecycle(input: { extensionId: string; fromState: LifecycleState | null; toState: LifecycleState; transition: LifecycleTransition; actorId: string; reason?: string | null; metadata?: Record<string, unknown> }): LifecycleRecord {
  const now = new Date().toISOString();
  const r: LifecycleRecord = {
    id: randomUUID(), extensionId: input.extensionId,
    fromState: input.fromState, toState: input.toState,
    transition: input.transition, actorId: input.actorId,
    reason: input.reason ?? null,
    occurredAt: now, correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  appendLifecycleRecord(r);
  return r;
}
export function getLifecycleRecordById(id: string) { return getLifecycleRecord(id); }
export function listLifecycleRecords(extensionId?: string) {
  const all = getAllLifecycleRecords();
  return extensionId ? all.filter(r => r.extensionId === extensionId) : all;
}
export function getLatestLifecycleState(extensionId: string): LifecycleState | null {
  const records = getAllLifecycleRecords().filter(r => r.extensionId === extensionId);
  if (records.length === 0) return null;
  return records[records.length - 1].toState;
}
export function supportsAllLifecycleStates(): LifecycleState[] { return ["installed", "enabled", "disabled", "suspended", "upgrading", "removed"]; }
export function supportsAllLifecycleTransitions(): LifecycleTransition[] { return ["install", "enable", "disable", "suspend", "resume", "upgrade", "remove"]; }
export function isValidTransition(from: LifecycleState | null, transition: LifecycleTransition): boolean {
  const transitions: Record<LifecycleTransition, LifecycleState[]> = {
    install: ["installed"],
    enable: ["enabled"],
    disable: ["disabled"],
    suspend: ["suspended"],
    resume: ["enabled"],
    upgrade: ["upgrading"],
    remove: ["removed"],
  };
  void from;
  return Object.prototype.hasOwnProperty.call(transitions, transition);
}

// System 12 — Marketplace Metadata
export function createMarketplaceListing(input: { extensionId: string; pluginId?: string | null; title: string; summary: string; description: string; category: PluginCategory; tags?: string[]; licenseType?: string | null; pricingModel?: "free" | "freemium" | "paid" | "contact"; privacyUrl?: string | null; supportUrl?: string | null; metadata?: Record<string, unknown> }): MarketplaceListing {
  const now = new Date().toISOString();
  const m: MarketplaceListing = {
    id: randomUUID(), extensionId: input.extensionId,
    pluginId: input.pluginId ?? null,
    title: input.title, summary: input.summary, description: input.description,
    category: input.category, tags: input.tags ?? [],
    status: "pending",
    ratingAverage: 0, ratingCount: 0,
    downloads: 0, installs: 0, activeInstalls: 0,
    version: "1.0.0", publishedAt: null,
    licenseType: input.licenseType ?? null,
    pricingModel: input.pricingModel ?? "free",
    privacyUrl: input.privacyUrl ?? null, supportUrl: input.supportUrl ?? null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeMarketplaceListing(m);
  return m;
}
export function getMarketplaceListingById(id: string) { return getMarketplaceListing(id); }
export function getMarketplaceListingForExtension(extensionId: string) { return getMarketplaceListingByExtension(extensionId); }
export function listMarketplaceListings(status?: MarketplaceListingStatus, category?: PluginCategory) {
  let all = getAllMarketplaceListings();
  if (status) all = all.filter(m => m.status === status);
  if (category) all = all.filter(m => m.category === category);
  return all;
}
export function publishMarketplaceListing(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.status = "listed"; m.publishedAt = new Date().toISOString(); m.updatedAt = m.publishedAt; storeMarketplaceListing(m); return m; }
export function unlistMarketplaceListing(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.status = "unlisted"; m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function rejectMarketplaceListing(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.status = "rejected"; m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function delistMarketplaceListing(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.status = "delisted"; m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function updateMarketplaceRating(id: string, rating: number) { const m = getMarketplaceListing(id); if (!m) return null; const total = m.ratingAverage * m.ratingCount + rating; m.ratingCount += 1; m.ratingAverage = total / m.ratingCount; m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function incrementMarketplaceInstalls(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.installs += 1; m.activeInstalls += 1; m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function decrementMarketplaceInstalls(id: string) { const m = getMarketplaceListing(id); if (!m) return null; m.activeInstalls = Math.max(0, m.activeInstalls - 1); m.updatedAt = new Date().toISOString(); storeMarketplaceListing(m); return m; }
export function supportsAllMarketplaceListingStatuses(): MarketplaceListingStatus[] { return ["pending", "listed", "unlisted", "rejected", "delisted"]; }
