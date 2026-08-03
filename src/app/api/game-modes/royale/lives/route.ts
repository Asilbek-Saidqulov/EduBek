/** GET /api/game-modes/royale/lives — Quiz Royale lives (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { ROYALE_RULES } from "@/features/game-modes/quiz-royale";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof ROYALE_RULES === 'function' ? ROYALE_RULES() : ROYALE_RULES;
  return NextResponse.json(result);
});
