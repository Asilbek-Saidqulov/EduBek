/**
 * POST /api/discussions/:id/replies/:replyId/react — Toggle a reaction
 * Body: { emoji: 'thumbs_up' | 'thumbs_down' | 'heart' | 'fire' | 'check' | ... }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import { addReaction, removeReaction } from "@/features/discussions";
import { z } from "zod";

const schema = z.object({
  emoji: z.string().min(1).max(50),
});

export const POST = withErrorHandler<{ id: string; replyId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id, replyId } = await ctx.params;
  const body = schema.parse(await req.json());

  // Verify the reply belongs to this discussion
  const reply = await db.discussionReply.findUnique({ where: { id: replyId }, select: { discussionId: true } });
  if (!reply || reply.discussionId !== id) throw notFound("Reply not found");

  // Toggle: if reaction exists, remove it; otherwise add it.
  const existing = await db.discussionReaction.findUnique({
    where: { replyId_userId_emoji: { replyId, userId: authCtx.userId, emoji: body.emoji } },
  }).catch(() => null);

  if (existing) {
    await removeReaction(replyId, authCtx.userId, body.emoji);
    return NextResponse.json({ success: true, action: "removed" });
  }
  await addReaction(replyId, authCtx.userId, body.emoji);
  return NextResponse.json({ success: true, action: "added" });
});
