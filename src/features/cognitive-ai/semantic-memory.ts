/**
 * EduBek — Semantic Memory (System 1c).
 *
 * Stores generalized knowledge: educational principles, curriculum
 * knowledge, teaching strategies, platform knowledge, best practices.
 * This memory does NOT store conversations — only extracted knowledge.
 *
 * REUSES Knowledge Intelligence (Concept, ConceptRelationship) and
 * Civilization Engine (KnowledgeBaseEntry) as upstream sources. This
 * module is the cognitive retrieval layer that ranks generalized
 * knowledge for reasoning.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { SemanticMemoryEntry, MemoryRetrievalResult } from "./types";

const log = getLogger("cognitive-semantic-memory");

// ===========================================================================
// Public API
// ===========================================================================

export async function recordKnowledge(input: {
  domain: string;
  kind: string;
  statement: string;
  explanation?: string;
  source: string;
  confidence?: number;
  tags?: string[];
}): Promise<SemanticMemoryEntry> {
  const row = await repo.createSemanticMemory({
    domain: input.domain, kind: input.kind, statement: input.statement,
    explanation: input.explanation ?? "", source: input.source,
    confidence: input.confidence ?? 0.5, tags: input.tags ?? [],
  });
  log.info("semantic.recorded", { id: row.id, domain: input.domain, kind: input.kind });
  return mapEntry(row);
}

export async function listKnowledge(domain?: string, kind?: string, limit = 50): Promise<SemanticMemoryEntry[]> {
  const rows = await repo.findSemanticMemory(domain, kind, limit);
  return rows.map(mapEntry);
}

export async function searchKnowledge(query: string, limit = 20): Promise<MemoryRetrievalResult<SemanticMemoryEntry>> {
  const rows = await repo.searchSemanticMemory(query, limit);
  const entries = rows.map(mapEntry);
  // Score by confidence + text match
  const scores = rows.map(r => {
    const textMatch = r.statement.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0.2;
    return Math.min(1, textMatch + r.confidence * 0.5);
  });
  // Touch lastAccessedAt for retrieved entries
  for (const r of rows) {
    repo.touchSemanticMemory(r.id).catch(() => { /* noop */ });
  }
  return { entries, total: entries.length, scores };
}

// ===========================================================================
// Built-in semantic knowledge seeds (deterministic — no LLM)
// ===========================================================================

export const BUILTIN_KNOWLEDGE: Array<Omit<SemanticMemoryEntry, "id" | "createdAt" | "lastAccessedAt">> = [
  {
    domain: "teaching",
    kind: "principle",
    statement: "Spaced repetition improves long-term retention by 200% compared to massed practice.",
    explanation: "Distributed practice schedules (e.g., SM-2 algorithm) strengthen memory traces through retrieval practice at expanding intervals.",
    source: "learning-planner",
    confidence: 0.9,
    tags: ["spaced-repetition", "retention", "sm-2"],
  },
  {
    domain: "teaching",
    kind: "strategy",
    statement: "Formative assessment with immediate feedback is more effective than summative-only assessment for learning.",
    explanation: "Frequent low-stakes quizzes with feedback help students identify gaps while learning is still in progress.",
    source: "assessment-platform",
    confidence: 0.85,
    tags: ["formative", "feedback", "assessment"],
  },
  {
    domain: "curriculum",
    kind: "principle",
    statement: "Bloom's taxonomy provides a hierarchy of cognitive complexity: remember < understand < apply < analyze < evaluate < create.",
    explanation: "Assessments should cover multiple Bloom levels to measure different cognitive skills. Balanced blueprints ensure comprehensive evaluation.",
    source: "knowledge-intelligence",
    confidence: 0.95,
    tags: ["bloom", "taxonomy", "assessment-design"],
  },
  {
    domain: "assessment",
    kind: "best_practice",
    statement: "Mastery-based progression (80% threshold) outperforms time-based progression for long-term learning outcomes.",
    explanation: "Students who achieve mastery before advancing retain knowledge longer and perform better in subsequent courses.",
    source: "knowledge-intelligence",
    confidence: 0.85,
    tags: ["mastery", "progression", "retention"],
  },
  {
    domain: "teaching",
    kind: "best_practice",
    statement: "Active learning techniques increase engagement by 40% and reduce dropout rates.",
    explanation: "Interactive methods — think-pair-share, peer instruction, problem-based learning — outperform passive lectures.",
    source: "platform-intelligence",
    confidence: 0.8,
    tags: ["active-learning", "engagement", "dropout"],
  },
  {
    domain: "platform",
    kind: "fact",
    statement: "AI assistance is most effective when it augments teacher judgment rather than replacing it.",
    explanation: "AI should handle repetitive tasks (grading MCQs, generating question variants) while teachers focus on high-value interactions (mentoring, complex feedback).",
    source: "platform-intelligence",
    confidence: 0.85,
    tags: ["ai", "teacher-workload", "augmentation"],
  },
  {
    domain: "teaching",
    kind: "strategy",
    statement: "Pretesting (quizzing before instruction) improves later learning, even when students get pretest questions wrong.",
    explanation: "Pretesting activates prior knowledge and primes students to attend to relevant information during instruction.",
    source: "research-platform",
    confidence: 0.75,
    tags: ["pretesting", "priming", "instruction"],
  },
  {
    domain: "curriculum",
    kind: "best_practice",
    statement: "Curriculum alignment to standards improves student performance on standardized assessments by 15-25%.",
    explanation: "When lessons, materials, and assessments all map to the same standards, students encounter coherent learning experiences.",
    source: "knowledge-intelligence",
    confidence: 0.9,
    tags: ["alignment", "standards", "curriculum"],
  },
];

/** Seed built-in knowledge on first use. Idempotent. */
export async function seedBuiltinKnowledge(): Promise<void> {
  for (const k of BUILTIN_KNOWLEDGE) {
    try {
      // Check if an entry with the same statement exists
      const existing = await repo.searchSemanticMemory(k.statement.slice(0, 50), 1);
      if (existing.length === 0) {
        await recordKnowledge(k);
      }
    } catch (err) {
      log.warn("semantic.seed_failed", { statement: k.statement.slice(0, 40), error: (err as Error).message });
    }
  }
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapEntry(row: Awaited<ReturnType<typeof repo.createSemanticMemory>>): SemanticMemoryEntry {
  return {
    id: row.id,
    domain: row.domain,
    kind: row.kind,
    statement: row.statement,
    explanation: row.explanation,
    source: row.source,
    confidence: row.confidence,
    tags: repo.safeParse(row.tags, []),
    createdAt: row.createdAt.toISOString(),
    lastAccessedAt: row.lastAccessedAt.toISOString(),
  };
}
