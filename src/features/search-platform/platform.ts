/** Systems 11-20: Sessions, Discovery, Saved, Analytics, Reindex, Health, Developer, Dashboard, Docs. */
import { randomUUID } from "node:crypto";
import type {
  SearchSession, DiscoveryCollection, CollectionType,
  SavedSearch, SearchQuery,
  SearchAnalytics, ReindexJob, ReindexStatus,
  SearchHealth, SearchHealthState,
  SearchEventType, SearchDeveloperIntegration, SearchDashboard, SearchDocumentation,
  SearchableEntityType,
} from "./types";
import {
  storeSession, getSession, getAllSessions, getSessionsByUser,
  storeCollection, getCollection, getAllCollections,
  storeSavedSearch, getSavedSearch, getAllSavedSearches, getSavedSearchesByUser,
  storeReindexJob, getReindexJob, getAllReindexJobs,
  storeHealth, getHealth, getHealthByIndex, getAllHealth,
  getAllIndexes, getAllDocuments, getIndex, storeIndex,
} from "./repository";
import { publishSearchEvent } from "./event-bus-bridge";

// ===== System 11 — Search Sessions =====
export function createSearchSession(input: {
  userId: string; query: string; filters?: Record<string, unknown>;
  resultCount?: number; page?: number; metadata?: Record<string, unknown>;
}): SearchSession {
  const s: SearchSession = {
    id: randomUUID(), userId: input.userId, query: input.query,
    filters: input.filters ?? {}, resultCount: input.resultCount ?? 0, page: input.page ?? 1,
    clickedDocumentIds: [], startedAt: new Date().toISOString(), endedAt: null,
    metadata: input.metadata ?? {},
  };
  storeSession(s);
  return s;
}
export function getSearchSessionById(id: string) { return getSession(id); }
export function listSearchSessions(userId?: string) { return userId ? getSessionsByUser(userId) : getAllSessions(); }
export function endSearchSession(id: string) { const s = getSession(id); if (!s) return null; s.endedAt = new Date().toISOString(); storeSession(s); return s; }
export function recordSearchClick(id: string, documentId: string) {
  const s = getSession(id); if (!s) return null;
  if (!s.clickedDocumentIds.includes(documentId)) s.clickedDocumentIds.push(documentId);
  storeSession(s); return s;
}

// ===== System 12 — Discovery Collections =====
export function createDiscoveryCollection(input: {
  type: CollectionType; name: string;
  entityType?: SearchableEntityType | null;
  documentIds?: string[]; organizationId?: string | null;
  active?: boolean;
}): DiscoveryCollection {
  const now = new Date().toISOString();
  const c: DiscoveryCollection = {
    id: randomUUID(), type: input.type, name: input.name,
    entityType: input.entityType ?? null, documentIds: input.documentIds ?? [],
    organizationId: input.organizationId ?? null, active: input.active ?? true,
    createdAt: now, updatedAt: now,
  };
  storeCollection(c);
  return c;
}
export function getDiscoveryCollectionById(id: string) { return getCollection(id); }
export function listDiscoveryCollections(type?: CollectionType, active?: boolean) {
  let all = getAllCollections();
  if (type) all = all.filter(c => c.type === type);
  if (active !== undefined) all = all.filter(c => c.active === active);
  return all;
}
export function addToCollection(id: string, documentId: string) {
  const c = getCollection(id); if (!c) return null;
  if (!c.documentIds.includes(documentId)) c.documentIds.push(documentId);
  c.updatedAt = new Date().toISOString(); storeCollection(c); return c;
}
export function supportsAllCollectionTypes(): CollectionType[] { return ["trending", "popular", "newest", "recommended", "featured", "organization"]; }

