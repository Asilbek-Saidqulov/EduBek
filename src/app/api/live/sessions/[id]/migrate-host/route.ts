/**
 * POST /api/live/sessions/[id]/migrate-host  — migrate host role to another player
 *   Body: { newHostUserId: string, reason: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { migrateHost } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  newHostUserId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const session = await migrateHost(authCtx, id, body.newHostUserId, body.reason);
    return NextResponse.json(session);
  },
);
