/** GET /api/game-modes/classic/status — Classic Quiz status (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getClassicQuizStatus } from "@/features/game-modes/classic-quiz";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId") ?? undefined;
  const result = typeof getClassicQuizStatus === 'function' ? getClassicQuizStatus() : getClassicQuizStatus;
  return NextResponse.json(result);
});
