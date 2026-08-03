/** In-memory repository for Search Platform. Phase 6G.24. */
import type {
  SearchRegistryEntry, IndexDefinition, SearchDocument,
  FilterDefinition, RankingConfig,
  AutocompleteSuggestion, SynonymEntry, SpellCorrection,
  SearchSession, DiscoveryCollection, SavedSearch,
  ReindexJob, SearchHealth,
} from "./types";

const registry = new Map<string, SearchRegistryEntry>();
const indexes = new Map<string, IndexDefinition>();
const documents = new Map<string, SearchDocument>();
const filters = new Map<string, FilterDefinition>();
const rankingConfigs = new Map<string, RankingConfig>();
const suggestions = new Map<string, AutocompleteSuggestion>();
const synonyms = new Map<string, SynonymEntry>();
const spellCorrections = new Map<string, SpellCorrection>();
const sessions = new Map<string, SearchSession>();
const collections = new Map<string, DiscoveryCollection>();
const savedSearches = new Map<string, SavedSearch>();
const reindexJobs = new Map<string, ReindexJob>();
const healthRecords = new Map<string, SearchHealth>();

export const storeRegistryEntry = (e: SearchRegistryEntry) => registry.set(e.id, e);
export const getRegistryEntry = (id: string) => registry.get(id) ?? null;
export const getRegistryByEntityType = (t: string) => Array.from(registry.values()).find(e => e.entityType === t) ?? null;
export const getAllRegistryEntries = () => Array.from(registry.values());

export const storeIndex = (i: IndexDefinition) => indexes.set(i.id, i);
export const getIndex = (id: string) => indexes.get(id) ?? null;
export const getIndexByName = (name: string) => Array.from(indexes.values()).find(i => i.name === name) ?? null;
export const getAllIndexes = () => Array.from(indexes.values());
export const getIndexesByEntityType = (t: string) => Array.from(indexes.values()).filter(i => i.entityType === t);

export const storeDocument = (d: SearchDocument) => documents.set(d.id, d);
export const getDocument = (id: string) => documents.get(id) ?? null;
export const getDocumentByEntityId = (entityId: string, indexId: string) => Array.from(documents.values()).find(d => d.entityId === entityId && d.indexId === indexId) ?? null;
export const getAllDocuments = () => Array.from(documents.values());
export const getDocumentsByIndex = (indexId: string) => Array.from(documents.values()).filter(d => d.indexId === indexId);

export const storeFilter = (f: FilterDefinition) => filters.set(f.id, f);
export const getFilter = (id: string) => filters.get(id) ?? null;
export const getAllFilters = () => Array.from(filters.values());

export const storeRankingConfig = (r: RankingConfig) => rankingConfigs.set(r.id, r);
export const getRankingConfig = (id: string) => rankingConfigs.get(id) ?? null;
export const getRankingByEntityType = (t: string) => Array.from(rankingConfigs.values()).find(r => r.entityType === t) ?? null;
export const getAllRankingConfigs = () => Array.from(rankingConfigs.values());

export const storeSuggestion = (s: AutocompleteSuggestion) => suggestions.set(s.id, s);
export const getSuggestion = (id: string) => suggestions.get(id) ?? null;
export const getAllSuggestions = () => Array.from(suggestions.values());

export const storeSynonym = (s: SynonymEntry) => synonyms.set(s.id, s);
export const getSynonym = (id: string) => synonyms.get(id) ?? null;
export const getAllSynonyms = () => Array.from(synonyms.values());

export const storeSpellCorrection = (s: SpellCorrection) => spellCorrections.set(s.id, s);
export const getSpellCorrection = (id: string) => spellCorrections.get(id) ?? null;
export const getAllSpellCorrections = () => Array.from(spellCorrections.values());

export const storeSession = (s: SearchSession) => sessions.set(s.id, s);
export const getSession = (id: string) => sessions.get(id) ?? null;
export const getAllSessions = () => Array.from(sessions.values());
export const getSessionsByUser = (userId: string) => Array.from(sessions.values()).filter(s => s.userId === userId);

export const storeCollection = (c: DiscoveryCollection) => collections.set(c.id, c);
export const getCollection = (id: string) => collections.get(id) ?? null;
export const getAllCollections = () => Array.from(collections.values());

export const storeSavedSearch = (s: SavedSearch) => savedSearches.set(s.id, s);
export const getSavedSearch = (id: string) => savedSearches.get(id) ?? null;
export const getAllSavedSearches = () => Array.from(savedSearches.values());
export const getSavedSearchesByUser = (userId: string) => Array.from(savedSearches.values()).filter(s => s.userId === userId);

export const storeReindexJob = (r: ReindexJob) => reindexJobs.set(r.id, r);
export const getReindexJob = (id: string) => reindexJobs.get(id) ?? null;
export const getAllReindexJobs = () => Array.from(reindexJobs.values());

export const storeHealth = (h: SearchHealth) => healthRecords.set(h.id, h);
export const getHealth = (id: string) => healthRecords.get(id) ?? null;
export const getHealthByIndex = (indexId: string) => Array.from(healthRecords.values()).find(h => h.indexId === indexId) ?? null;
export const getAllHealth = () => Array.from(healthRecords.values());

export function _resetRepositoryForTesting() {
  registry.clear(); indexes.clear(); documents.clear();
  filters.clear(); rankingConfigs.clear();
  suggestions.clear(); synonyms.clear(); spellCorrections.clear();
  sessions.clear(); collections.clear(); savedSearches.clear();
  reindexJobs.clear(); healthRecords.clear();
}
