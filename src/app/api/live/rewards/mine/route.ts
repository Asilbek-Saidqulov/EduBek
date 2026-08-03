/**
 * GET /api/live/rewards/mine  — list the caller's rewards
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMyRewards } from "@/features/reward";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const rewards = await getMyRewards(ctx, limit);
  return NextResponse.json({ rewards });
});
