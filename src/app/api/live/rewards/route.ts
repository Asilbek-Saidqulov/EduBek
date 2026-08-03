/**
 * GET /api/live/rewards  — list rewards (admin scope)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRewards, listRewardsQuerySchema } from "@/features/reward";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listRewardsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listRewards(ctx, query);
  return NextResponse.json(result);
});
