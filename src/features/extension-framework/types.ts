/**
 * EduBek — Platform SDK, Extension & Plugin Framework types.
 * Phase 6G.27: Single source of truth for platform extensibility across EduBek.
 *
 * Owns ONLY:
 *   plugin registry, extension registry, SDK metadata, extension manifests,
 *   extension lifecycle, extension permissions, capability registration,
 *   extension hooks, plugin sandbox metadata, extension compatibility,
 *   plugin marketplace metadata, SDK versioning.
 *
 * Never owns:
 *   gameplay, quizzes, organizations, commerce, notifications, AI,
 *   workflows, analytics, search, identity.
 *
 * Extensions communicate exclusively through the Event Bus and published
 * extension APIs. The platform NEVER executes plugin code inside core services.
 * The platform only stores metadata that lets operators and developers reason
 * about which extensions exist, what they may do, and how they integrate.
 *
 * Boundary with 6G.21 (Developer Platform):
 *   6G.21 owns API keys, webhooks, developer organizations, certifications,
 *   and developer-facing documentation tooling.
 *   6G.27 owns the EXTENSION/PLUGIN/SDK FRAMEWORK itself — the manifest schema,
 *   capability registry, hook registry, permission model, sandbox metadata,
 *   compatibility engine, dependency manager, lifecycle, marketplace metadata,
 *   and the developer integration surface that other modules consume.
 */

