/**
 * POST /api/live/tournaments/[id]/check-in  — participant check-in
 *   Body: { userId?: string }  (omit for self check-in)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { checkIn, checkInBodySchema } from "@/features/tournament";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = checkInBodySchema.parse(await req.json());
    const result = await checkIn(authCtx, id, body.userId);
    return NextResponse.json(result);
  },
);
