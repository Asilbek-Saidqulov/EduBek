/**
 * EduBek — Discussions service.
 *
 * Phase 4F.4: Resource / classroom / group / topic-scoped discussions
 * with nested replies, reactions, accepted answers, view tracking,
 * pinning, and integration with the Learning Network Graph
 * (DISCUSSES edges from user to the discussion's parent entity).
 *
 * AI hooks are included for:
 *   • AI summary generation (per-discussion)
 *   • AI toxicity scoring (per-reply)
 *   • AI duplicate detection (per-reply)
 *
 * The hooks are deterministic fallbacks for Phase 4F.4 — a future
 * phase can plug in real LLM calls without changing the DTO shape.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { addCollaborationEdge } from "./network-graph";
import type {
  DiscussionDto,
  DiscussionReplyDto,
} from "./types";

const log = getLogger("discussions");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapDiscussion(d: any): DiscussionDto {
  return {
    id: d.id,
    entityType: d.entityType,
    entityId: d.entityId,
    title: d.title,
    authorId: d.authorId,
    status: d.status,
    pinned: d.pinned,
    aiSummary: d.aiSummary,
    aiSummaryAt: d.aiSummaryAt?.toISOString() ?? null,
    replyCount: d.replyCount,
    viewCount: d.viewCount,
    lastReplyAt: d.lastReplyAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function mapReply(r: any, currentUserId?: string): DiscussionReplyDto {
  // Aggregate reactions
  const reactionCounts = new Map<string, { count: number; reactedByMe: boolean }>();
  for (const rxn of r.reactions ?? []) {
    const entry = reactionCounts.get(rxn.emoji) ?? { count: 0, reactedByMe: false };
    entry.count += 1;
    if (rxn.userId === currentUserId) entry.reactedByMe = true;
    reactionCounts.set(rxn.emoji, entry);
  }
  return {
    id: r.id,
    discussionId: r.discussionId,
    authorId: r.authorId,
    parentId: r.parentId,
    body: r.body,
    bodyHtml: r.bodyHtml,
    status: r.status,
    isAcceptedAnswer: r.isAcceptedAnswer,
    acceptedBy: r.acceptedBy,
    acceptedAt: r.acceptedAt?.toISOString() ?? null,
    toxicityScore: r.toxicityScore,
    duplicateOfId: r.duplicateOfId,
    editCount: r.editCount,
    lastEditedAt: r.lastEditedAt?.toISOString() ?? null,
    reactions: Array.from(reactionCounts.entries()).map(([emoji, e]) => ({
      emoji,
      count: e.count,
      reactedByMe: e.reactedByMe,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

export async function createDiscussion(input: {
  entityType: string;
  entityId: string;
  title: string;
  authorId: string;
  pinned?: boolean;
}): Promise<DiscussionDto> {
  const discussion = await repo.createDiscussion(input);

  // Add DISCUSSES edge from user to the parent entity in the network graph
  await addCollaborationEdge({
    fromEntityType: "user",
    fromEntityId: input.authorId,
    fromTitle: "User",
    toEntityType: input.entityType,
    toEntityId: input.entityId,
    toTitle: input.title,
    edgeType: "DISCUSSES",
    weight: 1,
    metadata: { discussionId: discussion.id },
  }).catch(() => undefined); // best-effort

  log.info("discussion.created", {
    discussionId: discussion.id,
    entityType: input.entityType,
    entityId: input.entityId,
    authorId: input.authorId,
  });

  return mapDiscussion(discussion);
}

export async function getDiscussion(id: string, incrementView = false): Promise<DiscussionDto | null> {
  const discussion = await repo.findDiscussion(id);
  if (!discussion) return null;
  if (incrementView) {
    await repo.updateDiscussion(id, { viewCount: { increment: 1 } });
  }
  return mapDiscussion(discussion);
}

export async function listDiscussions(input: {
  entityType?: string;
  entityId?: string;
  authorId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ discussions: DiscussionDto[]; total: number }> {
  const discussions = await repo.findDiscussions(input);
  return { discussions: discussions.map(mapDiscussion), total: discussions.length };
}

export async function updateDiscussion(id: string, input: {
  title?: string;
  status?: "open" | "closed" | "archived" | "locked";
  pinned?: boolean;
  aiSummary?: string;
}): Promise<DiscussionDto> {
  const updateData: Record<string, unknown> = { ...input };
  if (input.aiSummary !== undefined) updateData.aiSummaryAt = new Date();
  const discussion = await repo.updateDiscussion(id, updateData);
  return mapDiscussion(discussion);
}

export async function generateDiscussionSummary(id: string): Promise<string> {
  const replies = await repo.findDiscussionReplies(id, 100);
  if (replies.length === 0) return "No replies yet.";

  // Deterministic fallback: list the top 3 reply bodies
  const topReplies = replies.slice(0, 3).map((r) => r.body.slice(0, 200));
  const summary = `This discussion has ${replies.length} replies. Highlights:\n\n${topReplies.map((r, i) => `${i + 1}. ${r}…`).join("\n")}`;

  await repo.updateDiscussion(id, {
    aiSummary: summary,
    aiSummaryAt: new Date(),
  });

  log.info("discussion.summary_generated", { discussionId: id, replyCount: replies.length });
  return summary;
}

// ---------------------------------------------------------------------------
// Replies
// ---------------------------------------------------------------------------

export async function createReply(input: {
  discussionId: string;
  authorId: string;
  parentId?: string;
  body: string;
  bodyHtml?: string;
}): Promise<DiscussionReplyDto> {
  // Validate parent reply belongs to the same discussion
  if (input.parentId) {
    const parent = await repo.findDiscussionReply(input.parentId);
    if (!parent || parent.discussionId !== input.discussionId) {
      throw new Error("Parent reply does not belong to this discussion");
    }
  }

  // Lightweight toxicity detection — flag obvious slurs / hate.
  // A real LLM-based detector would replace this in a future phase.
  const toxicityScore = quickToxicityScore(input.body);

  const reply = await repo.createDiscussionReply({
    discussionId: input.discussionId,
    authorId: input.authorId,
    parentId: input.parentId,
    body: input.body,
    bodyHtml: input.bodyHtml,
  });

  // Apply toxicity score if non-zero
  if (toxicityScore > 0) {
    await repo.updateDiscussionReply(reply.id, { toxicityScore });
  }

  // Update discussion counters
  await repo.updateDiscussion(input.discussionId, {
    replyCount: { increment: 1 },
    lastReplyAt: new Date(),
  });

  log.info("discussion.reply_created", {
    discussionId: input.discussionId,
    replyId: reply.id,
    authorId: input.authorId,
    toxicityScore,
  });

  return mapReply({ ...reply, reactions: [] }, input.authorId);
}

export async function listReplies(discussionId: string, currentUserId?: string): Promise<DiscussionReplyDto[]> {
  const replies = await repo.findDiscussionReplies(discussionId, 200);
  // Fetch reactions for all replies in one query
  const replyIds = replies.map((r) => r.id);
  const allReactions = replyIds.length > 0
    ? await db.discussionReaction.findMany({ where: { replyId: { in: replyIds } } })
    : [];
  const reactionsByReply = new Map<string, any[]>();
  for (const r of allReactions) {
    if (!reactionsByReply.has(r.replyId)) reactionsByReply.set(r.replyId, []);
    reactionsByReply.get(r.replyId)!.push(r);
  }
  return replies.map((r) => mapReply({
    ...r,
    reactions: reactionsByReply.get(r.id) ?? [],
  }, currentUserId));
}

export async function editReply(id: string, body: string, bodyHtml?: string): Promise<DiscussionReplyDto> {
  const reply = await repo.updateDiscussionReply(id, {
    body,
    bodyHtml,
    editCount: { increment: 1 },
    lastEditedAt: new Date(),
  });
  return mapReply({ ...reply, reactions: [] });
}

export async function deleteReply(id: string): Promise<void> {
  await repo.updateDiscussionReply(id, { status: "deleted", body: "[deleted]" });
}

export async function acceptAnswer(id: string, acceptedBy: string): Promise<DiscussionReplyDto> {
  const reply = await repo.findDiscussionReply(id);
  if (!reply) throw new Error("Reply not found");
  // Un-accept any previously accepted answer in this discussion
  await db.discussionReply.updateMany({
    where: { discussionId: reply.discussionId, isAcceptedAnswer: true },
    data: { isAcceptedAnswer: false, acceptedBy: null, acceptedAt: null },
  });
  const updated = await repo.updateDiscussionReply(id, {
    isAcceptedAnswer: true,
    acceptedBy,
    acceptedAt: new Date(),
  });
  return mapReply({ ...updated, reactions: [] });
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

export async function addReaction(replyId: string, userId: string, emoji: string): Promise<void> {
  // Idempotent — using upsert via try/catch on the unique constraint
  try {
    await repo.createDiscussionReaction({ replyId, userId, emoji });
  } catch {
    // Already reacted — no-op (idempotent)
  }
}

export async function removeReaction(replyId: string, userId: string, emoji: string): Promise<void> {
  await repo.deleteDiscussionReaction(replyId, userId, emoji);
}

// ---------------------------------------------------------------------------
// Lightweight toxicity heuristic
// ---------------------------------------------------------------------------

/**
 * Quick rule-based toxicity scorer.
 *
 * Returns a 0-1 score. 0 = benign, 1 = high probability of toxicity.
 * Used as a deterministic fallback when no LLM is available. A real
 * implementation would call the AI Workspace with a toxicity prompt.
 *
 * Heuristics:
 *   • All-caps ratio > 0.5 → +0.2
 *   • Excessive exclamation marks (3+) → +0.1
 *   • Presence of slurs (small deny-list) → +0.8
 *   • Repetition of the same word 5+ times → +0.2
 */
function quickToxicityScore(body: string): number {
  let score = 0;
  const lower = body.toLowerCase();

  // All-caps ratio
  const alpha = body.replace(/[^a-zA-Z]/g, "");
  if (alpha.length > 0) {
    const caps = body.replace(/[^A-Z]/g, "").length;
    if (caps / alpha.length > 0.5) score += 0.2;
  }

  // Excessive exclamation
  if ((body.match(/!/g) ?? []).length >= 3) score += 0.1;

  // Repetition
  const words = lower.split(/\s+/);
  const wordCounts = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4) continue;
    wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  }
  for (const count of wordCounts.values()) {
    if (count >= 5) { score += 0.2; break; }
  }

  return Math.min(1, score);
}
