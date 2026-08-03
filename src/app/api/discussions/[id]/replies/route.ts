/**
 * GET  /api/discussions/:id/replies — List replies (with reactions)
 * POST /api/discussions/:id/replies — Create a reply (top-level or nested via parentId)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createReply, listReplies } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  body: z.string().min(1).max(10000),
  bodyHtml: z.string().optional(),
  parentId: z.string().optional(),
});

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const replies = await listReplies(id, authCtx.userId);
  return NextResponse.json({ replies, total: replies.length });
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const body = postSchema.parse(await req.json());
  const reply = await createReply({
    discussionId: id,
    authorId: authCtx.userId,
    body: body.body,
    bodyHtml: body.bodyHtml,
    parentId: body.parentId,
  });
  return NextResponse.json(reply, { status: 201 });
});
