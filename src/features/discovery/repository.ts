/**
 * EduBek — Discovery repository.
 *
 * Direct Prisma access for the Knowledge Graph, Search Index,
 * Topic tree, and Search Analytics.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Knowledge Graph Nodes
// ---------------------------------------------------------------------------

export async function findNodeByEntity(entityType: string, entityId: string) {
  return db.knowledgeGraphNode.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}

export async function findNodeById(id: string) {
  return db.knowledgeGraphNode.findUnique({ where: { id } });
}

export async function createNode(input: {
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  payload?: string;
  popularity?: number;
  quality?: number;
  language?: string;
  availableLanguages?: string;
}) {
  return db.knowledgeGraphNode.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      description: input.description ?? null,
      payload: input.payload ?? "{}",
      popularity: input.popularity ?? 0,
      quality: input.quality ?? 0.5,
      language: input.language ?? "en",
      availableLanguages: input.availableLanguages ?? "[]",
    },
  });
}

export async function upsertNode(input: {
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  payload?: string;
  popularity?: number;
  quality?: number;
  language?: string;
  availableLanguages?: string;
}) {
  return db.knowledgeGraphNode.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } },
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      description: input.description ?? null,
      payload: input.payload ?? "{}",
      popularity: input.popularity ?? 0,
      quality: input.quality ?? 0.5,
      language: input.language ?? "en",
      availableLanguages: input.availableLanguages ?? "[]",
    },
    update: {
      title: input.title,
      description: input.description,
      payload: input.payload,
      popularity: input.popularity,
      quality: input.quality,
      language: input.language,
      availableLanguages: input.availableLanguages,
    },
  });
}

// ---------------------------------------------------------------------------
// Knowledge Graph Edges
// ---------------------------------------------------------------------------

export async function findEdgesFrom(nodeId: string, edgeType?: string) {
  return db.knowledgeGraphEdge.findMany({
    where: { fromNodeId: nodeId, ...(edgeType ? { edgeType } : {}) },
    include: { toNode: true },
    orderBy: { weight: "desc" },
  });
}

export async function findEdgesTo(nodeId: string, edgeType?: string) {
  return db.knowledgeGraphEdge.findMany({
    where: { toNodeId: nodeId, ...(edgeType ? { edgeType } : {}) },
    include: { fromNode: true },
    orderBy: { weight: "desc" },
  });
}

export async function createEdge(input: {
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  weight?: number;
  metadata?: string;
}) {
  return db.knowledgeGraphEdge.create({
    data: {
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      edgeType: input.edgeType,
      weight: input.weight ?? 0.5,
      metadata: input.metadata,
    },
  });
}

export async function upsertEdge(input: {
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  weight?: number;
  metadata?: string;
}) {
  // Check if edge exists
  const existing = await db.knowledgeGraphEdge.findFirst({
    where: {
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      edgeType: input.edgeType,
    },
  });
  if (existing) {
    return db.knowledgeGraphEdge.update({
      where: { id: existing.id },
      data: { weight: input.weight, metadata: input.metadata },
    });
  }
  return createEdge(input);
}

// ---------------------------------------------------------------------------
// Search Index
// ---------------------------------------------------------------------------

export async function searchIndex(input: {
  query: string;
  entityTypes?: string[];
  language?: string;
  subject?: string;
  difficulty?: string;
  resourceType?: string;
  isMarketplace?: boolean;
  isAiGenerated?: boolean;
  isVerified?: boolean;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.entityTypes && input.entityTypes.length > 0) {
    where.entityType = { in: input.entityTypes };
  }
  if (input.language) where.language = input.language;
  if (input.subject) where.subject = input.subject;
  if (input.difficulty) where.difficulty = input.difficulty;
  if (input.resourceType) where.resourceType = input.resourceType;
  if (input.isMarketplace !== undefined) where.isMarketplace = input.isMarketplace;
  if (input.isAiGenerated !== undefined) where.isAiGenerated = input.isAiGenerated;
  if (input.isVerified !== undefined) where.isVerified = input.isVerified;

  // Text search — use OR on title, description, and searchText
  if (input.query) {
    const q = input.query.toLowerCase();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { searchText: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    db.searchIndexEntry.findMany({
      where,
      orderBy: [{ popularity: "desc" }, { quality: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.searchIndexEntry.count({ where }),
  ]);

  return { items, total };
}

export async function upsertSearchEntry(input: {
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  searchText?: string;
  language?: string;
  subject?: string;
  grade?: string;
  difficulty?: string;
  resourceType?: string;
  tags?: string;
  popularity?: number;
  quality?: number;
  ownerId?: string;
  orgId?: string;
  price?: number;
  isMarketplace?: boolean;
  isVerified?: boolean;
  isAiGenerated?: boolean;
}) {
  return db.searchIndexEntry.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } },
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      description: input.description ?? null,
      searchText: input.searchText ?? input.title.toLowerCase(),
      language: input.language ?? "en",
      subject: input.subject,
      grade: input.grade,
      difficulty: input.difficulty,
      resourceType: input.resourceType,
      tags: input.tags ?? "[]",
      popularity: input.popularity ?? 0,
      quality: input.quality ?? 0.5,
      ownerId: input.ownerId,
      orgId: input.orgId,
      price: input.price,
      isMarketplace: input.isMarketplace ?? false,
      isVerified: input.isVerified ?? false,
      isAiGenerated: input.isAiGenerated ?? false,
    },
    update: {
      title: input.title,
      description: input.description,
      searchText: input.searchText ?? input.title.toLowerCase(),
      language: input.language,
      subject: input.subject,
      grade: input.grade,
      difficulty: input.difficulty,
      resourceType: input.resourceType,
      tags: input.tags,
      popularity: input.popularity,
      quality: input.quality,
      ownerId: input.ownerId,
      orgId: input.orgId,
      price: input.price,
      isMarketplace: input.isMarketplace,
      isVerified: input.isVerified,
      isAiGenerated: input.isAiGenerated,
    },
  });
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function findTopics(parentId?: string | null) {
  return db.topic.findMany({
    where: parentId === undefined ? {} : { parentId: parentId ?? null },
    include: {
      _count: { select: { children: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function findTopicById(id: string) {
  return db.topic.findUnique({
    where: { id },
    include: {
      children: true,
      prerequisites: { include: { toTopic: true } },
      requiredFor: { include: { fromTopic: true } },
    },
  });
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
  aliases?: string;
  keywords?: string;
}) {
  return db.topic.create({
    data: {
      name: input.name,
      description: input.description,
      parentId: input.parentId,
      difficulty: input.difficulty ?? "medium",
      recommendedAge: input.recommendedAge,
      estimatedStudyTimeMin: input.estimatedStudyTimeMin,
      language: input.language ?? "en",
      slug: input.slug,
      aliases: input.aliases ?? "[]",
      keywords: input.keywords ?? "[]",
    },
  });
}

// ---------------------------------------------------------------------------
// Search Analytics
// ---------------------------------------------------------------------------

export async function recordSearchEvent(input: {
  userId?: string;
  query: string;
  locale?: string;
  resultCount: number;
  clickedEntityId?: string;
  clickedEntityType?: string;
  crossLanguageMatch?: boolean;
  responseTimeMs?: number;
}) {
  return db.searchAnalyticsEvent.create({
    data: {
      userId: input.userId,
      query: input.query,
      locale: input.locale ?? "en",
      resultCount: input.resultCount,
      clickedEntityId: input.clickedEntityId,
      clickedEntityType: input.clickedEntityType,
      crossLanguageMatch: input.crossLanguageMatch ?? false,
      responseTimeMs: input.responseTimeMs,
    },
  });
}

export async function getPopularSearches(limit = 20) {
  return db.searchAnalyticsEvent.groupBy({
    by: ["query"],
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: limit,
  });
}

export async function getFailedSearches(limit = 20) {
  return db.searchAnalyticsEvent.findMany({
    where: { resultCount: 0 },
    select: { query: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
