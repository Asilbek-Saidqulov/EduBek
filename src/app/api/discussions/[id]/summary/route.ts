/** POST /api/discussions/:id/summary — Generate (or refresh) the AI summary for this discussion */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getDiscussion, generateDiscussionSummary } from "@/features/collaboration";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const existing = await getDiscussion(id);
  if (!existing) throw notFound("Discussion not found");
  const summary = await generateDiscussionSummary(id);
  return NextResponse.json({ summary });
});
