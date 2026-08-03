/**
 * EduBek — Discovery feature barrel export.
 *
 * Phase 4F.1: Universal Search, Knowledge Graph & Discovery Engine.
 */
export {
  search,
  getNode,
  getRelatedContent,
  getGraphTraversal,
  getRecommendations,
  getTopics,
  getTopicTree,
  createTopic,
  generateLearningPath,
  indexEntity,
  linkEntities,
} from "./service";

export type {
  DiscoveryEntityType,
  EdgeType,
  GraphNodeDto,
  GraphEdgeDto,
  SearchQuery,
  SearchResultDto,
  SearchResultPage,
  RecommendationStrategy,
  RecommendationQuery,
  RecommendationDto,
  TopicDto,
  LearningPathDto,
  RelatedContentDto,
} from "./types";
