/** GET /api/challenges/:id — Get a challenge (with the user's progress/rank) */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getChallenge } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const challenge = await getChallenge(id, authCtx.userId);
  if (!challenge) throw notFound("Challenge not found");
  return NextResponse.json(challenge);
});
