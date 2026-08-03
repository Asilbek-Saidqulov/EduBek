/**
 * GET /api/live/players/mine/stats  — get the caller's aggregated stats
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMyStats } from "@/features/player";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const stats = await getMyStats(ctx);
  return NextResponse.json(stats);
});
