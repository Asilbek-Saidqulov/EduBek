/**
 * EduBek — Semantic search repository.
 *
 * Direct Prisma access for Embeddings, UserInterestProfiles,
 * RecommendationCache, SearchSession, LearningIntent, SemanticCluster,
 * and RecommendationAnalytics events.
 *
 * All functions are pure data-access — no business logic, no scoring,
 * no side effects beyond DB writes.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

export async function findEmbedding(entityType: string, entityId: string) {
  return db.embedding.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}

export async function findEmbeddingsForEntities(
  refs: Array<{ entityType: string; entityId: string }>,
) {
  if (refs.length === 0) return [];
  // SQLite doesn't support composite IN, so fetch by OR clauses.
  // Use AND inside each OR clause to express the composite key.
  return db.embedding.findMany({
    where: {
      OR: refs.map((r) => ({
        AND: [{ entityType: r.entityType }, { entityId: r.entityId }],
      })),
    },
  });
}

export async function upsertEmbedding(input: {
  entityType: string;
  entityId: string;
  vector: string;
  model?: string;
  contentHash?: string | null;
}) {
  return db.embedding.upsert({
    where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } },
    create: {
      entityType: input.entityType,
      entityId: input.entityId,
      vector: input.vector,
      model: input.model ?? "edubek-hash-v1",
      contentHash: input.contentHash,
    },
    update: {
      vector: input.vector,
      model: input.model,
      contentHash: input.contentHash,
    },
  });
}

export async function findAllEmbeddings(entityType?: string, limit = 1000) {
  return db.embedding.findMany({
    where: entityType ? { entityType } : undefined,
    take: limit,
    select: { id: true, entityType: true, entityId: true, vector: true, model: true, contentHash: true },
  });
}

export async function deleteEmbedding(entityType: string, entityId: string) {
  return db.embedding.deleteMany({
    where: { AND: [{ entityType }, { entityId }] },
  });
}

export async function countEmbeddings(entityType?: string): Promise<number> {
  return db.embedding.count({ where: entityType ? { entityType } : undefined });
}

// ---------------------------------------------------------------------------
// User Interest Profile
// ---------------------------------------------------------------------------

export async function findInterestProfile(userId: string) {
  return db.userInterestProfile.findUnique({ where: { userId } });
}

export async function upsertInterestProfile(input: {
  userId: string;
  interests?: string;
  mastery?: string;
  topicAffinity?: string;
  signals?: string;
  lastComputedAt?: Date;
}) {
  return db.userInterestProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      interests: input.interests ?? "{}",
      mastery: input.mastery ?? "{}",
      topicAffinity: input.topicAffinity ?? "{}",
      signals: input.signals ?? "{}",
      lastComputedAt: input.lastComputedAt,
    },
    update: {
      interests: input.interests,
      mastery: input.mastery,
      topicAffinity: input.topicAffinity,
      signals: input.signals,
      lastComputedAt: input.lastComputedAt,
    },
  });
}

// ---------------------------------------------------------------------------
// Recommendation Cache
// ---------------------------------------------------------------------------

export async function findRecommendationCache(userId: string, strategy: string, locale: string) {
  return db.recommendationCache.findUnique({
    where: { userId_strategy_locale: { userId, strategy, locale } },
  });
}

export async function findFreshRecommendationCache(
  userId: string,
  strategy: string,
  locale: string,
) {
  const cached = await db.recommendationCache.findUnique({
    where: { userId_strategy_locale: { userId, strategy, locale } },
  });
  if (!cached) return null;
  if (cached.expiresAt < new Date()) return null;
  return cached;
}

export async function upsertRecommendationCache(input: {
  userId: string;
  strategy: string;
  locale: string;
  recommendations: string;
  expiresAt: Date;
}) {
  return db.recommendationCache.upsert({
    where: {
      userId_strategy_locale: {
        userId: input.userId,
        strategy: input.strategy,
        locale: input.locale,
      },
    },
    create: {
      userId: input.userId,
      strategy: input.strategy,
      locale: input.locale,
      recommendations: input.recommendations,
      expiresAt: input.expiresAt,
    },
    update: {
      recommendations: input.recommendations,
      expiresAt: input.expiresAt,
    },
  });
}

export async function deleteExpiredCaches(): Promise<number> {
  const result = await db.recommendationCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ---------------------------------------------------------------------------
// Search Session
// ---------------------------------------------------------------------------

export async function createSearchSession(input: {
  userId?: string;
  query: string;
  locale?: string;
  intent?: string;
  intentConfidence?: number;
  resultCount?: number;
  clickedEntityId?: string;
  clickedEntityType?: string;
  refinementQuery?: string;
}) {
  return db.searchSession.create({ data: input });
}

export async function findRecentSearchSessions(userId: string, limit = 20) {
  return db.searchSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findRecentSearchSessionsByQuery(query: string, limit = 20) {
  return db.searchSession.findMany({
    where: { query: { contains: query } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Learning Intent
// ---------------------------------------------------------------------------

export async function createLearningIntent(input: {
  userId?: string;
  query: string;
  intent: string;
  confidence: number;
  extractedEntities?: string;
}) {
  return db.learningIntent.create({ data: input });
}

export async function findRecentIntents(userId?: string, limit = 50) {
  return db.learningIntent.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Semantic Clusters
// ---------------------------------------------------------------------------

export async function findClusters(topicId?: string) {
  return db.semanticCluster.findMany({
    where: topicId ? { topicId } : undefined,
  });
}

export async function findCluster(id: string) {
  return db.semanticCluster.findUnique({ where: { id } });
}

export async function createCluster(input: {
  name: string;
  description?: string;
  members: string;
  centroid: string;
  topicId?: string;
}) {
  return db.semanticCluster.create({ data: input });
}

export async function upsertClusterByName(input: {
  name: string;
  description?: string;
  members: string;
  centroid: string;
  topicId?: string;
}) {
  const existing = await db.semanticCluster.findFirst({ where: { name: input.name } });
  if (existing) {
    return db.semanticCluster.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        members: input.members,
        centroid: input.centroid,
        topicId: input.topicId,
      },
    });
  }
  return db.semanticCluster.create({ data: input });
}

// ---------------------------------------------------------------------------
// Recommendation Analytics
// ---------------------------------------------------------------------------

export async function recordRecommendationEvent(input: {
  userId?: string;
  entityType: string;
  entityId: string;
  eventType: string;
  strategy?: string;
  surface?: string;
  position?: number;
  locale?: string;
}) {
  // Stored as a SearchSession row with a special marker in `refinementQuery`.
  // This avoids adding a new Prisma model while still letting us query
  // recommendation events independently of search sessions.
  return db.searchSession.create({
    data: {
      userId: input.userId,
      query: `__rec:${input.eventType}`,
      locale: input.locale ?? "en",
      intent: input.strategy,
      intentConfidence: input.position ? Number(input.position) : undefined,
      clickedEntityId: input.entityId,
      clickedEntityType: input.entityType,
      refinementQuery: input.surface,
    },
  });
}

export async function getRecommendationAnalytics(
  userId: string,
  sinceDays = 30,
): Promise<{
  totalImpressions: number;
  totalClicks: number;
  totalCompletes: number;
  totalHelpful: number;
  totalNotHelpful: number;
  totalDismissals: number;
  perStrategy: Record<string, { impressions: number; clicks: number; ctr: number }>;
}> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const events = await db.searchSession.findMany({
    where: {
      userId,
      query: { startsWith: "__rec:" },
      createdAt: { gte: since },
    },
    select: { query: true, intent: true },
  });

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCompletes = 0;
  let totalHelpful = 0;
  let totalNotHelpful = 0;
  let totalDismissals = 0;
  const perStrategy: Record<string, { impressions: number; clicks: number; ctr: number }> = {};

  for (const e of events) {
    const type = e.query.replace("__rec:", "");
    const strategy = e.intent ?? "unknown";
    if (!perStrategy[strategy]) perStrategy[strategy] = { impressions: 0, clicks: 0, ctr: 0 };
    switch (type) {
      case "impression":
        totalImpressions += 1;
        perStrategy[strategy].impressions += 1;
        break;
      case "click":
      case "open":
        totalClicks += 1;
        perStrategy[strategy].clicks += 1;
        break;
      case "complete":
        totalCompletes += 1;
        break;
      case "helpful":
        totalHelpful += 1;
        break;
      case "not_helpful":
        totalNotHelpful += 1;
        break;
      case "dismiss":
        totalDismissals += 1;
        break;
    }
  }
  for (const s of Object.values(perStrategy)) {
    s.ctr = s.impressions > 0 ? s.clicks / s.impressions : 0;
  }

  return {
    totalImpressions,
    totalClicks,
    totalCompletes,
    totalHelpful,
    totalNotHelpful,
    totalDismissals,
    perStrategy,
  };
}
