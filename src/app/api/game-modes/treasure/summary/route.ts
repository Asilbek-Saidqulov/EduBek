/** GET /api/game-modes/treasure/summary — Treasure Heist summary (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateTreasureMatchSummary } from "@/features/game-modes/treasure-heist";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof generateTreasureMatchSummary === 'function' ? generateTreasureMatchSummary() : generateTreasureMatchSummary;
  return NextResponse.json(result);
});
