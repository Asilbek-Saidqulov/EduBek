/**
 * POST /api/learning-sessions/[id]/complete  — complete a session
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { completeSession } from "@/features/learning-session";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await completeSession(auth, id));
});
