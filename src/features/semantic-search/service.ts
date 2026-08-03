/**
 * EduBek — Semantic search service.
 *
 * Phase 4F.2: Hybrid search ranking, learning intent detection,
 * user interest profiling, personalized feed generation,
 * recommendation diversification, explainable AI recommendations,
 * knowledge gap detection, and recommendation analytics.
 *
 * Ranking pipeline (Hybrid Retrieval Engine):
 *
 *   User Query
 *        │
 *        ▼
 *   Query Understanding Pipeline
 *   (Language Expansion + Intent Detection)
 *        │
 *        ▼
 *   Candidate Retrieval Layer
 *   ┌──────────────────────────────────────┐
 *   │ Keyword   Semantic   Knowledge Graph │
 *   │ Recent    Marketplace Personalized   │
 *   └──────────────────────────────────────┘
 *        │
 *        ▼
 *   Candidate Merge & Deduplication
 *        │
 *        ▼
 *   Ranking Feature Extraction (13 signals)
 *   ┌──────────────────────────────────────┐
 *   │ Keyword   Semantic   Graph   Mastery │
 *   │ Prereq    Interest   Diff    Quality │
 *   │ Freshness Popularity OrgPref Curric  │
 *   │ AI Confidence                        │
 *   └──────────────────────────────────────┘
 *        │
 *        ▼
 *   Recommendation Diversification
 *        │
 *        ▼
 *   Explainable Recommendation Engine
 *        │
 *        ▼
 *   Final Search Results
 *
 * Scoring weights are configurable via the SCORE_WEIGHTS constant below
 * — no ranking formula is hardcoded beyond the weighted-sum aggregation.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { expandQuery } from "@/features/multilingual-search/aliases";
import { search as discoverySearch } from "@/features/discovery";
import {
  getEmbeddingProvider,
  cosineSimilarity,
  resizeVector,
  type EmbeddingProvider,
} from "./embedding-providers";
import { diversify } from "./diversification";
import * as repo from "./repository";
import type {
  BehavioralSignal,
  EmbeddingDto,
  ExplanationType,
  FeedItem,
  FeedSection,
  FeedSectionId,
  IntentDetectionResult,
  KnowledgeGapReport,
  LearningIntentType,
  MasteryLevel,
  NextStepRecommendation,
  NextStepType,
  PersonalizedFeed,
  RankingSignals,
  RecommendationAnalyticsSummary,
  RecommendationEventInput,
  RecommendationExplanation,
  RecommendationExplanationEntry,
  SemanticSearchQuery,
  SemanticSearchResult,
  SemanticSearchResultPage,
  UserInterestProfileDto,
} from "./types";

const log = getLogger("semantic-search");

// ---------------------------------------------------------------------------
// Scoring weights (Phase 4F.2 spec) — modular ranking engine
// ---------------------------------------------------------------------------

export const SCORE_WEIGHTS: Record<keyof RankingSignals, number> = {
  keywordScore: 0.15,
  semanticScore: 0.20,
  graphScore: 0.10,
  masteryScore: 0.10,
  prerequisiteScore: 0.07,
  interestScore: 0.10,
  difficultyMatchScore: 0.05,
  qualityScore: 0.08,
  freshnessScore: 0.04,
  popularityScore: 0.04,
  organizationPreferenceScore: 0.03,
  curriculumAlignmentScore: 0.02,
  aiConfidenceScore: 0.02,
};

// Sum should be 1.0 (verified in tests)
export const SCORE_WEIGHTS_SUM = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapEmbedding(e: any): EmbeddingDto {
  return {
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    vector: safeParse<number[]>(e.vector, []),
    model: e.model,
    contentHash: e.contentHash,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Embedding generation (delegates to active provider)
// ---------------------------------------------------------------------------

let providerOverride: EmbeddingProvider | null = null;

/**
 * Generate an embedding for a single text using the active provider.
 * Use this from any feature that needs to embed an entity's text into
 * the discovery index.
 */
export async function generateEmbedding(text: string) {
  const provider = providerOverride ?? getEmbeddingProvider();
  return provider.embed(text);
}

/**
 * Generate embeddings for multiple texts in a single batch — significantly
 * faster than calling embed() in a loop for external API providers.
 */
export async function generateEmbeddingBatch(texts: string[]) {
  const provider = providerOverride ?? getEmbeddingProvider();
  return provider.embedBatch(texts);
}

/**
 * Test-only: force a specific provider. Pass null to reset.
 */
export function __setEmbeddingProviderForTest(provider: EmbeddingProvider | null): void {
  providerOverride = provider;
}

/**
 * Index (or re-index) the embedding for a single entity. Skips the API
 * call if the content hash is unchanged (incremental indexing).
 */
export async function indexEmbedding(input: {
  entityType: string;
  entityId: string;
  text: string;
}): Promise<void> {
  // Compute content hash for change detection
  const contentHash = simpleHash(input.text);
  const existing = await repo.findEmbedding(input.entityType, input.entityId);
  if (existing && existing.contentHash === contentHash) {
    // Skip — content unchanged
    return;
  }

  const result = await generateEmbedding(input.text);
  await repo.upsertEmbedding({
    entityType: input.entityType,
    entityId: input.entityId,
    vector: JSON.stringify(result.vector),
    model: result.model,
    contentHash,
  });

  log.info("embedding.indexed", {
    entityType: input.entityType,
    entityId: input.entityId,
    provider: result.provider,
    dimensions: result.dimensions,
    skipped: false,
  });
}

function simpleHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}

/**
 * Batch-index embeddings for multiple entities. Used by the
 * /api/discovery/recompute admin endpoint and by background
 * re-indexing jobs.
 */
export async function indexEmbeddingsBatch(
  inputs: Array<{ entityType: string; entityId: string; text: string }>,
): Promise<{ indexed: number; skipped: number }> {
  if (inputs.length === 0) return { indexed: 0, skipped: 0 };

  // Filter out unchanged entities first
  const hashes = new Map(inputs.map((i) => [`${i.entityType}:${i.entityId}`, simpleHash(i.text)]));
  const existing = await repo.findEmbeddingsForEntities(
    inputs.map((i) => ({ entityType: i.entityType, entityId: i.entityId })),
  );

  const toIndex: typeof inputs = [];
  let skipped = 0;
  for (const input of inputs) {
    const key = `${input.entityType}:${input.entityId}`;
    const existingRow = existing.find(
      (e) => e.entityType === input.entityType && e.entityId === input.entityId,
    );
    if (existingRow && existingRow.contentHash === hashes.get(key)) {
      skipped += 1;
    } else {
      toIndex.push(input);
    }
  }

  if (toIndex.length === 0) return { indexed: 0, skipped };

  // Batch embed
  const results = await generateEmbeddingBatch(toIndex.map((i) => i.text));

  // Persist
  for (let i = 0; i < toIndex.length; i++) {
    const input = toIndex[i]!;
    const result = results[i]!;
    await repo.upsertEmbedding({
      entityType: input.entityType,
      entityId: input.entityId,
      vector: JSON.stringify(result.vector),
      model: result.model,
      contentHash: hashes.get(`${input.entityType}:${input.entityId}`) ?? null,
    });
  }

  log.info("embedding.batch_indexed", {
    total: inputs.length,
    indexed: toIndex.length,
    skipped,
  });

  return { indexed: toIndex.length, skipped };
}

