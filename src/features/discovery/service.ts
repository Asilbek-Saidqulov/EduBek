/**
 * EduBek — Discovery service.
 *
 * Phase 4F.1: Universal search, knowledge graph, recommendations,
 * and topic graph — all in one service.
 *
 * Every searchable entity becomes a node in the Knowledge Graph.
 * The Search Index provides fast text search. The Recommendation
 * Engine suggests content based on user behavior and preferences.
 * The Topic Graph provides hierarchical learning paths.
 */
import { getLogger } from "@/lib/logger";
import { notFound } from "@/lib/errors";
import { db } from "@/lib/db";
import { expandQuery } from "@/features/multilingual-search/aliases";
import * as repo from "./repository";
import type {
  DiscoveryEntityType,
  EdgeType,
  GraphNodeDto,
  GraphEdgeDto,
  LearningPathDto,
  RecommendationDto,
  RecommendationQuery,
  RelatedContentDto,
  SearchResultDto,
  SearchResultPage,
  SearchQuery,
  TopicDto,
} from "./types";

const log = getLogger("discovery");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse(raw: string | null, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function mapNode(n: any): GraphNodeDto {
  return {
    id: n.id,
    entityType: n.entityType as DiscoveryEntityType,
    entityId: n.entityId,
    title: n.title,
    description: n.description,
    payload: safeParse(n.payload, {}),
    popularity: n.popularity,
    quality: n.quality,
    language: n.language,
    availableLanguages: safeParse(n.availableLanguages, []),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

function mapEdge(e: any): GraphEdgeDto {
  return {
    id: e.id,
    fromNodeId: e.fromNodeId,
    toNodeId: e.toNodeId,
    edgeType: e.edgeType as EdgeType,
    weight: e.weight,
    metadata: e.metadata ? safeParse(e.metadata, null) : null,
    createdAt: e.createdAt.toISOString(),
  };
}

function mapTopic(t: any): TopicDto {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    parentId: t.parentId,
    difficulty: t.difficulty,
    recommendedAge: t.recommendedAge,
    estimatedStudyTimeMin: t.estimatedStudyTimeMin,
    language: t.language,
    slug: t.slug,
    aliases: safeParse(t.aliases, []),
    keywords: safeParse(t.keywords, []),
    children: (t.children ?? []).map(mapTopic),
    prerequisites: (t.prerequisites ?? []).map((p: any) => p.toTopicId),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Universal Search
// ---------------------------------------------------------------------------

export async function search(query: SearchQuery): Promise<SearchResultPage> {
  const startTime = Date.now();
  const { query: rawQuery, locale, page = 1, pageSize = 20, ...filters } = query;

  // Expand query with cross-language aliases
  const { expandedTerms, aliasesUsed } = rawQuery ? expandQuery(rawQuery) : { expandedTerms: [], aliasesUsed: [] };

  // Build search — use the expanded terms for text matching
  const searchQuery = (rawQuery || "").toLowerCase();
  const allTerms = expandedTerms.length > 0 ? expandedTerms : (searchQuery ? [searchQuery] : []);

  // Search in the unified index
  const { items, total } = await repo.searchIndex({
    query: allTerms.length > 0 ? allTerms[0]! : "", // Use first expanded term (most relevant)
    entityTypes: filters.entityTypes?.map((t) => t as string),
    language: filters.language ?? locale,
    subject: filters.subject,
    difficulty: filters.difficulty,
    resourceType: filters.resourceType,
    isMarketplace: filters.isMarketplace,
    isAiGenerated: filters.isAiGenerated,
    isVerified: filters.isVerified,
    page,
    pageSize,
  });

  // Rank results
  const results: SearchResultDto[] = items.map((item: any) => {
    // Compute score: text relevance + popularity + quality + freshness
    let score = 0.4; // base
    const titleLower = item.title.toLowerCase();
    if (allTerms.some((t) => titleLower.includes(t))) score += 0.3;
    if (item.description && allTerms.some((t) => item.description.toLowerCase().includes(t))) score += 0.1;
    score += item.popularity * 0.1;
    score += item.quality * 0.1;

    // Build snippet
    const snippet = buildSnippet(item.title, item.description, allTerms);

    return {
      id: item.id,
      entityType: item.entityType as DiscoveryEntityType,
      entityId: item.entityId,
      title: item.title,
      description: item.description,
      language: item.language,
      popularity: item.popularity,
      quality: item.quality,
      score: Math.min(1.0, score),
      snippet,
      availableLanguages: safeParse(item.tags, []), // placeholder
      isMarketplace: item.isMarketplace,
      isAiGenerated: item.isAiGenerated,
      tags: safeParse(item.tags, []),
    };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const responseTimeMs = Date.now() - startTime;

  // Record search analytics
  try {
    await repo.recordSearchEvent({
      query: rawQuery,
      locale,
      resultCount: total,
      crossLanguageMatch: aliasesUsed.length > 0,
      responseTimeMs,
    });
  } catch {
    // Analytics is best-effort
  }

  log.info("search.executed", {
    query: rawQuery,
    total,
    responseTimeMs,
    crossLanguage: aliasesUsed.length > 0,
  });

  return {
    results,
    total,
    page,
    pageSize,
    responseTimeMs,
  };
}

function buildSnippet(title: string, description: string | null, terms: string[]): string {
  const source = description ?? title;
  if (!source) return "";
  const lowerSource = source.toLowerCase();
  for (const term of terms) {
    const pos = lowerSource.indexOf(term);
    if (pos !== -1) {
      const start = Math.max(0, pos - 50);
      const end = Math.min(source.length, pos + term.length + 100);
      let snippet = source.substring(start, end);
      if (start > 0) snippet = "..." + snippet;
      if (end < source.length) snippet = snippet + "...";
      // Highlight
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      snippet = snippet.replace(regex, "<mark>$1</mark>");
      return snippet;
    }
  }
  return source.substring(0, 120) + (source.length > 120 ? "..." : "");
}

// ---------------------------------------------------------------------------
// Knowledge Graph — nodes and edges
// ---------------------------------------------------------------------------

export async function getNode(entityType: DiscoveryEntityType, entityId: string): Promise<GraphNodeDto | null> {
  const node = await repo.findNodeByEntity(entityType, entityId);
  return node ? mapNode(node) : null;
}

export async function getRelatedContent(
  entityType: DiscoveryEntityType,
  entityId: string,
  limit = 10,
): Promise<RelatedContentDto[]> {
  const node = await repo.findNodeByEntity(entityType, entityId);
  if (!node) return [];

  // Get edges FROM this node (what it relates to)
  const edgesFrom = await repo.findEdgesFrom(node.id);
  // Get edges TO this node (what relates to it)
  const edgesTo = await repo.findEdgesTo(node.id);

  const related: RelatedContentDto[] = [];

  for (const edge of edgesFrom) {
    const toNode = (edge as any).toNode;
    if (toNode) {
      related.push({
        entityType: toNode.entityType as DiscoveryEntityType,
        entityId: toNode.entityId,
        title: toNode.title,
        description: toNode.description,
        relationship: edge.edgeType as EdgeType,
        weight: edge.weight,
        language: toNode.language,
        score: edge.weight,
      });
    }
  }

  for (const edge of edgesTo) {
    const fromNode = (edge as any).fromNode;
    if (fromNode) {
      related.push({
        entityType: fromNode.entityType as DiscoveryEntityType,
        entityId: fromNode.entityId,
        title: fromNode.title,
        description: fromNode.description,
        relationship: edge.edgeType as EdgeType,
        weight: edge.weight,
        language: fromNode.language,
        score: edge.weight,
      });
    }
  }

  // Sort by weight descending and limit
  related.sort((a, b) => b.weight - a.weight);
  return related.slice(0, limit);
}

export async function getGraphTraversal(
  entityType: DiscoveryEntityType,
  entityId: string,
  depth = 2,
): Promise<{ nodes: GraphNodeDto[]; edges: GraphEdgeDto[] }> {
  const startNode = await repo.findNodeByEntity(entityType, entityId);
  if (!startNode) return { nodes: [], edges: [] };

  const visitedNodes = new Set<string>([startNode.id]);
  const allNodes: any[] = [startNode];
  const allEdges: any[] = [];
  let currentLevel = [startNode.id];

  for (let d = 0; d < depth; d++) {
    const nextLevel: string[] = [];
    for (const nodeId of currentLevel) {
      const edges = await repo.findEdgesFrom(nodeId);
      for (const edge of edges) {
        allEdges.push(edge);
        const toNodeId = edge.toNodeId;
        if (!visitedNodes.has(toNodeId)) {
          visitedNodes.add(toNodeId);
          nextLevel.push(toNodeId);
          const toNode = (edge as any).toNode;
          if (toNode) allNodes.push(toNode);
        }
      }
    }
    currentLevel = nextLevel;
    if (currentLevel.length === 0) break;
  }

  return {
    nodes: allNodes.map(mapNode),
    edges: allEdges.map(mapEdge),
  };
}

// ---------------------------------------------------------------------------
// Recommendation Engine
// ---------------------------------------------------------------------------

export async function getRecommendations(query: RecommendationQuery): Promise<RecommendationDto[]> {
  const { userId, locale, strategy = "for_you", entityType, topicId, limit = 10 } = query;

  let recommendations: RecommendationDto[] = [];

  switch (strategy) {
    case "popular":
      recommendations = await getPopularRecommendations(entityType, locale, limit);
      break;
    case "trending":
      recommendations = await getTrendingRecommendations(entityType, locale, limit);
      break;
    case "topic_based":
      if (topicId) {
        recommendations = await getTopicBasedRecommendations(topicId, entityType, locale, limit);
      }
      break;
    case "for_you":
    case "history_based":
      recommendations = await getPersonalizedRecommendations(userId, entityType, locale, limit);
      break;
    case "continue_learning":
      recommendations = await getContinueLearningRecommendations(userId, locale, limit);
      break;
    case "marketplace_picks":
      recommendations = await getMarketplaceRecommendations(locale, limit);
      break;
    default:
      recommendations = await getPopularRecommendations(entityType, locale, limit);
  }

  return recommendations;
}

async function getPopularRecommendations(
  entityType?: DiscoveryEntityType,
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  const items = await db.searchIndexEntry.findMany({
    where: {
      ...(entityType ? { entityType: entityType as string } : {}),
      ...(locale ? { language: locale } : {}),
    },
    orderBy: { popularity: "desc" },
    take: limit,
  });

  return items.map((item: any) => ({
    entityType: item.entityType as DiscoveryEntityType,
    entityId: item.entityId,
    title: item.title,
    description: item.description,
    score: item.popularity,
    reason: "Popular",
    reasonKey: "discovery.recommendations.popular",
    language: item.language,
  }));
}

async function getTrendingRecommendations(
  entityType?: DiscoveryEntityType,
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  // Trending = recently updated with high popularity
  const items = await db.searchIndexEntry.findMany({
    where: {
      ...(entityType ? { entityType: entityType as string } : {}),
      ...(locale ? { language: locale } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { popularity: "desc" }],
    take: limit,
  });

  return items.map((item: any) => ({
    entityType: item.entityType as DiscoveryEntityType,
    entityId: item.entityId,
    title: item.title,
    description: item.description,
    score: item.popularity * 0.7 + item.freshness * 0.3,
    reason: "Trending",
    reasonKey: "discovery.recommendations.trending",
    language: item.language,
  }));
}

async function getTopicBasedRecommendations(
  topicId: string,
  entityType?: DiscoveryEntityType,
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  // Find resources connected to this topic via the knowledge graph
  const topicNode = await repo.findNodeByEntity("topic", topicId);
  if (!topicNode) return [];

  const edges = await repo.findEdgesFrom(topicNode.id, "RELATED");
  const recommendations: RecommendationDto[] = [];

  for (const edge of edges) {
    const toNode = (edge as any).toNode;
    if (toNode && (!entityType || toNode.entityType === entityType)) {
      if (!locale || toNode.language === locale) {
        recommendations.push({
          entityType: toNode.entityType as DiscoveryEntityType,
          entityId: toNode.entityId,
          title: toNode.title,
          description: toNode.description,
          score: edge.weight,
          reason: "Related to your topic",
          reasonKey: "discovery.recommendations.topicBased",
          language: toNode.language,
        });
      }
    }
    if (recommendations.length >= limit) break;
  }

  return recommendations;
}

async function getPersonalizedRecommendations(
  userId: string,
  entityType?: DiscoveryEntityType,
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  // Get user's recent search history
  const recentSearches = await db.searchAnalyticsEvent.findMany({
    where: { userId },
    select: { query: true },
    distinct: ["query"],
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (recentSearches.length === 0) {
    // No history — fall back to popular
    return getPopularRecommendations(entityType, locale, limit);
  }

  // Search based on recent queries
  const searchTerms = recentSearches.map((s: any) => s.query).join(" ");
  const { items } = await repo.searchIndex({
    query: searchTerms.toLowerCase(),
    entityTypes: entityType ? [entityType as string] : undefined,
    language: locale,
    page: 1,
    pageSize: limit,
  });

  return items.map((item: any) => ({
    entityType: item.entityType as DiscoveryEntityType,
    entityId: item.entityId,
    title: item.title,
    description: item.description,
    score: item.popularity,
    reason: "Based on your activity",
    reasonKey: "discovery.recommendations.forYou",
    language: item.language,
  }));
}

async function getContinueLearningRecommendations(
  userId: string,
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  // Find resources the user has started but not completed
  // This would query AssignmentAttempt, LearningSession, etc.
  // For now, return popular resources as a fallback
  return getPopularRecommendations(undefined, locale, limit);
}

async function getMarketplaceRecommendations(
  locale?: string,
  limit = 10,
): Promise<RecommendationDto[]> {
  const items = await db.searchIndexEntry.findMany({
    where: {
      isMarketplace: true,
      ...(locale ? { language: locale } : {}),
    },
    orderBy: [{ quality: "desc" }, { popularity: "desc" }],
    take: limit,
  });

  return items.map((item: any) => ({
    entityType: item.entityType as DiscoveryEntityType,
    entityId: item.entityId,
    title: item.title,
    description: item.description,
    score: item.quality * 0.6 + item.popularity * 0.4,
    reason: "Marketplace pick",
    reasonKey: "discovery.recommendations.marketplacePicks",
    language: item.language,
  }));
}

// ---------------------------------------------------------------------------
// Topic Graph
// ---------------------------------------------------------------------------

export async function getTopics(parentId?: string | null): Promise<TopicDto[]> {
  const topics = await repo.findTopics(parentId);
  return topics.map(mapTopic);
}

export async function getTopicTree(topicId: string): Promise<TopicDto> {
  const topic = await repo.findTopicById(topicId);
  if (!topic) throw notFound("Topic not found");
  return mapTopic(topic);
}

export async function createTopic(input: {
  name: string;
  description?: string;
  parentId?: string;
  difficulty?: string;
  recommendedAge?: string;
  estimatedStudyTimeMin?: number;
  language?: string;
  slug?: string;
  aliases?: string[];
  keywords?: string[];
}): Promise<TopicDto> {
  const topic = await repo.createTopic({
    name: input.name,
    description: input.description,
    parentId: input.parentId,
    difficulty: input.difficulty,
    recommendedAge: input.recommendedAge,
    estimatedStudyTimeMin: input.estimatedStudyTimeMin,
    language: input.language,
    slug: input.slug,
    aliases: JSON.stringify(input.aliases ?? []),
    keywords: JSON.stringify(input.keywords ?? []),
  });

  // Also create a knowledge graph node for this topic
  await repo.upsertNode({
    entityType: "topic",
    entityId: topic.id,
    title: topic.name,
    description: topic.description ?? undefined,
    language: topic.language,
  });

  return mapTopic(topic);
}

// ---------------------------------------------------------------------------
// Learning Paths
// ---------------------------------------------------------------------------

export async function generateLearningPath(
  topicId: string,
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
): Promise<LearningPathDto> {
  const topic = await repo.findTopicById(topicId);
  if (!topic) throw notFound("Topic not found");

  // Collect all prerequisite topics (transitive closure)
  const visited = new Set<string>();
  const orderedTopics: any[] = [];

  async function visit(tid: string, order: number) {
    if (visited.has(tid)) return;
    visited.add(tid);
    const t = await repo.findTopicById(tid);
    if (!t) return;

    // Visit prerequisites first
    for (const prereq of t.prerequisites) {
      await visit(prereq.toTopicId, order);
    }

    orderedTopics.push({
      topicId: t.id,
      topicName: t.name,
      order: orderedTopics.length,
      difficulty: t.difficulty,
      estimatedStudyTimeMin: t.estimatedStudyTimeMin,
    });

    // Visit children
    for (const child of t.children) {
      await visit(child.id, order);
    }
  }

  await visit(topicId, 0);

  const totalEstimatedTimeMin = orderedTopics.reduce(
    (sum, t) => sum + (t.estimatedStudyTimeMin ?? 0),
    0,
  );

  return {
    id: `path_${topicId}_${difficulty}`,
    title: `${topic.name} — ${difficulty} path`,
    description: topic.description,
    topics: orderedTopics,
    totalEstimatedTimeMin,
    difficulty,
  };
}

// ---------------------------------------------------------------------------
// Indexing — register entities in the search index + knowledge graph
// ---------------------------------------------------------------------------

export async function indexEntity(input: {
  entityType: DiscoveryEntityType;
  entityId: string;
  title: string;
  description?: string;
  language?: string;
  subject?: string;
  grade?: string;
  difficulty?: string;
  resourceType?: string;
  tags?: string[];
  ownerId?: string;
  orgId?: string;
  price?: number;
  isMarketplace?: boolean;
  isAiGenerated?: boolean;
  isVerified?: boolean;
  popularity?: number;
  quality?: number;
}): Promise<void> {
  // Build search text (lowercased title + description + tags)
  const searchTextParts = [input.title];
  if (input.description) searchTextParts.push(input.description);
  if (input.tags) searchTextParts.push(...input.tags);
  const searchText = searchTextParts.join(" ").toLowerCase();

  // Upsert into search index
  await repo.upsertSearchEntry({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    description: input.description,
    searchText,
    language: input.language,
    subject: input.subject,
    grade: input.grade,
    difficulty: input.difficulty,
    resourceType: input.resourceType,
    tags: JSON.stringify(input.tags ?? []),
    ownerId: input.ownerId,
    orgId: input.orgId,
    price: input.price,
    isMarketplace: input.isMarketplace,
    isAiGenerated: input.isAiGenerated,
    isVerified: input.isVerified,
    popularity: input.popularity,
    quality: input.quality,
  });

  // Upsert into knowledge graph
  await repo.upsertNode({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    description: input.description,
    language: input.language,
    popularity: input.popularity,
    quality: input.quality,
  });

  log.info("discovery.indexed", {
    entityType: input.entityType,
    entityId: input.entityId,
  });
}

export async function linkEntities(input: {
  fromEntityType: DiscoveryEntityType;
  fromEntityId: string;
  toEntityType: DiscoveryEntityType;
  toEntityId: string;
  edgeType: EdgeType;
  weight?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const fromNode = await repo.findNodeByEntity(input.fromEntityType, input.fromEntityId);
  const toNode = await repo.findNodeByEntity(input.toEntityType, input.toEntityId);
  if (!fromNode || !toNode) {
    log.warn("discovery.link_missing_nodes", {
      from: `${input.fromEntityType}:${input.fromEntityId}`,
      to: `${input.toEntityType}:${input.toEntityId}`,
    });
    return;
  }

  await repo.upsertEdge({
    fromNodeId: fromNode.id,
    toNodeId: toNode.id,
    edgeType: input.edgeType,
    weight: input.weight,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });

  log.info("discovery.linked", {
    from: `${input.fromEntityType}:${input.fromEntityId}`,
    to: `${input.toEntityType}:${input.toEntityId}`,
    edgeType: input.edgeType,
  });
}
