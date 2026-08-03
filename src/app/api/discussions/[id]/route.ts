/** GET /api/discussions/:id — Get a discussion (increments view count by default) */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getDiscussion } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const incrementView = url.searchParams.get("incrementView") !== "false";
  const discussion = await getDiscussion(id, incrementView);
  if (!discussion) throw notFound("Discussion not found");
  return NextResponse.json(discussion);
});
