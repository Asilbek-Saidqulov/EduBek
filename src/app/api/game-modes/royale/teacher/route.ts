/** GET /api/game-modes/royale/teacher — Quiz Royale teacher (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateRoyaleDashboard } from "@/features/game-modes/quiz-royale";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof generateRoyaleDashboard === 'function' ? generateRoyaleDashboard() : generateRoyaleDashboard;
  return NextResponse.json(result);
});
