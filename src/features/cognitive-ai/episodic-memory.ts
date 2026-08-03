/**
 * EduBek — Episodic Memory (System 1b).
 *
 * Stores important educational events: teacher actions, student
 * milestones, organization decisions, AI interventions, and workflow
 * executions. Later reasoning retrieves similar past situations via
 * tag overlap and importance scoring.
 *
 * REUSES Civilization Engine's `recordTimelineEvent` and Education OS's
 * `AgentMemory` as upstream sources — this module is the cognitive
 * retrieval layer on top of those existing stores.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { EpisodicMemoryEntry, MemoryRetrievalResult } from "./types";

const log = getLogger("cognitive-episodic-memory");

// ===========================================================================
// Public API
// ===========================================================================

export async function recordEpisode(input: {
  scopeType: EpisodicMemoryEntry["scopeType"];
  scopeId: string;
  kind: EpisodicMemoryEntry["kind"];
  summary: string;
  payload?: Record<string, unknown>;
  importance?: number;
  linkedEntities?: Array<{ entityType: string; entityId: string }>;
  tags?: string[];
  occurredAt?: Date;
}): Promise<EpisodicMemoryEntry> {
  const row = await repo.createEpisodicMemory({
    scopeType: input.scopeType, scopeId: input.scopeId, kind: input.kind,
    summary: input.summary, payload: input.payload ?? {},
    importance: input.importance ?? 0.5,
    linkedEntities: input.linkedEntities ?? [],
    tags: input.tags ?? [], occurredAt: input.occurredAt,
  });
  log.info("episodic.recorded", { id: row.id, kind: input.kind, scopeType: input.scopeType });
  return mapEntry(row);
}

export async function listEpisodes(
  scopeType: EpisodicMemoryEntry["scopeType"],
  scopeId: string,
  limit = 50,
): Promise<EpisodicMemoryEntry[]> {
  const rows = await repo.findEpisodicMemoryByScope(scopeType, scopeId, limit);
  return rows.map(mapEntry);
}

export async function searchEpisodes(
  scopeType: EpisodicMemoryEntry["scopeType"],
  scopeId: string,
  query: string,
  limit = 20,
): Promise<MemoryRetrievalResult<EpisodicMemoryEntry>> {
  const rows = await repo.searchEpisodicMemory(scopeType, scopeId, query, limit);
  const entries = rows.map(mapEntry);
  // Score by simple text-match + importance
  const scores = rows.map(r => {
    const textMatch = r.summary.toLowerCase().includes(query.toLowerCase()) ? 0.7 : 0.3;
    return Math.min(1, textMatch + r.importance * 0.3);
  });
  return { entries, total: entries.length, scores };
}

export async function findSimilarEpisodes(tags: string[], limit = 10): Promise<EpisodicMemoryEntry[]> {
  if (tags.length === 0) return [];
  const rows = await repo.findSimilarEpisodes(tags, limit);
  return rows.map(mapEntry);
}

// ===========================================================================
// Convenience: record common episode kinds
// ===========================================================================

export async function recordTeacherAction(scopeId: string, action: string, details: Record<string, unknown>, tags: string[] = []): Promise<void> {
  await recordEpisode({
    scopeType: "user", scopeId, kind: "teacher_action",
    summary: action, payload: details, importance: 0.6,
    tags: ["teacher", ...tags],
  });
}

export async function recordStudentMilestone(scopeId: string, milestone: string, details: Record<string, unknown>, tags: string[] = []): Promise<void> {
  await recordEpisode({
    scopeType: "user", scopeId, kind: "student_milestone",
    summary: milestone, payload: details, importance: 0.8,
    tags: ["student", "milestone", ...tags],
  });
}

export async function recordOrganizationDecision(scopeId: string, decision: string, details: Record<string, unknown>, tags: string[] = []): Promise<void> {
  await recordEpisode({
    scopeType: "organization", scopeId, kind: "organization_decision",
    summary: decision, payload: details, importance: 0.9,
    tags: ["organization", "decision", ...tags],
  });
}

export async function recordAIIntervention(scopeId: string, intervention: string, details: Record<string, unknown>, tags: string[] = []): Promise<void> {
  await recordEpisode({
    scopeType: "user", scopeId, kind: "ai_intervention",
    summary: intervention, payload: details, importance: 0.7,
    tags: ["ai", ...tags],
  });
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapEntry(row: Awaited<ReturnType<typeof repo.createEpisodicMemory>>): EpisodicMemoryEntry {
  return {
    id: row.id,
    scopeType: row.scopeType as EpisodicMemoryEntry["scopeType"],
    scopeId: row.scopeId,
    kind: row.kind as EpisodicMemoryEntry["kind"],
    summary: row.summary,
    payload: repo.safeParse(row.payload, {}),
    importance: row.importance,
    linkedEntities: repo.safeParse(row.linkedEntities, []),
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    tags: repo.safeParse(row.tags, []),
  };
}
