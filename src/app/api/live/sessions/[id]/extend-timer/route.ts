/**
 * POST /api/live/sessions/[id]/extend-timer  — host extends the current question timer
 *   Body: { addedMs: number }  (1..300000)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { extendTimer } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  addedMs: z.number().int().min(1).max(300_000),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const result = await extendTimer(authCtx, id, body.addedMs);
    return NextResponse.json(result);
  },
);