// System 1 — Extension Registry
export type ExtensionStatus = "registered" | "active" | "disabled" | "suspended" | "removed";
export type ExtensionVisibility = "private" | "unlisted" | "public";
export interface ExtensionRegistryEntry {
  id: string; key: string; name: string;
  slug: string; ownerId: string; organizationId: string | null;
  version: string; status: ExtensionStatus; visibility: ExtensionVisibility;
  manifestId: string | null; sdkId: string | null;
  publishedAt: string | null; installedAt: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 2 — Plugin Registry
export type PluginStatus = "draft" | "submitted" | "approved" | "rejected" | "archived";
export type PluginCategory = "tool" | "integration" | "theme" | "language-pack" | "content-pack" | "dashboard" | "automation" | "other";
export interface PluginRegistryEntry {
  id: string; key: string; name: string; slug: string;
  publisherId: string; category: PluginCategory;
  status: PluginStatus; version: string;
  extensionId: string | null;
  tags: string[]; downloads: number; rating: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 3 — Extension Manifest
export type HookType = "lifecycle" | "event" | "ui" | "platform";
export type EntryPointType = "main" | "background" | "webview" | "settings" | "command";
export interface ManifestPermissionRef { name: string; reason: string; required: boolean; }
export interface ManifestHookRef { id: string; type: HookType; priority: number; }
export interface ManifestDependencyRef { extensionKey: string; versionRange: string; optional: boolean; }
export interface ManifestEntryPoint { id: string; type: EntryPointType; path: string; }
export interface ExtensionManifest {
  id: string; extensionId: string; version: string;
  displayName: string; description: string;
  entryPoints: ManifestEntryPoint[];
  permissions: ManifestPermissionRef[];
  hooks: ManifestHookRef[];
  dependencies: ManifestDependencyRef[];
  capabilities: string[];
  minPlatformVersion: string;
  sdkVersion: string;
  configSchema: Record<string, unknown> | null;
  createdAt: string; updatedAt: string;
}

// System 4 — SDK Registry
export type SdkStatus = "draft" | "active" | "deprecated" | "retired";
export type SdkLanguage = "typescript" | "javascript" | "python" | "java" | "go" | "csharp" | "php" | "rust";
export interface SdkEntry {
  id: string; key: string; name: string; version: string;
  language: SdkLanguage; status: SdkStatus;
  supportedApis: string[]; minPlatformVersion: string;
  publishedAt: string | null; deprecatedAt: string | null;
  downloadUrl: string | null; docsUrl: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 5 — Capability Registry
export type CapabilityScope = "platform" | "extension" | "user" | "system";
export type CapabilityStatus = "active" | "deprecated" | "restricted";
export interface CapabilityEntry {
  id: string; key: string; name: string;
  scope: CapabilityScope; status: CapabilityStatus;
  description: string;
  extensionKey: string | null;
  requiredPermission: string | null;
  createdAt: string; updatedAt: string;
}

// System 6 — Hook Registry
export interface HookEntry {
  id: string; key: string; name: string;
  type: HookType; triggerEvent: string | null;
  extensionKey: string; priority: number;
  description: string; active: boolean;
  createdAt: string; updatedAt: string;
}

// System 7 — Permission Model
export type PermissionStatus = "requested" | "granted" | "denied" | "revoked" | "expired";
export type PermissionCategory = "read" | "write" | "execute" | "admin" | "network" | "storage" | "identity";
export interface ExtensionPermission {
  id: string; key: string; name: string;
  category: PermissionCategory; description: string;
  scope: string; riskLevel: "low" | "medium" | "high" | "critical";
  createdAt: string; updatedAt: string;
}
export interface PermissionGrant {
  id: string; extensionId: string; permissionKey: string;
  status: PermissionStatus;
  requestedBy: string; approvedBy: string | null;
  reason: string | null;
  requestedAt: string; decidedAt: string | null;
  expiresAt: string | null;
  correlationId: string;
}

// System 8 — Sandbox Metadata
export type NetworkPolicy = "none" | "allowlist" | "open";
export type SandboxHealthStatus = "unknown" | "healthy" | "degraded" | "failing";
export interface SandboxPolicy {
  id: string; extensionId: string;
  cpuLimit: number; memoryLimitMb: number;
  storageLimitMb: number; timeoutMs: number;
  networkPolicy: NetworkPolicy; networkAllowlist: string[];
  filesystemIsolated: boolean;
  maxConcurrentExecutions: number;
  healthStatus: SandboxHealthStatus;
  createdAt: string; updatedAt: string;
}

// System 9 — Compatibility Engine
export type CompatibilityVerdict = "compatible" | "incompatible" | "untested" | "deprecated";
export interface CompatibilityEntry {
  id: string; extensionKey: string; extensionVersion: string;
  platformVersion: string; sdkVersion: string;
  verdict: CompatibilityVerdict;
  notes: string | null;
  testedAt: string | null;
  createdAt: string; updatedAt: string;
}

// System 10 — Dependency Manager
export type DependencyResolution = "satisfied" | "missing" | "version_conflict" | "circular";
export interface DependencyNode {
  id: string; extensionKey: string; version: string;
  dependencies: Array<{ extensionKey: string; versionRange: string; optional: boolean; resolution: DependencyResolution }>;
  hasCycle: boolean; cyclePath: string[];
  evaluatedAt: string;
}

// System 11 — Extension Lifecycle
export type LifecycleState = "installed" | "enabled" | "disabled" | "suspended" | "upgrading" | "removed";
export type LifecycleTransition =
  | "install" | "enable" | "disable" | "suspend" | "resume" | "upgrade" | "remove";
export interface LifecycleRecord {
  id: string; extensionId: string;
  fromState: LifecycleState | null; toState: LifecycleState;
  transition: LifecycleTransition;
  actorId: string; reason: string | null;
  occurredAt: string; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 12 — Marketplace Metadata
export type MarketplaceListingStatus = "pending" | "listed" | "unlisted" | "rejected" | "delisted";
export interface MarketplaceListing {
  id: string; extensionId: string; pluginId: string | null;
  title: string; summary: string; description: string;
  category: PluginCategory; tags: string[];
  status: MarketplaceListingStatus;
  ratingAverage: number; ratingCount: number;
  downloads: number; installs: number; activeInstalls: number;
  version: string; publishedAt: string | null;
  licenseType: string | null; pricingModel: "free" | "freemium" | "paid" | "contact";
  privacyUrl: string | null; supportUrl: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 13 — Extension Configuration
export type ConfigScope = "default" | "organization" | "extension" | "user";
export interface ExtensionConfig {
  id: string; extensionId: string; scope: ConfigScope;
  scopeId: string | null;
  settings: Record<string, unknown>;
  secrets: string[];
  overrides: string[];
  schemaVersion: number;
  updatedAt: string; createdAt: string;
}

// System 14 — Event Integration
export type EventDirection = "published" | "subscribed";
export interface EventSubscription {
  id: string; extensionId: string;
  eventType: string; direction: EventDirection;
  filter: Record<string, unknown> | null;
  active: boolean;
  createdAt: string; updatedAt: string;
}
export interface EventContract {
  id: string; extensionId: string; eventType: string;
  payloadSchema: Record<string, unknown> | null;
  direction: EventDirection; description: string;
  version: string;
  createdAt: string; updatedAt: string;
}

// System 15 — API Contracts
export type ApiScope = "read" | "write" | "admin" | "system";
export type ApiStability = "stable" | "beta" | "experimental" | "deprecated";
export interface ApiContract {
  id: string; extensionId: string;
  apiName: string; version: string;
  scope: ApiScope; stability: ApiStability;
  description: string; allowedMethods: string[];
  requiredPermissions: string[];
  rateLimit: number | null;
  createdAt: string; updatedAt: string;
}

// System 16 — Developer Portal Metadata
export interface DeveloperPortalMetadata {
  id: string; extensionId: string;
  documentationUrl: string | null;
  examplesCount: number; sdkReferencesCount: number;
  guideUrls: string[]; changelogUrl: string | null;
  lastSyncedAt: string | null;
  createdAt: string; updatedAt: string;
}

// System 17 — Validation Engine
export type ValidationSeverity = "error" | "warning" | "info";
export type ValidationKind = "manifest" | "permission" | "compatibility" | "schema" | "lifecycle" | "dependency";
export interface ValidationIssue {
  code: string; severity: ValidationSeverity;
  message: string; path: string;
}
export interface ValidationReport {
  id: string; extensionId: string; kind: ValidationKind;
  valid: boolean; issues: ValidationIssue[];
  validatedAt: string; correlationId: string;
}

// System 18 — Audit Platform
export type AuditCategory = "lifecycle" | "permission" | "configuration" | "marketplace" | "compatibility" | "validation" | "security";
export type AuditOutcome = "success" | "failure" | "denied";
export interface AuditRecord {
  id: string; extensionId: string | null;
  actorId: string; category: AuditCategory;
  action: string; outcome: AuditOutcome;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  occurredAt: string; correlationId: string;
  ipAddress: string | null; userAgent: string | null;
}

// System 19 — Analytics
export interface ExtensionAnalytics {
  installs: { total: number; last7d: number; last30d: number };
  activeInstalls: { total: number; growth7d: number };
  errors: { total: number; last7d: number };
  compatibility: { compatible: number; incompatible: number; untested: number };
  versions: { published: number; deprecated: number };
  topExtensions: Array<{ extensionKey: string; installs: number; active: number }>;
  updatedAt: string;
}

// System 20 — Dashboard
export interface ExtensionDashboard {
  extensions: { total: number; active: number; disabled: number; suspended: number };
  plugins: { total: number; approved: number; pending: number };
  sdks: { total: number; active: number; deprecated: number };
  health: { healthy: number; degraded: number; failing: number };
  permissions: { granted: number; pending: number; denied: number };
  marketplace: { listed: number; pending: number; rejected: number };
  compatibility: { compatible: number; incompatible: number; untested: number };
  lifecycle: { installed: number; enabled: number; suspended: number; removed: number };
  updatedAt: string;
}

// System 21 — Event Bus Bridge
export type ExtensionFrameworkEventType =
  | "PluginInstalled"
  | "PluginEnabled"
  | "PluginDisabled"
  | "PluginUpdated"
  | "PluginRemoved"
  | "ExtensionRegistered"
  | "ExtensionValidated"
  | "SDKPublished"
  | "PermissionGranted"
  | "PermissionRevoked"
  | "CompatibilityVerified"
  | "HookRegistered";

// System 22 — Developer Integration
export interface ExtensionDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: ExtensionFrameworkEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: ExtensionFrameworkEventType; description: string }>;
}

// System 23 — Administration API
export interface ExtensionAdminStatus {
  operational: boolean; systems: number;
  bridgeSubscribed: boolean; updatedAt: string;
}

// System 24 — Documentation Generator
export interface ExtensionDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: ExtensionFrameworkEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
