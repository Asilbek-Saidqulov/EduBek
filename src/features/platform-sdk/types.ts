/**
 * EduBek — Platform SDK & Extension Framework types.
 * Phase 5B.2: Extension Runtime, Plugin SDK, CLI, UI Extensions,
 * Workflow Hooks, Event SDK, Permissions, GraphQL Gateway,
 * Developer Portal, Extension Marketplace, Sandboxed Execution,
 * Version & Compatibility Manager.
 */

// Extension types
export type ExtensionType =
  | "backend" | "frontend" | "workflow" | "ai" | "dashboard"
  | "automation" | "assessment" | "knowledge_graph" | "connector" | "widget" | "theme";

export type ExtensionStatus = "draft" | "submitted" | "approved" | "published" | "rejected" | "deprecated" | "unlisted";
export type InstallStatus = "installed" | "enabled" | "disabled" | "error" | "uninstalled";

export interface ExtensionDto {
  id: string;
  type: ExtensionType;
  name: string;
  slug: string;
  description: string | null;
  developerId: string;
  developerName: string;
  latestVersion: string;
  status: ExtensionStatus;
  pricingModel: string;
  priceEduTokens: number;
  categories: string[];
  screenshots: string[];
  iconUrl: string | null;
  permissions: string[];
  hooks: string[];
  uiExtensions: string[];
  configSchema: Record<string, unknown>;
  installCount: number;
  ratingAverage: number;
  ratingCount: number;
  minPlatformVersion: string | null;
  maxPlatformVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionVersionDto {
  id: string;
  extensionId: string;
  version: string;
  changelog: string | null;
  packageUrl: string | null;
  packageHash: string | null;
  status: string;
  permissions: string[];
  hooks: string[];
  minPlatformVersion: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface ExtensionInstallDto {
  id: string;
  extensionId: string;
  organizationId: string | null;
  userId: string | null;
  version: string;
  config: Record<string, unknown>;
  status: InstallStatus;
  approvedPermissions: string[];
  cpuLimit: number;
  memoryLimitMb: number;
  timeoutMs: number;
  networkEnabled: boolean;
  installedBy: string;
  installedAt: string;
  updatedAt: string;
}

// Hooks
export interface ExtensionHookDto {
  id: string;
  extensionInstallId: string;
  event: string;
  handlerType: "sync" | "async" | "scheduled";
  priority: number;
  enabled: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
}

// Execution
export interface ExtensionExecutionDto {
  id: string;
  extensionInstallId: string;
  trigger: string;
  triggerEvent: string | null;
  status: "running" | "completed" | "failed" | "timeout" | "killed";
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  cpuUsagePercent: number | null;
  memoryUsageMb: number | null;
  errorMessage: string | null;
  errorStack: string | null;
  requestedBy: string | null;
  startedAt: string;
  completedAt: string | null;
}

// Sandbox
export interface SandboxSessionDto {
  id: string;
  extensionInstallId: string;
  status: "active" | "terminated" | "expired";
  cpuLimit: number;
  memoryLimitMb: number;
  timeoutMs: number;
  networkPolicy: "none" | "allowlist" | "open";
  networkAllowlist: string[];
  filesystemIsolated: boolean;
  auditLog: Array<{ timestamp: string; event: string; details: string }>;
  healthStatus: string;
  startedAt: string;
  terminatedAt: string | null;
}

// Permissions
export type ExtensionPermission =
  | "read:users" | "write:resources" | "create:quizzes" | "access:ai"
  | "access:marketplace" | "access:certificates" | "access:analytics"
  | "access:organizations" | "access:automation" | "access:webhooks"
  | "read:grades" | "write:grades" | "access:knowledge_graph"
  | "access:digital_twins" | "access:education_os";

// SDK
export interface SdkDefinition {
  language: string;
  packageName: string;
  version: string;
  features: string[];
  installCommand: string;
  docsUrl: string;
}

// CLI commands
export interface CliCommand {
  name: string;
  description: string;
  usage: string;
  options: Array<{ flag: string; description: string; required: boolean }>;
}

// UI Extensions
export interface UiExtensionDefinition {
  type: "dashboard_widget" | "sidebar_panel" | "settings_page" | "teacher_tool" | "student_tool" | "marketplace_page" | "report" | "analytics" | "custom_form" | "navigation_item";
  name: string;
  componentPath: string;
  config: Record<string, unknown>;
}

// GraphQL
export interface GraphQlSchemaInfo {
  types: string[];
  queries: string[];
  mutations: string[];
  subscriptions: string[];
  version: string;
}

// Reviews
export interface ExtensionReviewDto {
  id: string;
  extensionId: string;
  userId: string;
  rating: number;
  review: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Subscriptions
export interface ExtensionSubscriptionDto {
  id: string;
  extensionId: string;
  organizationId: string | null;
  userId: string | null;
  status: "active" | "cancelled" | "expired" | "suspended";
  plan: string;
  pricePerCycle: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Versions
export interface ApiVersionDto {
  id: string;
  version: string;
  status: "active" | "deprecated" | "sunset" | "retired";
  releaseDate: string;
  deprecationDate: string | null;
  sunsetDate: string | null;
  retirementDate: string | null;
  breakingChanges: string[];
  migrationGuide: string | null;
}

// Compatibility
export interface CompatibilityEntry {
  id: string;
  extensionId: string;
  extensionVersion: string;
  platformVersion: string;
  status: "compatible" | "incompatible" | "untested" | "deprecated";
  notes: string | null;
  testedAt: string | null;
}

// Developer Portal
export interface DeveloperPortalInfo {
  apiVersions: ApiVersionDto[];
  sdks: SdkDefinition[];
  cliCommands: CliCommand[];
  totalExtensions: number;
  totalInstalls: number;
  platformVersion: string;
  graphqlEnabled: boolean;
}
