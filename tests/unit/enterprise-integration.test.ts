/** EduBek — Phase 5B.1 Enterprise Integration tests. */
import { describe, it, expect } from "vitest";
import {
  listConnectors, getConnector,
  createIntegration, getIntegration, listIntegrations, updateIntegrationStatus, checkIntegrationHealth,
  runSync, getSyncLogs,
  createWebhookEndpoint, listWebhookEndpoints, deleteWebhookEndpoint, listWebhookDeliveries,
  createApiKey, listApiKeys, revokeApiKey, validateApiKey,
  createOAuthClient, listOAuthClients,
  registerAiProvider, listAiProviders, toggleAiProvider,
  createImportExportJob, getImportExportJob, listImportExportJobs, processImportExportJob,
  publishMarketplaceApp, listMarketplaceApps, approveMarketplaceApp,
  createTenant, getTenant, listTenants,
  createEventSubscription, listEventSubscriptions, publishEvent,
} from "@/features/enterprise-integration";

const TEST_USER = `test-5b1-${Date.now()}`;

// ---------------------------------------------------------------------------
// Connector Framework
// ---------------------------------------------------------------------------

describe("Connector Framework", () => {
  it("lists all available connectors", () => {
    const connectors = listConnectors();
    expect(connectors.length).toBeGreaterThanOrEqual(18);
    const types = connectors.map((c) => c.type);
    expect(types).toContain("google_classroom");
    expect(types).toContain("moodle");
    expect(types).toContain("canvas");
    expect(types).toContain("microsoft_teams");
    expect(types).toContain("zoom");
    expect(types).toContain("saml");
    expect(types).toContain("scim");
  });

  it("retrieves a specific connector definition", () => {
    const connector = getConnector("google_classroom");
    expect(connector).toBeTruthy();
    expect(connector!.name).toBe("Google Classroom");
    expect(connector!.supportsWebhooks).toBe(true);
    expect(connector!.supportedEntities.length).toBeGreaterThan(0);
  });

  it("returns null for unknown connector", () => {
    expect(getConnector("nonexistent" as any)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration Management
// ---------------------------------------------------------------------------

describe("Integration Management", () => {
  it("creates + retrieves + lists + updates an integration", async () => {
    const integration = await createIntegration({
      type: "google_classroom",
      name: `Test Integration ${Date.now()}`,
      organizationId: "test-org",
      syncEntities: ["students", "teachers"],
      syncSchedule: "daily",
    });
    expect(integration.id).toBeTruthy();
    expect(integration.status).toBe("pending");
    expect(integration.syncEntities).toEqual(["students", "teachers"]);

    const retrieved = await getIntegration(integration.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.id).toBe(integration.id);

    const list = await listIntegrations({ organizationId: "test-org" });
    expect(list.length).toBeGreaterThan(0);

    const updated = await updateIntegrationStatus(integration.id, "connected");
    expect(updated.status).toBe("connected");
  });

  it("checks integration health", async () => {
    const integration = await createIntegration({
      type: "moodle",
      name: `Health Test ${Date.now()}`,
    });
    const health = await checkIntegrationHealth(integration.id);
    expect(health.status).toBeTruthy();
    expect(health.score).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Data Synchronization
// ---------------------------------------------------------------------------

describe("Data Synchronization", () => {
  it("runs a sync and returns results", async () => {
    const integration = await createIntegration({
      type: "canvas",
      name: `Sync Test ${Date.now()}`,
      syncEntities: ["students", "teachers", "classrooms"],
    });
    await updateIntegrationStatus(integration.id, "connected");

    const result = await runSync({ integrationId: integration.id, syncType: "full" });
    expect(result.integrationId).toBe(integration.id);
    expect(result.syncType).toBe("full");
    expect(result.entities.length).toBeGreaterThan(0);
    expect(result.totalProcessed).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(["success", "partial", "failed"]).toContain(result.status);
  });

  it("lists sync logs", async () => {
    const logs = await getSyncLogs({ limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Webhook Platform
// ---------------------------------------------------------------------------

describe("Webhook Platform", () => {
  it("creates + lists + deletes a webhook endpoint", async () => {
    const endpoint = await createWebhookEndpoint({
      ownerId: TEST_USER,
      url: "https://example.com/webhook",
      events: ["quiz.completed", "assignment.submitted"],
    });
    expect(endpoint.id).toBeTruthy();
    expect(endpoint.url).toBe("https://example.com/webhook");
    expect(endpoint.events).toEqual(["quiz.completed", "assignment.submitted"]);
    expect(endpoint.status).toBe("active");

    const list = await listWebhookEndpoints({ ownerId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);

    await deleteWebhookEndpoint(endpoint.id);
    const listAfter = await listWebhookEndpoints({ ownerId: TEST_USER });
    expect(listAfter.find((e) => e.id === endpoint.id)).toBeUndefined();
  });

  it("lists webhook deliveries", async () => {
    const deliveries = await listWebhookDeliveries({ limit: 10 });
    expect(Array.isArray(deliveries)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API Gateway — API Keys
// ---------------------------------------------------------------------------

describe("API Gateway — API Keys", () => {
  it("creates an API key with plainKey + revokes it", async () => {
    const key = await createApiKey({
      ownerId: TEST_USER,
      name: `Test Key ${Date.now()}`,
      scopes: ["read:resources", "write:grades"],
      rateLimitPerMin: 200,
    });
    expect(key.id).toBeTruthy();
    expect(key.plainKey).toBeTruthy();
    expect(key.plainKey!.startsWith("ek_")).toBe(true);
    expect(key.scopes).toEqual(["read:resources", "write:grades"]);
    expect(key.rateLimitPerMin).toBe(200);

    // Validate the key
    const validation = await validateApiKey(key.plainKey!);
    expect(validation.valid).toBe(true);

    // Revoke
    await revokeApiKey(key.id);
    const validationAfter = await validateApiKey(key.plainKey!);
    expect(validationAfter.valid).toBe(false);
  });

  it("lists API keys", async () => {
    const keys = await listApiKeys({ ownerId: TEST_USER });
    expect(Array.isArray(keys)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API Gateway — OAuth Clients
// ---------------------------------------------------------------------------

describe("API Gateway — OAuth Clients", () => {
  it("creates an OAuth client with plainSecret", async () => {
    const client = await createOAuthClient({
      ownerId: TEST_USER,
      name: `Test OAuth Client ${Date.now()}`,
      redirectUris: ["https://example.com/callback"],
      scopes: ["read", "write"],
      grantTypes: ["authorization_code", "client_credentials"],
    });
    expect(client.id).toBeTruthy();
    expect(client.clientId).toBeTruthy();
    expect(client.plainSecret).toBeTruthy();
    expect(client.plainSecret!.length).toBeGreaterThan(20);
    expect(client.redirectUris).toEqual(["https://example.com/callback"]);

    const list = await listOAuthClients({ ownerId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// External AI Providers
// ---------------------------------------------------------------------------

describe("External AI Providers", () => {
  it("registers + lists + toggles an AI provider", async () => {
    const provider = await registerAiProvider({
      provider: "openai",
      name: `Test OpenAI ${Date.now()}`,
      apiEndpoint: "https://api.openai.com/v1",
      capabilities: ["chat", "embeddings"],
      models: [{ id: "gpt-4", name: "GPT-4", contextWindow: 8192, inputCostPer1k: 0.03, outputCostPer1k: 0.06 }],
      defaultModel: "gpt-4",
    });
    expect(provider.id).toBeTruthy();
    expect(provider.provider).toBe("openai");
    expect(provider.enabled).toBe(true);
    expect(provider.models.length).toBe(1);
    expect(provider.defaultModel).toBe("gpt-4");

    const list = await listAiProviders({ provider: "openai" });
    expect(list.length).toBeGreaterThan(0);

    const toggled = await toggleAiProvider(provider.id, false);
    expect(toggled.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Import/Export
// ---------------------------------------------------------------------------

describe("Import/Export", () => {
  it("creates + processes + retrieves an import job", async () => {
    const job = await createImportExportJob({
      direction: "import",
      format: "csv",
      entityType: "students",
      initiatedBy: TEST_USER,
      fileName: "students.csv",
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("pending");

    const processed = await processImportExportJob(job.id);
    expect(processed.status).toBe("completed");
    expect(processed.totalRecords).toBeGreaterThan(0);
    expect(processed.importedRecords).toBeGreaterThan(0);

    const retrieved = await getImportExportJob(job.id);
    expect(retrieved!.status).toBe("completed");

    const list = await listImportExportJobs({ initiatedBy: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Integration Marketplace
// ---------------------------------------------------------------------------

describe("Integration Marketplace", () => {
  it("publishes + lists + approves a marketplace app", async () => {
    const app = await publishMarketplaceApp({
      type: "ai_tool",
      name: `Test AI Tool ${Date.now()}`,
      developerId: TEST_USER,
      developerName: "Test Developer",
      pricingModel: "free",
      categories: ["ai", "math"],
    });
    expect(app.id).toBeTruthy();
    expect(app.status).toBe("submitted");

    const list = await listMarketplaceApps({ developerId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);

    const approved = await approveMarketplaceApp(app.id);
    expect(approved.status).toBe("published");
  });
});

// ---------------------------------------------------------------------------
// Multi-Tenant Management
// ---------------------------------------------------------------------------

describe("Multi-Tenant Management", () => {
  it("creates + retrieves + lists tenants", async () => {
    const tenant = await createTenant({
      type: "university",
      name: `Test University ${Date.now()}`,
      adminIds: [TEST_USER],
      delegatedAdmin: true,
      limits: { maxUsers: 10000, maxClassrooms: 500 },
    });
    expect(tenant.id).toBeTruthy();
    expect(tenant.type).toBe("university");
    expect(tenant.delegatedAdmin).toBe(true);
    expect(tenant.adminIds).toEqual([TEST_USER]);

    const retrieved = await getTenant(tenant.id);
    expect(retrieved).toBeTruthy();

    const list = await listTenants({ type: "university" });
    expect(list.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Event Subscriptions + Event Streaming
// ---------------------------------------------------------------------------

describe("Event Subscriptions + Streaming", () => {
  it("creates + lists event subscriptions", async () => {
    const sub = await createEventSubscription({
      ownerId: TEST_USER,
      eventTypes: ["quiz.completed", "certificate.issued"],
      deliveryMethod: "webhook",
      deliveryTarget: "https://example.com/events",
    });
    expect(sub.id).toBeTruthy();
    expect(sub.eventTypes).toEqual(["quiz.completed", "certificate.issued"]);
    expect(sub.status).toBe("active");

    const list = await listEventSubscriptions({ ownerId: TEST_USER });
    expect(list.length).toBeGreaterThan(0);
  });

  it("publishes an event without errors", async () => {
    await publishEvent("test.event", { message: "Hello from test" });
    // Should not throw
    expect(true).toBe(true);
  });
});
