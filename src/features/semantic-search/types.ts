/**
 * EduBek — Semantic search types.
 *
 * Phase 4F.2: Embedding-based semantic search, hybrid ranking,
 * learning intent detection, AI recommendation types, knowledge gap
 * detection, recommendation diversification, and recommendation
 * analytics.
 */

// ---------------------------------------------------------------------------
// Embedding types
// ---------------------------------------------------------------------------

export interface EmbeddingDto {
  id: string;
  entityType: string;
  entityId: string;
  vector: number[];
  model: string;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Semantic search types
// ---------------------------------------------------------------------------

export interface SemanticSearchQuery {
  query: string;
  locale?: string;
  userId?: string;
  entityTypes?: string[];
  limit?: number;
  /** Whether to include keyword search results alongside semantic. */
  hybrid?: boolean;
  /** Restrict to an organization's content. */
  organizationId?: string;
  /** Override detected intent (skip detection). */
  intent?: LearningIntentType;
}

/**
 * Per-signal scores — every value in [0, 1].
 *
 * These are the independent ranking signals the modular ranking engine
 * computes; the final score is a weighted sum (see SCORE_WEIGHTS in
 * service.ts).
 */
export interface RankingSignals {
  keywordScore: number;
  semanticScore: number;
  graphScore: number;
  masteryScore: number;
  prerequisiteScore: number;
  interestScore: number;
  difficultyMatchScore: number;
  qualityScore: number;
  freshnessScore: number;
  popularityScore: number;
  organizationPreferenceScore: number;
  curriculumAlignmentScore: number;
  aiConfidenceScore: number;
}

export interface SemanticSearchResult {
  entityId: string;
  entityType: string;
  title: string;
  description: string | null;
  language: string;
  // Per-signal scores
  signals: RankingSignals;
  // Final weighted score
  finalScore: number;
  snippet: string;
  availableLanguages: string[];
  /** Whether the entity was deduplicated against a higher-ranked entity. */
  isDuplicate?: boolean;
}

export interface SemanticSearchResultPage {
  results: SemanticSearchResult[];
  total: number;
  responseTimeMs: number;
  detectedIntent: string | null;
  intentConfidence: number;
  expandedTerms: string[];
  /** Signal weights used to compute finalScore (transparency for UI). */
  weights: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Learning intent types
// ---------------------------------------------------------------------------

export type LearningIntentType =
  | "learn_concept"
  | "prepare_exam"
  | "find_worksheet"
  | "generate_quiz"
  | "create_lesson"
  | "review_mistakes"
  | "homework_help"
  | "research";

export interface IntentDetectionResult {
  intent: LearningIntentType;
  confidence: number;
  extractedEntities: {
    topics: string[];
    difficulty: string | null;
    resourceType: string | null;
  };
}

// ---------------------------------------------------------------------------
// User interest profile types
// ---------------------------------------------------------------------------

export type MasteryLevel = "mastered" | "learning" | "weak" | "forgotten" | "never";

export interface UserInterestProfileDto {
  userId: string;
  /** topic → weight (0-1), aggregated from behavioral signals. */
  interests: Record<string, number>;
  /** topic → mastery level. */
  mastery: Record<string, MasteryLevel>;
  /** topic → affinity score (0-1), derived from interests + mastery + recency. */
  topicAffinity: Record<string, number>;
  /** Raw behavioral signal counts per topic. */
  signals: Record<string, Partial<Record<BehavioralSignal, number>>>;
  lastComputedAt: string | null;
}

export type BehavioralSignal =
  | "viewed"
  | "opened"
  | "completed"
  | "generated"
  | "purchased"
  | "bookmarked"
  | "shared"
  | "assigned"
  | "recommended"
  | "ai_generated"
  | "ai_edited"
  | "quiz_attempted"
  | "quiz_passed";

// ---------------------------------------------------------------------------
// Personalized feed types
// ---------------------------------------------------------------------------

export type FeedSectionId =
  | "continue_learning"
  | "recommended_today"
  | "weak_topics"
  | "next_prerequisites"
  | "trending"
  | "marketplace_picks"
  | "ai_recommendations"
  | "teacher_recommendations"
  | "organization_resources"
  | "recently_updated";

export interface FeedItem {
  entityType: string;
  entityId: string;
  title: string;
  description: string | null;
  score: number;
  reason: string;
  reasonKey: string;
  language: string;
  thumbnailUrl?: string | null;
}

export interface FeedSection {
  id: FeedSectionId;
  title: string;
  titleKey: string;
  items: FeedItem[];
}

export interface PersonalizedFeed {
  userId: string;
  sections: FeedSection[];
  generatedAt: string;
  /** Cache TTL in seconds; clients may use this for revalidation. */
  ttlSeconds: number;
}

// ---------------------------------------------------------------------------
// Next-step recommendation types
// ---------------------------------------------------------------------------

export type NextStepType =
  | "learn_prerequisite"
  | "continue_topic"
  | "review"
  | "practice"
  | "take_quiz"
  | "worksheet"
  | "ai_tutor"
  | "marketplace_resource"
  | "flashcards"
  | "exam_preparation"
  | "advance_topic"
  | "study_resource";

export interface NextStepRecommendation {
  type: NextStepType;
  entityType: string;
  entityId: string;
  title: string;
  description: string | null;
  reason: string;
  reasonKey: string;
  explanations: string[];
  explanationKeys: string[];
  priority: number; // 1 = highest
  language: string;
}

// ---------------------------------------------------------------------------
// Recommendation explanation types
// ---------------------------------------------------------------------------

export type ExplanationType =
  | "history"
  | "mastery"
  | "graph"
  | "popularity"
  | "topic"
  | "difficulty"
  | "locale"
  | "interest"
  | "quality"
  | "prerequisite"
  | "curriculum"
  | "organization"
  | "teacher"
  | "freshness";

export interface RecommendationExplanationEntry {
  type: ExplanationType;
  text: string;
  textKey: string;
  textParams: Record<string, string | number>;
  weight: number;
}

export interface RecommendationExplanation {
  entityId: string;
  entityType: string;
  title: string;
  explanations: RecommendationExplanationEntry[];
  overallScore: number;
}

// ---------------------------------------------------------------------------
// Knowledge gap detection
// ---------------------------------------------------------------------------

export interface KnowledgeGapReport {
  weakTopics: Array<{ topic: string; mastery: MasteryLevel; score: number }>;
  missingPrerequisites: Array<{
    topic: string;
    requiredFor: string;
    prerequisiteMastery: MasteryLevel;
  }>;
  forgottenTopics: Array<{ topic: string; lastSeenDays: number; previousMastery: MasteryLevel }>;
  masteredTopics: Array<{ topic: string; score: number }>;
  learningProgress: Array<{ topic: string; progress: number; lastActivityDays: number }>;
  /** 0-100 — overall readiness to advance to the next topic. */
  readinessScore: number;
}

// ---------------------------------------------------------------------------
// Recommendation diversification
// ---------------------------------------------------------------------------

export interface DiversificationConfig {
  /** Max items per entityType in a single recommendation batch. */
  maxPerEntityType?: number;
  /** Max items per author/creator. */
  maxPerAuthor?: number;
  /** Max items per organization. */
  maxPerOrganization?: number;
  /** Max items per difficulty level. */
  maxPerDifficulty?: number;
  /** Target ratio of AI-generated items (0-1). */
  targetAiGeneratedRatio?: number;
  /** Target ratio of marketplace items (0-1). */
  targetMarketplaceRatio?: number;
  /** Whether to allow duplicate topics in adjacent positions. */
  allowAdjacentSameTopic?: boolean;
}

// ---------------------------------------------------------------------------
// Recommendation analytics
// ---------------------------------------------------------------------------

export type RecommendationEventType =
  | "impression"
  | "click"
  | "open"
  | "complete"
  | "ignore"
  | "dismiss"
  | "helpful"
  | "not_helpful";

export interface RecommendationEventInput {
  userId?: string;
  entityType: string;
  entityId: string;
  eventType: RecommendationEventType;
  strategy?: string;
  /** Where the recommendation was shown (feed, next_step, search, related). */
  surface?: string;
  /** Position in the recommendation list (1-indexed). */
  position?: number;
  locale?: string;
}

export interface RecommendationAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalCompletes: number;
  totalHelpful: number;
  totalNotHelpful: number;
  totalDismissals: number;
  clickThroughRate: number;
  helpfulRate: number;
  perStrategy: Record<string, { impressions: number; clicks: number; ctr: number }>;
}

// ---------------------------------------------------------------------------
// Retrieval strategy enumeration
// ---------------------------------------------------------------------------

export type RetrievalStrategy =
  | "keyword"
  | "semantic"
  | "knowledge_graph"
  | "personalized"
  | "marketplace"
  | "recent"
  | "trending"
  | "ai"
  | "organization"
  | "teacher";
