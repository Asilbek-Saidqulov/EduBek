/**
 * GET /api/live/players/mine  — get the caller's player dashboard (stats + history)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMyStats, getMyHistory } from "@/features/player";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const [stats, history] = await Promise.all([
    getMyStats(ctx),
    getMyHistory(ctx),
  ]);
  return NextResponse.json({ stats, history });
});
