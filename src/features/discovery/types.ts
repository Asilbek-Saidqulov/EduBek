/**
 * EduBek — Discovery Engine types.
 *
 * Phase 4F.1: Universal search, knowledge graph, and recommendation types.
 */

// ---------------------------------------------------------------------------
// Entity types that participate in the discovery layer
// ---------------------------------------------------------------------------

export type DiscoveryEntityType =
  | "resource"
  | "quiz"
  | "question"
  | "marketplace_listing"
  | "classroom"
  | "user"
  | "organization"
  | "topic"
  | "course"
  | "certificate"
  | "ai_session"
  // Phase 4F.4 — collaborative entities
  | "study_group"
  | "discussion"
  | "note"
  | "challenge"
  | "announcement"
  | "department";

// ---------------------------------------------------------------------------
// Knowledge Graph types
// ---------------------------------------------------------------------------

export type EdgeType =
  | "RELATED"
  | "PREREQUISITE"
  | "NEXT"
  | "DERIVED_FROM"
  | "TRANSLATED_FROM"
  | "USES"
  | "BELONGS_TO"
  | "CREATED_BY"
  | "PART_OF"
  | "SIMILAR"
  | "REFERENCES"
  | "DUPLICATE"
  // Phase 4F.4 — Collaboration Learning Network Graph
  | "MENTORS"
  | "COLLABORATES_WITH"
  | "MEMBER_OF"
  | "TEACHES"
  | "STUDIES_WITH"
  | "RECOMMENDED_FOR"
  | "ASSIGNED_TO"
  | "REVIEWS"
  | "DISCUSSES"
  | "HELPS"
  // Phase 4F.5 — Educational Knowledge Intelligence
  | "SUPPLEMENTS"
  | "REINFORCES"
  | "ASSESSES"
  | "EXPLAINS";

export interface GraphNodeDto {
  id: string;
  entityType: DiscoveryEntityType;
  entityId: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  popularity: number;
  quality: number;
  language: string;
  availableLanguages: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdgeDto {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: EdgeType;
  weight: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Search types
// ---------------------------------------------------------------------------

export interface SearchQuery {
  query: string;
  locale?: string;
  entityTypes?: DiscoveryEntityType[];
  language?: string;
  subject?: string;
  difficulty?: string;
  resourceType?: string;
  tags?: string[];
  ownerId?: string;
  orgId?: string;
  isMarketplace?: boolean;
  isAiGenerated?: boolean;
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SearchResultDto {
  id: string;
  entityType: DiscoveryEntityType;
  entityId: string;
  title: string;
  description: string | null;
  language: string;
  popularity: number;
  quality: number;
  score: number;
  snippet: string;
  availableLanguages: string[];
  isMarketplace: boolean;
  isAiGenerated: boolean;
  tags: string[];
}

export interface SearchResultPage {
  results: SearchResultDto[];
  total: number;
  page: number;
  pageSize: number;
  responseTimeMs: number;
}

// ---------------------------------------------------------------------------
// Recommendation types
// ---------------------------------------------------------------------------

export type RecommendationStrategy =
  | "topic_based"
  | "history_based"
  | "popular"
  | "trending"
  | "for_you"
  | "continue_learning"
  | "marketplace_picks";

export interface RecommendationQuery {
  userId: string;
  locale?: string;
  strategy?: RecommendationStrategy;
  entityType?: DiscoveryEntityType;
  topicId?: string;
  limit?: number;
}

export interface RecommendationDto {
  entityType: DiscoveryEntityType;
  entityId: string;
  title: string;
  description: string | null;
  score: number;
  reason: string;
  reasonKey?: string;
  language: string;
}

// ---------------------------------------------------------------------------
// Topic graph types
// ---------------------------------------------------------------------------

export interface TopicDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  difficulty: string;
  recommendedAge: string | null;
  estimatedStudyTimeMin: number | null;
  language: string;
  slug: string | null;
  aliases: string[];
  keywords: string[];
  children: TopicDto[];
  prerequisites: string[]; // topic IDs
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathDto {
  id: string;
  title: string;
  description: string | null;
  topics: Array<{
    topicId: string;
    topicName: string;
    order: number;
    difficulty: string;
    estimatedStudyTimeMin: number | null;
  }>;
  totalEstimatedTimeMin: number;
  difficulty: string;
}

// ---------------------------------------------------------------------------
// Related content types
// ---------------------------------------------------------------------------

export interface RelatedContentDto {
  entityType: DiscoveryEntityType;
  entityId: string;
  title: string;
  description: string | null;
  relationship: EdgeType;
  weight: number;
  language: string;
  score: number;
}
