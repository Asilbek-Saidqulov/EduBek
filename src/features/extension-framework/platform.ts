/** Systems 13-24: Configuration, Event Integration, API Contracts, Developer Portal, Validation, Audit, Analytics, Dashboard, Bridge, Developer Integration, Admin, Docs. */
import { randomUUID } from "node:crypto";
import type {
  ExtensionConfig, ConfigScope,
  EventSubscription, EventContract, EventDirection,
  ApiContract, ApiScope, ApiStability,
  DeveloperPortalMetadata,
  ValidationReport, ValidationIssue, ValidationKind, ValidationSeverity,
  AuditRecord, AuditCategory, AuditOutcome,
  ExtensionAnalytics, ExtensionDashboard,
  ExtensionFrameworkEventType,
  ExtensionDeveloperIntegration, ExtensionAdminStatus, ExtensionDocumentation,
} from "./types";
import {
  storeConfig, getConfig, getConfigByExtension, getAllConfigs,
  storeEventSubscription, getEventSubscription, getAllEventSubscriptions,
  storeEventContract, getEventContract, getAllEventContracts,
  storeApiContract, getApiContract, getAllApiContracts,
  storePortalMetadata, getPortalMetadata, getPortalMetadataByExtension, getAllPortalMetadata,
  storeValidationReport, getValidationReport, getAllValidationReports,
  appendAuditRecord, getAuditRecord, getAllAuditRecords,
  getAllExtensions, getAllPlugins, getAllSdks,
  getAllSandboxPolicies, getAllCompatibility,
  getAllPermissionGrants, getAllMarketplaceListings,
  getAllLifecycleRecords, getAllHooks, getAllManifests, getAllDependencyNodes,
} from "./repository";
import { publishExtensionEvent } from "./event-bus-bridge";

