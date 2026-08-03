/**
 * GET /api/live/analytics/mode/[gameMode]  — per-Game-Mode analytics
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPerGameModeAnalytics } from "@/features/live-analytics";

export const GET = withErrorHandler<{ gameMode: string }>(
  async (_req, ctx: RouteContext<{ gameMode: string }>) => {
    const authCtx = await getAuthContext();
    const { gameMode } = await ctx.params;
    const result = await getPerGameModeAnalytics(authCtx, gameMode);
    return NextResponse.json(result);
  },
);
