/**
 * EduBek — Retrieval Evaluator (System 5).
 *
 * Evaluates RAG (Retrieval-Augmented Generation) performance: precision,
 * recall, relevance, evidence overlap, ranking quality, chunk
 * usefulness, embedding effectiveness, and missing knowledge.
 *
 * Deterministic — never invokes an LLM. Reuses Cognitive AI's
 * `retrieveEvidence` for actual retrieval comparison.
 */
import { getLogger } from "@/lib/logger";
import type {
  RetrievalEvaluationReport, RetrievalMetrics,
} from "./types";

const log = getLogger("retrieval-evaluator");

export async function evaluateRetrieval(input: {
  query: string;
  retrievedEvidence: Array<{ id: string; content: string; source: string; relevance: number; confidence: number }>;
  expectedEvidence?: Array<{ content: string; source: string }>;
}): Promise<RetrievalEvaluationReport> {
  const { query, retrievedEvidence, expectedEvidence = [] } = input;
  const metrics = computeMetrics(query, retrievedEvidence, expectedEvidence);
  const suggestions = generateSuggestions(metrics);
  const overallScore = computeOverallScore(metrics);

  log.info("retrieval.evaluate_complete", {
    query: query.slice(0, 50), retrieved: retrievedEvidence.length,
    precision: metrics.precision, overall: overallScore,
  });

  return {
    generatedAt: new Date().toISOString(),
    query,
    metrics,
    suggestions,
    overallRetrievalScore: overallScore,
  };
}

function computeMetrics(
  query: string,
  retrieved: Array<{ id: string; content: string; source: string; relevance: number; confidence: number }>,
  expected: Array<{ content: string; source: string }>,
): RetrievalMetrics {
  // Precision: fraction of retrieved items that are relevant (relevance > 0.5)
  const relevantCount = retrieved.filter(r => r.relevance > 0.5).length;
  const precision = retrieved.length > 0 ? relevantCount / retrieved.length : 0;

  // Recall: fraction of expected items that were retrieved
  const expectedFound = expected.filter(e =>
    retrieved.some(r => r.content.toLowerCase().includes(e.content.toLowerCase().slice(0, 50)))
  ).length;
  const recall = expected.length > 0 ? expectedFound / expected.length : 1.0;

  // Relevance: average relevance score of retrieved items
  const relevance = retrieved.length > 0
    ? retrieved.reduce((s, r) => s + r.relevance, 0) / retrieved.length
    : 0;

  // Evidence overlap: how much retrieved evidence overlaps with expected
  const evidenceOverlap = expected.length > 0 ? expectedFound / expected.length : 1.0;

  // Ranking quality: are relevant items ranked higher?
  const sortedByRelevance = [...retrieved].sort((a, b) => b.relevance - a.relevance);
  const rankingCorrect = retrieved.filter((r, i) =>
    r.id === sortedByRelevance[i]?.id && r.relevance > 0.5
  ).length;
  const rankingQuality = retrieved.length > 0 ? rankingCorrect / retrieved.length : 0;

  // Chunk usefulness: are retrieved chunks long enough to be useful?
  const usefulChunks = retrieved.filter(r => r.content.length > 50).length;
  const chunkUsefulness = retrieved.length > 0 ? usefulChunks / retrieved.length : 0;

  // Embedding effectiveness: how well do embeddings match the query?
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const matchedChunks = retrieved.filter(r => {
    const chunkWords = new Set(r.content.toLowerCase().split(/\s+/));
    const overlap = Array.from(queryWords).filter(w => chunkWords.has(w)).length;
    return overlap / queryWords.size > 0.2;
  }).length;
  const embeddingEffectiveness = retrieved.length > 0 ? matchedChunks / retrieved.length : 0;

  // Missing knowledge: what expected items were NOT retrieved?
  const missingKnowledge = expected
    .filter(e => !retrieved.some(r => r.content.toLowerCase().includes(e.content.toLowerCase().slice(0, 50))))
    .map(e => e.content.slice(0, 80));

  return {
    precision: Math.round(precision * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    relevance: Math.round(relevance * 100) / 100,
    evidenceOverlap: Math.round(evidenceOverlap * 100) / 100,
    rankingQuality: Math.round(rankingQuality * 100) / 100,
    chunkUsefulness: Math.round(chunkUsefulness * 100) / 100,
    embeddingEffectiveness: Math.round(embeddingEffectiveness * 100) / 100,
    missingKnowledge,
  };
}

function generateSuggestions(metrics: RetrievalMetrics): Array<{ parameter: string; currentValue: string; suggestedValue: string; reason: string }> {
  const suggestions: Array<{ parameter: string; currentValue: string; suggestedValue: string; reason: string }> = [];
  if (metrics.precision < 0.5) {
    suggestions.push({
      parameter: "retrieval_threshold",
      currentValue: "0.3",
      suggestedValue: "0.5",
      reason: `Precision is ${(metrics.precision * 100).toFixed(0)}% — raise the relevance threshold to filter out low-quality results.`,
    });
  }
  if (metrics.recall < 0.5) {
    suggestions.push({
      parameter: "top_k",
      currentValue: "5",
      suggestedValue: "10",
      reason: `Recall is ${(metrics.recall * 100).toFixed(0)}% — increase top-k to retrieve more results.`,
    });
  }
  if (metrics.chunkUsefulness < 0.7) {
    suggestions.push({
      parameter: "chunk_size",
      currentValue: "256 tokens",
      suggestedValue: "512 tokens",
      reason: "Chunk usefulness is low — larger chunks may provide better context.",
    });
  }
  if (metrics.embeddingEffectiveness < 0.5) {
    suggestions.push({
      parameter: "embedding_model",
      currentValue: "current",
      suggestedValue: "voyage-2 or openai-embedding-3-small",
      reason: "Embedding effectiveness is low — consider a better embedding model.",
    });
  }
  if (metrics.rankingQuality < 0.7) {
    suggestions.push({
      parameter: "ranking_weights",
      currentValue: "semantic: 1.0",
      suggestedValue: "semantic: 0.7, keyword: 0.3",
      reason: "Ranking quality is low — add keyword matching to improve ranking.",
    });
  }
  if (metrics.missingKnowledge.length > 0) {
    suggestions.push({
      parameter: "knowledge_sources",
      currentValue: "current sources",
      suggestedValue: "add missing sources",
      reason: `${metrics.missingKnowledge.length} expected item(s) were not found — consider adding more knowledge sources.`,
    });
  }
  return suggestions;
}

function computeOverallScore(metrics: RetrievalMetrics): number {
  const weights = {
    precision: 0.2, recall: 0.2, relevance: 0.15,
    rankingQuality: 0.15, chunkUsefulness: 0.1,
    embeddingEffectiveness: 0.1, evidenceOverlap: 0.1,
  };
  const score = metrics.precision * weights.precision
    + metrics.recall * weights.recall
    + metrics.relevance * weights.relevance
    + metrics.rankingQuality * weights.rankingQuality
    + metrics.chunkUsefulness * weights.chunkUsefulness
    + metrics.embeddingEffectiveness * weights.embeddingEffectiveness
    + metrics.evidenceOverlap * weights.evidenceOverlap;
  return Math.round(score * 100) / 100;
}
