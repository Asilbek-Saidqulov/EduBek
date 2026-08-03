/**
 * EduBek — Continuous Learning Loop (System 11).
 *
 * Uses Platform Intelligence's Feedback Engine, Product Intelligence's
 * analytics, Civilization Engine's Wisdom, and the Global Network's
 * insights to improve tool selection, planning, reasoning, goal
 * ranking, and confidence estimation — without changing user data.
 *
 * The learning loop reads from existing subsystems and applies small
 * adjustments to cognitive-ai's own parameters.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type { LearningLoopUpdate, ReflectionEntry } from "./types";
import { assessMetaCognition } from "./reflection-engine";

const log = getLogger("cognitive-learning-loop");

// ===========================================================================
// In-memory parameter store (adjustable by the learning loop)
// ===========================================================================

interface CognitiveParameters {
  /** Confidence penalty applied when evidence count < this threshold. */
  evidenceCountThreshold: number;
  /** Maximum cost (USD) before flagging expensive reasoning. */
  expensiveReasoningThreshold: number;
  /** Maximum modules before flagging overuse. */
  moduleCountThreshold: number;
  /** Confidence boost when evidence quality is high. */
  highQualityEvidenceBoost: number;
  /** Tool selection score boost for goal-aligned tools. */
  goalAlignmentBoost: number;
  /** Whether to cache plan results. */
  cachePlans: boolean;
}

const params: CognitiveParameters = {
  evidenceCountThreshold: 3,
  expensiveReasoningThreshold: 0.05,
  moduleCountThreshold: 8,
  highQualityEvidenceBoost: 0.1,
  goalAlignmentBoost: 10,
  cachePlans: true,
};

export function getParameters(): Readonly<CognitiveParameters> {
  return { ...params };
}

export function setParameter<K extends keyof CognitiveParameters>(key: K, value: CognitiveParameters[K]): void {
  params[key] = value;
  log.info("learning_loop.parameter_set", { key, value });
}

// ===========================================================================
// Public API
// ===========================================================================

export async function runLearningCycle(): Promise<LearningLoopUpdate[]> {
  const updates: LearningLoopUpdate[] = [];

  // 1. Learn from reflections (meta-cognition)
  const recentReflections = await repo.listReflections(20);
  if (recentReflections.length > 0) {
    const reflectionEntries: ReflectionEntry[] = recentReflections.map(r => ({
      id: r.id, actionType: r.actionType, traceId: r.traceId,
      reflections: repo.safeParse(r.reflections, []),
      overallScore: r.overallScore,
      lessons: repo.safeParse(r.lessons, []),
      memoryUpdateRecommended: r.memoryUpdateRecommended,
      createdAt: r.createdAt.toISOString(),
    }));
    const meta = assessMetaCognition(reflectionEntries);
    if (meta.adjustmentRecommended) {
      for (const adjustment of meta.adjustments) {
        updates.push({
          learning: adjustment,
          target: "reasoning",
          change: { adjustment },
          confidence: meta.selfScore,
          source: "meta-cognition",
          appliedAt: new Date().toISOString(),
        });
      }
      // Apply concrete parameter changes
      if (meta.issues.some(i => i.kind === "overconfidence")) {
        const oldBoost = params.highQualityEvidenceBoost;
        params.highQualityEvidenceBoost = Math.max(0, oldBoost - 0.05);
        updates.push({
          learning: "Reduced confidence boost due to overconfidence pattern",
          target: "confidence_estimation",
          change: { highQualityEvidenceBoost: { from: oldBoost, to: params.highQualityEvidenceBoost } },
          confidence: 0.8,
          source: "meta-cognition",
          appliedAt: new Date().toISOString(),
        });
      }
      if (meta.issues.some(i => i.kind === "expensive_reasoning")) {
        const oldThreshold = params.expensiveReasoningThreshold;
        params.expensiveReasoningThreshold = Math.max(0.01, oldThreshold * 0.9);
        updates.push({
          learning: "Lowered expensive-reasoning threshold",
          target: "tool_selection",
          change: { expensiveReasoningThreshold: { from: oldThreshold, to: params.expensiveReasoningThreshold } },
          confidence: 0.7,
          source: "meta-cognition",
          appliedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Learn from Platform Intelligence feedback events
  try {
    const feedbackEvents = await db.feedbackEvent.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      take: 50,
      select: { type: true, outcome: true },
    });
    if (feedbackEvents.length > 0) {
      const positive = feedbackEvents.filter(e => e.outcome === "positive").length;
      const negative = feedbackEvents.filter(e => e.outcome === "negative").length;
      if (negative > positive) {
        updates.push({
          learning: "Negative feedback exceeds positive — tighten confidence thresholds",
          target: "confidence_estimation",
          change: { negativeFeedbackCount: negative, positiveFeedbackCount: positive },
          confidence: 0.7,
          source: "platform-intelligence",
          appliedAt: new Date().toISOString(),
        });
      }
    }
  } catch { /* noop */ }

  // 3. Learn from Civilization Engine wisdom insights
  try {
    const wisdom = await db.wisdomInsight.findMany({
      where: { status: "active" },
      take: 5,
      orderBy: { confidence: "desc" },
      select: { id: true, narrative: true, confidence: true },
    });
    for (const w of wisdom) {
      updates.push({
        learning: `Wisdom insight: ${w.narrative.slice(0, 80)}`,
        target: "planning",
        change: { wisdomId: w.id, confidence: w.confidence },
        confidence: w.confidence,
        source: "civilization-wisdom",
        appliedAt: new Date().toISOString(),
      });
    }
  } catch { /* noop */ }

  // 4. Learn from Global Intelligence collective insights
  try {
    const insights = await db.collectiveInsight.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, confidence: true },
    });
    for (const i of insights) {
      updates.push({
        learning: `Global insight: ${i.title}`,
        target: "goal_ranking",
        change: { insightId: i.id },
        confidence: i.confidence,
        source: "global-intelligence",
        appliedAt: new Date().toISOString(),
      });
    }
  } catch { /* noop */ }

  log.info("learning_cycle.complete", { updates: updates.length });
  return updates;
}

// ===========================================================================
// Cache for reusable reasoning outputs (LLM call avoidance)
// ===========================================================================

const reasoningCache = new Map<string, { result: unknown; expiresAt: Date }>();

export function cacheReasoning(key: string, result: unknown, ttlMs = 60 * 60 * 1000): void {
  reasoningCache.set(key, { result, expiresAt: new Date(Date.now() + ttlMs) });
}

export function getCachedReasoning<T>(key: string): T | null {
  const entry = reasoningCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    reasoningCache.delete(key);
    return null;
  }
  return entry.result as T;
}

export function clearReasoningCache(): void {
  reasoningCache.clear();
}

export function getCacheSize(): number {
  return reasoningCache.size;
}
