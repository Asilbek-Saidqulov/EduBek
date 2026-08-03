/** Systems 1-5: Extension SDK, Runtime, Capability Registry, Permission Manager, Marketplace. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ExtensionManifest, RuntimeDescription, CapabilityRegistryReport, CapabilityEntry, PermissionReport, PermissionEntry, ExtensionMarketplaceReport, MarketplaceExtensionInfo } from "./types";

const log = getLogger("developer-platform");

// System 1 — Extension SDK
export function buildManifest(input: {
  id: string; name: string; version: string; description: string; type: string;
  permissions?: string[]; capabilities?: string[];
  dependencies?: Array<{ id: string; version: string }>;
  minPlatformVersion?: string; hooks?: string[];
}): ExtensionManifest {
  return {
    id: input.id, name: input.name, version: input.version, description: input.description, type: input.type,
    permissions: input.permissions ?? [], capabilities: input.capabilities ?? [],
    dependencies: input.dependencies ?? [],
    compatibility: { minPlatformVersion: input.minPlatformVersion ?? "6.0.0", maxPlatformVersion: null },
    lifecycle: { startup: "onInstall", shutdown: "onUninstall", health: "healthCheck" },
    hooks: input.hooks ?? [], configSchema: {},
  };
}

// System 2 — Extension Runtime
export function describeRuntime(input?: { cpuLimit?: number; memoryLimitMb?: number; timeoutMs?: number; networkEnabled?: boolean }): RuntimeDescription {
  return {
    lifecycle: [
      { phase: "install", description: "Extension is installed and configured", estimatedMs: 1000 },
      { phase: "startup", description: "Extension initializes resources and registers hooks", estimatedMs: 500 },
      { phase: "active", description: "Extension is running and responding to events", estimatedMs: 0 },
      { phase: "shutdown", description: "Extension cleans up resources", estimatedMs: 500 },
      { phase: "uninstall", description: "Extension is removed", estimatedMs: 1000 },
    ],
    sandbox: {
      cpuLimit: input?.cpuLimit ?? 50, memoryLimitMb: input?.memoryLimitMb ?? 128,
      timeoutMs: input?.timeoutMs ?? 30000, networkEnabled: input?.networkEnabled ?? false,
    },
    capabilityValidation: ["check_permissions", "check_rate_limits", "check_api_compatibility"],
    healthChecks: ["liveness", "readiness", "resource_usage"],
  };
}

// System 3 — Capability Registry
const CAPABILITIES: CapabilityEntry[] = [
  { id: "assessment", name: "Assessment API", description: "Create, read, update, delete assessments", module: "assessment-platform", requiredPermission: "read.assessments", apiEndpoint: "/api/assessments" },
  { id: "marketplace", name: "Marketplace API", description: "Browse and manage marketplace listings", module: "marketplace", requiredPermission: "marketplace.read", apiEndpoint: "/api/marketplace" },
  { id: "knowledge_graph", name: "Knowledge Graph", description: "Query the knowledge graph", module: "knowledge-intelligence", requiredPermission: "read.concepts", apiEndpoint: "/api/concepts" },
  { id: "digital_twins", name: "Digital Twins", description: "Access digital twin data", module: "digital-twins", requiredPermission: "read.twins", apiEndpoint: "/api/digital-twins" },
  { id: "education_os", name: "Education OS", description: "Interact with the Education OS", module: "education-os", requiredPermission: "read.workflow", apiEndpoint: "/api/education-os" },
  { id: "data_fabric", name: "Data Fabric", description: "Access the unified data layer", module: "data-fabric", requiredPermission: "read.entities", apiEndpoint: "/api/data-fabric" },
  { id: "global_intelligence", name: "Global Intelligence", description: "Access global intelligence network", module: "global-intelligence", requiredPermission: "read.benchmarks", apiEndpoint: "/api/intelligence-network" },
  { id: "ai_assistant", name: "AI Assistant", description: "Invoke AI assistant", module: "ai-workspace", requiredPermission: "ai.invoke", apiEndpoint: "/api/ai-workspace" },
  { id: "notifications", name: "Notifications", description: "Send notifications to users", module: "education-os", requiredPermission: "write.notifications", apiEndpoint: null },
  { id: "search", name: "Search", description: "Search across the platform", module: "discovery", requiredPermission: "search.query", apiEndpoint: "/api/search" },
  { id: "storage", name: "Storage", description: "Read/write files", module: "cloud-infra", requiredPermission: "storage.read", apiEndpoint: null },
  { id: "events", name: "Events", description: "Subscribe to platform events", module: "platform-orchestrator", requiredPermission: "events.subscribe", apiEndpoint: null },
  { id: "identity", name: "Identity", description: "Access user identity information", module: "auth", requiredPermission: "read.users", apiEndpoint: "/api/auth" },
  { id: "billing", name: "Billing", description: "Access billing information", module: "billing", requiredPermission: "read.billing", apiEndpoint: "/api/billing" },
];
export async function generateCapabilityReport(): Promise<CapabilityRegistryReport> {
  const byModule: Record<string, number> = {};
  for (const c of CAPABILITIES) byModule[c.module] = (byModule[c.module] ?? 0) + 1;
  log.info("capabilities.report_complete", { total: CAPABILITIES.length });
  return { generatedAt: new Date().toISOString(), capabilities: CAPABILITIES, total: CAPABILITIES.length, byModule };
}
export function listCapabilities() { return CAPABILITIES; }

// System 4 — Permission Manager
const PERMISSIONS: PermissionEntry[] = [
  { id: "read.assessments", scope: "read", resource: "assessments", action: "read", description: "Read assessment data", riskLevel: "low" },
  { id: "write.quizzes", scope: "write", resource: "quizzes", action: "write", description: "Create and modify quizzes", riskLevel: "medium" },
  { id: "read.students", scope: "read", resource: "students", action: "read", description: "Read student data", riskLevel: "medium" },
  { id: "events.subscribe", scope: "events", resource: "events", action: "subscribe", description: "Subscribe to platform events", riskLevel: "low" },
  { id: "ai.invoke", scope: "ai", resource: "ai", action: "invoke", description: "Invoke AI generation", riskLevel: "high" },
  { id: "search.query", scope: "search", resource: "search", action: "query", description: "Execute search queries", riskLevel: "low" },
  { id: "marketplace.read", scope: "marketplace", resource: "marketplace", action: "read", description: "Read marketplace data", riskLevel: "low" },
  { id: "marketplace.write", scope: "marketplace", resource: "marketplace", action: "write", description: "Create marketplace listings", riskLevel: "medium" },
  { id: "storage.read", scope: "storage", resource: "storage", action: "read", description: "Read files from storage", riskLevel: "low" },
  { id: "storage.write", scope: "storage", resource: "storage", action: "write", description: "Write files to storage", riskLevel: "high" },
  { id: "read.users", scope: "read", resource: "users", action: "read", description: "Read user identity data", riskLevel: "high" },
  { id: "write.notifications", scope: "write", resource: "notifications", action: "send", description: "Send notifications", riskLevel: "medium" },
  { id: "read.billing", scope: "read", resource: "billing", action: "read", description: "Read billing information", riskLevel: "high" },
  { id: "read.concepts", scope: "read", resource: "concepts", action: "read", description: "Read knowledge graph concepts", riskLevel: "low" },
  { id: "read.twins", scope: "read", resource: "twins", action: "read", description: "Read digital twin data", riskLevel: "medium" },
];
export async function generatePermissionReport(): Promise<PermissionReport> {
  const byRiskLevel: Record<string, number> = {};
  for (const p of PERMISSIONS) byRiskLevel[p.riskLevel] = (byRiskLevel[p.riskLevel] ?? 0) + 1;
  log.info("permissions.report_complete", { total: PERMISSIONS.length });
  return { generatedAt: new Date().toISOString(), permissions: PERMISSIONS, total: PERMISSIONS.length, byRiskLevel };
}
export function listPermissions() { return PERMISSIONS; }
export function validatePermissions(requested: string[]): { valid: boolean; invalid: string[] } {
  const valid = new Set(PERMISSIONS.map(p => p.id));
  const invalid = requested.filter(p => !valid.has(p));
  return { valid: invalid.length === 0, invalid };
}

// System 5 — Extension Marketplace
export async function generateMarketplaceReport(): Promise<ExtensionMarketplaceReport> {
  const [extensions, installs, reviews] = await Promise.all([
    repo.fetchExtensions(200), repo.fetchExtensionInstalls(500), repo.fetchExtensionReviews(500),
  ]);
  const installCounts = new Map<string, number>();
  for (const inst of installs) installCounts.set(inst.extensionId, (installCounts.get(inst.extensionId) ?? 0) + 1);
  const reviewMap = new Map<string, { sum: number; count: number }>();
  for (const rev of reviews) {
    const entry = reviewMap.get(rev.extensionId) ?? { sum: 0, count: 0 };
    entry.sum += rev.rating; entry.count++;
    reviewMap.set(rev.extensionId, entry);
  }
  const infos: MarketplaceExtensionInfo[] = extensions.map(ext => {
    const downloads = installCounts.get(ext.id) ?? 0;
    const reviewData = reviewMap.get(ext.id);
    return {
      id: ext.id, name: ext.name, slug: ext.slug, description: ext.description,
      type: ext.type, developerName: ext.developerName, latestVersion: ext.latestVersion,
      status: ext.status, pricingModel: ext.pricingModel, priceEduTokens: ext.priceEduTokens,
      categories: repo.safeParse(ext.categories, []), iconUrl: ext.iconUrl,
      downloads, rating: reviewData ? Math.round((reviewData.sum / reviewData.count) * 10) / 10 : 0,
      reviewCount: reviewData?.count ?? 0, verified: ext.status === "published",
    };
  });
  const byType: Record<string, number> = {};
  for (const e of infos) byType[e.type] = (byType[e.type] ?? 0) + 1;
  const published = infos.filter(e => e.status === "published").length;
  const verified = infos.filter(e => e.verified).length;
  log.info("marketplace.report_complete", { total: infos.length, published });
  return { generatedAt: new Date().toISOString(), extensions: infos, total: infos.length, published, verified, byType };
}
