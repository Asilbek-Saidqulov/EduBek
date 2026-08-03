/**
 * GET /api/live/rewards/summary  — get the caller's reward summary
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMySummary } from "@/features/reward";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const summary = await getMySummary(ctx);
  return NextResponse.json(summary);
});
