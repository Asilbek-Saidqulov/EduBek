/**
 * POST /api/notes/:id/presence — Add the user to active editors
 * DELETE /api/notes/:id/presence — Remove the user from active editors
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { addActiveEditor, removeActiveEditor } from "@/features/collaboration";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  await addActiveEditor(id, authCtx.userId);
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  await removeActiveEditor(id, authCtx.userId);
  return NextResponse.json({ success: true });
});
