/** GET /api/game-modes/battle/rules — Battle Royale rules + presets (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getRules, getBalancePresets } from "@/features/game-modes/battle-royale";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  return NextResponse.json({ rules: getRules(), presets: getBalancePresets() });
});
