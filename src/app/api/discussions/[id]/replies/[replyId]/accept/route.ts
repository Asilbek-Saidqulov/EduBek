/** POST /api/discussions/:id/replies/:replyId/accept — Mark a reply as the accepted answer */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import { acceptAnswer } from "@/features/collaboration";

export const POST = withErrorHandler<{ id: string; replyId: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id, replyId } = await ctx.params;

  // Verify the reply belongs to this discussion
  const reply = await db.discussionReply.findUnique({ where: { id: replyId }, select: { discussionId: true } });
  if (!reply || reply.discussionId !== id) throw notFound("Reply not found");

  const updated = await acceptAnswer(replyId, authCtx.userId);
  return NextResponse.json(updated);
});