// ===== System 13 — Saved Searches =====
export function createSavedSearch(input: {
  userId: string; name: string; query: SearchQuery;
  pinned?: boolean; alertsEnabled?: boolean;
}): SavedSearch {
  const now = new Date().toISOString();
  const s: SavedSearch = {
    id: randomUUID(), userId: input.userId, name: input.name,
    query: input.query, pinned: input.pinned ?? false, alertsEnabled: input.alertsEnabled ?? false,
    createdAt: now, updatedAt: now,
  };
  storeSavedSearch(s);
  return s;
}
export function getSavedSearchById(id: string) { return getSavedSearch(id); }
export function listSavedSearches(userId?: string) { return userId ? getSavedSearchesByUser(userId) : getAllSavedSearches(); }
export function togglePinned(id: string) { const s = getSavedSearch(id); if (!s) return null; s.pinned = !s.pinned; s.updatedAt = new Date().toISOString(); storeSavedSearch(s); return s; }
export function toggleAlerts(id: string) { const s = getSavedSearch(id); if (!s) return null; s.alertsEnabled = !s.alertsEnabled; s.updatedAt = new Date().toISOString(); storeSavedSearch(s); return s; }

// ===== System 14 — Search Analytics =====
export function generateSearchAnalytics(): SearchAnalytics {
  const sessions = getAllSessions();
  const docs = getAllDocuments();
  const queryCounts = new Map<string, number>();
  const noResultCounts = new Map<string, number>();
  const filterCounts: Record<string, number> = {};
  let totalClicks = 0;
  let totalSessions = 0;
  for (const s of sessions) {
    queryCounts.set(s.query, (queryCounts.get(s.query) ?? 0) + 1);
    if (s.resultCount === 0) noResultCounts.set(s.query, (noResultCounts.get(s.query) ?? 0) + 1);
    if (s.clickedDocumentIds.length > 0) { totalClicks += 1; }
    totalSessions += 1;
    for (const [k, v] of Object.entries(s.filters)) { filterCounts[k] = (filterCounts[k] ?? 0) + 1; }
  }
  const topQueries = Array.from(queryCounts.entries()).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const noResultQueries = Array.from(noResultCounts.entries()).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  return {
    totalQueries: sessions.length, uniqueQueries: queryCounts.size,
    topQueries, noResultQueries,
    avgClickThroughRate: totalSessions > 0 ? totalClicks / totalSessions : 0,
    avgLatencyMs: 0,
    filtersUsed: filterCounts,
    indexGrowth: [{ date: new Date().toISOString().slice(0, 10), documents: docs.length }],
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 15 — Reindex Platform =====
export function createReindexJob(input: {
  indexId: string; type: "full" | "incremental";
  metadata?: Record<string, unknown>;
}): ReindexJob {
  const idx = getIndex(input.indexId);
  const job: ReindexJob = {
    id: randomUUID(), indexId: input.indexId, type: input.type,
    status: "pending", totalDocuments: idx?.documentCount ?? 0, processedDocuments: 0,
    startedAt: new Date().toISOString(), completedAt: null, error: null,
    correlationId: randomUUID(), metadata: input.metadata ?? {},
  };
  storeReindexJob(job);
  return job;
}
export function getReindexJobById(id: string) { return getReindexJob(id); }
export function listReindexJobs(status?: ReindexStatus) { const all = getAllReindexJobs(); return status ? all.filter(j => j.status === status) : all; }
export function startReindexJob(id: string): ReindexJob | null {
  const j = getReindexJob(id); if (!j || j.status !== "pending") return null;
  j.status = "running"; storeReindexJob(j);
  const idx = getIndex(j.indexId); if (idx) { idx.status = "building"; storeIndex(idx); }
  return j;
}
export function completeReindexJob(id: string, processed: number): ReindexJob | null {
  const j = getReindexJob(id); if (!j || j.status !== "running") return null;
  j.status = "completed"; j.processedDocuments = processed; j.completedAt = new Date().toISOString();
  storeReindexJob(j);
  const idx = getIndex(j.indexId);
  if (idx) { idx.status = "active"; idx.lastRebuiltAt = j.completedAt; idx.documentCount = processed; storeIndex(idx); }
  publishSearchEvent("SearchRebuilt", null, { indexId: j.indexId, reindexJobId: j.id });
  return j;
}
export function failReindexJob(id: string, error: string): ReindexJob | null {
  const j = getReindexJob(id); if (!j || j.status !== "running") return null;
  j.status = "failed"; j.error = error; j.completedAt = new Date().toISOString();
  storeReindexJob(j);
  publishSearchEvent("SearchFailed", null, { indexId: j.indexId, error });
  return j;
}
export function supportsAllReindexStatuses(): ReindexStatus[] { return ["pending", "running", "completed", "failed", "cancelled"]; }

// ===== System 16 — Search Health =====
export function recordSearchHealth(input: {
  indexId: string; state?: SearchHealthState;
  latencyMs?: number | null; documentCount?: number;
  expectedDocumentCount?: number | null; failureCount?: number;
  metadata?: Record<string, unknown>;
}): SearchHealth {
  const h: SearchHealth = {
    id: randomUUID(), indexId: input.indexId,
    state: input.state ?? "healthy",
    latencyMs: input.latencyMs ?? null,
    documentCount: input.documentCount ?? 0,
    expectedDocumentCount: input.expectedDocumentCount ?? null,
    missingDocuments: input.expectedDocumentCount !== null && input.expectedDocumentCount !== undefined ? Math.max(0, input.expectedDocumentCount - (input.documentCount ?? 0)) : 0,
    failureCount: input.failureCount ?? 0, lastFailureAt: null,
    checkedAt: new Date().toISOString(),
  };
  storeHealth(h);
  return h;
}
export function getSearchHealthById(id: string) { return getHealth(id); }
export function getSearchHealthForIndex(indexId: string) { return getHealthByIndex(indexId); }
export function listSearchHealth() { return getAllHealth(); }
export function supportsAllSearchHealthStates(): SearchHealthState[] { return ["healthy", "degraded", "unhealthy", "unknown"]; }

// ===== System 18 — Developer Integration =====
export function getDeveloperIntegration(): SearchDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/search", method: "POST", description: "Search", authRequired: false, scope: "read" },
      { path: "/api/search/indexes", method: "GET", description: "List indexes", authRequired: true, scope: "admin" },
      { path: "/api/search/indexes", method: "POST", description: "Create index", authRequired: true, scope: "admin" },
      { path: "/api/search/reindex", method: "POST", description: "Create reindex job", authRequired: true, scope: "admin" },
      { path: "/api/search/autocomplete", method: "GET", description: "Autocomplete", authRequired: false, scope: "read" },
      { path: "/api/search/facets", method: "GET", description: "List facets", authRequired: false, scope: "read" },
      { path: "/api/search/filters", method: "GET", description: "List filters", authRequired: false, scope: "read" },
      { path: "/api/search/discovery", method: "GET", description: "List discovery collections", authRequired: false, scope: "read" },
      { path: "/api/search/trending", method: "GET", description: "Trending", authRequired: false, scope: "read" },
      { path: "/api/search/saved", method: "GET", description: "List saved searches", authRequired: true, scope: "user" },
      { path: "/api/search/saved", method: "POST", description: "Create saved search", authRequired: true, scope: "user" },
      { path: "/api/search/sessions", method: "GET", description: "List search sessions", authRequired: true, scope: "user" },
      { path: "/api/search/synonyms", method: "GET", description: "List synonyms", authRequired: false, scope: "read" },
      { path: "/api/search/spell", method: "GET", description: "Spell correction", authRequired: false, scope: "read" },
      { path: "/api/search/analytics", method: "GET", description: "Search analytics", authRequired: true, scope: "admin" },
      { path: "/api/search/dashboard", method: "GET", description: "Dashboard", authRequired: true, scope: "admin" },
      { path: "/api/search/health", method: "GET", description: "Health", authRequired: true, scope: "admin" },
      { path: "/api/search/developer", method: "GET", description: "Developer integration", authRequired: false, scope: "read" },
      { path: "/api/search/status", method: "GET", description: "Status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_search_indexed", name: "On Search Indexed", triggerEvent: "SearchIndexed", description: "Triggered when a document is indexed" },
      { id: "hook_search_updated", name: "On Search Updated", triggerEvent: "SearchUpdated", description: "Triggered when a document is updated" },
      { id: "hook_search_removed", name: "On Search Removed", triggerEvent: "SearchRemoved", description: "Triggered when a document is removed" },
      { id: "hook_search_rebuilt", name: "On Search Rebuilt", triggerEvent: "SearchRebuilt", description: "Triggered when an index is rebuilt" },
      { id: "hook_search_failed", name: "On Search Failed", triggerEvent: "SearchFailed", description: "Triggered when indexing fails" },
    ],
    sdkMetadata: { version: "1.0.0", language: "typescript", docsUrl: "/docs/search-platform", capabilities: ["indexes", "search", "autocomplete", "filters", "facets", "ranking", "synonyms", "spell", "sessions", "discovery", "saved", "analytics", "reindex", "health"] },
    webhooks: [
      { id: "wh_search_indexed", event: "SearchIndexed", description: "Fired when a document is indexed" },
      { id: "wh_search_rebuilt", event: "SearchRebuilt", description: "Fired when an index is rebuilt" },
      { id: "wh_search_failed", event: "SearchFailed", description: "Fired when indexing fails" },
    ],
    searchSchemas: [
      { name: "SearchDocument", fields: ["id", "indexId", "entityType", "entityId", "title", "body", "tags", "categories", "language", "organizationId", "status", "version"] },
      { name: "SearchQuery", fields: ["query", "matchType", "entityType", "filters", "facets", "page", "pageSize", "sortBy", "sortOrder"] },
      { name: "SearchResult", fields: ["documents", "total", "page", "pageSize", "facets", "took", "maxScore"] },
      { name: "IndexDefinition", fields: ["id", "name", "entityType", "version", "status", "aliases", "mappings", "documentCount"] },
    ],
  };
}