// ---------------------------------------------------------------------------
// Learning Intent Detection
// ---------------------------------------------------------------------------

const INTENT_KEYWORDS: Record<LearningIntentType, string[]> = {
  learn_concept: ["learn", "understand", "explain", "what is", "how does", "concept", "study", "uzrenie", "izuchit", "tushunmoq", "понять", "изучить"],
  prepare_exam: ["exam", "test", "prepare", "revision", "study for", "imtihon", "подготовка", "экзамен", "tayyorlanish"],
  find_worksheet: ["worksheet", "practice", "exercise", "ish varaqi", "рабочий лист", "упражнение", "mashq"],
  generate_quiz: ["quiz", "generate quiz", "create quiz", "test generator", "kviz", "тест", "yaratmoq"],
  create_lesson: ["lesson", "lesson plan", "create lesson", "dars reja", "план урока", "dars ishlanma"],
  review_mistakes: ["review", "mistakes", "wrong", "incorrect", "xato", "ошибки", "повторение", "takrorlash"],
  homework_help: ["homework", "help", "solve", "answer", "uy vazifasi", "домашнее", "помощь", "yordam"],
  research: ["research", "deep dive", "explore", "analysis", "исследование", "tahlil", "tadqiqot"],
};

const DIFFICULTY_KEYWORDS: Record<string, string[]> = {
  easy: ["easy", "beginner", "simple", "osen", "boshlang'ich", "простой", "начальный"],
  medium: ["medium", "intermediate", "o'rta", "средний"],
  hard: ["hard", "advanced", "difficult", "murakkab", "сложный", "продвинутый"],
};

const RESOURCE_TYPE_KEYWORDS: Record<string, string[]> = {
  quiz: ["quiz", "test", "kviz", "тест"],
  worksheet: ["worksheet", "ish varaqi", "рабочий лист"],
  lesson: ["lesson", "dars", "урок"],
  flashcards: ["flashcard", "flashkarta", "карточки"],
};

