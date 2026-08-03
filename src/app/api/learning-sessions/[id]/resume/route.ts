/**
 * POST /api/learning-sessions/[id]/resume  — resume a paused session
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { resumeSession } from "@/features/learning-session";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await resumeSession(auth, id));
});
