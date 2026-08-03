/**
 * POST /api/live/tournaments/[id]/register  — register a participant
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { register, registerBodySchema } from "@/features/tournament";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = registerBodySchema.parse(await req.json());
    const tournament = await register(authCtx, id, body);
    return NextResponse.json(tournament);
  },
);
