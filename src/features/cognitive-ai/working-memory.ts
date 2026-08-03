/**
 * EduBek — Working Memory (System 1a).
 *
 * Temporary context for the current conversation, classroom, workflow,
 * or task. Entries expire automatically (default TTL: 30 minutes).
 *
 * Working memory is the fastest tier — reads and writes should be
 * sub-millisecond. It is NOT a knowledge store — use episodic or
 * semantic memory for that.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { WorkingMemoryEntry } from "./types";

const log = getLogger("cognitive-working-memory");

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ===========================================================================
// Public API
// ===========================================================================

export async function setWorkingMemory(input: {
  scopeType: WorkingMemoryEntry["scopeType"];
  scopeId: string;
  kind: WorkingMemoryEntry["kind"];
  payload: Record<string, unknown>;
  ttlMs?: number;
}): Promise<WorkingMemoryEntry> {
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS));
  const row = await repo.createWorkingMemory({
    scopeType: input.scopeType, scopeId: input.scopeId, kind: input.kind,
    payload: input.payload, expiresAt,
  });
  log.debug("working_memory.set", { id: row.id, scopeType: input.scopeType, kind: input.kind });
  return mapEntry(row);
}

export async function getWorkingMemory(
  scopeType: WorkingMemoryEntry["scopeType"],
  scopeId: string,
): Promise<WorkingMemoryEntry[]> {
  const rows = await repo.findActiveWorkingMemory(scopeType, scopeId);
  return rows.map(mapEntry);
}

export async function getWorkingMemoryByKind(
  scopeType: WorkingMemoryEntry["scopeType"],
  scopeId: string,
  kind: WorkingMemoryEntry["kind"],
): Promise<WorkingMemoryEntry | null> {
  const entries = await getWorkingMemory(scopeType, scopeId);
  return entries.find(e => e.kind === kind) ?? null;
}

export async function deleteWorkingMemoryEntry(id: string): Promise<void> {
  await repo.deleteWorkingMemory(id);
}

export async function evictExpired(): Promise<number> {
  const result = await repo.deleteExpiredWorkingMemory();
  log.info("working_memory.evicted", { count: result.count });
  return result.count;
}

/** Convenience: set the "current task" for a user session. */
export async function setCurrentTask(userId: string, task: string, context?: Record<string, unknown>): Promise<void> {
  await setWorkingMemory({
    scopeType: "session", scopeId: userId, kind: "current_task",
    payload: { task, ...context },
  });
}

/** Convenience: get the "current task" for a user session. */
export async function getCurrentTask(userId: string): Promise<string | null> {
  const entry = await getWorkingMemoryByKind("session", userId, "current_task");
  return (entry?.payload as { task?: string })?.task ?? null;
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapEntry(row: Awaited<ReturnType<typeof repo.createWorkingMemory>>): WorkingMemoryEntry {
  return {
    id: row.id,
    scopeType: row.scopeType as WorkingMemoryEntry["scopeType"],
    scopeId: row.scopeId,
    kind: row.kind as WorkingMemoryEntry["kind"],
    payload: repo.safeParse(row.payload, {}),
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

// Exported for testing
export { randomUUID as _randomUUID };
