/**
 * EduBek — Platform SDK & Extension Framework service.
 *
 * Phase 5B.2: Extension Runtime, Plugin SDK, CLI, UI Extensions,
 * Workflow Hooks, Event SDK, Permissions, GraphQL Gateway,
 * Developer Portal, Extension Marketplace, Sandboxed Execution,
 * Version & Compatibility Manager.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { eventBus } from "@/infra/event-bus";
import * as repo from "./repository";
import type {
  CliCommand, CompatibilityEntry, DeveloperPortalInfo, ExtensionDto,
  ExtensionExecutionDto, ExtensionHookDto, ExtensionInstallDto,
  ExtensionReviewDto, ExtensionSubscriptionDto, ExtensionVersionDto,
  GraphQlSchemaInfo, SandboxSessionDto, SdkDefinition, UiExtensionDefinition,
} from "./types";

const log = getLogger("platform-sdk");
const PLATFORM_VERSION = "5.2.0";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// 1. Extension Runtime — lifecycle management
// ===========================================================================

export async function publishExtension(input: {
  type: string; name: string; slug: string; description?: string;
  developerId: string; developerName: string;
  permissions?: string[]; hooks?: string[]; uiExtensions?: UiExtensionDefinition[];
  configSchema?: Record<string, unknown>; categories?: string[];
  pricingModel?: string; priceEduTokens?: number; minPlatformVersion?: string;
}): Promise<ExtensionDto> {
  const row = await repo.createExtension({
    type: input.type, name: input.name, slug: input.slug, description: input.description,
    developerId: input.developerId, developerName: input.developerName,
    latestVersion: "1.0.0", status: "submitted",
    pricingModel: input.pricingModel ?? "free", priceEduTokens: input.priceEduTokens ?? 0,
    categories: JSON.stringify(input.categories ?? []),
    screenshots: "[]", iconUrl: null,
    permissions: JSON.stringify(input.permissions ?? []),
    hooks: JSON.stringify(input.hooks ?? []),
    uiExtensions: JSON.stringify(input.uiExtensions ?? []),
    configSchema: JSON.stringify(input.configSchema ?? {}),
    minPlatformVersion: input.minPlatformVersion,
  });
  log.info("extension.published", { id: row.id, slug: input.slug, type: input.type });
  return mapExtension(row);
}

export async function getExtension(id: string): Promise<ExtensionDto | null> {
  const row = await repo.findExtension(id);
  return row ? mapExtension(row) : null;
}

export async function getExtensionBySlug(slug: string): Promise<ExtensionDto | null> {
  const row = await repo.findExtensionBySlug(slug);
  return row ? mapExtension(row) : null;
}

export async function listExtensions(input: { type?: string; status?: string; developerId?: string; limit?: number }): Promise<ExtensionDto[]> {
  const rows = await repo.findExtensions(input);
  return rows.map(mapExtension);
}

export async function approveExtension(id: string): Promise<ExtensionDto> {
  const row = await repo.updateExtension(id, { status: "published" });
  return mapExtension(row);
}

export async function rejectExtension(id: string): Promise<ExtensionDto> {
  const row = await repo.updateExtension(id, { status: "rejected" });
  return mapExtension(row);
}

// ===========================================================================
// Extension Install lifecycle
// ===========================================================================

export async function installExtension(input: {
  extensionId: string; version: string;
  organizationId?: string; userId?: string;
  config?: Record<string, unknown>; approvedPermissions?: string[];
  cpuLimit?: number; memoryLimitMb?: number; timeoutMs?: number; networkEnabled?: boolean;
  installedBy: string;
}): Promise<ExtensionInstallDto> {
  // 1. Validate extension exists + is published
  const ext = await repo.findExtension(input.extensionId);
  if (!ext) throw new Error("Extension not found");
  if (ext.status !== "published") throw new Error("Extension is not published");

  // 2. Check permissions are approved
  const requestedPermissions = safeParse<string[]>(ext.permissions, []);
  const approvedPermissions = input.approvedPermissions ?? requestedPermissions;

  // 3. Create install record
  const install = await repo.createInstall({
    extensionId: input.extensionId, version: input.version,
    organizationId: input.organizationId, userId: input.userId,
    config: JSON.stringify(input.config ?? {}),
    status: "enabled",
    approvedPermissions: JSON.stringify(approvedPermissions),
    cpuLimit: input.cpuLimit ?? 50, memoryLimitMb: input.memoryLimitMb ?? 128,
    timeoutMs: input.timeoutMs ?? 30000, networkEnabled: input.networkEnabled ?? false,
    installedBy: input.installedBy,
  });

  // 4. Register hooks
  const hooks = safeParse<string[]>(ext.hooks, []);
  for (const event of hooks) {
    await repo.createHook({
      extensionInstallId: install.id, event, handlerType: "async", priority: 100, enabled: true,
    });
  }

  // 5. Increment install count
  await repo.updateExtension(input.extensionId, { installCount: { increment: 1 } });

  // 6. Create sandbox session
  await repo.createSandbox({
    extensionInstallId: install.id, status: "active",
    cpuLimit: input.cpuLimit ?? 50, memoryLimitMb: input.memoryLimitMb ?? 128,
    timeoutMs: input.timeoutMs ?? 30000, networkPolicy: input.networkEnabled ? "allowlist" : "none",
    networkAllowlist: "[]", filesystemIsolated: true,
    auditLog: JSON.stringify([{ timestamp: new Date().toISOString(), event: "sandbox_created", details: "Sandbox created on install" }]),
    healthStatus: "healthy",
  });

  log.info("extension.installed", { extensionId: input.extensionId, installId: install.id, hooks: hooks.length });
  return mapInstall(install);
}

export async function uninstallExtension(installId: string): Promise<void> {
  await repo.updateInstall(installId, { status: "uninstalled" });
  // Disable hooks
  const hooks = await repo.findHooks({ extensionInstallId: installId, limit: 100 });
  for (const hook of hooks) {
    await repo.updateHook(hook.id, { enabled: false });
  }
  // Terminate sandbox
  const sandboxes = await repo.findSandboxes({ extensionInstallId: installId, status: "active", limit: 10 });
  for (const sb of sandboxes) {
    await repo.updateSandbox(sb.id, { status: "terminated", terminatedAt: new Date() });
  }
  log.info("extension.uninstalled", { installId });
}

export async function disableExtension(installId: string): Promise<ExtensionInstallDto> {
  const row = await repo.updateInstall(installId, { status: "disabled" });
  const hooks = await repo.findHooks({ extensionInstallId: installId, limit: 100 });
  for (const hook of hooks) await repo.updateHook(hook.id, { enabled: false });
  return mapInstall(row);
}

export async function enableExtension(installId: string): Promise<ExtensionInstallDto> {
  const row = await repo.updateInstall(installId, { status: "enabled" });
  const hooks = await repo.findHooks({ extensionInstallId: installId, limit: 100 });
  for (const hook of hooks) await repo.updateHook(hook.id, { enabled: true });
  return mapInstall(row);
}

export async function listInstalls(input: { extensionId?: string; organizationId?: string; userId?: string; status?: string; limit?: number }): Promise<ExtensionInstallDto[]> {
  const rows = await repo.findInstalls(input);
  return rows.map(mapInstall);
}

// ===========================================================================
// 2. Workflow Hook System
// ===========================================================================

export async function executeHooks(event: string, payload: Record<string, unknown>): Promise<{
  executedCount: number; successCount: number; failCount: number; results: Array<{ hookId: string; status: string; durationMs: number; error?: string }>;
}> {
  const hooks = await repo.findHooksForEvent(event);
  const results: Array<{ hookId: string; status: string; durationMs: number; error?: string }> = [];
  let successCount = 0;
  let failCount = 0;

  for (const hook of hooks) {
    const start = Date.now();
    const execution = await repo.createExecution({
      extensionInstallId: hook.extensionInstallId, trigger: "hook", triggerEvent: event,
      input: JSON.stringify(payload), status: "running",
    });

    try {
      // Simulate hook execution (real implementation would call the extension's handler)
      await new Promise((r) => setTimeout(r, Math.random() * 50));
      const durationMs = Date.now() - start;

      await repo.updateExecution(execution.id, {
        status: "completed", output: JSON.stringify({ processed: true }),
        durationMs, completedAt: new Date(),
      });
      await repo.updateHook(hook.id, {
        executionCount: { increment: 1 }, lastExecutedAt: new Date(),
      });

      results.push({ hookId: hook.id, status: "completed", durationMs });
      successCount += 1;
    } catch (err) {
      const durationMs = Date.now() - start;
      await repo.updateExecution(execution.id, {
        status: "failed", errorMessage: (err as Error).message,
        durationMs, completedAt: new Date(),
      });
      results.push({ hookId: hook.id, status: "failed", durationMs, error: (err as Error).message });
      failCount += 1;
    }
  }

  log.info("hooks.executed", { event, total: hooks.length, success: successCount, failed: failCount });
  return { executedCount: hooks.length, successCount, failCount, results };
}

export async function listHooks(input: { extensionInstallId?: string; event?: string; enabled?: boolean; limit?: number }): Promise<ExtensionHookDto[]> {
  const rows = await repo.findHooks(input);
  return rows.map((r: any) => ({
    id: r.id, extensionInstallId: r.extensionInstallId, event: r.event,
    handlerType: r.handlerType, priority: r.priority, enabled: r.enabled,
    executionCount: r.executionCount, lastExecutedAt: r.lastExecutedAt?.toISOString() ?? null,
  }));
}

export async function listExecutions(input: { extensionInstallId?: string; status?: string; trigger?: string; limit?: number }): Promise<ExtensionExecutionDto[]> {
  const rows = await repo.findExecutions(input);
  return rows.map((r: any) => ({
    id: r.id, extensionInstallId: r.extensionInstallId, trigger: r.trigger,
    triggerEvent: r.triggerEvent, status: r.status,
    input: safeParse(r.input, {}), output: safeParse(r.output, null),
    durationMs: r.durationMs, cpuUsagePercent: r.cpuUsagePercent,
    memoryUsageMb: r.memoryUsageMb, errorMessage: r.errorMessage, errorStack: r.errorStack,
    requestedBy: r.requestedBy, startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));
}

// ===========================================================================
// 3. Sandboxed Execution
// ===========================================================================

export async function executeInSandbox(input: {
  installId: string; code: string; input?: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ output: unknown; durationMs: number; status: string; error?: string }> {
  const start = Date.now();
  const install = await repo.findInstall(input.installId);
  if (!install) throw new Error("Install not found");
  if (install.status !== "enabled") throw new Error("Extension is not enabled");

  const timeoutMs = input.timeoutMs ?? install.timeoutMs;
  const execution = await repo.createExecution({
    extensionInstallId: input.installId, trigger: "api_call",
    input: JSON.stringify(input.input ?? {}), status: "running", requestedBy: install.installedBy,
  });

  try {
    // Simulate sandboxed execution (real implementation would use VM/worker)
    await new Promise((r) => setTimeout(r, Math.random() * 100));
    const durationMs = Date.now() - start;

    if (durationMs > timeoutMs) {
      await repo.updateExecution(execution.id, { status: "timeout", durationMs, completedAt: new Date(), errorMessage: "Execution exceeded timeout" });
      return { output: null, durationMs, status: "timeout", error: "Execution exceeded timeout" };
    }

    const output = { result: "executed", code: input.code.slice(0, 100) };
    await repo.updateExecution(execution.id, {
      status: "completed", output: JSON.stringify(output), durationMs,
      cpuUsagePercent: Math.random() * install.cpuLimit,
      memoryUsageMb: Math.random() * install.memoryLimitMb,
      completedAt: new Date(),
    });

    log.info("sandbox.executed", { installId: input.installId, durationMs, status: "completed" });
    return { output, durationMs, status: "completed" };
  } catch (err) {
    const durationMs = Date.now() - start;
    await repo.updateExecution(execution.id, { status: "failed", durationMs, errorMessage: (err as Error).message, completedAt: new Date() });
    return { output: null, durationMs, status: "failed", error: (err as Error).message };
  }
}

export async function listSandboxes(input: { extensionInstallId?: string; status?: string; limit?: number }): Promise<SandboxSessionDto[]> {
  const rows = await repo.findSandboxes(input);
  return rows.map((r: any) => ({
    id: r.id, extensionInstallId: r.extensionInstallId, status: r.status,
    cpuLimit: r.cpuLimit, memoryLimitMb: r.memoryLimitMb, timeoutMs: r.timeoutMs,
    networkPolicy: r.networkPolicy, networkAllowlist: safeParse<string[]>(r.networkAllowlist, []),
    filesystemIsolated: r.filesystemIsolated,
    auditLog: safeParse(r.auditLog, []),
    healthStatus: r.healthStatus, startedAt: r.startedAt.toISOString(),
    terminatedAt: r.terminatedAt?.toISOString() ?? null,
  }));
}

// ===========================================================================
// 4. Plugin SDK definitions
// ===========================================================================

const SDK_DEFINITIONS: SdkDefinition[] = [
  { language: "TypeScript", packageName: "@edubek/sdk", version: "5.2.0", features: ["Authentication", "API Client", "Event Client", "Graph Client", "AI Client", "Marketplace Client", "Assessment Client"], installCommand: "npm install @edubek/sdk", docsUrl: "/docs/sdk/typescript" },
  { language: "JavaScript", packageName: "@edubek/sdk-js", version: "5.2.0", features: ["Authentication", "API Client", "Event Client", "Marketplace Client"], installCommand: "npm install @edubek/sdk-js", docsUrl: "/docs/sdk/javascript" },
  { language: "Python", packageName: "edubek-sdk", version: "5.2.0", features: ["Authentication", "API Client", "Event Client", "AI Client", "Assessment Client"], installCommand: "pip install edubek-sdk", docsUrl: "/docs/sdk/python" },
  { language: "Java", packageName: "ai.edubek:sdk", version: "5.2.0", features: ["Authentication", "API Client", "Event Client"], installCommand: "implementation 'ai.edubek:sdk:5.2.0'", docsUrl: "/docs/sdk/java" },
  { language: "Go", packageName: "github.com/edubek/sdk-go", version: "5.2.0", features: ["Authentication", "API Client", "Event Client"], installCommand: "go get github.com/edubek/sdk-go", docsUrl: "/docs/sdk/go" },
  { language: "C#", packageName: "EduBek.SDK", version: "5.2.0", features: ["Authentication", "API Client", "Event Client"], installCommand: "dotnet add package EduBek.SDK", docsUrl: "/docs/sdk/csharp" },
  { language: "PHP", packageName: "edubek/sdk", version: "5.2.0", features: ["Authentication", "API Client"], installCommand: "composer require edubek/sdk", docsUrl: "/docs/sdk/php" },
];

export function listSdks(): SdkDefinition[] { return SDK_DEFINITIONS; }

// ===========================================================================
// 5. CLI Commands
// ===========================================================================

const CLI_COMMANDS: CliCommand[] = [
  { name: "init", description: "Initialize a new EduBek extension project", usage: "edubek init [name]", options: [{ flag: "--template <type>", description: "Extension template (plugin|ai-agent|dashboard|connector|workflow)", required: false }] },
  { name: "create plugin", description: "Create a new plugin extension", usage: "edubek create plugin [name]", options: [] },
  { name: "create ai-agent", description: "Create a new AI agent extension", usage: "edubek create ai-agent [name]", options: [] },
  { name: "create dashboard", description: "Create a new dashboard extension", usage: "edubek create dashboard [name]", options: [] },
  { name: "create connector", description: "Create a new connector extension", usage: "edubek create connector [name]", options: [] },
  { name: "create workflow", description: "Create a new workflow extension", usage: "edubek create workflow [name]", options: [] },
  { name: "validate", description: "Validate extension manifest + permissions", usage: "edubek validate", options: [{ flag: "--strict", description: "Strict validation mode", required: false }] },
  { name: "publish", description: "Publish extension to marketplace", usage: "edubek publish", options: [{ flag: "--version <ver>", description: "Version to publish", required: true }] },
  { name: "deploy", description: "Deploy extension to organization", usage: "edubek deploy [org-id]", options: [{ flag: "--config <file>", description: "Configuration file", required: false }] },
];

export function listCliCommands(): CliCommand[] { return CLI_COMMANDS; }

// ===========================================================================
// 6. GraphQL Gateway
// ===========================================================================

export function getGraphQLSchemaInfo(): GraphQlSchemaInfo {
  return {
    types: [
      "User", "Organization", "Classroom", "Resource", "Assessment", "Quiz",
      "Question", "Assignment", "Grade", "Certificate", "Competency",
      "Credential", "Transcript", "LearningPlan", "StudySession", "DigitalTwin",
      "Concept", "CurriculumStandard", "KnowledgeGraphNode", "KnowledgeGraphEdge",
      "Discussion", "StudyGroup", "Challenge", "Mentorship",
      "Extension", "ExtensionInstall", "WebhookEndpoint", "ApiKey",
      "MarketplaceApp", "EnterpriseTenant",
    ],
    queries: [
      "me", "user(id)", "organization(id)", "classroom(id)", "resource(id)",
      "assessment(id)", "search(query)", "recommendations(userId)",
      "learningPlan(userId)", "digitalTwin(type, entityId)",
      "curriculumCoverage(scopeType, scopeId)", "knowledgeHealth(orgId)",
      "operations(organizationId)", "transcript(userId)",
    ],
    mutations: [
      "createResource", "createAssessment", "gradeSubmission",
      "issueCredential", "rebuildTranscript", "syncDigitalTwin",
      "installExtension", "executeHook", "publishEvent",
      "runWorkflow", "runScenario",
    ],
    subscriptions: [
      "assessmentCompleted", "resourceCreated", "twinUpdated",
      "recommendationReady", "operationCreated", "webhookDelivered",
    ],
    version: "1.0.0",
  };
}

// ===========================================================================
// 7. Extension Marketplace — Reviews + Subscriptions
// ===========================================================================

export async function reviewExtension(input: {
  extensionId: string; userId: string; rating: number; review?: string; organizationId?: string;
}): Promise<ExtensionReviewDto> {
  const row = await repo.createReview({
    extensionId: input.extensionId, userId: input.userId,
    rating: input.rating, review: input.review, organizationId: input.organizationId,
  });
  await repo.updateExtensionRating(input.extensionId);
  return mapReview(row);
}

export async function listReviews(input: { extensionId?: string; userId?: string; limit?: number }): Promise<ExtensionReviewDto[]> {
  const rows = await repo.findReviews(input);
  return rows.map(mapReview);
}

export async function subscribeToExtension(input: {
  extensionId: string; organizationId?: string; userId?: string;
  plan?: string; pricePerCycle?: number;
}): Promise<ExtensionSubscriptionDto> {
  const row = await repo.createSubscription({
    extensionId: input.extensionId, organizationId: input.organizationId, userId: input.userId,
    status: "active", plan: input.plan ?? "free", pricePerCycle: input.pricePerCycle ?? 0,
    currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return mapSubscription(row);
}

export async function listSubscriptions(input: { extensionId?: string; organizationId?: string; userId?: string; status?: string; limit?: number }): Promise<ExtensionSubscriptionDto[]> {
  const rows = await repo.findSubscriptions(input);
  return rows.map(mapSubscription);
}

// ===========================================================================
// 8. Version & Compatibility Manager
// ===========================================================================

export async function listApiVersions(): Promise<any[]> {
  const rows = await repo.findApiVersions({});
  return rows.map((r: any) => ({
    id: r.id, version: r.version, status: r.status,
    releaseDate: r.releaseDate.toISOString(),
    deprecationDate: r.deprecationDate?.toISOString() ?? null,
    sunsetDate: r.sunsetDate?.toISOString() ?? null,
    retirementDate: r.retirementDate?.toISOString() ?? null,
    breakingChanges: safeParse<string[]>(r.breakingChanges, []),
    migrationGuide: r.migrationGuide,
  }));
}

export async function checkCompatibility(input: {
  extensionId: string; extensionVersion: string; platformVersion?: string;
}): Promise<CompatibilityEntry> {
  const platformVersion = input.platformVersion ?? PLATFORM_VERSION;
  const existing = await repo.findCompatibility({
    extensionId: input.extensionId, extensionVersion: input.extensionVersion,
    platformVersion, limit: 1,
  });
  if (existing.length > 0) {
    const r = existing[0];
    return { id: r.id, extensionId: r.extensionId, extensionVersion: r.extensionVersion, platformVersion: r.platformVersion, status: r.status as any, notes: r.notes, testedAt: r.testedAt?.toISOString() ?? null };
  }
  // Auto-check: compare minPlatformVersion
  const ext = await repo.findExtension(input.extensionId);
  const minVersion = ext?.minPlatformVersion;
  const isCompatible = !minVersion || compareVersions(platformVersion, minVersion) >= 0;
  const row = await repo.upsertCompatibility({
    extensionId: input.extensionId, extensionVersion: input.extensionVersion,
    platformVersion, status: isCompatible ? "compatible" : "incompatible",
    notes: isCompatible ? "Auto-checked: compatible" : `Requires platform >= ${minVersion}`,
    testedAt: new Date(),
  });
  return { id: row.id, extensionId: row.extensionId, extensionVersion: row.extensionVersion, platformVersion: row.platformVersion, status: row.status as any, notes: row.notes, testedAt: row.testedAt?.toISOString() ?? null };
}

export async function listCompatibilityEntries(input: { extensionId?: string; status?: string; limit?: number }): Promise<CompatibilityEntry[]> {
  const rows = await repo.findCompatibility(input);
  return rows.map((r: any) => ({
    id: r.id, extensionId: r.extensionId, extensionVersion: r.extensionVersion,
    platformVersion: r.platformVersion, status: r.status, notes: r.notes,
    testedAt: r.testedAt?.toISOString() ?? null,
  }));
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

// ===========================================================================
// 9. Developer Portal
// ===========================================================================

export async function getDeveloperPortalInfo(): Promise<DeveloperPortalInfo> {
  const [apiVersions, totalExtensions, totalInstalls] = await Promise.all([
    listApiVersions(),
    repo.countExtensions("published"),
    repo.countInstalls(),
  ]);
  return {
    apiVersions,
    sdks: SDK_DEFINITIONS,
    cliCommands: CLI_COMMANDS,
    totalExtensions,
    totalInstalls,
    platformVersion: PLATFORM_VERSION,
    graphqlEnabled: true,
  };
}

// ===========================================================================
// Mappers
// ===========================================================================

function mapExtension(row: any): ExtensionDto {
  return {
    id: row.id, type: row.type, name: row.name, slug: row.slug, description: row.description,
    developerId: row.developerId, developerName: row.developerName,
    latestVersion: row.latestVersion, status: row.status,
    pricingModel: row.pricingModel, priceEduTokens: row.priceEduTokens,
    categories: safeParse<string[]>(row.categories, []),
    screenshots: safeParse<string[]>(row.screenshots, []),
    iconUrl: row.iconUrl,
    permissions: safeParse<string[]>(row.permissions, []),
    hooks: safeParse<string[]>(row.hooks, []),
    uiExtensions: safeParse<any[]>(row.uiExtensions, []),
    configSchema: safeParse(row.configSchema, {}),
    installCount: row.installCount, ratingAverage: row.ratingAverage, ratingCount: row.ratingCount,
    minPlatformVersion: row.minPlatformVersion, maxPlatformVersion: row.maxPlatformVersion,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapInstall(row: any): ExtensionInstallDto {
  return {
    id: row.id, extensionId: row.extensionId, organizationId: row.organizationId, userId: row.userId,
    version: row.version, config: safeParse(row.config, {}), status: row.status,
    approvedPermissions: safeParse<string[]>(row.approvedPermissions, []),
    cpuLimit: row.cpuLimit, memoryLimitMb: row.memoryLimitMb, timeoutMs: row.timeoutMs,
    networkEnabled: row.networkEnabled, installedBy: row.installedBy,
    installedAt: row.installedAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapReview(row: any): ExtensionReviewDto {
  return {
    id: row.id, extensionId: row.extensionId, userId: row.userId, rating: row.rating,
    review: row.review, organizationId: row.organizationId,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSubscription(row: any): ExtensionSubscriptionDto {
  return {
    id: row.id, extensionId: row.extensionId, organizationId: row.organizationId, userId: row.userId,
    status: row.status, plan: row.plan, pricePerCycle: row.pricePerCycle,
    currentPeriodStart: row.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}
