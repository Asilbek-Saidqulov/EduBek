/**
 * EduBek — Agent Memory.
 *
 * Phase 4F.6: Shared memory store for all agents. Each memory entry
 * is scoped to a (scopeType, scopeId) pair — user / classroom /
 * organization / system. Memory types:
 *
 *   • conversation — chat history with an agent
 *   • goal         — user's stated learning goal
 *   • action       — agent action taken (audit trail)
 *   • context      — current learning / organizational context
 *   • workflow     — workflow execution summary
 *
 * Memories have an `importance` (0-1) — higher-importance memories
 * are surfaced first when an agent queries context. TTL via
 * `expiresInDays` allows automatic cleanup of stale entries.
 *
 * Reuses:
 *   • Prisma `AgentMemory` table (Phase 4F.6)
 *   • `AiSession` storage when agentType links back to an AI session
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  AgentMemoryDto,
  AgentType,
  CreateMemoryInput,
  MemoryScopeType,
  MemoryType,
} from "./types";

const log = getLogger("agent-memory");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapMemory(m: any): AgentMemoryDto {
  return {
    id: m.id,
    scopeType: m.scopeType as MemoryScopeType,
    scopeId: m.scopeId,
    type: m.type as MemoryType,
    summary: m.summary,
    payload: safeParse<Record<string, unknown>>(m.payload, {}),
    importance: m.importance,
    agentType: m.agentType as AgentType | null,
    workflowId: m.workflowId,
    expiresAt: m.expiresAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function storeMemory(input: CreateMemoryInput): Promise<AgentMemoryDto> {
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;
  const memory = await repo.createMemory({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    type: input.type,
    summary: input.summary,
    payload: JSON.stringify(input.payload ?? {}),
    importance: input.importance ?? 0.5,
    agentType: input.agentType,
    workflowId: input.workflowId,
    expiresAt,
  });
  log.info("memory.stored", {
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    type: input.type,
    agentType: input.agentType,
  });
  return mapMemory(memory);
}

export async function recallMemory(input: {
  scopeType: MemoryScopeType;
  scopeId: string;
  type?: MemoryType;
  agentType?: AgentType;
  limit?: number;
}): Promise<AgentMemoryDto[]> {
  const memories = await repo.findMemories({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    type: input.type,
    agentType: input.agentType,
    limit: input.limit ?? 20,
  });
  return memories.map(mapMemory);
}

/**
 * Recall the most relevant context for an agent invocation.
 *
 * Returns a merged context object combining:
 *   • Recent conversation memories (last 5)
 *   • Active goals (last 3)
 *   • Recent actions (last 5)
 *   • Current context (last 1)
 *
 * Used by every agent as the starting context for an execution.
 */
export async function recallContext(input: {
  scopeType: MemoryScopeType;
  scopeId: string;
}): Promise<{
  conversations: AgentMemoryDto[];
  goals: AgentMemoryDto[];
  recentActions: AgentMemoryDto[];
  context: AgentMemoryDto[];
}> {
  const [conversations, goals, recentActions, context] = await Promise.all([
    recallMemory({ ...input, type: "conversation", limit: 5 }),
    recallMemory({ ...input, type: "goal", limit: 3 }),
    recallMemory({ ...input, type: "action", limit: 5 }),
    recallMemory({ ...input, type: "context", limit: 1 }),
  ]);
  return { conversations, goals, recentActions, context };
}

export async function getMemory(id: string): Promise<AgentMemoryDto | null> {
  const m = await repo.findMemory(id);
  return m ? mapMemory(m) : null;
}

export async function deleteMemory(id: string): Promise<void> {
  await repo.deleteMemory(id);
}

/**
 * Cleanup expired memories. Called by a scheduled job or on each
 * memory write. Returns the number of deleted entries.
 */
export async function pruneExpiredMemories(): Promise<number> {
  const deleted = await repo.deleteExpiredMemories();
  if (deleted > 0) {
    log.info("memory.pruned", { count: deleted });
  }
  return deleted;
}

export async function countMemories(scopeType?: MemoryScopeType, scopeId?: string): Promise<number> {
  return repo.countMemories(scopeType, scopeId);
}
