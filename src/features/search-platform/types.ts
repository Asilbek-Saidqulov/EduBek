/**
 * EduBek — Search, Discovery & Knowledge Index Platform types.
 * Phase 6G.24: Single source of truth for indexing, search, discovery, filtering,
 * ranking metadata, autocomplete, recommendations metadata, and knowledge retrieval.
 * Owns ONLY indexes. Never owns content. Every platform remains owner of its own data.
 */

// System 1 — Search Registry
export type SearchableEntityType = "quizzes" | "classrooms" | "organizations" | "users" | "marketplace_products" | "badges" | "tournaments" | "events" | "ai_resources" | "courses" | "resources" | "custom";
export interface SearchRegistryEntry {
  id: string; entityType: SearchableEntityType; name: string;
  active: boolean; version: number;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 2 — Index Registry
export type IndexStatus = "active" | "building" | "degraded" | "failed" | "inactive";
export interface IndexDefinition {
  id: string; name: string; entityType: SearchableEntityType;
  version: number; status: IndexStatus;
  aliases: string[]; mappings: Record<string, unknown>;
  documentCount: number; lastRebuiltAt: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 3 — Document Indexer
export type DocumentStatus = "active" | "soft_deleted" | "pending";
export interface SearchDocument {
  id: string; indexId: string; entityType: SearchableEntityType;
  entityId: string; title: string; body: string;
  tags: string[]; categories: string[];
  language: string; organizationId: string | null;
  metadata: Record<string, unknown>;
  status: DocumentStatus;
  version: number; indexedAt: string;
  correlationId: string;
}

// System 4 — Full Text Search
export type SearchMatchType = "keyword" | "phrase" | "boolean" | "prefix" | "wildcard";
export interface SearchQuery {
  query: string; matchType?: SearchMatchType;
  entityType?: SearchableEntityType | null;
  indexName?: string | null;
  filters?: SearchFilter[];
  facets?: string[];
  page?: number; pageSize?: number;
  sortBy?: string; sortOrder?: "asc" | "desc";
}
export interface SearchFilter {
  field: string; operator: "eq" | "neq" | "in" | "not_in" | "gt" | "lt" | "gte" | "lte" | "exists" | "range";
  value: unknown;
}
export interface SearchResult {
  documents: Array<{ document: SearchDocument; score: number; highlights: string[] }>;
  total: number; page: number; pageSize: number;
  facets: Record<string, Array<{ value: string; count: number }>>;
  took: number; maxScore: number;
}

// System 5 — Filters (metadata definitions)
export type FilterType = "category" | "tags" | "language" | "organization" | "difficulty" | "grade" | "visibility" | "date" | "status" | "ownership";
export interface FilterDefinition {
  id: string; name: string; field: string; type: FilterType;
  options: string[]; active: boolean;
  createdAt: string; updatedAt: string;
}

// System 6 — Facets
export interface FacetBucket { value: string; count: number; }
export interface FacetResult { field: string; buckets: FacetBucket[]; }

// System 7 — Ranking Engine
export type RankingSignal = "popularity" | "freshness" | "organization_boost" | "quality_score" | "completion" | "engagement";
export interface RankingConfig {
  id: string; entityType: SearchableEntityType;
  weights: Record<RankingSignal, number>;
  active: boolean; version: number;
  createdAt: string; updatedAt: string;
}

// System 8 — Autocomplete
export interface AutocompleteSuggestion {
  id: string; text: string; entityType: SearchableEntityType | null;
  popularity: number; locale: string;
  createdAt: string;
}
export interface AutocompleteResult {
  suggestions: AutocompleteSuggestion[];
  total: number;
}

// System 9 — Synonym Registry
export interface SynonymEntry {
  id: string; terms: string[]; locale: string;
  active: boolean; createdAt: string; updatedAt: string;
}

// System 10 — Spell Correction Metadata
export interface SpellCorrection {
  id: string; original: string; correction: string;
  locale: string; active: boolean;
  createdAt: string;
}

// System 11 — Search Sessions
export interface SearchSession {
  id: string; userId: string;
  query: string; filters: Record<string, unknown>;
  resultCount: number; page: number;
  clickedDocumentIds: string[];
  startedAt: string; endedAt: string | null;
  metadata: Record<string, unknown>;
}

// System 12 — Discovery Collections
export type CollectionType = "trending" | "popular" | "newest" | "recommended" | "featured" | "organization";
export interface DiscoveryCollection {
  id: string; type: CollectionType; name: string;
  entityType: SearchableEntityType | null;
  documentIds: string[];
  organizationId: string | null;
  active: boolean;
  createdAt: string; updatedAt: string;
}

// System 13 — Saved Searches
export interface SavedSearch {
  id: string; userId: string; name: string;
  query: SearchQuery; pinned: boolean; alertsEnabled: boolean;
  createdAt: string; updatedAt: string;
}

// System 14 — Search Analytics
export interface SearchAnalytics {
  totalQueries: number; uniqueQueries: number;
  topQueries: Array<{ query: string; count: number }>;
  noResultQueries: Array<{ query: string; count: number }>;
  avgClickThroughRate: number;
  avgLatencyMs: number;
  filtersUsed: Record<string, number>;
  indexGrowth: Array<{ date: string; documents: number }>;
  updatedAt: string;
}

// System 15 — Reindex Platform
export type ReindexStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export interface ReindexJob {
  id: string; indexId: string;
  type: "full" | "incremental";
  status: ReindexStatus;
  totalDocuments: number; processedDocuments: number;
  startedAt: string; completedAt: string | null;
  error: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// System 16 — Search Health
export type SearchHealthState = "healthy" | "degraded" | "unhealthy" | "unknown";
export interface SearchHealth {
  id: string; indexId: string;
  state: SearchHealthState;
  latencyMs: number | null;
  documentCount: number; expectedDocumentCount: number | null;
  missingDocuments: number;
  failureCount: number; lastFailureAt: string | null;
  checkedAt: string;
}

// System 17 — Event Bus Bridge
export type SearchEventType =
  | "SearchIndexed" | "SearchUpdated" | "SearchRemoved"
  | "SearchRebuilt" | "SearchFailed";

// System 18 — Developer Integration
export interface SearchDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: SearchEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: SearchEventType; description: string }>;
  searchSchemas: Array<{ name: string; fields: string[] }>;
}

// System 19 — Dashboard
export interface SearchDashboard {
  indexes: { total: number; active: number; building: number; degraded: number; failed: number };
  documents: { total: number; active: number; softDeleted: number };
  queries: { total24h: number; avgLatencyMs: number; noResultRate: number };
  reindex: { running: number; completed24h: number; failed24h: number };
  health: { healthy: number; degraded: number; unhealthy: number };
  autocomplete: { suggestions: number; popularSearches: number };
  updatedAt: string;
}

// System 20 — Documentation
export interface SearchDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: SearchEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
