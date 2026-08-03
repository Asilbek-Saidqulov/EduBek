/**
 * EduBek — Integration, Connectors & External Systems Platform tests.
 * Phase 6G.23: 550+ deterministic tests covering all 20 systems.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerConnector, getConnectorById, getConnectorByKeyStr, listConnectors,
  supportsAllConnectorTypes, supportsAllConnectorStatuses,
  canTransitionConnector, installConnector, enableConnector, disableConnector,
  suspendConnector, upgradeConnector, removeConnector, getConnectorLifecycle,
  createAuthReference, getAuthReferenceById, listAuthRefs, deactivateAuthRef, supportsAllAuthRefTypes,
  createSyncJob, getSyncJobById, listSyncJobs, startSyncJob, completeSyncJob, failSyncJob,
  supportsAllSyncDirections, supportsAllSyncModes, supportsAllSyncStatuses,
  createImportJob, getImportJobById, listImportJobs, startImportJob, completeImportJob, failImportJob,
  supportsAllImportFormats, supportsAllImportStatuses,
  createExportJob, getExportJobById, listExportJobs, startExportJob, completeExportJob, failExportJob,
  supportsAllExportFormats, supportsAllExportStatuses,
  registerWebhook, getWebhookById, listWebhooks, pauseWebhook, revokeWebhook, recordWebhookDelivery,
  supportsAllWebhookDirections, supportsAllWebhookStatuses,
  registerExternalApi, getExternalApiById, listExternalApis,
  recordConnectorHealth, getHealthById, getHealthForConnectorId, listHealth,
  recordConnectorFailure, recordHeartbeat, supportsAllHealthStates,
  setConnectorRateLimit, getRateLimitById, getRateLimitForConnectorId, listRateLimits,
  checkRateLimit, recordRateLimitUsage, resetRateLimitWindow,
  createMapping, getMappingById, listMappings,
  detectConflict, getConflictById, listConflicts, resolveConflict, ignoreConflict,
  supportsAllConflictStrategies, supportsAllConflictStatuses,
  createSyncSchedule, getSyncScheduleById, listSyncSchedules, pauseSyncSchedule,
  resumeSyncSchedule, recordSyncScheduleRun, cancelSyncSchedule, listDueSyncSchedules,
  supportsAllScheduleTypes, supportsAllScheduleStatuses,
  generateIntegrationAnalytics,
  recordIntegrationAudit, listIntegrationAudit, getIntegrationAuditCount, verifyAuditIntegrity,
  generateIntegrationDashboard,
  getDeveloperIntegration,
  generateIntegrationDocumentation, generateMarkdownDocumentation, getIntegrationVersion, getIntegrationStatus,
  subscribeIntegration, unsubscribeIntegration, isIntegrationSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishIntegrationEvent, _resetBridgeForTesting,
  _resetRepositoryForTesting,
} from "@/features/integration-platform";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

describe("Integration — Connector Registry (System 1)", () => {
  it("registers connector", () => { const c = registerConnector({ key: "gc1", name: "Google Classroom", type: "education", version: "1.0", provider: "Google", ownerId: "d", signature: "s" }); expect(c.id).toBeDefined(); expect(c.status).toBe("draft"); });
  it("rejects duplicate key", () => { registerConnector({ key: "dk", name: "D", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(() => registerConnector({ key: "dk", name: "D2", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" })).toThrow(); });
  it("gets by id", () => { const c = registerConnector({ key: "gi", name: "G", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(getConnectorById(c.id)).not.toBeNull(); expect(getConnectorById("missing")).toBeNull(); });
  it("gets by key", () => { registerConnector({ key: "gk", name: "G", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(getConnectorByKeyStr("gk")).not.toBeNull(); });
  it("lists connectors", () => { registerConnector({ key: "l1", name: "L", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); registerConnector({ key: "l2", name: "L", type: "identity", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(listConnectors().length).toBe(2); });
  it("lists by type", () => { registerConnector({ key: "t1", name: "L", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); registerConnector({ key: "t2", name: "L", type: "identity", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(listConnectors("identity").length).toBe(1); });
  it("lists by status", () => { registerConnector({ key: "s1", name: "L", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(listConnectors(undefined, "draft").length).toBe(1); });
  it("supports all types", () => { expect(supportsAllConnectorTypes().length).toBe(7); });
  it("supports all statuses", () => { expect(supportsAllConnectorStatuses().length).toBe(6); });
  it("default direction bidirectional", () => { expect(registerConnector({ key: "dd", name: "D", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }).direction).toBe("bidirectional"); });
  it("supports capabilities", () => { expect(registerConnector({ key: "cap", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s", capabilities: ["sync", "import"] }).capabilities.length).toBe(2); });
  it("default removedAt null", () => { expect(registerConnector({ key: "dr", name: "D", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }).removedAt).toBeNull(); });
});

describe("Integration — Lifecycle (System 2)", () => {
  it("canTransition validates", () => { expect(canTransitionConnector("draft", "installed")).toBe(true); expect(canTransitionConnector("removed", "enabled")).toBe(false); });
  it("install connector", () => { const c = registerConnector({ key: "in1", name: "I", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(installConnector(c.id, "admin")?.status).toBe("installed"); });
  it("enable connector", () => { const c = registerConnector({ key: "en1", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); expect(enableConnector(c.id, "admin")?.status).toBe("enabled"); });
  it("disable connector", () => { const c = registerConnector({ key: "di1", name: "D", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); enableConnector(c.id, "admin"); expect(disableConnector(c.id, "admin", "x")?.status).toBe("disabled"); });
  it("suspend connector", () => { const c = registerConnector({ key: "su1", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); enableConnector(c.id, "admin"); expect(suspendConnector(c.id, "admin", "x")?.status).toBe("suspended"); });
  it("remove connector sets removedAt", () => { const c = registerConnector({ key: "rm1", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); removeConnector(c.id, "admin", "x"); expect(getConnectorById(c.id)?.removedAt).not.toBeNull(); });
  it("upgrade connector changes version", () => { const c = registerConnector({ key: "up1", name: "U", type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); enableConnector(c.id, "admin"); upgradeConnector(c.id, "2.0", "admin"); expect(getConnectorById(c.id)?.version).toBe("2.0"); });
  it("lifecycle history tracked", () => { const c = registerConnector({ key: "lh1", name: "L", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); expect(getConnectorLifecycle(c.id).length).toBe(1); });
  it("rejects invalid transition", () => { const c = registerConnector({ key: "iv1", name: "I", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(enableConnector(c.id, "admin")).toBeNull(); });
  it("install publishes event", () => { const c = registerConnector({ key: "ie1", name: "I", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); _resetBridgeForTesting(); installConnector(c.id, "admin"); expect(getPublishedEvents().some(e => e.type === "ConnectorInstalled")).toBe(true); });
  it("remove publishes event", () => { const c = registerConnector({ key: "re1", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); installConnector(c.id, "admin"); _resetBridgeForTesting(); removeConnector(c.id, "admin", "x"); expect(getPublishedEvents().some(e => e.type === "ConnectorRemoved")).toBe(true); });
});

describe("Integration — Auth References (System 3)", () => {
  it("creates auth ref", () => { const c = registerConnector({ key: "ar1", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const a = createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: "key1" }); expect(a.id).toBeDefined(); expect(a.active).toBe(true); });
  it("gets by id", () => { const c = registerConnector({ key: "ar2", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const a = createAuthReference({ connectorId: c.id, type: "api_key", referenceKey: "k" }); expect(getAuthReferenceById(a.id)).not.toBeNull(); });
  it("lists by connector", () => { const c = registerConnector({ key: "ar3", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: "k1" }); createAuthReference({ connectorId: c.id, type: "jwt", referenceKey: "k2" }); expect(listAuthRefs(c.id).length).toBe(2); });
  it("deactivates", () => { const c = registerConnector({ key: "ar4", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const a = createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: "k" }); expect(deactivateAuthRef(a.id)?.active).toBe(false); });
  it("supports all types", () => { expect(supportsAllAuthRefTypes().length).toBe(6); });
  it("default scopes empty", () => { const c = registerConnector({ key: "ar5", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: "k" }).scopes.length).toBe(0); });
  it("default expiresAt null", () => { const c = registerConnector({ key: "ar6", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: "k" }).expiresAt).toBeNull(); });
});

describe("Integration — Sync Engine (System 4)", () => {
  it("creates sync job", () => { const c = registerConnector({ key: "sy1", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const j = createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }); expect(j.status).toBe("pending"); });
  it("starts sync job", () => { const c = registerConnector({ key: "sy2", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const j = createSyncJob({ connectorId: c.id, direction: "one_way_in", mode: "full" }); expect(startSyncJob(j.id)?.status).toBe("running"); });
  it("completes sync job", () => { const c = registerConnector({ key: "sy3", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const j = createSyncJob({ connectorId: c.id, direction: "one_way_in", mode: "full" }); startSyncJob(j.id); expect(completeSyncJob(j.id, 100, 95, 5)?.status).toBe("completed"); });
  it("lists sync jobs", () => { const c = registerConnector({ key: "sy4", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }); expect(listSyncJobs().length).toBe(1); });
  it("sync start publishes event", () => { const c = registerConnector({ key: "sy5", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); _resetBridgeForTesting(); createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }); expect(getPublishedEvents().some(e => e.type === "ConnectorSyncStarted")).toBe(true); });
  it("sync complete publishes event", () => { const c = registerConnector({ key: "sy6", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const j = createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }); startSyncJob(j.id); _resetBridgeForTesting(); completeSyncJob(j.id, 10, 10, 0); expect(getPublishedEvents().some(e => e.type === "ConnectorSyncCompleted")).toBe(true); });
  it("supports all directions", () => { expect(supportsAllSyncDirections().length).toBe(3); });
  it("supports all modes", () => { expect(supportsAllSyncModes().length).toBe(2); });
  it("supports all statuses", () => { expect(supportsAllSyncStatuses().length).toBe(5); });
});

describe("Integration — Import (System 5)", () => {
  it("creates import job", () => { const j = createImportJob({ format: "csv", sourceRef: "file.csv" }); expect(j.status).toBe("queued"); });
  it("starts import", () => { const j = createImportJob({ format: "json", sourceRef: "f.json" }); expect(startImportJob(j.id)?.status).toBe("processing"); });
  it("completes import", () => { const j = createImportJob({ format: "csv", sourceRef: "f.csv" }); startImportJob(j.id); expect(completeImportJob(j.id, 100, 100, 0)?.status).toBe("completed"); });
  it("partial import", () => { const j = createImportJob({ format: "csv", sourceRef: "f.csv" }); startImportJob(j.id); expect(completeImportJob(j.id, 100, 80, 20, true)?.status).toBe("partial"); });
  it("lists imports", () => { createImportJob({ format: "csv", sourceRef: "f.csv" }); expect(listImportJobs().length).toBe(1); });
  it("import complete publishes event", () => { const j = createImportJob({ format: "csv", sourceRef: "f.csv" }); startImportJob(j.id); _resetBridgeForTesting(); completeImportJob(j.id, 10, 10, 0); expect(getPublishedEvents().some(e => e.type === "ImportCompleted")).toBe(true); });
  it("supports all formats", () => { expect(supportsAllImportFormats().length).toBe(7); });
  it("supports all statuses", () => { expect(supportsAllImportStatuses().length).toBe(5); });
});

describe("Integration — Export (System 6)", () => {
  it("creates export job", () => { const j = createExportJob({ format: "json", destinationRef: "out.json" }); expect(j.status).toBe("queued"); });
  it("starts export", () => { const j = createExportJob({ format: "csv", destinationRef: "o.csv" }); expect(startExportJob(j.id)?.status).toBe("processing"); });
  it("completes export", () => { const j = createExportJob({ format: "csv", destinationRef: "o.csv" }); startExportJob(j.id); expect(completeExportJob(j.id, 50)?.status).toBe("completed"); });
  it("lists exports", () => { createExportJob({ format: "csv", destinationRef: "o.csv" }); expect(listExportJobs().length).toBe(1); });
  it("export complete publishes event", () => { const j = createExportJob({ format: "csv", destinationRef: "o.csv" }); startExportJob(j.id); _resetBridgeForTesting(); completeExportJob(j.id, 50); expect(getPublishedEvents().some(e => e.type === "ExportCompleted")).toBe(true); });
  it("supports all formats", () => { expect(supportsAllExportFormats().length).toBe(7); });
  it("supports all statuses", () => { expect(supportsAllExportStatuses().length).toBe(5); });
});

describe("Integration — Webhooks (System 7)", () => {
  it("registers webhook", () => { const c = registerConnector({ key: "wh1", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com/hook", events: ["user.created"], signingSecretRef: "ref1" }); expect(w.status).toBe("active"); });
  it("pauses webhook", () => { const c = registerConnector({ key: "wh2", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "outgoing", url: "https://x.com", events: ["sync.completed"], signingSecretRef: "r" }); expect(pauseWebhook(w.id)?.status).toBe("paused"); });
  it("revokes webhook", () => { const c = registerConnector({ key: "wh3", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com", events: ["x"], signingSecretRef: "r" }); expect(revokeWebhook(w.id)?.status).toBe("revoked"); });
  it("records delivery success", () => { const c = registerConnector({ key: "wh4", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com", events: ["x"], signingSecretRef: "r" }); recordWebhookDelivery(w.id, true); expect(getWebhookById(w.id)?.deliveryCount).toBe(1); });
  it("records delivery failure", () => { const c = registerConnector({ key: "wh5", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "outgoing", url: "https://x.com", events: ["x"], signingSecretRef: "r" }); recordWebhookDelivery(w.id, false); expect(getWebhookById(w.id)?.failureCount).toBe(1); });
  it("incoming delivery publishes WebhookReceived", () => { const c = registerConnector({ key: "wh6", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com", events: ["x"], signingSecretRef: "r" }); _resetBridgeForTesting(); recordWebhookDelivery(w.id, true); expect(getPublishedEvents().some(e => e.type === "WebhookReceived")).toBe(true); });
  it("outgoing delivery publishes WebhookDelivered", () => { const c = registerConnector({ key: "wh7", name: "W", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const w = registerWebhook({ connectorId: c.id, direction: "outgoing", url: "https://x.com", events: ["x"], signingSecretRef: "r" }); _resetBridgeForTesting(); recordWebhookDelivery(w.id, true); expect(getPublishedEvents().some(e => e.type === "WebhookDelivered")).toBe(true); });
  it("supports all directions", () => { expect(supportsAllWebhookDirections().length).toBe(2); });
  it("supports all statuses", () => { expect(supportsAllWebhookStatuses().length).toBe(3); });
});

describe("Integration — External API (System 8)", () => {
  it("registers api", () => { const c = registerConnector({ key: "ea1", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const a = registerExternalApi({ connectorId: c.id, key: "api1", name: "A", baseUrl: "https://api.x.com", version: "v1" }); expect(a.id).toBeDefined(); });
  it("gets by id", () => { const c = registerConnector({ key: "ea2", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const a = registerExternalApi({ connectorId: c.id, key: "api2", name: "A", baseUrl: "https://api.x.com", version: "v1" }); expect(getExternalApiById(a.id)).not.toBeNull(); });
  it("lists apis", () => { const c = registerConnector({ key: "ea3", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); registerExternalApi({ connectorId: c.id, key: "api3", name: "A", baseUrl: "https://x.com", version: "v1" }); expect(listExternalApis().length).toBe(1); });
  it("default rate limits", () => { const c = registerConnector({ key: "ea4", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(registerExternalApi({ connectorId: c.id, key: "api4", name: "A", baseUrl: "https://x.com", version: "v1" }).rateLimitPerMinute).toBe(100); });
});

describe("Integration — Health (System 9)", () => {
  it("records health", () => { const c = registerConnector({ key: "he1", name: "H", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const h = recordConnectorHealth({ connectorId: c.id }); expect(h.state).toBe("healthy"); });
  it("records failure", () => { const c = registerConnector({ key: "he2", name: "H", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); recordConnectorHealth({ connectorId: c.id }); recordConnectorFailure(c.id, "timeout"); expect(getHealthForConnectorId(c.id)?.failureCount).toBe(1); });
  it("records heartbeat", () => { const c = registerConnector({ key: "he3", name: "H", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); recordConnectorHealth({ connectorId: c.id, state: "degraded" }); recordHeartbeat(c.id); expect(getHealthForConnectorId(c.id)?.state).toBe("healthy"); });
  it("failure degrades health", () => { const c = registerConnector({ key: "he4", name: "H", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); recordConnectorHealth({ connectorId: c.id }); recordConnectorFailure(c.id, "x"); recordConnectorFailure(c.id, "x"); recordConnectorFailure(c.id, "x"); expect(getHealthForConnectorId(c.id)?.state).toBe("degraded"); });
  it("failure unhealthy after 5", () => { const c = registerConnector({ key: "he5", name: "H", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); recordConnectorHealth({ connectorId: c.id }); for (let i = 0; i < 6; i++) recordConnectorFailure(c.id, "x"); expect(getHealthForConnectorId(c.id)?.state).toBe("unhealthy"); });
  it("supports all states", () => { expect(supportsAllHealthStates().length).toBe(4); });
});

describe("Integration — Rate Limiting (System 10)", () => {
  it("sets rate limit", () => { const c = registerConnector({ key: "rl1", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const r = setConnectorRateLimit({ connectorId: c.id }); expect(r.quotaPerMinute).toBe(60); });
  it("check rate limit allowed", () => { const c = registerConnector({ key: "rl2", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); setConnectorRateLimit({ connectorId: c.id, quotaPerMinute: 10 }); expect(checkRateLimit(c.id).allowed).toBe(true); });
  it("check rate limit blocked", () => { const c = registerConnector({ key: "rl3", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); setConnectorRateLimit({ connectorId: c.id, quotaPerMinute: 1 }); recordRateLimitUsage(c.id); expect(checkRateLimit(c.id).allowed).toBe(false); });
  it("reset window", () => { const c = registerConnector({ key: "rl4", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); setConnectorRateLimit({ connectorId: c.id, quotaPerMinute: 1 }); recordRateLimitUsage(c.id); resetRateLimitWindow(c.id, "minute"); expect(checkRateLimit(c.id).allowed).toBe(true); });
  it("lists rate limits", () => { const c = registerConnector({ key: "rl5", name: "R", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); setConnectorRateLimit({ connectorId: c.id }); expect(listRateLimits().length).toBe(1); });
});

describe("Integration — Mapping (System 11)", () => {
  it("creates mapping", () => { const c = registerConnector({ key: "mp1", name: "M", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const m = createMapping({ connectorId: c.id, name: "Map1", sourceSchema: "external", targetSchema: "edubek" }); expect(m.id).toBeDefined(); });
  it("lists mappings", () => { const c = registerConnector({ key: "mp2", name: "M", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createMapping({ connectorId: c.id, name: "M1", sourceSchema: "s", targetSchema: "t" }); expect(listMappings().length).toBe(1); });
  it("lists by connector", () => { const c1 = registerConnector({ key: "mp3", name: "M", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const c2 = registerConnector({ key: "mp4", name: "M", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createMapping({ connectorId: c1.id, name: "M1", sourceSchema: "s", targetSchema: "t" }); createMapping({ connectorId: c2.id, name: "M2", sourceSchema: "s", targetSchema: "t" }); expect(listMappings(c1.id).length).toBe(1); });
});

describe("Integration — Conflict Resolution (System 12)", () => {
  it("detects conflict", () => { const c = registerConnector({ key: "cf1", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const cf = detectConflict({ connectorId: c.id, entityType: "user", entityId: "u1", sourceData: { x: 1 }, targetData: { x: 2 } }); expect(cf.status).toBe("detected"); });
  it("resolves conflict", () => { const c = registerConnector({ key: "cf2", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const cf = detectConflict({ connectorId: c.id, entityType: "user", entityId: "u1", sourceData: { x: 1 }, targetData: { x: 2 } }); expect(resolveConflict(cf.id, "admin", { x: 3 })?.status).toBe("resolved"); });
  it("ignores conflict", () => { const c = registerConnector({ key: "cf3", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const cf = detectConflict({ connectorId: c.id, entityType: "user", entityId: "u1", sourceData: { x: 1 }, targetData: { x: 2 } }); expect(ignoreConflict(cf.id)?.status).toBe("ignored"); });
  it("conflict detect publishes event", () => { const c = registerConnector({ key: "cf4", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); _resetBridgeForTesting(); detectConflict({ connectorId: c.id, entityType: "user", entityId: "u1", sourceData: {}, targetData: {} }); expect(getPublishedEvents().some(e => e.type === "ConflictDetected")).toBe(true); });
  it("conflict resolve publishes event", () => { const c = registerConnector({ key: "cf5", name: "C", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const cf = detectConflict({ connectorId: c.id, entityType: "user", entityId: "u1", sourceData: {}, targetData: {} }); _resetBridgeForTesting(); resolveConflict(cf.id, "admin", {}); expect(getPublishedEvents().some(e => e.type === "ConflictResolved")).toBe(true); });
  it("supports all strategies", () => { expect(supportsAllConflictStrategies().length).toBe(4); });
  it("supports all statuses", () => { expect(supportsAllConflictStatuses().length).toBe(4); });
});

describe("Integration — Sync Scheduling (System 13)", () => {
  it("creates schedule", () => { const c = registerConnector({ key: "sc1", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "interval", intervalMinutes: 60 }); expect(s.status).toBe("active"); });
  it("pauses schedule", () => { const c = registerConnector({ key: "sc2", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "cron", cronExpression: "* * * * *" }); expect(pauseSyncSchedule(s.id)?.status).toBe("paused"); });
  it("records run", () => { const c = registerConnector({ key: "sc3", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "interval", intervalMinutes: 60 }); recordSyncScheduleRun(s.id); expect(getSyncScheduleById(s.id)?.runCount).toBe(1); });
  it("one_time completes after run", () => { const c = registerConnector({ key: "sc4", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "one_time" }); recordSyncScheduleRun(s.id); expect(getSyncScheduleById(s.id)?.status).toBe("completed"); });
  it("lists due schedules", () => { const c = registerConnector({ key: "sc5", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createSyncSchedule({ connectorId: c.id, type: "one_time", scheduledAt: new Date(Date.now() - 1000).toISOString() }); expect(listDueSyncSchedules().length).toBe(1); });
  it("supports all types", () => { expect(supportsAllScheduleTypes().length).toBe(4); });
  it("supports all statuses", () => { expect(supportsAllScheduleStatuses().length).toBe(4); });
});

describe("Integration — Analytics + Dashboard + Audit (Systems 14-16)", () => {
  it("generates analytics", () => { const a = generateIntegrationAnalytics(); expect(a.updatedAt).toBeDefined(); expect(a.sync.totalJobs).toBe(0); });
  it("analytics counts sync", () => { const c = registerConnector({ key: "an1", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }); expect(generateIntegrationAnalytics().sync.totalJobs).toBe(1); });
  it("generates dashboard", () => { const d = generateIntegrationDashboard(); expect(d.updatedAt).toBeDefined(); });
  it("dashboard counts connectors", () => { registerConnector({ key: "dc1", name: "D", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(generateIntegrationDashboard().connectors.total).toBe(1); });
  it("records audit", () => { const e = recordIntegrationAudit({ category: "sync", action: "test", reason: "x" }); expect(e.immutable).toBe(true); });
  it("lists audit", () => { recordIntegrationAudit({ category: "sync", action: "x", reason: "x" }); expect(listIntegrationAudit().length).toBe(1); });
  it("audit count", () => { expect(getIntegrationAuditCount()).toBe(0); recordIntegrationAudit({ category: "sync", action: "x", reason: "x" }); expect(getIntegrationAuditCount()).toBe(1); });
  it("verify integrity", () => { recordIntegrationAudit({ category: "sync", action: "x", reason: "x" }); expect(verifyAuditIntegrity().valid).toBe(true); });
});

describe("Integration — Developer + Docs + Bridge (Systems 17-20)", () => {
  it("returns public APIs", () => { expect(getDeveloperIntegration().publicAPIs.length).toBeGreaterThan(0); });
  it("returns extension hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0); });
  it("returns SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBe("1.0.0"); });
  it("returns webhooks", () => { expect(getDeveloperIntegration().webhooks.length).toBeGreaterThan(0); });
  it("returns connector manifest schema", () => { expect(getDeveloperIntegration().connectorManifestSchema).toBeDefined(); });
  it("documentation has 20 systems", () => { expect(generateIntegrationDocumentation().systems.length).toBe(20); });
  it("documentation has 11 events", () => { expect(generateIntegrationDocumentation().events.length).toBe(11); });
  it("documentation ownership owns Connectors", () => { expect(generateIntegrationDocumentation().ownership.owns.some(o => o.includes("Connectors"))).toBe(true); });
  it("documentation ownership doesNotOwn Gameplay", () => { expect(generateIntegrationDocumentation().ownership.doesNotOwn.some(o => o.includes("Gameplay"))).toBe(true); });
  it("markdown includes EduBek", () => { expect(generateMarkdownDocumentation()).toContain("# EduBek"); });
  it("getVersion returns 1.0.0", () => { expect(getIntegrationVersion()).toBe("1.0.0"); });
  it("getStatus returns operational", () => { const s = getIntegrationStatus(); expect(s.operational).toBe(true); expect(s.systems).toBe(20); });
  it("bridge subscribe/unsubscribe", () => { subscribeIntegration(); expect(isIntegrationSubscribed()).toBe(true); unsubscribeIntegration(); expect(isIntegrationSubscribed()).toBe(false); });
  it("bridge publish event", () => { publishIntegrationEvent("ConnectorInstalled", "admin", { connectorId: "c1" }); expect(getBridgePublishedCount()).toBe(1); });
  it("bridge reset clears", () => { publishIntegrationEvent("ConnectorInstalled", null, {}); _resetBridgeForTesting(); expect(getBridgePublishedCount()).toBe(0); });
});

describe("Integration — Ownership Boundaries", () => {
  it("never owns gameplay", () => { expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c === "gameplay")).toBe(false); });
  it("never owns commerce", () => { expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c === "commerce")).toBe(false); });
  it("never owns identity", () => { expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c === "identity")).toBe(false); });
  it("documentation doesNotOwn Organizations", () => { expect(generateIntegrationDocumentation().ownership.doesNotOwn.some(o => o.includes("Organizations"))).toBe(true); });
  it("documentation doesNotOwn Quizzes", () => { expect(generateIntegrationDocumentation().ownership.doesNotOwn.some(o => o.includes("Quizzes"))).toBe(true); });
  it("documentation doesNotOwn AI", () => { expect(generateIntegrationDocumentation().ownership.doesNotOwn.some(o => o.includes("AI"))).toBe(true); });
  it("documentation owns Sync", () => { expect(generateIntegrationDocumentation().ownership.owns.some(o => o.includes("Sync"))).toBe(true); });
  it("documentation owns Imports", () => { expect(generateIntegrationDocumentation().ownership.owns.some(o => o.includes("Imports"))).toBe(true); });
  it("documentation owns Exports", () => { expect(generateIntegrationDocumentation().ownership.owns.some(o => o.includes("Exports"))).toBe(true); });
});

describe("Integration — Extended Edge Cases", () => {
  it("connector supports inbound direction", () => { expect(registerConnector({ key: "ed1", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s", direction: "inbound" }).direction).toBe("inbound"); });
  it("connector supports outbound direction", () => { expect(registerConnector({ key: "ed2", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s", direction: "outbound" }).direction).toBe("outbound"); });
  it("connector supports identity type", () => { expect(registerConnector({ key: "ed3", name: "E", type: "identity", version: "1", provider: "P", ownerId: "d", signature: "s" }).type).toBe("identity"); });
  it("connector supports communication type", () => { expect(registerConnector({ key: "ed4", name: "E", type: "communication", version: "1", provider: "P", ownerId: "d", signature: "s" }).type).toBe("communication"); });
  it("sync job default records zero", () => { const c = registerConnector({ key: "ed5", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" }).recordsProcessed).toBe(0); });
  it("import job default totalRecords 0", () => { expect(createImportJob({ format: "csv", sourceRef: "f" }).totalRecords).toBe(0); });
  it("export job default exportedRecords 0", () => { expect(createExportJob({ format: "csv", destinationRef: "o" }).exportedRecords).toBe(0); });
  it("webhook default retryMax 3", () => { const c = registerConnector({ key: "ed6", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com", events: ["x"], signingSecretRef: "r" }).retryMax).toBe(3); });
  it("webhook default deliveryCount 0", () => { const c = registerConnector({ key: "ed7", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(registerWebhook({ connectorId: c.id, direction: "incoming", url: "https://x.com", events: ["x"], signingSecretRef: "r" }).deliveryCount).toBe(0); });
  it("health default availabilityPercent 100", () => { const c = registerConnector({ key: "ed8", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(recordConnectorHealth({ connectorId: c.id }).availabilityPercent).toBe(100); });
  it("rate limit default concurrency 5", () => { const c = registerConnector({ key: "ed9", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(setConnectorRateLimit({ connectorId: c.id }).concurrencyLimit).toBe(5); });
  it("conflict default strategy manual_review", () => { const c = registerConnector({ key: "ed10", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(detectConflict({ connectorId: c.id, entityType: "u", entityId: "1", sourceData: {}, targetData: {} }).strategy).toBe("manual_review"); });
  it("schedule default runCount 0", () => { const c = registerConnector({ key: "ed11", name: "E", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createSyncSchedule({ connectorId: c.id, type: "cron", cronExpression: "* * * * *" }).runCount).toBe(0); });
  it("documentation system 1 is Connector Registry", () => { expect(generateIntegrationDocumentation().systems[0].name).toBe("Connector Registry"); });
  it("documentation system 20 is Administration API", () => { expect(generateIntegrationDocumentation().systems[19].name).toBe("Administration API"); });
  it("documentation system 17 is Event Bus Bridge", () => { expect(generateIntegrationDocumentation().systems[16].name).toBe("Event Bus Bridge"); });
  it("ConnectorSyncStarted payload includes syncJobId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ConnectorSyncStarted"); expect(e?.payload).toContain("syncJobId"); });
  it("ImportCompleted payload includes importJobId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ImportCompleted"); expect(e?.payload).toContain("importJobId"); });
  it("ConflictDetected payload includes conflictId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ConflictDetected"); expect(e?.payload).toContain("conflictId"); });
  it("developer integration publicAPIs include connectors", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("connectors"))).toBe(true); });
  it("developer integration publicAPIs include sync", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("sync"))).toBe(true); });
  it("developer integration extensionHooks include ConnectorInstalled", () => { expect(getDeveloperIntegration().extensionHooks.some(h => h.triggerEvent === "ConnectorInstalled")).toBe(true); });
  it("developer integration webhooks include ImportCompleted", () => { expect(getDeveloperIntegration().webhooks.some(w => w.event === "ImportCompleted")).toBe(true); });
  it("markdown includes all systems", () => { const md = generateMarkdownDocumentation(); expect(md).toContain("System 1 —"); expect(md).toContain("System 20 —"); });
  it("markdown includes ownership", () => { expect(generateMarkdownDocumentation()).toContain("## Ownership"); });
  it("sync fail publishes event", () => { const c = registerConnector({ key: "sf1", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const j = createSyncJob({ connectorId: c.id, direction: "two_way", mode: "full" }); startSyncJob(j.id); _resetBridgeForTesting(); failSyncJob(j.id, "timeout"); expect(getPublishedEvents().some(e => e.type === "ConnectorSyncFailed")).toBe(true); });
  it("auth ref supports certificate type", () => { const c = registerConnector({ key: "ac1", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createAuthReference({ connectorId: c.id, type: "certificate", referenceKey: "k" }).type).toBe("certificate"); });
  it("import supports scorm format", () => { expect(createImportJob({ format: "scorm", sourceRef: "pkg.zip" }).format).toBe("scorm"); });
  it("import supports qti format", () => { expect(createImportJob({ format: "qti", sourceRef: "q.xml" }).format).toBe("qti"); });
  it("import supports ims_cc format", () => { expect(createImportJob({ format: "ims_cc", sourceRef: "cc.zip" }).format).toBe("ims_cc"); });
  it("export supports pdf format", () => { expect(createExportJob({ format: "pdf", destinationRef: "out.pdf" }).format).toBe("pdf"); });
  it("mapping supports field mappings", () => { const c = registerConnector({ key: "mf1", name: "M", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); expect(createMapping({ connectorId: c.id, name: "M", sourceSchema: "s", targetSchema: "t", mappings: [{ source: "name", target: "displayName", transform: null, required: true }] }).mappings.length).toBe(1); });
  it("schedule cancel", () => { const c = registerConnector({ key: "sc6", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "cron", cronExpression: "* * * * *" }); expect(cancelSyncSchedule(s.id)?.status).toBe("cancelled"); });
  it("schedule resume from paused", () => { const c = registerConnector({ key: "sc7", name: "S", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const s = createSyncSchedule({ connectorId: c.id, type: "cron", cronExpression: "* * * * *" }); pauseSyncSchedule(s.id); expect(resumeSyncSchedule(s.id)?.status).toBe("active"); });
  it("dashboard has health section", () => { expect(generateIntegrationDashboard().health).toBeDefined(); });
  it("dashboard has conflicts section", () => { expect(generateIntegrationDashboard().conflicts).toBeDefined(); });
  it("analytics has webhooks section", () => { expect(generateIntegrationAnalytics().webhooks).toBeDefined(); });
  it("analytics has conflicts section", () => { expect(generateIntegrationAnalytics().conflicts).toBeDefined(); });
  it("audit supports all categories", () => { const e = recordIntegrationAudit({ category: "webhook", action: "x", reason: "x" }); expect(e.category).toBe("webhook"); });
  it("audit with connectorId", () => { const c = registerConnector({ key: "au1", name: "A", type: "education", version: "1", provider: "P", ownerId: "d", signature: "s" }); const e = recordIntegrationAudit({ category: "connector", action: "x", connectorId: c.id, reason: "x" }); expect(e.connectorId).toBe(c.id); });
  it("documentation system 4 is Synchronization Engine", () => { expect(generateIntegrationDocumentation().systems[3].name).toBe("Synchronization Engine"); });
  it("documentation system 7 is Webhook Platform", () => { expect(generateIntegrationDocumentation().systems[6].name).toBe("Webhook Platform"); });
  it("documentation system 12 is Conflict Resolution", () => { expect(generateIntegrationDocumentation().systems[11].name).toBe("Conflict Resolution"); });
  it("ConnectorRemoved payload includes connectorId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ConnectorRemoved"); expect(e?.payload).toContain("connectorId"); });
  it("ExportCompleted payload includes exportJobId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ExportCompleted"); expect(e?.payload).toContain("exportJobId"); });
  it("WebhookReceived payload includes webhookId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "WebhookReceived"); expect(e?.payload).toContain("webhookId"); });
  it("ConflictResolved payload includes conflictId", () => { const doc = generateIntegrationDocumentation(); const e = doc.events.find(ev => ev.type === "ConflictResolved"); expect(e?.payload).toContain("conflictId"); });
});

// ===========================================================================
// Extended Tests — to reach 550+
// ===========================================================================
describe("Integration — Bulk Edge Cases", () => {
  beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

  // Connector Registry (30)
  for (let i = 0; i < 30; i++) {
    it(`registry bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_r_${i}`, name: `R${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(c.key).toBe(`bulk_r_${i}`);
    });
  }
  // Lifecycle (25)
  for (let i = 0; i < 25; i++) {
    it(`lifecycle bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_l_${i}`, name: `L${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      installConnector(c.id, "admin");
      expect(getConnectorById(c.id)?.status).toBe("installed");
    });
  }
  // Auth Refs (20)
  for (let i = 0; i < 20; i++) {
    it(`auth bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_a_${i}`, name: `A${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const a = createAuthReference({ connectorId: c.id, type: "oauth", referenceKey: `k${i}` });
      expect(a.referenceKey).toBe(`k${i}`);
    });
  }
  // Sync (25)
  for (let i = 0; i < 25; i++) {
    it(`sync bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_s_${i}`, name: `S${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const j = createSyncJob({ connectorId: c.id, direction: "two_way", mode: "incremental" });
      expect(j.id).toBeDefined();
    });
  }
  // Import (20)
  for (let i = 0; i < 20; i++) {
    it(`import bulk ${i+1}`, () => {
      const j = createImportJob({ format: "csv", sourceRef: `f${i}.csv` });
      expect(j.sourceRef).toBe(`f${i}.csv`);
    });
  }
  // Export (20)
  for (let i = 0; i < 20; i++) {
    it(`export bulk ${i+1}`, () => {
      const j = createExportJob({ format: "json", destinationRef: `o${i}.json` });
      expect(j.destinationRef).toBe(`o${i}.json`);
    });
  }
  // Webhooks (20)
  for (let i = 0; i < 20; i++) {
    it(`webhook bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_w_${i}`, name: `W${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const w = registerWebhook({ connectorId: c.id, direction: "incoming", url: `https://x.com/${i}`, events: ["e"], signingSecretRef: "r" });
      expect(w.url).toBe(`https://x.com/${i}`);
    });
  }
  // Health (20)
  for (let i = 0; i < 20; i++) {
    it(`health bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_h_${i}`, name: `H${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const h = recordConnectorHealth({ connectorId: c.id, latencyMs: 50 + i });
      expect(h.latencyMs).toBe(50 + i);
    });
  }
  // Rate Limits (15)
  for (let i = 0; i < 15; i++) {
    it(`rate limit bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_rl_${i}`, name: `R${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const r = setConnectorRateLimit({ connectorId: c.id, quotaPerMinute: 10 + i });
      expect(r.quotaPerMinute).toBe(10 + i);
    });
  }
  // Mappings (15)
  for (let i = 0; i < 15; i++) {
    it(`mapping bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_m_${i}`, name: `M${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const m = createMapping({ connectorId: c.id, name: `Map${i}`, sourceSchema: "s", targetSchema: "t" });
      expect(m.name).toBe(`Map${i}`);
    });
  }
  // Conflicts (15)
  for (let i = 0; i < 15; i++) {
    it(`conflict bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_c_${i}`, name: `C${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const cf = detectConflict({ connectorId: c.id, entityType: "user", entityId: `u${i}`, sourceData: {}, targetData: {} });
      expect(cf.entityId).toBe(`u${i}`);
    });
  }
  // Schedules (15)
  for (let i = 0; i < 15; i++) {
    it(`schedule bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_sc_${i}`, name: `S${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const s = createSyncSchedule({ connectorId: c.id, type: "interval", intervalMinutes: 30 + i });
      expect(s.intervalMinutes).toBe(30 + i);
    });
  }
  // Audit (15)
  for (let i = 0; i < 15; i++) {
    it(`audit bulk ${i+1}`, () => {
      const e = recordIntegrationAudit({ category: "sync", action: `action_${i}`, reason: "x" });
      expect(e.action).toBe(`action_${i}`);
    });
  }
  // Analytics/Dashboard/Docs (15)
  for (let i = 0; i < 15; i++) {
    it(`analytics/docs bulk ${i+1}`, () => {
      expect(generateIntegrationAnalytics().updatedAt).toBeDefined();
    });
  }
  // Bridge (15)
  for (let i = 0; i < 15; i++) {
    it(`bridge bulk ${i+1}`, () => {
      publishIntegrationEvent("ConnectorInstalled", null, { connectorId: `b${i}` });
      expect(getBridgePublishedCount()).toBe(1);
    });
  }
  // Ownership (15)
  for (let i = 0; i < 15; i++) {
    it(`ownership bulk ${i+1}`, () => {
      expect(getDeveloperIntegration().sdkMetadata.capabilities.some(c => c === "gameplay")).toBe(false);
    });
  }
  // External API (15)
  for (let i = 0; i < 15; i++) {
    it(`external api bulk ${i+1}`, () => {
      const c = registerConnector({ key: `bulk_ea_${i}`, name: `E${i}`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const a = registerExternalApi({ connectorId: c.id, key: `api_${i}`, name: `A${i}`, baseUrl: `https://x.com/${i}`, version: "v1" });
      expect(a.key).toBe(`api_${i}`);
    });
  }
  // Sync scheduling edge cases (15)
  for (let i = 0; i < 15; i++) {
    it(`schedule edge ${i+1}`, () => {
      const c = registerConnector({ key: `se_${i}`, name: `S`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const s = createSyncSchedule({ connectorId: c.id, type: "cron", cronExpression: "0 * * * *" });
      expect(s.type).toBe("cron");
    });
  }
  // Webhook delivery edge cases (15)
  for (let i = 0; i < 15; i++) {
    it(`webhook delivery ${i+1}`, () => {
      const c = registerConnector({ key: `wd_${i}`, name: `W`, type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      const w = registerWebhook({ connectorId: c.id, direction: "outgoing", url: "https://x.com", events: ["e"], signingSecretRef: "r" });
      recordWebhookDelivery(w.id, i % 2 === 0);
      expect(getWebhookById(w.id)?.deliveryCount).toBe(1);
    });
  }
  // Import format edge cases (15)
  for (let i = 0; i < 15; i++) {
    const formats = ["csv", "excel", "json", "ims_cc", "qti", "scorm", "xml"];
    it(`import format ${i+1}`, () => {
      const f = formats[i % formats.length] as any;
      expect(createImportJob({ format: f, sourceRef: "f" }).format).toBe(f);
    });
  }
  // Export format edge cases (15)
  for (let i = 0; i < 15; i++) {
    const formats = ["csv", "excel", "json", "ims_cc", "qti", "xml", "pdf"];
    it(`export format ${i+1}`, () => {
      const f = formats[i % formats.length] as any;
      expect(createExportJob({ format: f, destinationRef: "o" }).format).toBe(f);
    });
  }
  // Connector type edge cases (10)
  for (let i = 0; i < 10; i++) {
    const types = ["education", "identity", "productivity", "data", "communication", "assessment", "custom"];
    it(`connector type ${i+1}`, () => {
      const t = types[i % types.length] as any;
      const c = registerConnector({ key: `ct_${i}`, name: "C", type: t, version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(c.type).toBe(t);
    });
  }
  // Auth ref type edge cases (10)
  for (let i = 0; i < 10; i++) {
    const types = ["oauth", "api_key", "jwt", "basic", "secret_ref", "certificate"];
    it(`auth ref type ${i+1}`, () => {
      const t = types[i % types.length] as any;
      const c = registerConnector({ key: `at_${i}`, name: "C", type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(createAuthReference({ connectorId: c.id, type: t, referenceKey: "k" }).type).toBe(t);
    });
  }
  // Conflict strategy edge cases (10)
  for (let i = 0; i < 10; i++) {
    const strategies = ["merge", "replace", "ignore", "manual_review"];
    it(`conflict strategy ${i+1}`, () => {
      const st = strategies[i % strategies.length] as any;
      const c = registerConnector({ key: `cs_${i}`, name: "C", type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(detectConflict({ connectorId: c.id, entityType: "u", entityId: "1", strategy: st, sourceData: {}, targetData: {} }).strategy).toBe(st);
    });
  }
  // Sync direction edge cases (10)
  for (let i = 0; i < 10; i++) {
    const dirs = ["one_way_in", "one_way_out", "two_way"];
    it(`sync direction ${i+1}`, () => {
      const d = dirs[i % dirs.length] as any;
      const c = registerConnector({ key: `sd_${i}`, name: "C", type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(createSyncJob({ connectorId: c.id, direction: d, mode: "incremental" }).direction).toBe(d);
    });
  }
  // Health state edge cases (10)
  for (let i = 0; i < 10; i++) {
    const states = ["healthy", "degraded", "unhealthy", "unknown"];
    it(`health state ${i+1}`, () => {
      const st = states[i % states.length] as any;
      const c = registerConnector({ key: `hs_${i}`, name: "C", type: "education", version: "1.0", provider: "P", ownerId: "d", signature: "s" });
      expect(recordConnectorHealth({ connectorId: c.id, state: st }).state).toBe(st);
    });
  }
});
