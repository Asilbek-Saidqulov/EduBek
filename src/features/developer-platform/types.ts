/**
 * EduBek — Developer Platform, SDK & Plugin Ecosystem types.
 * Phase 6G.21: Single source of truth for extensions, plugins, SDKs, API capabilities,
 * developer credentials, lifecycle management, and sandboxed customization.
 *
 * Owns ONLY the developer ecosystem. Never executes plugin code inside core services.
 * All communication through Event Bus and approved Extension APIs.
 */

// ===========================================================================
// System 1 — Extension Registry
// ===========================================================================
export type ExtensionType = "plugin" | "sdk" | "theme" | "integration" | "widget" | "cli_tool";
export type ExtensionStatus = "draft" | "registered" | "active" | "suspended" | "deprecated" | "removed";

export interface ExtensionRegistryEntry {
  id: string; key: string; name: string;
  type: ExtensionType;
  status: ExtensionStatus;
  namespace: string;
  ownerId: string;
  signature: string;
  version: number;
  createdAt: string; updatedAt: string;
  deprecatedAt: string | null;
  removedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 2 — Plugin Manifest Platform
// ===========================================================================
export interface PluginManifest {
  id: string; extensionId: string;
  version: string; name: string; description: string;
  author: string;
  capabilities: string[];
  permissions: string[];
  dependencies: Array<{ extensionKey: string; versionRange: string }>;
  compatibility: { minPlatformVersion: string; maxPlatformVersion: string | null };
  entryPoint: string;
  iconUrl: string | null;
  homepageUrl: string | null;
  license: string;
  semanticVersion: string;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 3 — SDK Registry
// ===========================================================================
export type SdkLanguage = "typescript" | "python" | "rust" | "go" | "java" | "rest" | "websocket";

export interface SdkEntry {
  id: string; key: string; name: string;
  language: SdkLanguage;
  version: string;
  downloadUrl: string | null;
  docsUrl: string | null;
  minPlatformVersion: string;
  active: boolean;
  deprecatedAt: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 4 — API Capability Registry
// ===========================================================================
export interface ApiCapability {
  id: string; key: string; name: string;
  description: string;
  scopes: string[];
  permissions: string[];
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  documentationRef: string | null;
  active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 5 — Extension Sandbox
// ===========================================================================
export interface SandboxPolicy {
  id: string; extensionId: string;
  executionIsolation: "isolated" | "shared" | "forbidden";
  memoryLimitMb: number;
  cpuLimitPercent: number;
  timeoutMs: number;
  filesystemAccess: "none" | "read" | "read_write";
  networkAccess: "none" | "egress" | "full";
  allowedHosts: string[];
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 6 — Permission Model
// ===========================================================================
export type PermissionStatus = "pending" | "approved" | "rejected" | "revoked";

export interface ExtensionPermission {
  id: string; extensionId: string;
  capability: string;
  scope: string;
  status: PermissionStatus;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  revokedAt: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 7 — Lifecycle Manager
// ===========================================================================
export type LifecycleState = "installed" | "enabled" | "disabled" | "suspended" | "updating" | "rolling_back" | "removed";
export type LifecycleAction = "install" | "enable" | "disable" | "suspend" | "update" | "rollback" | "remove";

export interface LifecycleEvent {
  id: string; extensionId: string;
  action: LifecycleAction;
  fromState: LifecycleState | null;
  toState: LifecycleState;
  version: string;
  actorId: string;
  reason: string;
  occurredAt: string;
  correlationId: string;
}

export interface LifecycleState_ {
  extensionId: string;
  state: LifecycleState;
  currentVersion: string;
  previousVersion: string | null;
  installedAt: string;
  lastStateChangeAt: string;
  health: "healthy" | "degraded" | "unhealthy" | "unknown";
}

// ===========================================================================
// System 8 — Dependency Manager
// ===========================================================================
export interface DependencyNode {
  extensionKey: string;
  version: string;
  dependencies: Array<{ extensionKey: string; versionRange: string; resolved: boolean }>;
}

export interface DependencyCheckResult {
  valid: boolean;
  circularDependencies: string[];
  missingDependencies: string[];
  versionConflicts: Array<{ extensionKey: string; required: string; found: string }>;
}

// ===========================================================================
// System 9 — Event Subscription Platform
// ===========================================================================
export interface EventSubscription {
  id: string; extensionId: string;
  eventType: string;
  filter: Record<string, unknown> | null;
  active: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 10 — Extension Configuration
// ===========================================================================
export interface ExtensionConfig {
  id: string; extensionId: string;
  settings: Record<string, unknown>;
  defaults: Record<string, unknown>;
  validationRules: Array<{ key: string; type: string; required: boolean }>;
  environmentOverrides: Record<string, Record<string, unknown>>;
  secretRefs: string[];
  updatedAt: string;
}

// ===========================================================================
// System 11 — Webhook Platform
// ===========================================================================
export type WebhookStatus = "active" | "paused" | "revoked";

export interface WebhookDefinition {
  id: string; extensionId: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  signingSecret: string;
  retryMax: number;
  retryBackoffMs: number;
  lastTriggeredAt: string | null;
  lastDeliveryStatus: "success" | "failed" | "pending" | null;
  deliveryCount: number;
  failureCount: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 12 — API Keys & Tokens
// ===========================================================================
export type ApiKeyStatus = "active" | "revoked" | "expired" | "rotating";

export interface DeveloperApiKey {
  id: string; developerId: string;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  scopes: string[];
  status: ApiKeyStatus;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  rotationDueAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 13 — Developer Organizations
// ===========================================================================
export interface DeveloperOrganization {
  id: string; name: string;
  ownerId: string;
  members: Array<{ developerId: string; role: "owner" | "admin" | "developer" | "viewer"; addedAt: string }>;
  projects: string[];
  applications: string[];
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 14 — Marketplace Integration
// ===========================================================================
export interface MarketplaceReference {
  id: string; extensionId: string;
  listingId: string;
  versionRef: string;
  licenseRef: string;
  revenueRef: string | null;
  publishedAt: string | null;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 15 — Developer Analytics
// ===========================================================================
export interface DeveloperAnalytics {
  apiUsage: { totalCalls: number; calls24h: number; calls7d: number; byCapability: Record<string, number> };
  sdkAdoption: { totalInstalls: number; byLanguage: Record<SdkLanguage, number> };
  extensionAdoption: { totalInstalls: number; activeInstalls: number; byType: Record<ExtensionType, number> };
  errorRates: { totalErrors: number; errorRate: number; byExtension: Record<string, number> };
  versionDistribution: Array<{ extensionKey: string; versions: Array<{ version: string; count: number }> }>;
  performance: { avgResponseMs: number; p95ResponseMs: number; p99ResponseMs: number };
  updatedAt: string;
}

// ===========================================================================
// System 16 — Extension Health
// ===========================================================================
export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ExtensionHealth {
  id: string; extensionId: string;
  state: HealthState;
  failureCount: number;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  crashCount: number;
  lastCrashAt: string | null;
  compatibilityStatus: "compatible" | "incompatible" | "unknown";
  recoveryRecommendation: string | null;
  checkedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 17 — Certification Platform
// ===========================================================================
export type CertificationLevel = "none" | "basic" | "verified" | "premium";
export type CertificationStatus = "pending" | "in_review" | "approved" | "rejected" | "expired";

export interface CertificationRecord {
  id: string; extensionId: string;
  level: CertificationLevel;
  status: CertificationStatus;
  securityReviewPassed: boolean;
  compatibilityVerified: boolean;
  complianceStatus: "compliant" | "non_compliant" | "pending";
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  expiresAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 18 — Developer Dashboard
// ===========================================================================
export interface DeveloperDashboard {
  extensions: { total: number; active: number; suspended: number; deprecated: number };
  sdks: { total: number; active: number; deprecated: number };
  apiKeys: { total: number; active: number; revoked: number };
  usage: { apiCalls24h: number; apiCalls7d: number; errorRate: number };
  health: { healthy: number; degraded: number; unhealthy: number; unknown: number };
  projects: { total: number };
  organizations: { total: number };
  certifications: { pending: number; approved: number; rejected: number };
  updatedAt: string;
}

// ===========================================================================
// System 19 — Event Bus Bridge
// ===========================================================================
export type DeveloperEventType =
  | "ExtensionInstalled" | "ExtensionEnabled" | "ExtensionDisabled"
  | "ExtensionUpdated" | "ExtensionRolledBack" | "ExtensionRemoved"
  | "ExtensionCertified" | "ExtensionRejected"
  | "DeveloperRegistered" | "DeveloperOrganizationCreated"
  | "ApiKeyCreated" | "ApiKeyRevoked"
  | "WebhookRegistered" | "WebhookTriggered"
  | "SdkPublished" | "SdkDeprecated"
  | "DocumentationGenerated" | "CliTemplateCreated";

// ===========================================================================
// System 20 — Public Developer APIs (metadata only)
// ===========================================================================
export interface PublicApiEndpoint {
  path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string; authRequired: boolean; scope: string;
  rateLimited: boolean;
}

// ===========================================================================
// System 21 — Documentation Generator
// ===========================================================================
export interface DeveloperDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: DeveloperEventType; payload: string[]; description: string }>;
  openApiMetadata: { openapi: string; title: string; version: string; paths: string[] };
  sdkMetadata: Array<{ language: SdkLanguage; version: string; capabilities: string[] }>;
  extensionManifestSchema: { fields: string[] };
  ownership: { owns: string[]; doesNotOwn: string[] };
}

// ===========================================================================
// System 22 — Developer CLI Metadata
// ===========================================================================
export interface CliCommand {
  id: string; name: string;
  description: string;
  args: string[];
  flags: string[];
  template: string | null;
}

export interface CliTemplate {
  id: string; name: string;
  description: string;
  scaffoldType: "extension" | "sdk" | "widget" | "integration";
  files: string[];
  packageMetadata: { name: string; version: string; entry: string };
}

export interface CliMetadata {
  version: string;
  commands: CliCommand[];
  templates: CliTemplate[];
  packageManagers: string[];
}

// ===========================================================================
// Developer Integration (for API route)
// ===========================================================================
export interface DeveloperIntegration {
  publicAPIs: PublicApiEndpoint[];
  extensionHooks: Array<{ id: string; name: string; triggerEvent: DeveloperEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: DeveloperEventType; description: string }>;
  cliMetadata: CliMetadata;
}
