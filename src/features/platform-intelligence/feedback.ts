/**
 * EduBek — Continuous Feedback Engine.
 *
 * Phase 4F.7: Every important platform event becomes feedback. The
 * engine accepts a FeedbackEvent (typed event with outcome + value),
 * persists it, and updates the corresponding LearningSignal aggregates.
 *
 * Feedback events feed into:
 *   • Recommendation Learning (CTR, completion, dismiss, ignore)
 *   • Search Learning (clicked/ignored/reformulated/abandoned)
 *   • Prompt Optimization (acceptance, regeneration, edits, rating)
 *   • Experimentation Framework (per-variant outcomes)
 *
 * Reuses:
 *   • Phase 4F.2 Recommendation Analytics (recommendation events)
 *   • Phase 4F.7 LearningSignal table (aggregated signals)
 *   • Phase 4F.7 AuditEvent table (for autonomous-action feedback)
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  FeedbackEventDto,
  FeedbackEventType,
  FeedbackOutcome,
  RecordFeedbackInput,
} from "./types";

const log = getLogger("feedback");

// ---------------------------------------------------------------------------
// Event type → outcome + value inference
// ---------------------------------------------------------------------------

const EVENT_TYPE_DEFAULTS: Record<FeedbackEventType, { outcome: FeedbackOutcome; value: number }> = {
  quiz_completed: { outcome: "positive", value: 0.8 },
  lesson_opened: { outcome: "positive", value: 0.6 },
  resource_abandoned: { outcome: "negative", value: 0.2 },
  recommendation_clicked: { outcome: "positive", value: 0.7 },
  recommendation_ignored: { outcome: "neutral", value: 0.4 },
  recommendation_dismissed: { outcome: "negative", value: 0.1 },
  search_success: { outcome: "positive", value: 0.8 },
  search_failure: { outcome: "negative", value: 0.2 },
  ai_generation_accepted: { outcome: "positive", value: 0.9 },
  ai_generation_regenerated: { outcome: "negative", value: 0.3 },
  marketplace_purchase: { outcome: "positive", value: 1.0 },
  marketplace_refund: { outcome: "negative", value: 0.1 },
  course_completed: { outcome: "positive", value: 1.0 },
  certificate_earned: { outcome: "positive", value: 1.0 },
  discussion_solved: { outcome: "positive", value: 0.8 },
  teacher_edited_ai_output: { outcome: "neutral", value: 0.5 },
  student_corrected_answer: { outcome: "neutral", value: 0.5 },
};

// ---------------------------------------------------------------------------
// Main entry point: record a feedback event
// ---------------------------------------------------------------------------

export async function recordFeedback(input: RecordFeedbackInput): Promise<FeedbackEventDto> {
  const defaults = EVENT_TYPE_DEFAULTS[input.type] ?? { outcome: "neutral" as FeedbackOutcome, value: 0.5 };
  const outcome = input.outcome ?? defaults.outcome;
  const value = input.value ?? defaults.value;

  const row = await repo.createFeedbackEvent({
    type: input.type,
    userId: input.userId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: JSON.stringify(input.payload ?? {}),
    outcome,
    value,
    experimentId: input.experimentId,
    variant: input.variant,
  });

  // Update the corresponding LearningSignal (best-effort)
  await updateLearningSignal(input, outcome).catch(() => undefined);

  log.info("feedback.recorded", {
    type: input.type,
    outcome,
    value,
    userId: input.userId,
    entityId: input.entityId,
  });

  return mapFeedbackEvent(row);
}

/**
 * Batch-record multiple feedback events. Useful for bulk imports + tests.
 */
export async function recordFeedbackBatch(inputs: RecordFeedbackInput[]): Promise<number> {
  let count = 0;
  for (const input of inputs) {
    await recordFeedback(input);
    count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Query feedback events
// ---------------------------------------------------------------------------

export async function listFeedbackEvents(input: {
  type?: FeedbackEventType;
  userId?: string;
  scopeType?: string;
  scopeId?: string;
  entityType?: string;
  entityId?: string;
  outcome?: FeedbackOutcome;
  experimentId?: string;
  sinceDays?: number;
  limit?: number;
}): Promise<FeedbackEventDto[]> {
  const since = input.sinceDays ? new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000) : undefined;
  const rows = await repo.findFeedbackEvents({
    type: input.type,
    userId: input.userId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    entityType: input.entityType,
    entityId: input.entityId,
    outcome: input.outcome,
    experimentId: input.experimentId,
    since,
    limit: input.limit,
  });
  return rows.map(mapFeedbackEvent);
}

export async function countFeedbackEvents(sinceDays?: number): Promise<number> {
  const since = sinceDays ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : undefined;
  return repo.countFeedbackEvents(since);
}

export async function countFeedbackEventsByType(sinceDays?: number): Promise<Record<string, number>> {
  const since = sinceDays ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : undefined;
  return repo.countFeedbackEventsByType(since);
}

// ---------------------------------------------------------------------------
// Internal: update the LearningSignal for the affected entity
// ---------------------------------------------------------------------------

async function updateLearningSignal(input: RecordFeedbackInput, outcome: FeedbackOutcome): Promise<void> {
  if (!input.entityType || !input.entityId) return;

  // Map the feedback type to a signal type
  const signalType = inferSignalType(input.type);
  if (!signalType) return;

  // Fetch the existing signal (or default)
  const existing = await repo.findLearningSignal({
    signalType,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  const impressions = (existing?.impressions ?? 0) + 1;
  const clicks = (existing?.clicks ?? 0) + (outcome === "positive" ? 1 : 0);
  const completions = (existing?.completions ?? 0) + (input.type === "course_completed" || input.type === "quiz_completed" ? 1 : 0);
  const dismissals = (existing?.dismissals ?? 0) + (input.type === "recommendation_dismissed" ? 1 : 0);
  const ignores = (existing?.ignores ?? 0) + (input.type === "recommendation_ignored" ? 1 : 0);

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const satisfaction = clicks > 0 ? completions / clicks : 0;

  // Rolling window of last 20 outcomes
  const recentOutcomes = parseOutcomes(existing?.recentOutcomes);
  recentOutcomes.push(outcome);
  if (recentOutcomes.length > 20) recentOutcomes.shift();

  await repo.upsertLearningSignal({
    signalType,
    entityType: input.entityType,
    entityId: input.entityId,
    impressions,
    clicks,
    completions,
    dismissals,
    ignores,
    ctr,
    satisfaction,
    recentOutcomes: JSON.stringify(recentOutcomes),
    lastComputedAt: new Date(),
  });
}

function inferSignalType(feedbackType: FeedbackEventType): string | null {
  if (feedbackType.startsWith("recommendation")) return "recommendation";
  if (feedbackType.startsWith("search")) return "search_result";
  if (feedbackType.startsWith("ai_generation")) return "prompt";
  if (feedbackType === "quiz_completed") return "quiz";
  if (feedbackType === "lesson_opened") return "lesson";
  if (feedbackType === "resource_abandoned") return "resource";
  return null;
}

function parseOutcomes(raw: string | null | undefined): FeedbackOutcome[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapFeedbackEvent(row: any): FeedbackEventDto {
  return {
    id: row.id,
    type: row.type as FeedbackEventType,
    userId: row.userId,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    entityType: row.entityType,
    entityId: row.entityId,
    payload: safeParseRecord(row.payload),
    outcome: row.outcome as FeedbackOutcome,
    value: row.value,
    experimentId: row.experimentId,
    variant: row.variant,
    occurredAt: row.occurredAt.toISOString(),
  };
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
