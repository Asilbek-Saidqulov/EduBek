/**
 * GET /api/live/tournaments/[id]/matches  — list matches in a tournament
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMatches } from "@/features/tournament";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const matches = await listMatches(authCtx, id);
    return NextResponse.json({ matches });
  },
);
