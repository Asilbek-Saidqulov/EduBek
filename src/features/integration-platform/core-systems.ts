/** Systems 1-4: API Gateway, Integration Registry, Connector Framework, Webhook Platform. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { APIGatewayReport, IntegrationRegistryReport, IntegrationEntry, ConnectorFrameworkReport, ConnectorDefinition, ConnectorCategory, WebhookPlatformReport, WebhookEndpointInfo } from "./types";

const log = getLogger("integration-platform");

// System 1 — API Gateway
export async function generateAPIGatewayReport(): Promise<APIGatewayReport> {
  const apiDirs = ["auth", "resources", "classrooms", "assessments", "ai-workspace", "marketplace", "billing", "organizations", "orchestrator", "cognitive", "ai-quality", "ai-governance", "enterprise-operations"];
  const endpoints = apiDirs.flatMap(d => ["GET", "POST"].map(m => ({ path: `/api/${d}`, method: m, version: "v1", auth: m === "POST" ? "bearer+rbac" : "bearer", rateLimited: true })));
  log.info("api_gateway.report_complete", { endpoints: endpoints.length });
  return { generatedAt: new Date().toISOString(), endpoints, totalEndpoints: endpoints.length, versions: ["v1"], authenticationMethods: ["bearer", "api_key", "oauth2"], totalRequests24h: 0, avgLatencyMs: 0, errorRate: 0 };
}

// System 2 — Integration Registry
export async function generateIntegrationRegistry(): Promise<IntegrationRegistryReport> {
  const integrations = await repo.fetchIntegrations(200);
  const entries: IntegrationEntry[] = integrations.map(i => ({
    id: i.id, type: i.type, name: i.name, description: i.description,
    organizationId: i.organizationId, status: i.status, healthStatus: i.healthStatus,
    config: repo.safeParse(i.config, {}), lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
    syncSchedule: i.syncSchedule ?? "manual", version: "1.0.0", owner: i.organizationId,
    capabilities: ["sync", "webhooks"], dependencies: [],
  }));
  const byType: Record<string, number> = {};
  for (const e of entries) byType[e.type] = (byType[e.type] ?? 0) + 1;
  const activeCount = entries.filter(e => e.status === "connected").length;
  const errorCount = entries.filter(e => e.status === "error").length;
  log.info("registry.report_complete", { total: entries.length, active: activeCount });
  return { generatedAt: new Date().toISOString(), integrations: entries, totalIntegrations: entries.length, activeCount, errorCount, byType };
}

// System 3 — Connector Framework
const BUILTIN_CONNECTORS: ConnectorDefinition[] = [
  { id: "google_classroom", name: "Google Classroom", category: "lms", description: "Sync courses, assignments, and grades with Google Classroom", authMethods: ["oauth2"], capabilities: ["sync_courses", "sync_assignments", "sync_grades"], configSchema: {}, version: "1.0.0" },
  { id: "canvas", name: "Canvas LMS", category: "lms", description: "Sync with Instructure Canvas LMS", authMethods: ["api_key", "oauth2"], capabilities: ["sync_courses", "sync_assignments", "sync_grades", "sync_enrollments"], configSchema: {}, version: "1.0.0" },
  { id: "moodle", name: "Moodle", category: "lms", description: "Sync with Moodle LMS", authMethods: ["api_key"], capabilities: ["sync_courses", "sync_assignments", "sync_grades"], configSchema: {}, version: "1.0.0" },
  { id: "blackboard", name: "Blackboard", category: "lms", description: "Sync with Blackboard Learn", authMethods: ["oauth2"], capabilities: ["sync_courses", "sync_assignments"], configSchema: {}, version: "1.0.0" },
  { id: "microsoft_teams", name: "Microsoft Teams", category: "communication", description: "Integrate with Microsoft Teams for Education", authMethods: ["oauth2"], capabilities: ["create_meetings", "send_messages", "sync_classes"], configSchema: {}, version: "1.0.0" },
  { id: "zoom", name: "Zoom", category: "video", description: "Schedule and manage Zoom meetings", authMethods: ["oauth2", "api_key"], capabilities: ["create_meetings", "sync_recordings"], configSchema: {}, version: "1.0.0" },
  { id: "slack", name: "Slack", category: "communication", description: "Send notifications via Slack", authMethods: ["oauth2"], capabilities: ["send_messages", "create_channels"], configSchema: {}, version: "1.0.0" },
  { id: "discord", name: "Discord", category: "communication", description: "Send notifications via Discord", authMethods: ["api_key"], capabilities: ["send_messages"], configSchema: {}, version: "1.0.0" },
  { id: "payme", name: "Payme", category: "payment", description: "Process payments via Payme (Uzbekistan)", authMethods: ["api_key"], capabilities: ["process_payments"], configSchema: {}, version: "1.0.0" },
  { id: "click", name: "Click", category: "payment", description: "Process payments via Click (Uzbekistan)", authMethods: ["api_key"], capabilities: ["process_payments"], configSchema: {}, version: "1.0.0" },
  { id: "telegram", name: "Telegram Bot", category: "communication", description: "Send notifications via Telegram bot", authMethods: ["api_key"], capabilities: ["send_messages"], configSchema: {}, version: "1.0.0" },
  { id: "email", name: "Email (SMTP)", category: "communication", description: "Send email notifications", authMethods: ["api_key"], capabilities: ["send_emails"], configSchema: {}, version: "1.0.0" },
  { id: "sms", name: "SMS Gateway", category: "communication", description: "Send SMS notifications", authMethods: ["api_key"], capabilities: ["send_sms"], configSchema: {}, version: "1.0.0" },
  { id: "ldap", name: "LDAP", category: "identity", description: "Sync users via LDAP", authMethods: ["api_key"], capabilities: ["sync_users", "authenticate"], configSchema: {}, version: "1.0.0" },
  { id: "saml", name: "SAML 2.0", category: "identity", description: "SAML 2.0 SSO integration", authMethods: ["oauth2"], capabilities: ["sso", "sync_users"], configSchema: {}, version: "1.0.0" },
  { id: "google_workspace", name: "Google Workspace", category: "storage", description: "Sync files from Google Drive", authMethods: ["oauth2"], capabilities: ["sync_files", "share_documents"], configSchema: {}, version: "1.0.0" },
  { id: "microsoft_365", name: "Microsoft 365", category: "storage", description: "Sync files from OneDrive/SharePoint", authMethods: ["oauth2"], capabilities: ["sync_files", "share_documents"], configSchema: {}, version: "1.0.0" },
  { id: "generic_rest", name: "Generic REST API", category: "generic", description: "Connect to any REST API", authMethods: ["api_key", "oauth2", "bearer"], capabilities: ["custom"], configSchema: {}, version: "1.0.0" },
  { id: "generic_graphql", name: "Generic GraphQL API", category: "generic", description: "Connect to any GraphQL API", authMethods: ["api_key", "oauth2", "bearer"], capabilities: ["custom"], configSchema: {}, version: "1.0.0" },
  { id: "generic_sql", name: "Generic SQL Database", category: "generic", description: "Connect to any SQL database", authMethods: ["api_key"], capabilities: ["query", "sync"], configSchema: {}, version: "1.0.0" },
  { id: "filesystem", name: "Filesystem", category: "storage", description: "Read/write to local or network filesystem", authMethods: ["api_key"], capabilities: ["read_files", "write_files"], configSchema: {}, version: "1.0.0" },
  { id: "s3_storage", name: "S3-Compatible Storage", category: "storage", description: "Connect to S3-compatible object storage", authMethods: ["api_key"], capabilities: ["read_files", "write_files", "list_buckets"], configSchema: {}, version: "1.0.0" },
];

export function listConnectors(category?: ConnectorCategory): ConnectorDefinition[] {
  return category ? BUILTIN_CONNECTORS.filter(c => c.category === category) : BUILTIN_CONNECTORS;
}
export function getConnector(id: string): ConnectorDefinition | null {
  return BUILTIN_CONNECTORS.find(c => c.id === id) ?? null;
}
export async function generateConnectorReport(): Promise<ConnectorFrameworkReport> {
  const byCategory: Record<string, number> = {};
  for (const c of BUILTIN_CONNECTORS) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  log.info("connector.report_complete", { total: BUILTIN_CONNECTORS.length });
  return { generatedAt: new Date().toISOString(), connectors: BUILTIN_CONNECTORS, totalConnectors: BUILTIN_CONNECTORS.length, byCategory };
}

// System 4 — Webhook Platform
export async function generateWebhookReport(): Promise<WebhookPlatformReport> {
  const [endpoints, deliveries] = await Promise.all([repo.fetchWebhookEndpoints(200), repo.fetchWebhookDeliveries(200)]);
  const endpointInfos: WebhookEndpointInfo[] = endpoints.map(e => ({
    id: e.id, url: e.url, events: repo.safeParse(e.events, []), status: e.status,
    secret: e.secret ? "***" : "", maxRetries: e.maxRetries, retryBackoffMs: e.retryBackoffMs,
    totalDelivered: e.totalDelivered, totalFailed: e.totalFailed,
    lastDeliveryAt: e.lastDeliveryAt?.toISOString() ?? null, lastDeliveryStatus: e.lastDeliveryStatus,
  }));
  const totalDelivered = endpoints.reduce((s, e) => s + e.totalDelivered, 0);
  const totalFailed = endpoints.reduce((s, e) => s + e.totalFailed, 0);
  const deadLetterCount = deliveries.filter(d => d.status === "dead_letter" || d.attemptCount >= 3).length;
  const activeCount = endpoints.filter(e => e.status === "active").length;
  const deliveryRate = totalDelivered + totalFailed > 0 ? Math.round((totalDelivered / (totalDelivered + totalFailed)) * 100) / 100 : 1;
  log.info("webhook.report_complete", { endpoints: endpoints.length, delivered: totalDelivered });
  return { generatedAt: new Date().toISOString(), endpoints: endpointInfos, totalEndpoints: endpoints.length, activeCount, totalDelivered, totalFailed, deliveryRate, deadLetterCount };
}
