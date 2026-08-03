/** Systems 9-16: Events, Config, Webhooks, Keys, Orgs, Marketplace, Analytics, Health. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeSubscription, getSubscription, getAllSubscriptions, getSubscriptionsByExtension,
  storeConfig, getConfig, getConfigByExtension, getAllConfigs,
  storeWebhook, getWebhook, getAllWebhooks, getWebhooksByExtension,
  storeApiKey, getApiKey, getAllApiKeys, getApiKeysByDeveloper,
  storeOrganization, getOrganization, getAllOrganizations,
  storeMarketplaceRef, getMarketplaceRef, getAllMarketplaceRefs,
  storeHealth, getHealth, getHealthByExtension, getAllHealth,
} from "./repository";
import type {
  EventSubscription, ExtensionConfig, WebhookDefinition, WebhookStatus,
  DeveloperApiKey, ApiKeyStatus,
  DeveloperOrganization, MarketplaceReference,
  ExtensionHealth, HealthState,
  DeveloperAnalytics, SdkLanguage, ExtensionType,
} from "./types";
import { publishDeveloperEvent } from "./event-bus-bridge";

const log = getLogger("developer.platform");

// ===== System 9 — Event Subscription Platform =====
const ALLOWED_EVENTS = [
  "MatchCreated", "MatchFinished", "PlayerJoined", "PlayerLeft",
  "ScoreUpdated", "PurchaseCompleted", "AchievementUnlocked",
  "IdentityCreated", "SessionCreated", "NotificationDelivered",
];

export function createSubscription(input: {
  extensionId: string; eventType: string;
  filter?: Record<string, unknown> | null; metadata?: Record<string, unknown>;
}): EventSubscription {
  if (!ALLOWED_EVENTS.includes(input.eventType)) throw new Error(`Event type not allowed: ${input.eventType}`);
  const sub: EventSubscription = {
    id: randomUUID(), extensionId: input.extensionId, eventType: input.eventType,
    filter: input.filter ?? null, active: true, createdAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeSubscription(sub);
  return sub;
}
export function getSubscriptionById(id: string) { return getSubscription(id); }
export function listSubscriptions(extId?: string) { return extId ? getSubscriptionsByExtension(extId) : getAllSubscriptions(); }
export function deactivateSubscription(id: string) {
  const s = getSubscription(id); if (!s) return null;
  s.active = false; storeSubscription(s); return s;
}
export function getAllowedEvents() { return ALLOWED_EVENTS; }

// ===== System 10 — Extension Configuration =====
export function createConfig(input: {
  extensionId: string; settings?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  validationRules?: Array<{ key: string; type: string; required: boolean }>;
  environmentOverrides?: Record<string, Record<string, unknown>>;
  secretRefs?: string[];
}): ExtensionConfig {
  const config: ExtensionConfig = {
    id: randomUUID(), extensionId: input.extensionId,
    settings: input.settings ?? {}, defaults: input.defaults ?? {},
    validationRules: input.validationRules ?? [],
    environmentOverrides: input.environmentOverrides ?? {},
    secretRefs: input.secretRefs ?? [],
    updatedAt: new Date().toISOString(),
  };
  storeConfig(config);
  return config;
}
export function getConfigById(id: string) { return getConfig(id); }
export function getConfigForExtension(extId: string) { return getConfigByExtension(extId); }
export function listConfigs() { return getAllConfigs(); }
export function updateConfig(id: string, settings: Record<string, unknown>) {
  const c = getConfig(id); if (!c) return null;
  c.settings = { ...c.settings, ...settings }; c.updatedAt = new Date().toISOString();
  storeConfig(c); return c;
}

// ===== System 11 — Webhook Platform =====
function hashSecret(secret: string): string {
  let h = 0; for (let i = 0; i < secret.length; i++) h = (h * 31 + secret.charCodeAt(i)) | 0;
  return `wh_${(h >>> 0).toString(16)}`;
}

export function registerWebhook(input: {
  extensionId: string; url: string; events: string[];
  retryMax?: number; retryBackoffMs?: number; metadata?: Record<string, unknown>;
}): WebhookDefinition & { plainSecret: string } {
  const secret = randomUUID();
  const now = new Date().toISOString();
  const webhook: WebhookDefinition = {
    id: randomUUID(), extensionId: input.extensionId, url: input.url,
    events: input.events, status: "active", signingSecret: hashSecret(secret),
    retryMax: input.retryMax ?? 3, retryBackoffMs: input.retryBackoffMs ?? 1000,
    lastTriggeredAt: null, lastDeliveryStatus: null,
    deliveryCount: 0, failureCount: 0, createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeWebhook(webhook);
  publishDeveloperEvent("WebhookRegistered", null, { webhookId: webhook.id, extensionId: input.extensionId });
  return { ...webhook, plainSecret: secret };
}
export function getWebhookById(id: string) { return getWebhook(id); }
export function listWebhooks(extId?: string) { return extId ? getWebhooksByExtension(extId) : getAllWebhooks(); }
export function pauseWebhook(id: string) {
  const w = getWebhook(id); if (!w) return null;
  if (w.status !== "active") return null;
  w.status = "paused"; w.updatedAt = new Date().toISOString(); storeWebhook(w); return w;
}
export function revokeWebhook(id: string) {
  const w = getWebhook(id); if (!w) return null;
  w.status = "revoked"; w.updatedAt = new Date().toISOString(); storeWebhook(w); return w;
}
export function recordWebhookDelivery(id: string, success: boolean) {
  const w = getWebhook(id); if (!w) return null;
  w.deliveryCount += 1; w.lastTriggeredAt = new Date().toISOString();
  w.lastDeliveryStatus = success ? "success" : "failed";
  if (!success) w.failureCount += 1;
  w.updatedAt = w.lastTriggeredAt; storeWebhook(w); return w;
}
export function triggerWebhook(id: string) {
  const w = getWebhook(id); if (!w) return null;
  publishDeveloperEvent("WebhookTriggered", null, { webhookId: id, url: w.url });
  return w;
}
export function supportsAllWebhookStatuses() { return ["active", "paused", "revoked"]; }

// ===== System 12 — API Keys & Tokens =====
export function issueApiKey(input: {
  developerId: string; name: string; scopes?: string[];
  expiresAt?: string | null; rotationDueAt?: string | null;
  metadata?: Record<string, unknown>;
}): DeveloperApiKey & { plainSecret: string } {
  const now = new Date().toISOString();
  const secret = randomUUID() + randomUUID();
  let h = 0; for (let i = 0; i < secret.length; i++) h = (h * 31 + secret.charCodeAt(i)) | 0;
  const hashedSecret = `h_${(h >>> 0).toString(16)}`;
  const key: DeveloperApiKey = {
    id: randomUUID(), developerId: input.developerId, name: input.name,
    keyPrefix: `dk_${randomUUID().slice(0, 8)}`, hashedSecret,
    scopes: input.scopes ?? [], status: "active",
    issuedAt: now, expiresAt: input.expiresAt ?? null,
    revokedAt: null, rotationDueAt: input.rotationDueAt ?? null,
    lastUsedAt: null, lastUsedIp: null,
    correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeApiKey(key);
  publishDeveloperEvent("ApiKeyCreated", input.developerId, { keyId: key.id });
  return { ...key, plainSecret: secret };
}
export function getApiKeyById(id: string) { return getApiKey(id); }
export function listApiKeys(developerId?: string, status?: ApiKeyStatus) {
  let all = developerId ? getApiKeysByDeveloper(developerId) : getAllApiKeys();
  if (status) all = all.filter(k => k.status === status);
  return all;
}
export function recordApiKeyUsage(id: string, ip: string | null) {
  const k = getApiKey(id); if (!k) return null;
  if (k.status !== "active") return null;
  k.lastUsedAt = new Date().toISOString(); k.lastUsedIp = ip; storeApiKey(k); return k;
}
export function rotateApiKey(id: string): (DeveloperApiKey & { plainSecret: string }) | null {
  const k = getApiKey(id); if (!k) return null;
  if (k.status !== "active") return null;
  const newSecret = randomUUID() + randomUUID();
  let h = 0; for (let i = 0; i < newSecret.length; i++) h = (h * 31 + newSecret.charCodeAt(i)) | 0;
  k.hashedSecret = `h_${(h >>> 0).toString(16)}`;
  k.keyPrefix = `dk_${randomUUID().slice(0, 8)}`;
  k.rotationDueAt = null; storeApiKey(k);
  return { ...k, plainSecret: newSecret };
}
export function revokeApiKey(id: string, reason: string) {
  const k = getApiKey(id); if (!k) return null;
  if (k.status === "revoked") return null;
  k.status = "revoked"; k.revokedAt = new Date().toISOString(); k.metadata.revocationReason = reason;
  storeApiKey(k);
  publishDeveloperEvent("ApiKeyRevoked", k.developerId, { keyId: k.id, reason });
  return k;
}
export function supportsAllApiKeyStatuses() { return ["active", "revoked", "expired", "rotating"]; }

// ===== System 13 — Developer Organizations =====
export function createOrganization(input: {
  name: string; ownerId: string; metadata?: Record<string, unknown>;
}): DeveloperOrganization {
  const now = new Date().toISOString();
  const org: DeveloperOrganization = {
    id: randomUUID(), name: input.name, ownerId: input.ownerId,
    members: [{ developerId: input.ownerId, role: "owner", addedAt: now }],
    projects: [], applications: [],
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storeOrganization(org);
  publishDeveloperEvent("DeveloperOrganizationCreated", input.ownerId, { organizationId: org.id, name: org.name });
  return org;
}
export function getOrganizationById(id: string) { return getOrganization(id); }
export function listOrganizations() { return getAllOrganizations(); }
export function addMember(orgId: string, developerId: string, role: "owner" | "admin" | "developer" | "viewer", addedBy: string) {
  const o = getOrganization(orgId); if (!o) return null;
  if (o.members.find(m => m.developerId === developerId)) return o;
  o.members.push({ developerId, role, addedAt: new Date().toISOString() });
  o.updatedAt = new Date().toISOString(); storeOrganization(o); return o;
}
export function removeMember(orgId: string, developerId: string) {
  const o = getOrganization(orgId); if (!o) return null;
  o.members = o.members.filter(m => m.developerId !== developerId);
  o.updatedAt = new Date().toISOString(); storeOrganization(o); return o;
}
export function addProject(orgId: string, projectId: string) {
  const o = getOrganization(orgId); if (!o) return null;
  if (!o.projects.includes(projectId)) o.projects.push(projectId);
  o.updatedAt = new Date().toISOString(); storeOrganization(o); return o;
}
export function addApplication(orgId: string, appId: string) {
  const o = getOrganization(orgId); if (!o) return null;
  if (!o.applications.includes(appId)) o.applications.push(appId);
  o.updatedAt = new Date().toISOString(); storeOrganization(o); return o;
}

// ===== System 14 — Marketplace Integration =====
export function createMarketplaceReference(input: {
  extensionId: string; listingId: string; versionRef: string;
  licenseRef: string; revenueRef?: string | null; metadata?: Record<string, unknown>;
}): MarketplaceReference {
  const ref: MarketplaceReference = {
    id: randomUUID(), extensionId: input.extensionId,
    listingId: input.listingId, versionRef: input.versionRef,
    licenseRef: input.licenseRef, revenueRef: input.revenueRef ?? null,
    publishedAt: null, updatedAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
  storeMarketplaceRef(ref);
  return ref;
}
export function getMarketplaceReference(id: string) { return getMarketplaceRef(id); }
export function listMarketplaceReferences() { return getAllMarketplaceRefs(); }
export function markMarketplacePublished(id: string) {
  const m = getMarketplaceRef(id); if (!m) return null;
  m.publishedAt = new Date().toISOString(); m.updatedAt = m.publishedAt;
  storeMarketplaceRef(m); return m;
}

// ===== System 15 — Developer Analytics =====
export function generateDeveloperAnalytics(): DeveloperAnalytics {
  // Simplified: returns empty/zeros since we don't track raw API calls in-memory
  const byLang: Record<SdkLanguage, number> = { typescript: 0, python: 0, rust: 0, go: 0, java: 0, rest: 0, websocket: 0 };
  const byType: Record<ExtensionType, number> = { plugin: 0, sdk: 0, theme: 0, integration: 0, widget: 0, cli_tool: 0 };
  return {
    apiUsage: { totalCalls: 0, calls24h: 0, calls7d: 0, byCapability: {} },
    sdkAdoption: { totalInstalls: 0, byLanguage: byLang },
    extensionAdoption: { totalInstalls: 0, activeInstalls: 0, byType: byType },
    errorRates: { totalErrors: 0, errorRate: 0, byExtension: {} },
    versionDistribution: [],
    performance: { avgResponseMs: 0, p95ResponseMs: 0, p99ResponseMs: 0 },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 16 — Extension Health =====
export function recordHealth(input: {
  extensionId: string; state?: HealthState; failureCount?: number;
  lastFailureReason?: string | null; crashCount?: number;
  compatibilityStatus?: "compatible" | "incompatible" | "unknown";
  recoveryRecommendation?: string | null; metadata?: Record<string, unknown>;
}): ExtensionHealth {
  const health: ExtensionHealth = {
    id: randomUUID(), extensionId: input.extensionId,
    state: input.state ?? "healthy",
    failureCount: input.failureCount ?? 0,
    lastFailureAt: null, lastFailureReason: input.lastFailureReason ?? null,
    crashCount: input.crashCount ?? 0, lastCrashAt: null,
    compatibilityStatus: input.compatibilityStatus ?? "compatible",
    recoveryRecommendation: input.recoveryRecommendation ?? null,
    checkedAt: new Date().toISOString(), metadata: input.metadata ?? {},
  };
  storeHealth(health);
  return health;
}
export function getHealthById(id: string) { return getHealth(id); }
export function getHealthForExtension(extId: string) { return getHealthByExtension(extId); }
export function listHealth() { return getAllHealth(); }
export function recordFailure(extId: string, reason: string) {
  const h = getHealthByExtension(extId);
  if (h) {
    h.failureCount += 1; h.lastFailureAt = new Date().toISOString(); h.lastFailureReason = reason;
    if (h.failureCount > 5) h.state = "unhealthy";
    else if (h.failureCount > 2) h.state = "degraded";
    storeHealth(h); return h;
  }
  return null;
}
export function recordCrash(extId: string) {
  const h = getHealthByExtension(extId);
  if (h) {
    h.crashCount += 1; h.lastCrashAt = new Date().toISOString();
    h.state = "unhealthy"; storeHealth(h); return h;
  }
  return null;
}
export function supportsAllHealthStates() { return ["healthy", "degraded", "unhealthy", "unknown"]; }