// System 13 — Extension Configuration
export function createConfig(input: { extensionId: string; scope?: ConfigScope; scopeId?: string | null; settings?: Record<string, unknown>; secrets?: string[]; overrides?: string[]; schemaVersion?: number }): ExtensionConfig {
  const now = new Date().toISOString();
  const c: ExtensionConfig = {
    id: randomUUID(), extensionId: input.extensionId,
    scope: input.scope ?? "default", scopeId: input.scopeId ?? null,
    settings: input.settings ?? {}, secrets: input.secrets ?? [],
    overrides: input.overrides ?? [], schemaVersion: input.schemaVersion ?? 1,
    updatedAt: now, createdAt: now,
  };
  storeConfig(c);
  return c;
}
export function getConfigById(id: string) { return getConfig(id); }
export function getConfigForExtension(extensionId: string, scope?: ConfigScope) { return getConfigByExtension(extensionId, scope); }
export function listConfigs(scope?: ConfigScope) {
  const all = getAllConfigs();
  return scope ? all.filter(c => c.scope === scope) : all;
}
export function updateConfigSettings(id: string, settings: Record<string, unknown>) { const c = getConfig(id); if (!c) return null; c.settings = settings; c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function addConfigSecret(id: string, secretKey: string) { const c = getConfig(id); if (!c) return null; if (!c.secrets.includes(secretKey)) c.secrets.push(secretKey); c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function addConfigOverride(id: string, overrideKey: string) { const c = getConfig(id); if (!c) return null; if (!c.overrides.includes(overrideKey)) c.overrides.push(overrideKey); c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function supportsAllConfigScopes(): ConfigScope[] { return ["default", "organization", "extension", "user"]; }

// System 14 — Event Integration
export function createEventSubscription(input: { extensionId: string; eventType: string; direction?: EventDirection; filter?: Record<string, unknown> | null; active?: boolean }): EventSubscription {
  const now = new Date().toISOString();
  const s: EventSubscription = {
    id: randomUUID(), extensionId: input.extensionId,
    eventType: input.eventType, direction: input.direction ?? "subscribed",
    filter: input.filter ?? null, active: input.active ?? true,
    createdAt: now, updatedAt: now,
  };
  storeEventSubscription(s);
  return s;
}
export function getEventSubscriptionById(id: string) { return getEventSubscription(id); }
export function listEventSubscriptions(extensionId?: string, direction?: EventDirection) {
  let all = getAllEventSubscriptions();
  if (extensionId) all = all.filter(s => s.extensionId === extensionId);
  if (direction) all = all.filter(s => s.direction === direction);
  return all;
}
export function setEventSubscriptionActive(id: string, active: boolean) { const s = getEventSubscription(id); if (!s) return null; s.active = active; s.updatedAt = new Date().toISOString(); storeEventSubscription(s); return s; }
export function registerEventContract(input: { extensionId: string; eventType: string; direction: EventDirection; description: string; version: string; payloadSchema?: Record<string, unknown> | null }): EventContract {
  const now = new Date().toISOString();
  const c: EventContract = {
    id: randomUUID(), extensionId: input.extensionId, eventType: input.eventType,
    payloadSchema: input.payloadSchema ?? null,
    direction: input.direction, description: input.description,
    version: input.version, createdAt: now, updatedAt: now,
  };
  storeEventContract(c);
  return c;
}
export function getEventContractById(id: string) { return getEventContract(id); }
export function listEventContracts(extensionId?: string) {
  const all = getAllEventContracts();
  return extensionId ? all.filter(c => c.extensionId === extensionId) : all;
}
export function supportsAllEventDirections(): EventDirection[] { return ["published", "subscribed"]; }

// System 15 — API Contracts
export function createApiContract(input: { extensionId: string; apiName: string; version: string; scope: ApiScope; stability: ApiStability; description: string; allowedMethods?: string[]; requiredPermissions?: string[]; rateLimit?: number | null }): ApiContract {
  const now = new Date().toISOString();
  const c: ApiContract = {
    id: randomUUID(), extensionId: input.extensionId,
    apiName: input.apiName, version: input.version,
    scope: input.scope, stability: input.stability,
    description: input.description,
    allowedMethods: input.allowedMethods ?? ["GET"],
    requiredPermissions: input.requiredPermissions ?? [],
    rateLimit: input.rateLimit ?? null,
    createdAt: now, updatedAt: now,
  };
  storeApiContract(c);
  return c;
}
export function getApiContractById(id: string) { return getApiContract(id); }
export function listApiContracts(extensionId?: string, scope?: ApiScope) {
  let all = getAllApiContracts();
  if (extensionId) all = all.filter(c => c.extensionId === extensionId);
  if (scope) all = all.filter(c => c.scope === scope);
  return all;
}
export function deprecateApiContract(id: string) { const c = getApiContract(id); if (!c) return null; c.stability = "deprecated"; c.updatedAt = new Date().toISOString(); storeApiContract(c); return c; }
export function supportsAllApiScopes(): ApiScope[] { return ["read", "write", "admin", "system"]; }
export function supportsAllApiStabilities(): ApiStability[] { return ["stable", "beta", "experimental", "deprecated"]; }

// System 16 — Developer Portal Metadata
export function upsertDeveloperPortalMetadata(input: { extensionId: string; documentationUrl?: string | null; examplesCount?: number; sdkReferencesCount?: number; guideUrls?: string[]; changelogUrl?: string | null; lastSyncedAt?: string | null }): DeveloperPortalMetadata {
  const existing = getPortalMetadataByExtension(input.extensionId);
  const now = new Date().toISOString();
  if (existing) {
    if (input.documentationUrl !== undefined) existing.documentationUrl = input.documentationUrl;
    if (input.examplesCount !== undefined) existing.examplesCount = input.examplesCount;
    if (input.sdkReferencesCount !== undefined) existing.sdkReferencesCount = input.sdkReferencesCount;
    if (input.guideUrls !== undefined) existing.guideUrls = input.guideUrls;
    if (input.changelogUrl !== undefined) existing.changelogUrl = input.changelogUrl;
    if (input.lastSyncedAt !== undefined) existing.lastSyncedAt = input.lastSyncedAt;
    existing.updatedAt = now;
    storePortalMetadata(existing);
    return existing;
  }
  const p: DeveloperPortalMetadata = {
    id: randomUUID(), extensionId: input.extensionId,
    documentationUrl: input.documentationUrl ?? null,
    examplesCount: input.examplesCount ?? 0,
    sdkReferencesCount: input.sdkReferencesCount ?? 0,
    guideUrls: input.guideUrls ?? [],
    changelogUrl: input.changelogUrl ?? null,
    lastSyncedAt: input.lastSyncedAt ?? null,
    createdAt: now, updatedAt: now,
  };
  storePortalMetadata(p);
  return p;
}
export function getDeveloperPortalMetadataById(id: string) { return getPortalMetadata(id); }
export function getDeveloperPortalMetadataForExtension(extensionId: string) { return getPortalMetadataByExtension(extensionId); }
export function listDeveloperPortalMetadata() { return getAllPortalMetadata(); }
export function syncDeveloperPortalMetadata(extensionId: string) { return upsertDeveloperPortalMetadata({ extensionId, lastSyncedAt: new Date().toISOString() }); }

// System 17 — Validation Engine
export function runValidation(input: { extensionId: string; kind: ValidationKind; issues?: ValidationIssue[] }): ValidationReport {
  const errors = (input.issues ?? []).filter(i => i.severity === "error");
  const valid = errors.length === 0;
  const r: ValidationReport = {
    id: randomUUID(), extensionId: input.extensionId, kind: input.kind,
    valid, issues: input.issues ?? [],
    validatedAt: new Date().toISOString(), correlationId: randomUUID(),
  };
  storeValidationReport(r);
  publishExtensionEvent("ExtensionValidated", null, { reportId: r.id, extensionId: r.extensionId, kind: r.kind, valid: r.valid });
  return r;
}
export function getValidationReportById(id: string) { return getValidationReport(id); }
export function listValidationReports(extensionId?: string, kind?: ValidationKind) {
  let all = getAllValidationReports();
  if (extensionId) all = all.filter(r => r.extensionId === extensionId);
  if (kind) all = all.filter(r => r.kind === kind);
  return all;
}
export function validateManifestStructure(manifest: { displayName: string; description: string; version: string; minPlatformVersion: string; entryPoints: unknown[]; permissions: unknown[]; hooks: unknown[]; dependencies: unknown[] }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!manifest.displayName || manifest.displayName.trim() === "") issues.push({ code: "MANIFEST_DISPLAY_NAME_REQUIRED", severity: "error", message: "Display name is required", path: "displayName" });
  if (!manifest.description || manifest.description.trim() === "") issues.push({ code: "MANIFEST_DESCRIPTION_REQUIRED", severity: "error", message: "Description is required", path: "description" });
  if (!manifest.version || manifest.version.trim() === "") issues.push({ code: "MANIFEST_VERSION_REQUIRED", severity: "error", message: "Version is required", path: "version" });
  if (!manifest.minPlatformVersion) issues.push({ code: "MANIFEST_MIN_PLATFORM_REQUIRED", severity: "error", message: "minPlatformVersion is required", path: "minPlatformVersion" });
  if (!Array.isArray(manifest.entryPoints)) issues.push({ code: "MANIFEST_ENTRY_POINTS_ARRAY", severity: "error", message: "entryPoints must be an array", path: "entryPoints" });
  if (!Array.isArray(manifest.permissions)) issues.push({ code: "MANIFEST_PERMISSIONS_ARRAY", severity: "error", message: "permissions must be an array", path: "permissions" });
  if (!Array.isArray(manifest.hooks)) issues.push({ code: "MANIFEST_HOOKS_ARRAY", severity: "error", message: "hooks must be an array", path: "hooks" });
  if (!Array.isArray(manifest.dependencies)) issues.push({ code: "MANIFEST_DEPENDENCIES_ARRAY", severity: "warning", message: "dependencies should be an array", path: "dependencies" });
  return issues;
}
export function supportsAllValidationSeverities(): ValidationSeverity[] { return ["error", "warning", "info"]; }
export function supportsAllValidationKinds(): ValidationKind[] { return ["manifest", "permission", "compatibility", "schema", "lifecycle", "dependency"]; }

// System 18 — Audit Platform
export function recordAudit(input: { extensionId?: string | null; actorId: string; category: AuditCategory; action: string; outcome: AuditOutcome; reason?: string | null; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; ipAddress?: string | null; userAgent?: string | null }): AuditRecord {
  const now = new Date().toISOString();
  const r: AuditRecord = {
    id: randomUUID(), extensionId: input.extensionId ?? null,
    actorId: input.actorId, category: input.category,
    action: input.action, outcome: input.outcome,
    reason: input.reason ?? null,
    before: input.before ?? null, after: input.after ?? null,
    occurredAt: now, correlationId: randomUUID(),
    ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null,
  };
  appendAuditRecord(r);
  return r;
}
export function getAuditRecordById(id: string) { return getAuditRecord(id); }
export function listAuditRecords(extensionId?: string, category?: AuditCategory) {
  let all = getAllAuditRecords();
  if (extensionId) all = all.filter(r => r.extensionId === extensionId);
  if (category) all = all.filter(r => r.category === category);
  return all;
}
export function supportsAllAuditCategories(): AuditCategory[] { return ["lifecycle", "permission", "configuration", "marketplace", "compatibility", "validation", "security"]; }
export function supportsAllAuditOutcomes(): AuditOutcome[] { return ["success", "failure", "denied"]; }

// System 19 — Analytics
export function generateExtensionAnalytics(): ExtensionAnalytics {
  const extensions = getAllExtensions();
  const compatibility = getAllCompatibility();
  const listings = getAllMarketplaceListings();
  const day = 24 * 3600 * 1000;
  const now = Date.now();
  const installsByExt: Record<string, number> = {};
  const activeByExt: Record<string, number> = {};
  for (const l of listings) {
    installsByExt[l.extensionId] = (installsByExt[l.extensionId] ?? 0) + l.installs;
    activeByExt[l.extensionId] = (activeByExt[l.extensionId] ?? 0) + l.activeInstalls;
  }
  const topExtensions = Object.keys(installsByExt)
    .map(extId => {
      const ext = extensions.find(e => e.id === extId);
      return { extensionKey: ext?.key ?? extId, installs: installsByExt[extId], active: activeByExt[extId] ?? 0 };
    })
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 10);
  return {
    installs: {
      total: listings.reduce((s, l) => s + l.installs, 0),
      last7d: listings.filter(l => l.publishedAt && now - new Date(l.publishedAt).getTime() < 7 * day).reduce((s, l) => s + l.installs, 0),
      last30d: listings.filter(l => l.publishedAt && now - new Date(l.publishedAt).getTime() < 30 * day).reduce((s, l) => s + l.installs, 0),
    },
    activeInstalls: {
      total: listings.reduce((s, l) => s + l.activeInstalls, 0),
      growth7d: 0,
    },
    errors: { total: 0, last7d: 0 },
    compatibility: {
      compatible: compatibility.filter(c => c.verdict === "compatible").length,
      incompatible: compatibility.filter(c => c.verdict === "incompatible").length,
      untested: compatibility.filter(c => c.verdict === "untested").length,
    },
    versions: { published: 0, deprecated: 0 },
    topExtensions,
    updatedAt: new Date().toISOString(),
  };
}

// System 20 — Dashboard
export function generateExtensionDashboard(): ExtensionDashboard {
  const extensions = getAllExtensions();
  const plugins = getAllPlugins();
  const sdks = getAllSdks();
  const sandboxes = getAllSandboxPolicies();
  const grants = getAllPermissionGrants();
  const listings = getAllMarketplaceListings();
  const compat = getAllCompatibility();
  const lifecycle = getAllLifecycleRecords();
  const latestByExt = new Map<string, string>();
  for (const r of lifecycle) { latestByExt.set(r.extensionId, r.toState); }
  return {
    extensions: {
      total: extensions.length,
      active: extensions.filter(e => e.status === "active").length,
      disabled: extensions.filter(e => e.status === "disabled").length,
      suspended: extensions.filter(e => e.status === "suspended").length,
    },
    plugins: {
      total: plugins.length,
      approved: plugins.filter(p => p.status === "approved").length,
      pending: plugins.filter(p => p.status === "submitted").length,
    },
    sdks: {
      total: sdks.length,
      active: sdks.filter(s => s.status === "active").length,
      deprecated: sdks.filter(s => s.status === "deprecated").length,
    },
    health: {
      healthy: sandboxes.filter(s => s.healthStatus === "healthy").length,
      degraded: sandboxes.filter(s => s.healthStatus === "degraded").length,
      failing: sandboxes.filter(s => s.healthStatus === "failing").length,
    },
    permissions: {
      granted: grants.filter(g => g.status === "granted").length,
      pending: grants.filter(g => g.status === "requested").length,
      denied: grants.filter(g => g.status === "denied").length,
    },
    marketplace: {
      listed: listings.filter(l => l.status === "listed").length,
      pending: listings.filter(l => l.status === "pending").length,
      rejected: listings.filter(l => l.status === "rejected").length,
    },
    compatibility: {
      compatible: compat.filter(c => c.verdict === "compatible").length,
      incompatible: compat.filter(c => c.verdict === "incompatible").length,
      untested: compat.filter(c => c.verdict === "untested").length,
    },
    lifecycle: {
      installed: Array.from(latestByExt.values()).filter(s => s === "installed").length,
      enabled: Array.from(latestByExt.values()).filter(s => s === "enabled").length,
      suspended: Array.from(latestByExt.values()).filter(s => s === "suspended").length,
      removed: Array.from(latestByExt.values()).filter(s => s === "removed").length,
    },
    updatedAt: new Date().toISOString(),
  };
}

// System 22 — Developer Integration
export function getDeveloperIntegration(): ExtensionDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/extension-framework/extensions", method: "GET", description: "List extensions", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/extensions", method: "POST", description: "Register extension", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/plugins", method: "GET", description: "List plugins", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/plugins", method: "POST", description: "Register plugin", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/sdk", method: "GET", description: "List SDKs", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/sdk", method: "POST", description: "Register SDK", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/manifests", method: "GET", description: "List manifests", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/capabilities", method: "GET", description: "List capabilities", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/hooks", method: "GET", description: "List hooks", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/permissions", method: "GET", description: "List permission grants", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/sandbox", method: "GET", description: "List sandbox policies", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/compatibility", method: "GET", description: "List compatibility entries", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/dependencies", method: "POST", description: "Evaluate dependencies", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/lifecycle", method: "GET", description: "List lifecycle records", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/marketplace", method: "GET", description: "List marketplace listings", authRequired: true, scope: "read" },
      { path: "/api/extension-framework/validation", method: "POST", description: "Run validation", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/audit", method: "GET", description: "List audit records", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/analytics", method: "GET", description: "Get analytics", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/dashboard", method: "GET", description: "Dashboard", authRequired: true, scope: "admin" },
      { path: "/api/extension-framework/status", method: "GET", description: "Status", authRequired: false, scope: "read" },
      { path: "/api/extension-framework/documentation", method: "GET", description: "Documentation", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_plugin_installed", name: "On Plugin Installed", triggerEvent: "PluginInstalled", description: "Triggered when a plugin is installed" },
      { id: "hook_plugin_enabled", name: "On Plugin Enabled", triggerEvent: "PluginEnabled", description: "Triggered when a plugin is enabled" },
      { id: "hook_plugin_disabled", name: "On Plugin Disabled", triggerEvent: "PluginDisabled", description: "Triggered when a plugin is disabled" },
      { id: "hook_plugin_removed", name: "On Plugin Removed", triggerEvent: "PluginRemoved", description: "Triggered when a plugin is removed" },
      { id: "hook_extension_registered", name: "On Extension Registered", triggerEvent: "ExtensionRegistered", description: "Triggered when an extension is registered" },
      { id: "hook_extension_validated", name: "On Extension Validated", triggerEvent: "ExtensionValidated", description: "Triggered when an extension is validated" },
      { id: "hook_sdk_published", name: "On SDK Published", triggerEvent: "SDKPublished", description: "Triggered when an SDK is published" },
      { id: "hook_permission_granted", name: "On Permission Granted", triggerEvent: "PermissionGranted", description: "Triggered when a permission is granted" },
      { id: "hook_permission_revoked", name: "On Permission Revoked", triggerEvent: "PermissionRevoked", description: "Triggered when a permission is revoked" },
      { id: "hook_compatibility_verified", name: "On Compatibility Verified", triggerEvent: "CompatibilityVerified", description: "Triggered when compatibility is verified" },
      { id: "hook_registered", name: "On Hook Registered", triggerEvent: "HookRegistered", description: "Triggered when a hook is registered" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/extension-framework", capabilities: ["extensions", "plugins", "manifests", "sdk", "capabilities", "hooks", "permissions", "sandbox", "compatibility", "dependencies", "lifecycle", "marketplace", "configuration", "events", "apis", "portal", "validation", "audit", "analytics", "dashboard"] },
    webhooks: [
      { id: "wh_plugin_installed", event: "PluginInstalled", description: "Fired when a plugin is installed" },
      { id: "wh_plugin_updated", event: "PluginUpdated", description: "Fired when a plugin is updated" },
      { id: "wh_sdk_published", event: "SDKPublished", description: "Fired when an SDK is published" },
      { id: "wh_permission_granted", event: "PermissionGranted", description: "Fired when a permission is granted" },
      { id: "wh_permission_revoked", event: "PermissionRevoked", description: "Fired when a permission is revoked" },
      { id: "wh_compatibility_verified", event: "CompatibilityVerified", description: "Fired when compatibility is verified" },
    ],
  };
}

// System 23 — Administration API
export function getExtensionFrameworkStatus(): ExtensionAdminStatus { return { operational: true, systems: 24, bridgeSubscribed: false, updatedAt: new Date().toISOString() }; }

// System 24 — Documentation Generator
const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Extension Registry", description: "Register extensions with ownership, versions, visibility, SDK linkage.", endpoints: ["/api/extension-framework/extensions"], events: ["ExtensionRegistered"] },
  { id: 2, name: "Plugin Registry", description: "Plugin metadata, publisher, categories, status, downloads, ratings.", endpoints: ["/api/extension-framework/plugins"], events: [] },
  { id: 3, name: "Extension Manifest", description: "Capabilities, permissions, hooks, dependencies, entry points.", endpoints: ["/api/extension-framework/manifests"], events: [] },
  { id: 4, name: "SDK Registry", description: "SDK versions, supported APIs, compatibility, lifecycle.", endpoints: ["/api/extension-framework/sdk"], events: ["SDKPublished"] },
  { id: 5, name: "Capability Registry", description: "Which capabilities plugins expose.", endpoints: ["/api/extension-framework/capabilities"], events: [] },
  { id: 6, name: "Hook Registry", description: "Lifecycle hooks, event hooks, UI hooks, platform hooks.", endpoints: ["/api/extension-framework/hooks"], events: ["HookRegistered"] },
  { id: 7, name: "Permission Model", description: "Requested permissions, granted permissions, approval workflow.", endpoints: ["/api/extension-framework/permissions"], events: ["PermissionGranted", "PermissionRevoked"] },
  { id: 8, name: "Sandbox Metadata", description: "CPU limits, memory limits, storage limits, timeouts. No runtime execution.", endpoints: ["/api/extension-framework/sandbox"], events: [] },
  { id: 9, name: "Compatibility Engine", description: "Platform versions, SDK versions, migration support.", endpoints: ["/api/extension-framework/compatibility"], events: ["CompatibilityVerified"] },
  { id: 10, name: "Dependency Manager", description: "Plugin dependencies, circular detection, version requirements.", endpoints: ["/api/extension-framework/dependencies"], events: [] },
  { id: 11, name: "Extension Lifecycle", description: "Install, enable, disable, suspend, upgrade, remove.", endpoints: ["/api/extension-framework/lifecycle"], events: ["PluginInstalled", "PluginEnabled", "PluginDisabled", "PluginUpdated", "PluginRemoved"] },
  { id: 12, name: "Marketplace Metadata", description: "Listing metadata, ratings, categories, downloads. Never payments.", endpoints: ["/api/extension-framework/marketplace"], events: [] },
  { id: 13, name: "Extension Configuration", description: "Settings, defaults, overrides.", endpoints: ["/api/extension-framework/configuration"], events: [] },
  { id: 14, name: "Event Integration", description: "Allowed events, published events, subscriptions.", endpoints: ["/api/extension-framework/events"], events: [] },
  { id: 15, name: "API Contracts", description: "Allowed APIs, scopes, versions.", endpoints: ["/api/extension-framework/apis"], events: [] },
  { id: 16, name: "Developer Portal Metadata", description: "Documentation, examples, SDK references.", endpoints: ["/api/extension-framework/developer"], events: [] },
  { id: 17, name: "Validation Engine", description: "Manifest validation, permission validation, compatibility validation.", endpoints: ["/api/extension-framework/validation"], events: ["ExtensionValidated"] },
  { id: 18, name: "Audit Platform", description: "Everything recorded.", endpoints: ["/api/extension-framework/audit"], events: [] },
  { id: 19, name: "Analytics", description: "Installs, usage, errors, compatibility.", endpoints: ["/api/extension-framework/analytics"], events: [] },
  { id: 20, name: "Dashboard", description: "Extensions, health, versions, permissions.", endpoints: ["/api/extension-framework/dashboard"], events: [] },
  { id: 21, name: "Event Bus Bridge", description: "Passive consumer, passive producer.", endpoints: [], events: ["PluginInstalled", "PluginEnabled", "PluginDisabled", "PluginUpdated", "PluginRemoved", "ExtensionRegistered", "ExtensionValidated", "SDKPublished", "PermissionGranted", "PermissionRevoked", "CompatibilityVerified", "HookRegistered"] },
  { id: 22, name: "Developer Integration", description: "SDK metadata, schemas, hooks.", endpoints: ["/api/extension-framework/developer"], events: [] },
  { id: 23, name: "Administration API", description: "Status, registry, health.", endpoints: ["/api/extension-framework/status"], events: [] },
  { id: 24, name: "Documentation Generator", description: "Markdown, JSON.", endpoints: ["/api/extension-framework/documentation"], events: [] },
];
const EVENT_PAYLOADS: Record<ExtensionFrameworkEventType, string[]> = {
  PluginInstalled: ["extensionId", "pluginId", "actorId"],
  PluginEnabled: ["extensionId", "pluginId", "actorId"],
  PluginDisabled: ["extensionId", "pluginId", "actorId"],
  PluginUpdated: ["extensionId", "pluginId", "oldVersion", "newVersion"],
  PluginRemoved: ["extensionId", "pluginId", "actorId"],
  ExtensionRegistered: ["extensionId", "key", "ownerId"],
  ExtensionValidated: ["reportId", "extensionId", "kind", "valid"],
  SDKPublished: ["sdkId", "key", "version"],
  PermissionGranted: ["grantId", "extensionId", "permissionKey"],
  PermissionRevoked: ["grantId", "extensionId", "permissionKey"],
  CompatibilityVerified: ["entryId", "extensionKey", "verdict"],
  HookRegistered: ["hookId", "key", "extensionKey", "type"],
};
const EVENT_DESCRIPTIONS: Record<ExtensionFrameworkEventType, string> = {
  PluginInstalled: "Emitted when a plugin is installed.",
  PluginEnabled: "Emitted when a plugin is enabled.",
  PluginDisabled: "Emitted when a plugin is disabled.",
  PluginUpdated: "Emitted when a plugin is updated.",
  PluginRemoved: "Emitted when a plugin is removed.",
  ExtensionRegistered: "Emitted when an extension is registered in the registry.",
  ExtensionValidated: "Emitted when a validation report is generated for an extension.",
  SDKPublished: "Emitted when an SDK is published.",
  PermissionGranted: "Emitted when a permission grant is approved.",
  PermissionRevoked: "Emitted when a permission grant is revoked.",
  CompatibilityVerified: "Emitted when a compatibility entry is recorded.",
  HookRegistered: "Emitted when a hook is registered.",
};

export function generateDocumentation(): ExtensionDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as ExtensionFrameworkEventType, payload: EVENT_PAYLOADS[type as ExtensionFrameworkEventType], description: EVENT_DESCRIPTIONS[type as ExtensionFrameworkEventType] })),
    ownership: {
      owns: ["Plugin Registry", "Extension Registry", "SDK Metadata", "Extension Manifests", "Extension Lifecycle", "Extension Permissions", "Capability Registration", "Extension Hooks", "Plugin Sandbox Metadata", "Extension Compatibility", "Plugin Marketplace Metadata", "SDK Versioning"],
      doesNotOwn: ["Gameplay", "Quizzes", "Organizations", "Commerce", "Notifications", "AI", "Workflows", "Analytics Datasets", "Search", "Identity", "APIs"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateDocumentation();
  let md = `# EduBek — Platform SDK, Extension & Plugin Framework\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.27\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for platform extensibility across EduBek. It owns ONLY plugin registry, extension registry, SDK metadata, extension manifests, extension lifecycle, extension permissions, capability registration, extension hooks, plugin sandbox metadata, extension compatibility, plugin marketplace metadata, and SDK versioning. Extensions communicate exclusively through the Event Bus and published extension APIs. The platform NEVER executes plugin code inside core services.\n\n**Boundary with 6G.21 (Developer Platform):** 6G.21 owns API keys, webhooks, developer organizations, certifications, and developer-facing documentation tooling. 6G.27 owns the EXTENSION/PLUGIN/SDK FRAMEWORK itself.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getExtensionFrameworkVersion(): string { return "1.0.0"; }
