/** Systems 1-10: Registry, Index, Indexer, FullText, Filters, Facets, Ranking, Autocomplete, Synonyms, Spell. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeRegistryEntry, getRegistryEntry, getRegistryByEntityType, getAllRegistryEntries,
  storeIndex, getIndex, getIndexByName, getAllIndexes, getIndexesByEntityType,
  storeDocument, getDocument, getDocumentByEntityId, getAllDocuments, getDocumentsByIndex,
  storeFilter, getFilter, getAllFilters,
  storeRankingConfig, getRankingConfig, getRankingByEntityType, getAllRankingConfigs,
  storeSuggestion, getAllSuggestions,
  storeSynonym, getSynonym, getAllSynonyms,
  storeSpellCorrection, getSpellCorrection, getAllSpellCorrections,
} from "./repository";
import type {
  SearchRegistryEntry, SearchableEntityType,
  IndexDefinition, IndexStatus,
  SearchDocument, DocumentStatus,
  SearchQuery, SearchFilter, SearchResult, SearchMatchType,
  FilterDefinition, FilterType,
  FacetResult, FacetBucket,
  RankingConfig, RankingSignal,
  AutocompleteSuggestion, AutocompleteResult,
  SynonymEntry, SpellCorrection,
} from "./types";
import { publishSearchEvent } from "./event-bus-bridge";

const log = getLogger("search.core");

// ===== System 1 — Search Registry =====
export function registerSearchableEntity(input: {
  entityType: SearchableEntityType; name: string;
  active?: boolean; metadata?: Record<string, unknown>;
}): SearchRegistryEntry {
  if (getRegistryByEntityType(input.entityType)) throw new Error(`Entity type already registered: ${input.entityType}`);
  const now = new Date().toISOString();
  const e: SearchRegistryEntry = { id: randomUUID(), entityType: input.entityType, name: input.name, active: input.active ?? true, version: 1, createdAt: now, updatedAt: now, metadata: input.metadata ?? {} };
  storeRegistryEntry(e);
  return e;
}
export function getSearchRegistryEntry(id: string) { return getRegistryEntry(id); }
export function listSearchRegistry(active?: boolean) { const all = getAllRegistryEntries(); return active === undefined ? all : all.filter(e => e.active === active); }
export function supportsAllEntityTypes(): SearchableEntityType[] { return ["quizzes", "classrooms", "organizations", "users", "marketplace_products", "badges", "tournaments", "events", "ai_resources", "courses", "resources", "custom"]; }

// ===== System 2 — Index Registry =====
export function createIndex(input: {
  name: string; entityType: SearchableEntityType;
  aliases?: string[]; mappings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): IndexDefinition {
  if (getIndexByName(input.name)) throw new Error(`Index name already exists: ${input.name}`);
  const now = new Date().toISOString();
  const idx: IndexDefinition = { id: randomUUID(), name: input.name, entityType: input.entityType, version: 1, status: "active", aliases: input.aliases ?? [], mappings: input.mappings ?? {}, documentCount: 0, lastRebuiltAt: null, createdAt: now, updatedAt: now, metadata: input.metadata ?? {} };
  storeIndex(idx);
  return idx;
}
export function getIndexById(id: string) { return getIndex(id); }
export function getIndexByNameStr(name: string) { return getIndexByName(name); }
export function listIndexes(status?: IndexStatus, entityType?: SearchableEntityType) {
  let all = getAllIndexes();
  if (status) all = all.filter(i => i.status === status);
  if (entityType) all = all.filter(i => i.entityType === entityType);
  return all;
}
export function setIndexStatus(id: string, status: IndexStatus) { const i = getIndex(id); if (!i) return null; i.status = status; i.updatedAt = new Date().toISOString(); storeIndex(i); return i; }
export function supportsAllIndexStatuses(): IndexStatus[] { return ["active", "building", "degraded", "failed", "inactive"]; }

// ===== System 3 — Document Indexer =====
export function indexDocument(input: {
  indexId: string; entityType: SearchableEntityType; entityId: string;
  title: string; body: string;
  tags?: string[]; categories?: string[];
  language?: string; organizationId?: string | null;
  metadata?: Record<string, unknown>; correlationId?: string;
}): SearchDocument {
  // Check if document already exists for this entity in this index
  const existing = getDocumentByEntityId(input.entityId, input.indexId);
  const now = new Date().toISOString();
  if (existing) {
    existing.title = input.title; existing.body = input.body;
    existing.tags = input.tags ?? []; existing.categories = input.categories ?? [];
    existing.language = input.language ?? "en"; existing.organizationId = input.organizationId ?? null;
    existing.metadata = input.metadata ?? {}; existing.version += 1; existing.indexedAt = now;
    existing.status = "active";
    storeDocument(existing);
    publishSearchEvent("SearchUpdated", null, { documentId: existing.id, entityId: input.entityId, indexId: input.indexId });
    return existing;
  }
  const doc: SearchDocument = {
    id: randomUUID(), indexId: input.indexId, entityType: input.entityType, entityId: input.entityId,
    title: input.title, body: input.body,
    tags: input.tags ?? [], categories: input.categories ?? [],
    language: input.language ?? "en", organizationId: input.organizationId ?? null,
    metadata: input.metadata ?? {}, status: "active", version: 1, indexedAt: now,
    correlationId: input.correlationId ?? randomUUID(),
  };
  storeDocument(doc);
  // Update index document count
  const idx = getIndex(input.indexId);
  if (idx) { idx.documentCount += 1; idx.updatedAt = now; storeIndex(idx); }
  publishSearchEvent("SearchIndexed", null, { documentId: doc.id, entityId: input.entityId, indexId: input.indexId, entityType: input.entityType });
  return doc;
}
export function getDocumentById(id: string) { return getDocument(id); }
export function listDocuments(indexId?: string, status?: DocumentStatus) {
  let all = indexId ? getDocumentsByIndex(indexId) : getAllDocuments();
  if (status) all = all.filter(d => d.status === status);
  return all;
}
export function softDeleteDocument(id: string) {
  const d = getDocument(id); if (!d) return null;
  d.status = "soft_deleted"; storeDocument(d);
  publishSearchEvent("SearchRemoved", null, { documentId: d.id, entityId: d.entityId, indexId: d.indexId });
  return d;
}
export function supportsAllDocumentStatuses(): DocumentStatus[] { return ["active", "soft_deleted", "pending"]; }

// ===== System 4 — Full Text Search =====
export function search(query: SearchQuery): SearchResult {
  const startTime = Date.now();
  let docs = getAllDocuments().filter(d => d.status === "active");
  // Filter by entity type
  if (query.entityType) docs = docs.filter(d => d.entityType === query.entityType);
  if (query.indexName) {
    const idx = getIndexByName(query.indexName);
    if (idx) docs = docs.filter(d => d.indexId === idx.id);
  }
  // Apply text search
  const q = query.query.toLowerCase();
  const matchType = query.matchType ?? "keyword";
  if (q) {
    docs = docs.filter(d => {
      const title = d.title.toLowerCase(); const body = d.body.toLowerCase();
      const tags = d.tags.map(t => t.toLowerCase());
      if (matchType === "phrase") return title.includes(q) || body.includes(q);
      if (matchType === "prefix") return title.startsWith(q) || body.startsWith(q) || tags.some(t => t.startsWith(q));
      if (matchType === "wildcard") {
        const regex = new RegExp(q.replace(/\*/g, ".*").replace(/\?/g, "."));
        return regex.test(title) || regex.test(body) || tags.some(t => regex.test(t));
      }
      // keyword: any word in query matches
      const words = q.split(/\s+/);
      return words.some(w => title.includes(w) || body.includes(w) || tags.some(t => t.includes(w)));
    });
  }
  // Apply filters
  if (query.filters) {
    for (const f of query.filters) {
      docs = docs.filter(d => applyFilter(d, f));
    }
  }
  // Calculate scores
  const ranked = docs.map(d => ({ document: d, score: calculateScore(d, q), highlights: generateHighlights(d, q) }));
  // Sort by score or custom sort
  if (query.sortBy) {
    const sb = query.sortBy; const order = query.sortOrder ?? "desc";
    ranked.sort((a, b) => {
      const av = (a.document as any)[sb] ?? 0; const bv = (b.document as any)[sb] ?? 0;
      return order === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  } else {
    ranked.sort((a, b) => b.score - a.score);
  }
  const total = ranked.length;
  // Pagination
  const page = query.page ?? 1; const pageSize = query.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = ranked.slice(start, start + pageSize);
  // Facets
  const facets: Record<string, FacetBucket[]> = {};
  if (query.facets) {
    for (const field of query.facets) { facets[field] = computeFacet(docs, field); }
  }
  return {
    documents: paged, total, page, pageSize,
    facets, took: Date.now() - startTime,
    maxScore: paged.length > 0 ? paged[0].score : 0,
  };
}

function applyFilter(doc: SearchDocument, filter: SearchFilter): boolean {
  const val = (doc as any)[filter.field] ?? doc.metadata[filter.field];
  switch (filter.operator) {
    case "eq": return val === filter.value;
    case "neq": return val !== filter.value;
    case "in": return Array.isArray(filter.value) && filter.value.includes(val);
    case "not_in": return Array.isArray(filter.value) && !filter.value.includes(val);
    case "gt": return typeof val === "number" && val > (filter.value as number);
    case "lt": return typeof val === "number" && val < (filter.value as number);
    case "gte": return typeof val === "number" && val >= (filter.value as number);
    case "lte": return typeof val === "number" && val <= (filter.value as number);
    case "exists": return val !== undefined && val !== null;
    case "range": { const r = filter.value as [number, number]; return typeof val === "number" && val >= r[0] && val <= r[1]; }
    default: return true;
  }
}

function calculateScore(doc: SearchDocument, q: string): number {
  let score = 0;
  const title = doc.title.toLowerCase(); const body = doc.body.toLowerCase();
  if (title.includes(q)) score += 10;
  if (body.includes(q)) score += 5;
  const words = q.split(/\s+/);
  for (const w of words) { if (title.includes(w)) score += 3; if (body.includes(w)) score += 1; }
  return score;
}

function generateHighlights(doc: SearchDocument, q: string): string[] {
  const highlights: string[] = [];
  if (doc.title.toLowerCase().includes(q)) highlights.push(`title:${doc.title}`);
  return highlights;
}

// ===== System 5 — Filters =====
export function createFilterDefinition(input: {
  name: string; field: string; type: FilterType;
  options?: string[]; active?: boolean;
}): FilterDefinition {
  const now = new Date().toISOString();
  const f: FilterDefinition = { id: randomUUID(), name: input.name, field: input.field, type: input.type, options: input.options ?? [], active: input.active ?? true, createdAt: now, updatedAt: now };
  storeFilter(f);
  return f;
}
export function getFilterById(id: string) { return getFilter(id); }
export function listFilterDefinitions(active?: boolean) { const all = getAllFilters(); return active === undefined ? all : all.filter(f => f.active === active); }
export function supportsAllFilterTypes(): FilterType[] { return ["category", "tags", "language", "organization", "difficulty", "grade", "visibility", "date", "status", "ownership"]; }

// ===== System 6 — Facets =====
function computeFacet(docs: SearchDocument[], field: string): FacetBucket[] {
  const counts = new Map<string, number>();
  for (const d of docs) {
    const val = (d as any)[field] ?? d.metadata[field];
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) { for (const v of val) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1); }
    else counts.set(String(val), (counts.get(String(val)) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

// ===== System 7 — Ranking Engine =====
export function createRankingConfig(input: {
  entityType: SearchableEntityType;
  weights?: Partial<Record<RankingSignal, number>>;
}): RankingConfig {
  const now = new Date().toISOString();
  const rc: RankingConfig = {
    id: randomUUID(), entityType: input.entityType,
    weights: { popularity: 1, freshness: 1, organization_boost: 1, quality_score: 1, completion: 1, engagement: 1, ...input.weights },
    active: true, version: 1, createdAt: now, updatedAt: now,
  };
  storeRankingConfig(rc);
  return rc;
}
export function getRankingConfigById(id: string) { return getRankingConfig(id); }
export function getRankingConfigForEntityType(t: SearchableEntityType) { return getRankingByEntityType(t); }
export function listRankingConfigs(active?: boolean) { const all = getAllRankingConfigs(); return active === undefined ? all : all.filter(r => r.active === active); }
export function supportsAllRankingSignals(): RankingSignal[] { return ["popularity", "freshness", "organization_boost", "quality_score", "completion", "engagement"]; }

// ===== System 8 — Autocomplete =====
export function addSuggestion(input: {
  text: string; entityType?: SearchableEntityType | null;
  popularity?: number; locale?: string;
}): AutocompleteSuggestion {
  const s: AutocompleteSuggestion = { id: randomUUID(), text: input.text, entityType: input.entityType ?? null, popularity: input.popularity ?? 0, locale: input.locale ?? "en", createdAt: new Date().toISOString() };
  storeSuggestion(s);
  return s;
}
export function autocomplete(prefix: string, limit = 10): AutocompleteResult {
  const p = prefix.toLowerCase();
  const matches = getAllSuggestions().filter(s => s.text.toLowerCase().startsWith(p)).sort((a, b) => b.popularity - a.popularity).slice(0, limit);
  return { suggestions: matches, total: matches.length };
}

// ===== System 9 — Synonym Registry =====
export function createSynonym(input: {
  terms: string[]; locale?: string; active?: boolean;
}): SynonymEntry {
  const now = new Date().toISOString();
  const s: SynonymEntry = { id: randomUUID(), terms: input.terms, locale: input.locale ?? "en", active: input.active ?? true, createdAt: now, updatedAt: now };
  storeSynonym(s);
  return s;
}
export function getSynonymById(id: string) { return getSynonym(id); }
export function listSynonyms(locale?: string, active?: boolean) {
  let all = getAllSynonyms();
  if (locale) all = all.filter(s => s.locale === locale);
  if (active !== undefined) all = all.filter(s => s.active === active);
  return all;
}

// ===== System 10 — Spell Correction Metadata =====
export function createSpellCorrection(input: {
  original: string; correction: string; locale?: string; active?: boolean;
}): SpellCorrection {
  const s: SpellCorrection = { id: randomUUID(), original: input.original, correction: input.correction, locale: input.locale ?? "en", active: input.active ?? true, createdAt: new Date().toISOString() };
  storeSpellCorrection(s);
  return s;
}
export function getSpellCorrectionById(id: string) { return getSpellCorrection(id); }
export function listSpellCorrections(locale?: string, active?: boolean) {
  let all = getAllSpellCorrections();
  if (locale) all = all.filter(s => s.locale === locale);
  if (active !== undefined) all = all.filter(s => s.active === active);
  return all;
}
export function correctSpelling(query: string, locale = "en"): string {
  const corrections = getAllSpellCorrections().filter(s => s.active && s.locale === locale);
  let corrected = query;
  for (const c of corrections) {
    corrected = corrected.split(c.original).join(c.correction);
  }
  return corrected;
}
