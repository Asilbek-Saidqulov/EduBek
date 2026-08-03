/** GET /api/game-modes/treasure/analytics — Treasure Heist analytics (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateTreasureAnalytics } from "@/features/game-modes/treasure-heist";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof generateTreasureAnalytics === 'function' ? generateTreasureAnalytics() : generateTreasureAnalytics;
  return NextResponse.json(result);
});