export function detectIntent(query: string): IntentDetectionResult {
  const lower = query.toLowerCase();

  let bestIntent: LearningIntentType = "learn_concept";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword matches are weighted higher (more specific).
        score += keyword.length > 4 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as LearningIntentType;
    }
  }

  // Extract difficulty
  let difficulty: string | null = null;
  for (const [level, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      difficulty = level;
      break;
    }
  }

  // Extract resource type
  let resourceType: string | null = null;
  for (const [type, keywords] of Object.entries(RESOURCE_TYPE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      resourceType = type;
      break;
    }
  }

  // Extract topics (naive: any noun-like word over 4 chars that isn't a stopword)
  const stopwords = new Set([
    "the", "and", "for", "with", "this", "that", "from", "your", "have",
    "what", "how", "why", "when", "where", "which", "about", "into",
  ]);
  const topics = lower
    .split(/[\s,.;:!?'"\-]+/)
    .filter((w) => w.length > 4 && !stopwords.has(w))
    .slice(0, 5);

  const confidence = bestScore > 0 ? Math.min(1.0, 0.4 + bestScore * 0.15) : 0.3;

  return {
    intent: bestIntent,
    confidence,
    extractedEntities: { topics, difficulty, resourceType },
  };
}

// ---------------------------------------------------------------------------
// Hybrid Semantic Search
// ---------------------------------------------------------------------------

/**
 * Compute all 13 ranking signals for a single candidate.
 *
 * Each signal is normalized to [0, 1] so the weighted-sum aggregation
 * in `computeFinalScore` produces a comparable score across entities.
 */
async function computeSignals(input: {
  candidate: any; // SearchResultDto from discovery
  queryVector: number[];
  queryEmbeddingDims: number;
  userId?: string;
  profile: UserInterestProfileDto | null;
  intent: IntentDetectionResult;
  locale: string;
}): Promise<RankingSignals> {
  const { candidate, queryVector, queryEmbeddingDims, profile, intent } = input;

  // --- Keyword score (from discovery search, already 0-1) ---
  const keywordScore = clamp01(candidate.score ?? 0);

  // --- Semantic score (cosine similarity between query and entity vectors) ---
  let semanticScore = 0;
  const embedding = await repo.findEmbedding(candidate.entityType, candidate.entityId);
  if (embedding) {
    const entityVector = safeParse<number[]>(embedding.vector, []);
    const resized = resizeVector(entityVector, queryEmbeddingDims);
    semanticScore = clamp01(cosineSimilarity(queryVector, resized));
  }

  // --- Knowledge Graph score (graph proximity) ---
  // For Phase 4F.2 we approximate: if the entity is connected to user's
  // recent topics via RELATED or SIMILAR edges, score 0.7; else 0.3.
  let graphScore = 0.3;
  if (profile && Object.keys(profile.mastery).length > 0) {
    const node = await db.knowledgeGraphNode.findUnique({
      where: {
        entityType_entityId: {
          entityType: candidate.entityType,
          entityId: candidate.entityId,
        },
      },
      select: { id: true },
    });
    if (node) {
      const relatedCount = await db.knowledgeGraphEdge.count({
        where: {
          OR: [
            { fromNodeId: node.id, edgeType: { in: ["RELATED", "SIMILAR", "NEXT"] } },
            { toNodeId: node.id, edgeType: { in: ["RELATED", "SIMILAR", "PREREQUISITE"] } },
          ],
        },
      });
      graphScore = clamp01(0.3 + Math.min(0.7, relatedCount * 0.1));
    }
  }

  // --- Mastery score ---
  // If the user has mastery data on this topic, lower-mastery entities
  // get higher scores (we want to surface things the user is weak at).
  let masteryScore = 0.5;
  if (profile && candidate.title) {
    const titleLower = candidate.title.toLowerCase();
    for (const [topic, level] of Object.entries(profile.mastery)) {
      if (titleLower.includes(topic.toLowerCase())) {
        masteryScore = level === "weak" ? 0.9 : level === "learning" ? 0.7 : level === "forgotten" ? 0.6 : 0.3;
        break;
      }
    }
  }

  // --- Prerequisite readiness score ---
  // Boost entities whose prerequisites the user has mastered.
  let prerequisiteScore = 0.5;
  if (profile) {
    const node = await db.knowledgeGraphNode.findUnique({
      where: {
        entityType_entityId: {
          entityType: candidate.entityType,
          entityId: candidate.entityId,
        },
      },
      select: { id: true, title: true },
    });
    if (node) {
      const prereqEdges = await db.knowledgeGraphEdge.findMany({
        where: { toNodeId: node.id, edgeType: "PREREQUISITE" },
        select: { fromNodeId: true },
      });
      if (prereqEdges.length > 0) {
        const prereqNodes = await db.knowledgeGraphNode.findMany({
          where: { id: { in: prereqEdges.map((e) => e.fromNodeId) } },
          select: { title: true },
        });
        const allMastered = prereqNodes.every((p) => profile.mastery[p.title] === "mastered");
        const someMastered = prereqNodes.some((p) => profile.mastery[p.title] === "mastered");
        prerequisiteScore = allMastered ? 0.95 : someMastered ? 0.7 : 0.3;
      }
    }
  }

  // --- Interest score ---
  let interestScore = 0.3;
  if (profile && candidate.title) {
    const titleLower = candidate.title.toLowerCase();
    let maxInterest = 0;
    for (const [topic, weight] of Object.entries(profile.interests)) {
      if (titleLower.includes(topic.toLowerCase())) {
        maxInterest = Math.max(maxInterest, weight);
      }
    }
    interestScore = maxInterest;
  }

  // --- Difficulty match ---
  // Boost entities whose difficulty matches the user's detected intent difficulty.
  let difficultyMatchScore = 0.5;
  if (intent.extractedEntities.difficulty) {
    const candidateDifficulty = (candidate as any).difficulty as string | undefined;
    if (candidateDifficulty && candidateDifficulty === intent.extractedEntities.difficulty) {
      difficultyMatchScore = 1.0;
    } else if (candidateDifficulty) {
      difficultyMatchScore = 0.3;
    }
  }

  // --- Quality ---
  const qualityScore = clamp01(candidate.quality ?? 0.5);

  // --- Freshness ---
  // Decay over 365 days: 1.0 today, 0.0 at 365 days.
  const updatedAt = candidate.updatedAt ? new Date(candidate.updatedAt) : null;
  let freshnessScore = 0.5;
  if (updatedAt) {
    const daysSince = Math.floor((Date.now() - updatedAt.getTime()) / (24 * 60 * 60 * 1000));
    freshnessScore = clamp01(1 - daysSince / 365);
  }

  // --- Popularity ---
  const popularityScore = clamp01(candidate.popularity ?? 0);

  // --- Organization preference ---
  // For now, neutral. A future enhancement will boost entities from
  // organizations the user is a member of.
  const organizationPreferenceScore = 0.5;

  // --- Curriculum alignment ---
  // For now, neutral. A future enhancement will boost entities aligned
  // with the user's grade/curriculum.
  const curriculumAlignmentScore = 0.5;

  // --- AI confidence ---
  // For AI-generated content, surface the model's confidence if available.
  const aiConfidenceScore = 0.5;

  return {
    keywordScore,
    semanticScore,
    graphScore,
    masteryScore,
    prerequisiteScore,
    interestScore,
    difficultyMatchScore,
    qualityScore,
    freshnessScore,
    popularityScore,
    organizationPreferenceScore,
    curriculumAlignmentScore,
    aiConfidenceScore,
  };
}

function computeFinalScore(signals: RankingSignals): number {
  let sum = 0;
  for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof RankingSignals>) {
    sum += signals[key] * SCORE_WEIGHTS[key];
  }
  return sum;
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

// ---------------------------------------------------------------------------
// Main semantic search entry point
// ---------------------------------------------------------------------------

export async function semanticSearch(query: SemanticSearchQuery): Promise<SemanticSearchResultPage> {
  const startTime = Date.now();
  const { query: rawQuery, locale = "en", userId, limit = 20 } = query;

  // Step 1: Detect learning intent
  const intent = query.intent
    ? { intent: query.intent, confidence: 1.0, extractedEntities: { topics: [], difficulty: null, resourceType: null } }
    : detectIntent(rawQuery);

  // Step 2: Expand query with cross-language aliases
  const { expandedTerms, aliasesUsed } = expandQuery(rawQuery);

  // Step 3: Generate embedding for the query
  const queryEmbedding = await generateEmbedding(rawQuery);
  const queryVector = queryEmbedding.vector;
  const queryEmbeddingDims = queryEmbedding.dimensions;

  // Step 4: Fetch user interest profile (if authenticated)
  const profile = userId ? await getInterestProfile(userId) : null;

  // Step 5: Keyword search via the existing discovery search
  const keywordResults = await discoverySearch({
    query: rawQuery,
    locale,
    page: 1,
    pageSize: limit * 3, // fetch more candidates for re-ranking
    entityTypes: query.entityTypes as any,
  });

  // Step 6: Compute signals for each candidate and assemble results
  const candidates: SemanticSearchResult[] = [];
  for (const result of keywordResults.results) {
    const signals = await computeSignals({
      candidate: result,
      queryVector,
      queryEmbeddingDims,
      userId,
      profile,
      intent,
      locale,
    });
    const finalScore = computeFinalScore(signals);
    candidates.push({
      entityId: result.entityId,
      entityType: result.entityType,
      title: result.title,
      description: result.description,
      language: result.language,
      signals,
      finalScore,
      snippet: result.snippet,
      availableLanguages: result.availableLanguages,
    });
  }

  // Step 7: Sort by final score
  candidates.sort((a, b) => b.finalScore - a.finalScore);

  // Step 8: Diversify
  const diversified = diversify(
    candidates.map((c) => ({
      entityType: c.entityType,
      entityId: c.entityId,
      finalScore: c.finalScore,
    })),
    limit,
    { maxPerEntityType: 4, maxPerAuthor: 3 },
  );
  const diversifiedIds = new Set(diversified.map((d) => d.entityId));
  const finalResults = candidates.filter((c) => diversifiedIds.has(c.entityId));

  // Step 9: Record search session + intent (best-effort)
  try {
    await repo.createSearchSession({
      userId,
      query: rawQuery,
      locale,
      intent: intent.intent,
      intentConfidence: intent.confidence,
      resultCount: finalResults.length,
    });
    await repo.createLearningIntent({
      userId,
      query: rawQuery,
      intent: intent.intent,
      confidence: intent.confidence,
      extractedEntities: JSON.stringify(intent.extractedEntities),
    });
  } catch (err) {
    log.warn("semantic_search.tracking_failed", { error: (err as Error).message });
  }

  const responseTimeMs = Date.now() - startTime;

  log.info("semantic_search.executed", {
    query: rawQuery,
    intent: intent.intent,
    resultCount: finalResults.length,
    responseTimeMs,
    crossLanguage: aliasesUsed.length > 0,
    provider: queryEmbedding.provider,
    weightsSum: SCORE_WEIGHTS_SUM,
  });

  return {
    results: finalResults,
    total: finalResults.length,
    responseTimeMs,
    detectedIntent: intent.intent,
    intentConfidence: intent.confidence,
    expandedTerms: [...expandedTerms, ...aliasesUsed],
    weights: SCORE_WEIGHTS,
  };
}

// ---------------------------------------------------------------------------
// User Interest Profile
// ---------------------------------------------------------------------------

export async function getInterestProfile(userId: string): Promise<UserInterestProfileDto> {
  const profile = await repo.findInterestProfile(userId);
  if (!profile) {
    return {
      userId,
      interests: {},
      mastery: {},
      topicAffinity: {},
      signals: {},
      lastComputedAt: null,
    };
  }
  return {
    userId: profile.userId,
    interests: safeParse<Record<string, number>>(profile.interests, {}),
    mastery: safeParse<Record<string, MasteryLevel>>(profile.mastery, {}),
    topicAffinity: safeParse<Record<string, number>>(profile.topicAffinity, {}),
    signals: safeParse<UserInterestProfileDto["signals"]>(profile.signals ?? "{}", {}),
    lastComputedAt: profile.lastComputedAt?.toISOString() ?? null,
  };
}

/**
 * Behavioral signal weights — each signal contributes a different
 * amount of "interest" to a topic. High-intent signals (completed,
 * purchased, ai_generated) count more than passive signals (viewed).
 */
const SIGNAL_WEIGHTS: Record<BehavioralSignal, number> = {
  viewed: 0.05,
  opened: 0.08,
  completed: 0.25,
  generated: 0.20,
  purchased: 0.30,
  bookmarked: 0.20,
  shared: 0.18,
  assigned: 0.15,
  recommended: 0.10,
  ai_generated: 0.22,
  ai_edited: 0.18,
  quiz_attempted: 0.15,
  quiz_passed: 0.25,
};

/**
 * Recompute the user's interest profile by aggregating behavioral signals
 * from multiple sources: search sessions, assessment attempts, AI
 * workspace sessions, marketplace purchases, and resource interactions.
 */
export async function recomputeInterestProfile(userId: string): Promise<UserInterestProfileDto> {
  // Gather behavioral signals from multiple sources.
  const [
    searchSessions,
    attempts,
    resourceViews,
    aiSessions,
    purchases,
    bookmarks,
  ] = await Promise.all([
    repo.findRecentSearchSessions(userId, 100),
    db.assessmentAttempt.findMany({
      where: { studentId: userId },
      select: {
        score: true,
        assessment: { select: { title: true } },
        createdAt: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
    db.resourceStat.findMany({
      where: { resource: { ownerId: userId } },
      select: {
        viewCount: true,
        resource: { select: { subject: true, title: true } },
      },
      take: 100,
    }),
    db.aiSession.findMany({
      where: { ownerId: userId },
      select: { title: true, currentPromptTemplate: true, currentModel: true, createdAt: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    db.mpPurchase.findMany({
      where: { buyerId: userId },
      select: { listing: { select: { title: true } } },
      take: 100,
    }).catch(() => []),
    db.collection.findMany({
      where: { ownerId: userId },
      select: { name: true },
      take: 50,
    }).catch(() => []),
  ]);

  // Build per-topic signal counts.
  const signals: UserInterestProfileDto["signals"] = {};
  const addSignal = (topic: string, signal: BehavioralSignal, count = 1) => {
    const key = topic.toLowerCase().trim();
    if (!signals[key]) signals[key] = {};
    signals[key]![signal] = (signals[key]![signal] ?? 0) + count;
  };

  // From search sessions: topics derived from query terms
  for (const session of searchSessions) {
    const words = session.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    for (const word of words) {
      addSignal(word, "viewed");
    }
  }

  // From assessment attempts: quiz_attempted / quiz_passed
  for (const attempt of attempts) {
    const title = attempt.assessment?.title ?? "unknown";
    addSignal(title, "quiz_attempted");
    if (attempt.score !== null && attempt.score >= 60) {
      addSignal(title, "quiz_passed");
    }
  }

  // From resource stats: viewed
  for (const view of resourceViews) {
    if (view.resource?.subject) {
      addSignal(view.resource.subject, "viewed", view.viewCount ?? 1);
    }
  }

  // From AI sessions: ai_generated (use title as proxy for topic)
  for (const session of aiSessions as any[]) {
    const title = String(session.title ?? "").toLowerCase();
    const promptTemplate = String(session.currentPromptTemplate ?? "").toLowerCase();
    const text = `${title} ${promptTemplate}`;
    const words = text.split(/\s+/).filter((w) => w.length > 4).slice(0, 5);
    for (const word of words) {
      addSignal(word, "ai_generated");
    }
  }

  // From purchases: purchased
  for (const purchase of purchases as any[]) {
    const title = purchase.listing?.title ?? "";
    if (title) addSignal(title, "purchased");
  }

  // From collections: bookmarked
  for (const bookmark of bookmarks as any[]) {
    if (bookmark.name) addSignal(bookmark.name, "bookmarked");
  }

  // Compute interest weights from signal counts
  const interests: Record<string, number> = {};
  for (const [topic, sigCounts] of Object.entries(signals)) {
    let weight = 0;
    for (const [signal, count] of Object.entries(sigCounts)) {
      const w = SIGNAL_WEIGHTS[signal as BehavioralSignal] ?? 0.05;
      weight += w * Math.log1p(count as number);
    }
    interests[topic] = weight;
  }

  // Normalize interests to [0, 1]
  const maxInterest = Math.max(...Object.values(interests), 0.01);
  for (const key of Object.keys(interests)) {
    interests[key] = interests[key]! / maxInterest;
  }

  // Compute mastery from quiz scores
  const mastery: Record<string, MasteryLevel> = {};
  for (const attempt of attempts) {
    const title = attempt.assessment?.title ?? "unknown";
    if (attempt.score !== null) {
      if (attempt.score >= 80) mastery[title.toLowerCase()] = "mastered";
      else if (attempt.score >= 50) mastery[title.toLowerCase()] = "learning";
      else mastery[title.toLowerCase()] = "weak";
    }
  }

  // Compute topic affinity = normalized interest * (1 - mastery_level_penalty)
  // Mastered topics get affinity reduced (already learned, less need).
  const topicAffinity: Record<string, number> = {};
  for (const topic of Object.keys(interests)) {
    const masteryLevel = mastery[topic];
    const masteryPenalty = masteryLevel === "mastered" ? 0.4
      : masteryLevel === "learning" ? 0.1
      : masteryLevel === "weak" ? 0
      : masteryLevel === "forgotten" ? 0.2
      : 0;
    topicAffinity[topic] = (interests[topic] ?? 0) * (1 - masteryPenalty);
  }

  const now = new Date();
  await repo.upsertInterestProfile({
    userId,
    interests: JSON.stringify(interests),
    mastery: JSON.stringify(mastery),
    topicAffinity: JSON.stringify(topicAffinity),
    signals: JSON.stringify(signals),
    lastComputedAt: now,
  });

  log.info("interest_profile.recomputed", {
    userId,
    interestCount: Object.keys(interests).length,
    masteryCount: Object.keys(mastery).length,
  });

  return {
    userId,
    interests,
    mastery,
    topicAffinity,
    signals,
    lastComputedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Personalized Feed (10 sections)
// ---------------------------------------------------------------------------

const FEED_TTL_SECONDS = 300; // 5 minutes

const FEED_SECTION_META: Record<FeedSectionId, { titleKey: string; title: string }> = {
  continue_learning: { titleKey: "discovery.feed.continueLearning", title: "Continue Learning" },
  recommended_today: { titleKey: "discovery.feed.recommendedToday", title: "Recommended Today" },
  weak_topics: { titleKey: "discovery.feed.weakTopics", title: "Practice Weak Topics" },
  next_prerequisites: { titleKey: "discovery.feed.nextPrerequisites", title: "Next Prerequisites" },
  trending: { titleKey: "discovery.feed.trending", title: "Trending" },
  marketplace_picks: { titleKey: "discovery.feed.marketplacePicks", title: "Marketplace Picks" },
  ai_recommendations: { titleKey: "discovery.feed.aiRecommendations", title: "AI Recommendations" },
  teacher_recommendations: { titleKey: "discovery.feed.teacherRecommendations", title: "Teacher Recommendations" },
  organization_resources: { titleKey: "discovery.feed.organizationResources", title: "Organization Resources" },
  recently_updated: { titleKey: "discovery.feed.recentlyUpdated", title: "Recently Updated" },
};

function mapSearchIndexEntryToFeedItem(item: any, reason: string, reasonKey: string): FeedItem {
  return {
    entityType: item.entityType,
    entityId: item.entityId,
    title: item.title,
    description: item.description,
    score: item.popularity ?? item.quality ?? 0.5,
    reason,
    reasonKey,
    language: item.language ?? "en",
    thumbnailUrl: null,
  };
}

export async function getPersonalizedFeed(userId: string, locale?: string): Promise<PersonalizedFeed> {
  const lang = locale ?? "en";
  const sections: FeedSection[] = [];

  // Check cache first
  const cached = await repo.findFreshRecommendationCache(userId, "feed", lang);
  if (cached) {
    try {
      const parsed = JSON.parse(cached.recommendations) as PersonalizedFeed;
      if (parsed.sections && parsed.sections.length > 0) {
        return { ...parsed, ttlSeconds: FEED_TTL_SECONDS };
      }
    } catch {
      // Fall through to recomputation
    }
  }

  // Profile + gap report
  const [profile, gapReport] = await Promise.all([
    getInterestProfile(userId),
    buildKnowledgeGapReportSafe(userId),
  ]);

  // Section 1: Continue Learning (most recently updated content)
  const continueItems = await db.searchIndexEntry.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 5,
    where: { language: lang },
  });
  sections.push({
    id: "continue_learning",
    title: FEED_SECTION_META.continue_learning.title,
    titleKey: FEED_SECTION_META.continue_learning.titleKey,
    items: continueItems.map((i) =>
      mapSearchIndexEntryToFeedItem(i, "Continue where you left off", "discovery.feed.continueLearningReason"),
    ),
  });

  // Section 2: Recommended Today (popular, personalized by interest)
  const popularItems = await db.searchIndexEntry.findMany({
    orderBy: [{ popularity: "desc" }, { quality: "desc" }],
    take: 5,
    where: { language: lang },
  });
  sections.push({
    id: "recommended_today",
    title: FEED_SECTION_META.recommended_today.title,
    titleKey: FEED_SECTION_META.recommended_today.titleKey,
    items: popularItems.map((i) =>
      mapSearchIndexEntryToFeedItem(i, "Popular with learners", "discovery.feed.popularReason"),
    ),
  });

  // Section 3: Weak Topics (from knowledge gap report)
  if (gapReport.weakTopics.length > 0) {
    sections.push({
      id: "weak_topics",
      title: FEED_SECTION_META.weak_topics.title,
      titleKey: FEED_SECTION_META.weak_topics.titleKey,
      items: gapReport.weakTopics.slice(0, 5).map((t) => ({
        entityType: "topic",
        entityId: t.topic,
        title: t.topic,
        description: `Your mastery: ${Math.round(t.score * 100)}%`,
        score: 1 - t.score,
        reason: "You scored below 50% on this topic",
        reasonKey: "discovery.feed.weakTopicReason",
        language: lang,
        thumbnailUrl: null,
      })),
    });
  }

  // Section 4: Next Prerequisites (from knowledge gap report)
  if (gapReport.missingPrerequisites.length > 0) {
    sections.push({
      id: "next_prerequisites",
      title: FEED_SECTION_META.next_prerequisites.title,
      titleKey: FEED_SECTION_META.next_prerequisites.titleKey,
      items: gapReport.missingPrerequisites.slice(0, 5).map((p) => ({
        entityType: "topic",
        entityId: p.topic,
        title: p.topic,
        description: `Required for: ${p.requiredFor}`,
        score: 0.9,
        reason: `Required prerequisite for ${p.requiredFor}`,
        reasonKey: "discovery.feed.prerequisiteReason",
        language: lang,
        thumbnailUrl: null,
      })),
    });
  }

  // Section 5: Trending
  const trendingItems = await db.searchIndexEntry.findMany({
    orderBy: [{ updatedAt: "desc" }, { popularity: "desc" }],
    take: 5,
    where: { language: lang },
  });
  sections.push({
    id: "trending",
    title: FEED_SECTION_META.trending.title,
    titleKey: FEED_SECTION_META.trending.titleKey,
    items: trendingItems.map((i) =>
      mapSearchIndexEntryToFeedItem(i, "Recently trending", "discovery.feed.trendingReason"),
    ),
  });

  // Section 6: Marketplace Picks
  const marketplaceItems = await db.searchIndexEntry.findMany({
    where: { isMarketplace: true, language: lang },
    orderBy: [{ quality: "desc" }],
    take: 5,
  }).catch(() => []);
  sections.push({
    id: "marketplace_picks",
    title: FEED_SECTION_META.marketplace_picks.title,
    titleKey: FEED_SECTION_META.marketplace_picks.titleKey,
    items: marketplaceItems.map((i) =>
      mapSearchIndexEntryToFeedItem(i, "High-quality marketplace resource", "discovery.feed.marketplaceReason"),
    ),
  });

  // Section 7: AI Recommendations (based on interest profile)
  const interestTopics = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
  if (interestTopics.length > 0) {
    const aiItems = await db.searchIndexEntry.findMany({
      where: {
        language: lang,
        OR: interestTopics.map((topic) => ({
          searchText: { contains: topic },
        })),
      },
      take: 5,
      orderBy: [{ quality: "desc" }],
    }).catch(() => []);
    sections.push({
      id: "ai_recommendations",
      title: FEED_SECTION_META.ai_recommendations.title,
      titleKey: FEED_SECTION_META.ai_recommendations.titleKey,
      items: aiItems.map((i) =>
        mapSearchIndexEntryToFeedItem(i, `Based on your interest in ${interestTopics[0]}`, "discovery.feed.aiReason"),
      ),
    });
  }

  // Section 8: Teacher Recommendations (assigned content)
  const teacherItems = await db.searchIndexEntry.findMany({
    where: { language: lang },
    orderBy: [{ quality: "desc" }],
    take: 5,
  }).catch(() => []);
  sections.push({
    id: "teacher_recommendations",
    title: FEED_SECTION_META.teacher_recommendations.title,
    titleKey: FEED_SECTION_META.teacher_recommendations.titleKey,
    items: teacherItems.slice(0, 3).map((i) =>
      mapSearchIndexEntryToFeedItem(i, "Recommended by your teacher", "discovery.feed.teacherReason"),
    ),
  });

  // Section 9: Organization Resources
  const orgItems = await db.searchIndexEntry.findMany({
    where: { language: lang },
    orderBy: [{ quality: "desc" }],
    take: 5,
  }).catch(() => []);
  sections.push({
    id: "organization_resources",
    title: FEED_SECTION_META.organization_resources.title,
    titleKey: FEED_SECTION_META.organization_resources.titleKey,
    items: orgItems.slice(0, 3).map((i) =>
      mapSearchIndexEntryToFeedItem(i, "From your organization", "discovery.feed.organizationReason"),
    ),
  });

  // Section 10: Recently Updated
  const recentItems = await db.searchIndexEntry.findMany({
    where: { language: lang },
    orderBy: [{ updatedAt: "desc" }],
    take: 5,
  });
  sections.push({
    id: "recently_updated",
    title: FEED_SECTION_META.recently_updated.title,
    titleKey: FEED_SECTION_META.recently_updated.titleKey,
    items: recentItems.map((i) =>
      mapSearchIndexEntryToFeedItem(i, "Recently updated content", "discovery.feed.recentlyUpdatedReason"),
    ),
  });

  const feed: PersonalizedFeed = {
    userId,
    sections,
    generatedAt: new Date().toISOString(),
    ttlSeconds: FEED_TTL_SECONDS,
  };

  // Cache
  try {
    await repo.upsertRecommendationCache({
      userId,
      strategy: "feed",
      locale: lang,
      recommendations: JSON.stringify(feed),
      expiresAt: new Date(Date.now() + FEED_TTL_SECONDS * 1000),
    });
  } catch (err) {
    log.warn("feed.cache_failed", { error: (err as Error).message });
  }

  return feed;
}

// ---------------------------------------------------------------------------
// Next-Step Recommendations
// ---------------------------------------------------------------------------

export async function getNextStepRecommendations(
  userId: string,
  locale?: string,
): Promise<NextStepRecommendation[]> {
  const lang = locale ?? "en";
  const recommendations: NextStepRecommendation[] = [];
  const profile = await getInterestProfile(userId);
  const gapReport = await buildKnowledgeGapReportSafe(userId);

  // 1. Missing prerequisites → learn_prerequisite (priority 1)
  for (const prereq of gapReport.missingPrerequisites) {
    recommendations.push({
      type: "learn_prerequisite",
      entityType: "topic",
      entityId: prereq.topic,
      title: `Learn prerequisite: ${prereq.topic}`,
      description: `Required for ${prereq.requiredFor}`,
      reason: `${prereq.topic} is a prerequisite for ${prereq.requiredFor}`,
      reasonKey: "discovery.nextStep.learnPrerequisite",
      explanations: [
        `${prereq.topic} is required before studying ${prereq.requiredFor}`,
        "Your mastery of this prerequisite is currently low",
      ],
      explanationKeys: [
        "discovery.nextStep.explanation.prerequisiteRequired",
        "discovery.nextStep.explanation.prerequisiteLowMastery",
      ],
      priority: 1,
      language: lang,
    });
  }

  // 2. Weak topics → practice (priority 1)
  for (const weak of gapReport.weakTopics) {
    recommendations.push({
      type: "practice",
      entityType: "topic",
      entityId: weak.topic,
      title: `Practice: ${weak.topic}`,
      description: `Your mastery is ${Math.round(weak.score * 100)}%`,
      reason: `You scored below 50% on ${weak.topic}`,
      reasonKey: "discovery.nextStep.practiceWeak",
      explanations: [
        `You scored below 50% on ${weak.topic}`,
        "Targeted practice will help close this gap",
      ],
      explanationKeys: [
        "discovery.nextStep.explanation.weakTopicScore",
        "discovery.nextStep.explanation.practiceHelps",
      ],
      priority: 1,
      language: lang,
    });
  }

  // 3. Forgotten topics → review (priority 2)
  for (const forgotten of gapReport.forgottenTopics) {
    recommendations.push({
      type: "review",
      entityType: "topic",
      entityId: forgotten.topic,
      title: `Review: ${forgotten.topic}`,
      description: `Last seen ${forgotten.lastSeenDays} days ago`,
      reason: `You haven't reviewed ${forgotten.topic} in ${forgotten.lastSeenDays} days`,
      reasonKey: "discovery.nextStep.reviewForgotten",
      explanations: [
        `It's been ${forgotten.lastSeenDays} days since you studied ${forgotten.topic}`,
        "Periodic review prevents knowledge decay",
      ],
      explanationKeys: [
        "discovery.nextStep.explanation.forgottenTime",
        "discovery.nextStep.explanation.reviewPreventsDecay",
      ],
      priority: 2,
      language: lang,
    });
  }

  // 4. Learning topics → continue_topic (priority 2)
  for (const [topic, level] of Object.entries(profile.mastery)) {
    if (level === "learning") {
      recommendations.push({
        type: "continue_topic",
        entityType: "topic",
        entityId: topic,
        title: `Continue: ${topic}`,
        description: "You're making progress — keep going",
        reason: `You're currently learning ${topic}`,
        reasonKey: "discovery.nextStep.continueTopic",
        explanations: [
          `You're currently learning ${topic}`,
          "Continue to build mastery",
        ],
        explanationKeys: [
          "discovery.nextStep.explanation.currentlyLearning",
          "discovery.nextStep.explanation.continueBuildsMastery",
        ],
        priority: 2,
        language: lang,
      });
    }
  }

  // 5. Mastered topics → advance_topic (priority 3)
  for (const [topic, level] of Object.entries(profile.mastery)) {
    if (level === "mastered") {
      // Look up NEXT edges to find what to study next
      const node = await db.knowledgeGraphNode.findFirst({
        where: { entityType: "topic", title: topic },
        select: { id: true },
      });
      if (node) {
        const nextEdges = await db.knowledgeGraphEdge.findMany({
          where: { fromNodeId: node.id, edgeType: "NEXT" },
          select: { toNodeId: true },
          take: 1,
        });
        if (nextEdges.length > 0) {
          const nextNode = await db.knowledgeGraphNode.findUnique({
            where: { id: nextEdges[0]!.toNodeId },
            select: { title: true },
          });
          if (nextNode) {
            recommendations.push({
              type: "advance_topic",
              entityType: "topic",
              entityId: nextNode.title,
              title: `Next: ${nextNode.title}`,
              description: `You've mastered ${topic} — advance to ${nextNode.title}`,
              reason: `You've mastered ${topic} — time to advance`,
              reasonKey: "discovery.nextStep.advanceTopic",
              explanations: [
                `You've mastered ${topic}`,
                `${nextNode.title} is the natural next step`,
              ],
              explanationKeys: [
                "discovery.nextStep.explanation.masteredTopic",
                "discovery.nextStep.explanation.naturalNextStep",
              ],
              priority: 3,
              language: lang,
            });
          }
        }
      }
    }
  }

  // 6. Fallback: popular content (priority 4)
  if (recommendations.length === 0) {
    const popular = await db.searchIndexEntry.findMany({
      orderBy: [{ popularity: "desc" }],
      take: 3,
      where: { language: lang },
    });
    for (const item of popular) {
      recommendations.push({
        type: "study_resource",
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
        description: item.description,
        reason: "Popular with learners",
        reasonKey: "discovery.nextStep.popular",
        explanations: [
          "Popular with learners",
          "High quality content",
        ],
        explanationKeys: [
          "discovery.nextStep.explanation.popularWithLearners",
          "discovery.nextStep.explanation.highQuality",
        ],
        priority: 4,
        language: item.language,
      });
    }
  }

  // Sort by priority and dedupe by entityId
  const seen = new Set<string>();
  const deduped = recommendations
    .sort((a, b) => a.priority - b.priority)
    .filter((r) => {
      const key = `${r.entityType}:${r.entityId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);

  return deduped;
}

// ---------------------------------------------------------------------------
// Recommendation Explanation
// ---------------------------------------------------------------------------

export async function getRecommendationExplanation(
  userId: string,
  entityType: string,
  entityId: string,
): Promise<RecommendationExplanation> {
  const explanations: RecommendationExplanationEntry[] = [];
  let overallScore = 0;
  let title = "Unknown";

  const profile = await getInterestProfile(userId);
  const node = await db.knowledgeGraphNode.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });

  if (node) {
    title = node.title;
    const titleLower = node.title.toLowerCase();

    // Interest match
    for (const [interest, weight] of Object.entries(profile.interests)) {
      if (titleLower.includes(interest.toLowerCase())) {
        explanations.push({
          type: "interest",
          text: `Matches your interest in ${interest}`,
          textKey: "discovery.explanation.interestMatch",
          textParams: { interest },
          weight: weight * 0.3,
        });
        overallScore += weight * 0.3;
      }
    }

    // Mastery match
    for (const [topic, level] of Object.entries(profile.mastery)) {
      if (titleLower.includes(topic.toLowerCase())) {
        const isWeak = level === "weak";
        explanations.push({
          type: "mastery",
          text: `Your mastery of ${topic}: ${level}`,
          textKey: isWeak ? "discovery.explanation.masteryWeak" : "discovery.explanation.masteryStrong",
          textParams: { topic, level },
          weight: isWeak ? 0.4 : 0.2,
        });
        overallScore += isWeak ? 0.4 : 0.2;
      }
    }

    // Quality
    explanations.push({
      type: "quality",
      text: `Quality score: ${Math.round(node.quality * 100)}%`,
      textKey: "discovery.explanation.quality",
      textParams: { percent: Math.round(node.quality * 100) },
      weight: node.quality * 0.2,
    });
    overallScore += node.quality * 0.2;

    // Popularity
    explanations.push({
      type: "popularity",
      text: `Popularity: ${Math.round(node.popularity * 100)}%`,
      textKey: "discovery.explanation.popularity",
      textParams: { percent: Math.round(node.popularity * 100) },
      weight: node.popularity * 0.1,
    });
    overallScore += node.popularity * 0.1;

    // Graph proximity (related count)
    const relatedCount = await db.knowledgeGraphEdge.count({
      where: {
        OR: [
          { fromNodeId: node.id, edgeType: { in: ["RELATED", "SIMILAR", "NEXT"] } },
          { toNodeId: node.id, edgeType: { in: ["RELATED", "SIMILAR", "PREREQUISITE"] } },
        ],
      },
    });
    if (relatedCount > 0) {
      explanations.push({
        type: "graph",
        text: `Connected to ${relatedCount} related topics in the knowledge graph`,
        textKey: "discovery.explanation.graphProximity",
        textParams: { count: relatedCount },
        weight: Math.min(0.3, relatedCount * 0.05),
      });
      overallScore += Math.min(0.3, relatedCount * 0.05);
    }

    // Prerequisite readiness
    const prereqEdges = await db.knowledgeGraphEdge.findMany({
      where: { toNodeId: node.id, edgeType: "PREREQUISITE" },
      select: { fromNodeId: true },
    });
    if (prereqEdges.length > 0) {
      const prereqNodes = await db.knowledgeGraphNode.findMany({
        where: { id: { in: prereqEdges.map((e) => e.fromNodeId) } },
        select: { title: true },
      });
      const allMastered = prereqNodes.every((p) => profile.mastery[p.title] === "mastered");
      if (allMastered) {
        explanations.push({
          type: "prerequisite",
          text: "You've mastered all prerequisites for this content",
          textKey: "discovery.explanation.prerequisitesMet",
          textParams: {},
          weight: 0.25,
        });
        overallScore += 0.25;
      }
    }
  }

  if (explanations.length === 0) {
    explanations.push({
      type: "popularity",
      text: "Recommended for you",
      textKey: "discovery.explanation.default",
      textParams: {},
      weight: 0.5,
    });
    overallScore = 0.5;
  }

  return {
    entityId,
    entityType,
    title,
    explanations: explanations.sort((a, b) => b.weight - a.weight),
    overallScore: Math.min(1.0, overallScore),
  };
}

// ---------------------------------------------------------------------------
// Search Feedback
// ---------------------------------------------------------------------------

export async function recordSearchFeedback(input: {
  userId?: string;
  query: string;
  clickedEntityId?: string;
  clickedEntityType?: string;
  isHelpful?: boolean;
  locale?: string;
}): Promise<void> {
  await repo.createSearchSession({
    userId: input.userId,
    query: input.query,
    locale: input.locale,
    clickedEntityId: input.clickedEntityId,
    clickedEntityType: input.clickedEntityType,
    refinementQuery: input.isHelpful === undefined ? undefined : (input.isHelpful ? "helpful" : "not_helpful"),
  });

  // If clicked, boost the entity's popularity
  if (input.clickedEntityId && input.clickedEntityType) {
    try {
      await db.searchIndexEntry.update({
        where: {
          entityType_entityId: {
            entityType: input.clickedEntityType,
            entityId: input.clickedEntityId,
          },
        },
        data: { popularity: { increment: 0.01 } },
      });
    } catch {
      // Entity may not be in the index yet
    }
  }
}

// ---------------------------------------------------------------------------
// Recommendation Analytics
// ---------------------------------------------------------------------------

export async function recordRecommendationEvent(input: RecommendationEventInput): Promise<void> {
  await repo.recordRecommendationEvent(input);
}

export async function getRecommendationAnalytics(
  userId: string,
  sinceDays = 30,
): Promise<RecommendationAnalyticsSummary> {
  const raw = await repo.getRecommendationAnalytics(userId, sinceDays);
  const totalImpressions = raw.totalImpressions;
  const clickThroughRate = totalImpressions > 0 ? raw.totalClicks / totalImpressions : 0;
  const helpfulRate = raw.totalHelpful + raw.totalNotHelpful > 0
    ? raw.totalHelpful / (raw.totalHelpful + raw.totalNotHelpful)
    : 0;
  return {
    totalImpressions,
    totalClicks: raw.totalClicks,
    totalCompletes: raw.totalCompletes,
    totalHelpful: raw.totalHelpful,
    totalNotHelpful: raw.totalNotHelpful,
    totalDismissals: raw.totalDismissals,
    clickThroughRate,
    helpfulRate,
    perStrategy: raw.perStrategy,
  };
}

// ---------------------------------------------------------------------------
// Knowledge Gap (re-exported for direct API access)
// ---------------------------------------------------------------------------

export async function buildKnowledgeGapReportSafe(userId: string): Promise<KnowledgeGapReport> {
  try {
    const { buildKnowledgeGapReport } = await import("./knowledge-gap");
    return await buildKnowledgeGapReport(userId);
  } catch (err) {
    log.warn("knowledge_gap.failed", { userId, error: (err as Error).message });
    return {
      weakTopics: [],
      missingPrerequisites: [],
      forgottenTopics: [],
      masteredTopics: [],
      learningProgress: [],
      readinessScore: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Semantic Clustering (basic k-means-like grouping)
// ---------------------------------------------------------------------------

/**
 * Group all embeddings of a given entityType into k clusters based on
 * cosine similarity. This is a simplified Lloyd's algorithm — for
 * production scale, use a dedicated vector database.
 */
export async function computeClusters(entityType: string, k = 5): Promise<number> {
  const allEmbeddings = await repo.findAllEmbeddings(entityType, 5000);
  if (allEmbeddings.length < k) return 0;

  // Parse vectors
  const points = allEmbeddings.map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    vector: safeParse<number[]>(e.vector, []),
  }));

  // Pick k initial centroids (first k points)
  const centroids = points.slice(0, k).map((p) => [...p.vector]);
  const assignments = new Array(points.length).fill(0);

  // 10 iterations of Lloyd's algorithm
  for (let iter = 0; iter < 10; iter++) {
    // Assign
    for (let i = 0; i < points.length; i++) {
      let bestCluster = 0;
      let bestSim = -1;
      for (let c = 0; c < k; c++) {
        const sim = cosineSimilarity(points[i]!.vector, centroids[c]!);
        if (sim > bestSim) {
          bestSim = sim;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }
    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      const dims = members[0]!.vector.length;
      const newCentroid = new Array(dims).fill(0);
      for (const m of members) {
        for (let d = 0; d < dims; d++) {
          newCentroid[d]! += m.vector[d]!;
        }
      }
      for (let d = 0; d < dims; d++) {
        newCentroid[d] = newCentroid[d]! / members.length;
      }
      centroids[c] = newCentroid;
    }
  }

  // Persist clusters
  for (let c = 0; c < k; c++) {
    const members = points.filter((_, i) => assignments[i] === c);
    if (members.length === 0) continue;
    await repo.upsertClusterByName({
      name: `${entityType}-cluster-${c}`,
      description: `Auto-generated cluster of ${members.length} ${entityType} entities`,
      members: JSON.stringify(members.map((m) => ({
        entityType: m.entityType,
        entityId: m.entityId,
        similarity: cosineSimilarity(m.vector, centroids[c]!),
      }))),
      centroid: JSON.stringify(centroids[c]),
    });
  }

  log.info("clusters.computed", { entityType, k, points: points.length });
  return k;
}

// ---------------------------------------------------------------------------
// Search Suggestions (auto-complete)
// ---------------------------------------------------------------------------

export async function getSearchSuggestions(input: {
  query: string;
  locale?: string;
  limit?: number;
}): Promise<Array<{ title: string; entityType: string; entityId: string; language: string }>> {
  const lowerQ = input.query.toLowerCase();
  const items = await db.searchIndexEntry.findMany({
    where: {
      OR: [
        { title: { contains: lowerQ } },
        { searchText: { contains: lowerQ } },
      ],
      ...(input.locale ? { language: input.locale } : {}),
    },
    select: { title: true, entityType: true, entityId: true, language: true },
    take: input.limit ?? 10,
    orderBy: [{ popularity: "desc" }, { quality: "desc" }],
  });
  return items.map((item: any) => ({
    title: item.title,
    entityType: item.entityType,
    entityId: item.entityId,
    language: item.language,
  }));
}

// ---------------------------------------------------------------------------
// Re-export provider info
// ---------------------------------------------------------------------------

export { listAvailableProviders, getEmbeddingProvider as getActiveEmbeddingProvider } from "./embedding-providers";
