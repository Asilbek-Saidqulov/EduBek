/** GET /api/game-engine/analytics — Game engine analytics report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateGameAnalytics } from "@/features/game-engine";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = typeof generateGameAnalytics === 'function' ? generateGameAnalytics() : generateGameAnalytics;
  return NextResponse.json(report);
});
