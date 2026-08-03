/** GET /api/game-modes/empire/summary — Empire Builder summary (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateEmpireMatchSummary } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof generateEmpireMatchSummary === 'function' ? generateEmpireMatchSummary() : generateEmpireMatchSummary;
  return NextResponse.json(result);
});
