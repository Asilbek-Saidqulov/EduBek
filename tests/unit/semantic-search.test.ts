/**
 * EduBek — Phase 4F.2 Semantic Search & Recommendations tests.
 *
 * Verifies:
 *   - Embedding provider architecture (hash provider determinism, registry, fallback)
 *   - Cosine similarity math
 *   - Vector resize
 *   - Learning intent detection (multilingual)
 *   - Recommendation diversification (per-bucket caps, ratio caps)
 *   - Score weights sum to 1.0
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  HashEmbeddingProvider,
  GeminiEmbeddingProvider,
  OpenAIEmbeddingProvider,
  getEmbeddingProvider,
  listAvailableProviders,
  cosineSimilarity,
  resizeVector,
  __setEmbeddingProviderForTest,
} from "@/features/semantic-search/embedding-providers";
import {
  detectIntent,
  SCORE_WEIGHTS,
  SCORE_WEIGHTS_SUM,
} from "@/features/semantic-search/service";
import { diversify } from "@/features/semantic-search/diversification";
import type { LearningIntentType } from "@/features/semantic-search/types";

// ---------------------------------------------------------------------------
// Embedding Provider Architecture
// ---------------------------------------------------------------------------

describe("Embedding Provider Architecture", () => {
  afterEach(() => {
    __setEmbeddingProviderForTest(null);
  });

  it("hash provider generates deterministic 256-dim normalized vectors", async () => {
    const provider = new HashEmbeddingProvider();
    const r1 = await provider.embed("photosynthesis");
    const r2 = await provider.embed("photosynthesis");

    expect(r1.vector).toHaveLength(256);
    expect(r1.dimensions).toBe(256);
    expect(r1.provider).toBe("hash");
    expect(r1.model).toBe("edubek-hash-v1");
    expect(r1.vector).toEqual(r2.vector); // deterministic

    // L2-normalized: magnitude is approximately 1
    const magnitude = Math.sqrt(r1.vector.reduce((s, v) => s + v * v, 0));
    expect(magnitude).toBeCloseTo(1.0, 5);
  });

  it("hash provider returns empty-vector magnitude 0 for empty input (no division by zero)", async () => {
    const provider = new HashEmbeddingProvider();
    const result = await provider.embed("");
    expect(result.vector).toHaveLength(256);
    // No exception, magnitude 0 acceptable
    const magnitude = Math.sqrt(result.vector.reduce((s, v) => s + v * v, 0));
    expect(magnitude).toBe(0);
  });

  it("hash provider batch embedding returns one result per input", async () => {
    const provider = new HashEmbeddingProvider();
    const results = await provider.embedBatch(["alpha", "beta", "gamma"]);
    expect(results).toHaveLength(3);
    expect(results[0]!.vector).not.toEqual(results[1]!.vector);
    expect(results[1]!.vector).not.toEqual(results[2]!.vector);
  });

  it("registry returns 9 providers", () => {
    const providers = listAvailableProviders();
    expect(providers).toHaveLength(9);
    const names = providers.map((p) => p.name).sort();
    expect(names).toEqual([
      "cohere",
      "edubek",
      "gemini",
      "hash",
      "jina",
      "local",
      "nomic",
      "openai",
      "voyage",
    ]);
  });

  it("getEmbeddingProvider returns hash by default and caches", () => {
    const p1 = getEmbeddingProvider();
    const p2 = getEmbeddingProvider();
    expect(p1).toBe(p2); // cached
    expect(p1.name).toBe("hash");
  });

  it("external providers fall back to hash when API key is missing", async () => {
    const gemini = new GeminiEmbeddingProvider();
    // No GEMINI_API_KEY in env — should fall back to hash
    const result = await gemini.embed("test text");
    expect(result.provider).toBe("hash");
    expect(result.dimensions).toBe(256);

    const openai = new OpenAIEmbeddingProvider();
    const result2 = await openai.embed("test text");
    expect(result2.provider).toBe("hash");
  });
});

// ---------------------------------------------------------------------------
// Vector math
// ---------------------------------------------------------------------------

describe("Vector math", () => {
  it("cosine similarity returns 1 for identical vectors", () => {
    const v = [1, 2, 3, 4];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("cosine similarity returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("cosine similarity returns 0 for empty or mismatched-length vectors", () => {
    expect(cosineSimilarity([], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("resizeVector pads with zeros or truncates", () => {
    expect(resizeVector([1, 2, 3], 5)).toEqual([1, 2, 3, 0, 0]);
    expect(resizeVector([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
    expect(resizeVector([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// Learning Intent Detection
// ---------------------------------------------------------------------------

describe("Learning Intent Detection", () => {
  it("detects 'learn_concept' intent for explain-style queries", () => {
    const result = detectIntent("how does photosynthesis work");
    expect(result.intent).toBe("learn_concept" as LearningIntentType);
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("detects 'prepare_exam' intent", () => {
    const result = detectIntent("prepare for my math exam");
    expect(result.intent).toBe("prepare_exam");
  });

  it("detects 'find_worksheet' intent", () => {
    const result = detectIntent("i need a worksheet on fractions");
    expect(result.intent).toBe("find_worksheet");
  });

  it("detects 'generate_quiz' intent", () => {
    const result = detectIntent("generate a quiz about geography");
    expect(result.intent).toBe("generate_quiz");
  });

  it("detects 'review_mistakes' intent (multilingual)", () => {
    const en = detectIntent("review my mistakes from last test");
    expect(en.intent).toBe("review_mistakes");

    const ru = detectIntent("повторение ошибок из теста");
    expect(ru.intent).toBe("review_mistakes");
  });

  it("detects 'homework_help' intent (multilingual)", () => {
    const uz = detectIntent("uy vazifasiga yordam kerak");
    expect(uz.intent).toBe("homework_help");
  });

  it("extracts difficulty from query", () => {
    const easy = detectIntent("easy algebra practice");
    expect(easy.extractedEntities.difficulty).toBe("easy");

    const hard = detectIntent("advanced physics problems");
    expect(hard.extractedEntities.difficulty).toBe("hard");
  });

  it("extracts resource type from query", () => {
    const worksheet = detectIntent("find me a worksheet");
    expect(worksheet.extractedEntities.resourceType).toBe("worksheet");

    const flashcards = detectIntent("i need flashcards for biology");
    expect(flashcards.extractedEntities.resourceType).toBe("flashcards");
  });

  it("falls back to 'learn_concept' for empty or ambiguous queries", () => {
    const result = detectIntent("zzz qqq");
    expect(result.intent).toBe("learn_concept");
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

// ---------------------------------------------------------------------------
// Recommendation Diversification
// ---------------------------------------------------------------------------

describe("Recommendation Diversification", () => {
  const makeItem = (
    id: string,
    score: number,
    overrides: Partial<{
      entityType: string;
      author: string;
      organizationId: string;
      difficulty: string;
      isAiGenerated: boolean;
      isMarketplace: boolean;
      topic: string;
    }> = {},
  ) => ({
    entityType: overrides.entityType ?? "resource",
    entityId: id,
    finalScore: score,
    author: overrides.author ?? null,
    organizationId: overrides.organizationId ?? null,
    difficulty: overrides.difficulty ?? null,
    isAiGenerated: overrides.isAiGenerated ?? false,
    isMarketplace: overrides.isMarketplace ?? false,
    topic: overrides.topic ?? null,
  });

  it("returns at most `targetCount` items", () => {
    // Use distinct entityTypes so per-type cap (default 3) doesn't kick in
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.05, { entityType: `type${i % 5}` }),
    );
    const result = diversify(items, 5);
    expect(result).toHaveLength(5);
  });

  it("respects maxPerEntityType cap", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`e${i}`, 1 - i * 0.05));
    const result = diversify(items, 10, { maxPerEntityType: 3 });
    const typeCount = result.filter((r) => r.entityType === "resource").length;
    expect(typeCount).toBeLessThanOrEqual(3);
  });

  it("respects maxPerAuthor cap", () => {
    // Use distinct entityTypes so per-type cap doesn't kick in before per-author
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.05, { author: "same-author", entityType: `type${i}` }),
    );
    const result = diversify(items, 6, { maxPerAuthor: 2 });
    const authorCount = result.filter((r) => r.author === "same-author").length;
    expect(authorCount).toBeLessThanOrEqual(2);
  });

  it("respects targetAiGeneratedRatio cap in pass 1 (soft cap relaxed in pass 2)", () => {
    // 10 items: 8 AI, 2 non-AI. Distinct entityTypes so per-type cap doesn't block.
    // Pass 1 (3 items): all AI accepted up to slot 3, then non-AI accepted to balance.
    // Pass 2 (filling remaining slots): relaxes AI ratio to fill target count.
    // Final ratio will be between 0.3 (strict pass-1 only) and 1.0 (no enforcement).
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.05, {
        isAiGenerated: i < 8,
        entityType: `type${i}`,
      }),
    );
    const result = diversify(items, 8, { targetAiGeneratedRatio: 0.3 });
    // Pass 1 accepts the first 3 AI items + 2 non-AI items = 5
    // Pass 2 fills remaining 3 slots with next-best AI items
    // Final: 6 AI / 8 total = 0.75
    // The test verifies: (a) at least some non-AI items made it in (balance achieved)
    const nonAiCount = result.filter((r) => !r.isAiGenerated).length;
    expect(nonAiCount).toBeGreaterThan(0); // some balance achieved
    expect(result).toHaveLength(8); // target count met
  });

  it("prevents adjacent items with same topic when allowAdjacentSameTopic is false", () => {
    // Use distinct entityTypes so per-type cap doesn't reduce below 5
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.05, {
        topic: i % 2 === 0 ? "topic-a" : "topic-b",
        entityType: `type${i}`,
      }),
    );
    const result = diversify(items, 5, { allowAdjacentSameTopic: false, maxPerEntityType: 10 });
    // Should not have back-to-back same-topic items
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.topic).not.toBe(result[i - 1]!.topic);
    }
  });

  it("does NOT relax strict caps in second pass (per-type cap is enforced)", () => {
    // 5 items all entityType 'resource' but cap is 1 — second pass should
    // also enforce the cap, so only 1 item is returned.
    const items = [
      makeItem("a", 0.9, { entityType: "resource" }),
      makeItem("b", 0.8, { entityType: "resource" }),
      makeItem("c", 0.7, { entityType: "resource" }),
      makeItem("d", 0.6, { entityType: "resource" }),
      makeItem("e", 0.5, { entityType: "resource" }),
    ];
    const result = diversify(items, 5, { maxPerEntityType: 1 });
    expect(result.length).toBe(1);
  });

  it("second pass DOES relax soft caps (AI ratio, marketplace ratio, adjacent topic)", () => {
    // 5 AI items, target 5, ratio 0.1 — pass 1 returns ~1, pass 2 should fill
    // remaining slots by relaxing the AI ratio cap.
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.1, {
        isAiGenerated: true,
        entityType: `type${i}`, // different types so per-type cap doesn't block
      }),
    );
    const result = diversify(items, 5, {
      targetAiGeneratedRatio: 0.1,
      maxPerEntityType: 5,
    });
    expect(result.length).toBe(5); // soft cap relaxed in second pass
  });

  it("preserves score-descending order when no caps apply", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem(`e${i}`, 1 - i * 0.1, { entityType: `type${i}` }),
    );
    const result = diversify(items, 5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.finalScore).toBeLessThanOrEqual(result[i - 1]!.finalScore);
    }
  });
});

// ---------------------------------------------------------------------------
// Score weights
// ---------------------------------------------------------------------------

describe("Ranking score weights", () => {
  it("sum of all weights is 1.0", () => {
    expect(SCORE_WEIGHTS_SUM).toBeCloseTo(1.0, 5);
  });

  it("all 13 signals are present", () => {
    const expected = [
      "keywordScore",
      "semanticScore",
      "graphScore",
      "masteryScore",
      "prerequisiteScore",
      "interestScore",
      "difficultyMatchScore",
      "qualityScore",
      "freshnessScore",
      "popularityScore",
      "organizationPreferenceScore",
      "curriculumAlignmentScore",
      "aiConfidenceScore",
    ];
    for (const key of expected) {
      expect(SCORE_WEIGHTS).toHaveProperty(key);
      expect(SCORE_WEIGHTS[key as keyof typeof SCORE_WEIGHTS]).toBeGreaterThan(0);
    }
  });

  it("semantic weight is the highest (per spec: semantic is primary)", () => {
    const max = Math.max(...Object.values(SCORE_WEIGHTS));
    expect(SCORE_WEIGHTS.semanticScore).toBe(max);
  });
});
