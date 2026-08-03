/**
 * POST /api/live/tournaments/[id]/matches/[matchId]/finish  — record the winner of a match
 *   Body: { winnerId: string, score1?: number, score2?: number }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { finishMatch } from "@/features/tournament";
import { z } from "zod";

const bodySchema = z.object({
  winnerId: z.string().min(1),
  score1: z.number().int().optional(),
  score2: z.number().int().optional(),
});

export const POST = withErrorHandler<{ id: string; matchId: string }>(
  async (req, ctx: RouteContext<{ id: string; matchId: string }>) => {
    const authCtx = await getAuthContext();
    const { matchId } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const match = await finishMatch(authCtx, matchId, body.winnerId, body.score1, body.score2);
    return NextResponse.json(match);
  },
);