// ===== System 19 — Dashboard =====
export function generateSearchDashboard(): SearchDashboard {
  const indexes = getAllIndexes();
  const docs = getAllDocuments();
  const jobs = getAllReindexJobs();
  const health = getAllHealth();
  const day = 24 * 3600 * 1000; const now = Date.now();
  return {
    indexes: { total: indexes.length, active: indexes.filter(i => i.status === "active").length, building: indexes.filter(i => i.status === "building").length, degraded: indexes.filter(i => i.status === "degraded").length, failed: indexes.filter(i => i.status === "failed").length },
    documents: { total: docs.length, active: docs.filter(d => d.status === "active").length, softDeleted: docs.filter(d => d.status === "soft_deleted").length },
    queries: { total24h: 0, avgLatencyMs: 0, noResultRate: 0 },
    reindex: { running: jobs.filter(j => j.status === "running").length, completed24h: jobs.filter(j => j.status === "completed" && j.completedAt && now - new Date(j.completedAt).getTime() < day).length, failed24h: jobs.filter(j => j.status === "failed" && j.completedAt && now - new Date(j.completedAt).getTime() < day).length },
    health: { healthy: health.filter(h => h.state === "healthy").length, degraded: health.filter(h => h.state === "degraded").length, unhealthy: health.filter(h => h.state === "unhealthy").length },
    autocomplete: { suggestions: 0, popularSearches: 0 },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 20 — Documentation =====
const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Search Registry", description: "Register searchable entity types.", endpoints: ["/api/search/registry"], events: [] },
  { id: 2, name: "Index Registry", description: "Versioned indexes, aliases, rebuild status, health, mappings.", endpoints: ["/api/search/indexes"], events: [] },
  { id: 3, name: "Document Indexer", description: "Consumes Event Bus, transforms entity, stores search document, versioning, soft delete.", endpoints: ["/api/search/documents"], events: ["SearchIndexed", "SearchUpdated", "SearchRemoved"] },
  { id: 4, name: "Full Text Search", description: "Keyword, phrase, boolean, prefix, wildcard. No external search engine.", endpoints: ["/api/search"], events: [] },
  { id: 5, name: "Filters", description: "Category, tags, language, organization, difficulty, grade, visibility, date, status, ownership.", endpoints: ["/api/search/filters"], events: [] },
  { id: 6, name: "Facets", description: "Counts, buckets, aggregations.", endpoints: ["/api/search/facets"], events: [] },
  { id: 7, name: "Ranking Engine", description: "Deterministic ranking. Weights only. No ML.", endpoints: ["/api/search/ranking"], events: [] },
  { id: 8, name: "Autocomplete", description: "Suggestions, popular searches, prefix lookup, history metadata.", endpoints: ["/api/search/autocomplete"], events: [] },
  { id: 9, name: "Synonym Registry", description: "Teacher ↔ Instructor, Quiz ↔ Assessment, etc. Multiple locales.", endpoints: ["/api/search/synonyms"], events: [] },
  { id: 10, name: "Spell Correction Metadata", description: "Known corrections, dictionary, suggestions. No AI.", endpoints: ["/api/search/spell"], events: [] },
  { id: 11, name: "Search Sessions", description: "Search history, pagination, cursor, session statistics.", endpoints: ["/api/search/sessions"], events: [] },
  { id: 12, name: "Discovery Collections", description: "Trending, popular, newest, recommended, featured, organization collections.", endpoints: ["/api/search/discovery"], events: [] },
  { id: 13, name: "Saved Searches", description: "Users save filters, alerts, pinned searches.", endpoints: ["/api/search/saved"], events: [] },
  { id: 14, name: "Search Analytics", description: "Top queries, no-result searches, CTR, filters used, latency, index growth.", endpoints: ["/api/search/analytics"], events: [] },
  { id: 15, name: "Reindex Platform", description: "Full rebuild, incremental rebuild, version migration, background rebuild.", endpoints: ["/api/search/reindex"], events: ["SearchRebuilt", "SearchFailed"] },
  { id: 16, name: "Search Health", description: "Index health, latency, failures, coverage, missing documents.", endpoints: ["/api/search/health"], events: [] },
  { id: 17, name: "Event Bus Bridge", description: "Consumes platform events, publishes search events. Passive.", endpoints: [], events: ["SearchIndexed", "SearchUpdated", "SearchRemoved", "SearchRebuilt", "SearchFailed"] },
  { id: 18, name: "Developer Integration", description: "SDK metadata, search schemas, extension hooks, plugin indexes.", endpoints: ["/api/search/developer"], events: [] },
  { id: 19, name: "Administration Dashboard", description: "Indexes, latency, documents, queries, health, analytics, rebuild jobs.", endpoints: ["/api/search/dashboard"], events: [] },
  { id: 20, name: "Documentation Generator", description: "Markdown, JSON, ownership matrix, API docs. Deterministic. No LLM.", endpoints: ["/api/search/documentation"], events: [] },
];
const EVENT_PAYLOADS: Record<SearchEventType, string[]> = {
  SearchIndexed: ["documentId", "entityId", "indexId", "entityType"],
  SearchUpdated: ["documentId", "entityId", "indexId"],
  SearchRemoved: ["documentId", "entityId", "indexId"],
  SearchRebuilt: ["indexId", "reindexJobId"],
  SearchFailed: ["indexId", "error"],
};
const EVENT_DESCRIPTIONS: Record<SearchEventType, string> = {
  SearchIndexed: "Emitted when a document is indexed.",
  SearchUpdated: "Emitted when a document is updated in the index.",
  SearchRemoved: "Emitted when a document is removed from the index.",
  SearchRebuilt: "Emitted when an index is rebuilt.",
  SearchFailed: "Emitted when indexing fails.",
};

export function generateSearchDocumentation(): SearchDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as SearchEventType, payload: EVENT_PAYLOADS[type as SearchEventType], description: EVENT_DESCRIPTIONS[type as SearchEventType] })),
    ownership: {
      owns: ["Indexes", "Search Metadata", "Autocomplete", "Ranking Metadata", "Search Analytics", "Search Sessions", "Saved Searches", "Synonym Registry", "Facets", "Discovery Collections"],
      doesNotOwn: ["Quizzes", "Marketplace", "AI", "Organizations", "Inventory", "Commerce", "Users", "Notifications", "Workflows", "Analytics", "Reports", "APIs"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateSearchDocumentation();
  let md = `# EduBek — Search, Discovery & Knowledge Index Platform\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.24\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for indexing, search, discovery, filtering, ranking metadata, autocomplete, recommendations metadata, and knowledge retrieval. It does NOT own any content. Every platform remains the owner of its own data. Search only owns indexes.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getSearchVersion(): string { return "1.0.0"; }
export function getSearchStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; updatedAt: string } { return { operational: true, systems: 20, bridgeSubscribed: false, updatedAt: new Date().toISOString() }; }
