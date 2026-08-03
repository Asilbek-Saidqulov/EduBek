/** Search Platform service — composes all 20 systems. Phase 6G.24. */
export {
  registerSearchableEntity, getSearchRegistryEntry, listSearchRegistry, supportsAllEntityTypes,
  createIndex, getIndexById, getIndexByNameStr, listIndexes, setIndexStatus, supportsAllIndexStatuses,
  indexDocument, getDocumentById, listDocuments, softDeleteDocument, supportsAllDocumentStatuses,
  search, supportsAllFilterTypes,
  createFilterDefinition, getFilterById, listFilterDefinitions,
  createRankingConfig, getRankingConfigById, getRankingConfigForEntityType, listRankingConfigs, supportsAllRankingSignals,
  addSuggestion, autocomplete,
  createSynonym, getSynonymById, listSynonyms,
  createSpellCorrection, getSpellCorrectionById, listSpellCorrections, correctSpelling,
} from "./core";
export {
  createSearchSession, getSearchSessionById, listSearchSessions, endSearchSession, recordSearchClick,
  createDiscoveryCollection, getDiscoveryCollectionById, listDiscoveryCollections, addToCollection, supportsAllCollectionTypes,
  createSavedSearch, getSavedSearchById, listSavedSearches, togglePinned, toggleAlerts,
  generateSearchAnalytics,
  createReindexJob, getReindexJobById, listReindexJobs, startReindexJob, completeReindexJob, failReindexJob, supportsAllReindexStatuses,
  recordSearchHealth, getSearchHealthById, getSearchHealthForIndex, listSearchHealth, supportsAllSearchHealthStates,
  getDeveloperIntegration, generateSearchDashboard,
  generateSearchDocumentation, generateMarkdownDocumentation, getSearchVersion, getSearchStatus,
} from "./platform";
export {
  subscribeSearch, unsubscribeSearch, isSearchSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishSearchEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";
export { _resetRepositoryForTesting } from "./repository";
export type {
  SearchableEntityType, SearchRegistryEntry,
  IndexStatus, IndexDefinition,
  DocumentStatus, SearchDocument,
  SearchQuery, SearchFilter, SearchResult, SearchMatchType,
  FilterType, FilterDefinition,
  FacetResult, FacetBucket,
  RankingSignal, RankingConfig,
  AutocompleteSuggestion, AutocompleteResult,
  SynonymEntry, SpellCorrection,
  SearchSession, DiscoveryCollection, CollectionType,
  SavedSearch, SearchAnalytics,
  ReindexStatus, ReindexJob,
  SearchHealthState, SearchHealth,
  SearchEventType, SearchDeveloperIntegration, SearchDashboard, SearchDocumentation,
} from "./types";
