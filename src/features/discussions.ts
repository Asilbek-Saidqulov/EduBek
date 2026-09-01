import { db } from "@/lib/db";
import { notFound, forbidden } from "@/lib/errors";

export async function listDiscussions(filters: {
  entityType?: string;
  entityId?: string;
  status?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.status) where.status = filters.status;
  const items = await db.discussion.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { lastReplyAt: "desc" }, { createdAt: "desc" }],
    take: Math.min(filters.limit || 50, 100),
  });
  return { success: true, items, data: items, list: items, total: items.length };
}

export async function createDiscussion(input: {
  entityType: string;
  entityId: string;
  title: string;
  pinned?: boolean;
  authorId: string;
}) {
  return db.discussion.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      pinned: Boolean(input.pinned),
      authorId: input.authorId,
      status: "open",
    },
  });
}

export async function listReplies(discussionId: string, userId?: string) {
  const replies = await db.discussionReply.findMany({
    where: { discussionId, status: "visible" },
    orderBy: { createdAt: "asc" },
    include: { reactions: true },
  });
  return replies.map((r) => ({
    ...r,
    myReactions: userId ? r.reactions.filter((x) => x.userId === userId).map((x) => x.emoji) : [],
  }));
}

export async function createReply(input: {
  discussionId: string;
  authorId: string;
  body: string;
  bodyHtml?: string;
  parentId?: string;
}) {
  const thread = await db.discussion.findUnique({ where: { id: input.discussionId } });
  if (!thread) throw notFound("Discussion not found");
  const reply = await db.discussionReply.create({
    data: {
      discussionId: input.discussionId,
      authorId: input.authorId,
      body: input.body,
      bodyHtml: input.bodyHtml,
      parentId: input.parentId,
    },
  });
  await db.discussion.update({
    where: { id: input.discussionId },
    data: { replyCount: { increment: 1 }, lastReplyAt: new Date() },
  });
  return reply;
}

export async function addReaction(replyId: string, userId: string, emoji: string) {
  return db.discussionReaction.create({
    data: { replyId, userId, emoji },
  });
}

export async function removeReaction(replyId: string, userId: string, emoji: string) {
  return db.discussionReaction.delete({
    where: { replyId_userId_emoji: { replyId, userId, emoji } },
  });
}

export async function acceptAnswer(replyId: string, userId: string) {
  const reply = await db.discussionReply.findUnique({
    where: { id: replyId },
    include: { discussion: true },
  });
  if (!reply) throw notFound("Reply not found");
  if (reply.discussion.authorId && reply.discussion.authorId !== userId) {
    throw forbidden("Only the thread author can accept an answer");
  }
  await db.discussionReply.updateMany({
    where: { discussionId: reply.discussionId, isAcceptedAnswer: true },
    data: { isAcceptedAnswer: false },
  });
  return db.discussionReply.update({
    where: { id: replyId },
    data: { isAcceptedAnswer: true, acceptedBy: userId },
  });
}
