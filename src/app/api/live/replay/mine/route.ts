/**
 * GET /api/live/replay/mine  — list the caller's replays
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMyReplays } from "@/features/replay";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const replays = await listMyReplays(ctx, limit);
  return NextResponse.json({ replays });
});
