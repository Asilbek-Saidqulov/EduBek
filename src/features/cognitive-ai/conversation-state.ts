/**
 * EduBek — Conversation State (System 13).
 *
 * Persist conversation objective, current task, entities, assumptions,
 * pending questions, and follow-up opportunities across long
 * conversations. Reuses Product Intelligence's intent detection and
 * Product Memory for user-level preferences.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ConversationState } from "./types";

const log = getLogger("cognitive-conversation-state");

// ===========================================================================
// Public API
// ===========================================================================

export async function startConversation(userId: string, objective?: string): Promise<ConversationState> {
  // End any existing active conversation for this user
  const existing = await repo.findActiveConversationState(userId);
  if (existing) {
    await repo.updateConversationState(existing.id, { status: "archived" });
  }
  const row = await repo.createConversationState({ userId, objective });
  log.info("conversation.started", { id: row.id, userId });
  return mapState(row);
}

export async function getConversation(id: string): Promise<ConversationState | null> {
  const row = await repo.findConversationState(id);
  return row ? mapState(row) : null;
}

export async function getActiveConversation(userId: string): Promise<ConversationState | null> {
  const row = await repo.findActiveConversationState(userId);
  return row ? mapState(row) : null;
}

export async function updateConversation(id: string, input: {
  objective?: string | null;
  currentTask?: string | null;
  entities?: Array<{ type: string; id: string; label: string }>;
  assumptions?: string[];
  pendingQuestions?: string[];
  followUpOpportunities?: Array<{ label: string; rationale: string; priority: number }>;
}): Promise<ConversationState | null> {
  const row = await repo.updateConversationState(id, input);
  return row ? mapState(row) : null;
}

export async function endConversation(id: string): Promise<void> {
  await repo.updateConversationState(id, { status: "ended" });
  log.info("conversation.ended", { id });
}

export async function addEntity(id: string, entity: { type: string; id: string; label: string }): Promise<ConversationState | null> {
  const state = await getConversation(id);
  if (!state) return null;
  const entities = [...state.entities, entity];
  return updateConversation(id, { entities });
}

export async function addAssumption(id: string, assumption: string): Promise<ConversationState | null> {
  const state = await getConversation(id);
  if (!state) return null;
  const assumptions = [...state.assumptions, assumption];
  return updateConversation(id, { assumptions });
}

export async function addPendingQuestion(id: string, question: string): Promise<ConversationState | null> {
  const state = await getConversation(id);
  if (!state) return null;
  const pendingQuestions = [...state.pendingQuestions, question];
  return updateConversation(id, { pendingQuestions });
}

export async function resolvePendingQuestion(id: string, question: string): Promise<ConversationState | null> {
  const state = await getConversation(id);
  if (!state) return null;
  const pendingQuestions = state.pendingQuestions.filter(q => q !== question);
  return updateConversation(id, { pendingQuestions });
}

export async function addFollowUp(id: string, followUp: { label: string; rationale: string; priority: number }): Promise<ConversationState | null> {
  const state = await getConversation(id);
  if (!state) return null;
  const followUpOpportunities = [...state.followUpOpportunities, followUp]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10); // cap at 10
  return updateConversation(id, { followUpOpportunities });
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapState(row: Awaited<ReturnType<typeof repo.createConversationState>>): ConversationState {
  return {
    id: row.id,
    userId: row.userId,
    objective: row.objective,
    currentTask: row.currentTask,
    entities: repo.safeParse(row.entities, []),
    assumptions: repo.safeParse(row.assumptions, []),
    pendingQuestions: repo.safeParse(row.pendingQuestions, []),
    followUpOpportunities: repo.safeParse(row.followUpOpportunities, []),
    lastMessageAt: row.lastMessageAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export { randomUUID as _randomUUID };
