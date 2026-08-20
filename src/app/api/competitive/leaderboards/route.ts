/** GET /api/competitive/leaderboards — Competitive platform leaderboards (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildLeaderboard } from "@/features/competitive-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  const view = (searchParams.get('view') ?? 'global') as "global" | "country" | "region" | "organization" | "school" | "teacher" | "classroom" | "friends" | "mode_specific" | "seasonal" | "lifetime"; return NextResponse.json({ leaderboard: buildLeaderboard({ view }) });
});
