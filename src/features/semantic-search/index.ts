/**
 * EduBek — Semantic search barrel export.
 *
 * Phase 4F.2: Semantic search, personalization, AI recommendations,
 * knowledge gap detection, recommendation diversification, and
 * recommendation analytics.
 */
export {
  // Embedding generation & indexing
  generateEmbedding,
  generateEmbeddingBatch,
  indexEmbedding,
  indexEmbeddingsBatch,
  // Semantic search
  detectIntent,
  semanticSearch,
  getSearchSuggestions,
  SCORE_WEIGHTS,
  // User interest profile
  getInterestProfile,
  recomputeInterestProfile,
  // Personalized feed
  getPersonalizedFeed,
  // Next-step recommendations
  getNextStepRecommendations,
  // Recommendation explanation
  getRecommendationExplanation,
  // Knowledge gap
  buildKnowledgeGapReportSafe as buildKnowledgeGapReport,
  // Recommendation analytics
  recordRecommendationEvent,
  getRecommendationAnalytics,
  // Search feedback
  recordSearchFeedback,
  // Semantic clustering
  computeClusters,
  // Provider info
  listAvailableProviders,
  getActiveEmbeddingProvider,
} from "./service";

export {
  // Provider architecture
  HashEmbeddingProvider,
  GeminiEmbeddingProvider,
  OpenAIEmbeddingProvider,
  VoyageEmbeddingProvider,
  CohereEmbeddingProvider,
  JinaEmbeddingProvider,
  NomicEmbeddingProvider,
  LocalEmbeddingProvider,
  EduBekEmbeddingProvider,
  getEmbeddingProvider,
  cosineSimilarity,
  resizeVector,
  type EmbeddingProvider,
  type EmbeddingResult,
} from "./embedding-providers";

// Diversification
export {
  diversify,
  type DiversifiableItem,
} from "./diversification";

// Knowledge gap (direct exports)
export {
  detectMissingPrerequisites,
  detectForgottenTopics,
} from "./knowledge-gap";

export type {
  EmbeddingDto,
  SemanticSearchQuery,
  SemanticSearchResult,
  SemanticSearchResultPage,
  RankingSignals,
  LearningIntentType,
  IntentDetectionResult,
  MasteryLevel,
  BehavioralSignal,
  UserInterestProfileDto,
  FeedSection,
  FeedSectionId,
  FeedItem,
  PersonalizedFeed,
  NextStepRecommendation,
  NextStepType,
  RecommendationExplanation,
  RecommendationExplanationEntry,
  ExplanationType,
  KnowledgeGapReport,
  DiversificationConfig,
  RecommendationEventInput,
  RecommendationEventType,
  RecommendationAnalyticsSummary,
  RetrievalStrategy,
} from "./types";
