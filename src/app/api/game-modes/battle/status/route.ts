/** GET /api/game-modes/battle/status — Battle Royale status (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getBattleRoyaleStatus } from "@/features/game-modes/battle-royale";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof getBattleRoyaleStatus === "function" ? getBattleRoyaleStatus() : getBattleRoyaleStatus;
  return NextResponse.json(result);
});
