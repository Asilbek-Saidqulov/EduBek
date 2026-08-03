/**
 * POST /api/live/sessions/[id]/end  — end (or cancel) the session
 *   Body: { cancel?: boolean }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { endSession } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  cancel: z.boolean().default(false),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const session = await endSession(authCtx, id, body.cancel);
    return NextResponse.json(session);
  },
);
