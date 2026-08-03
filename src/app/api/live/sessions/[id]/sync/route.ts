/**
 * POST /api/live/sessions/[id]/sync  — full state sync for reconnecting participants
 *   Body: { lastSeenAt: string (ISO datetime) }
 *
 * Returns the current Quiz Session state, the active round (if any), the
 * latest leaderboard snapshot, and a count of events the participant
 * missed since `lastSeenAt`. Used by the socket layer on reconnect to
 * replay missed state without losing gameplay progress.
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { syncSessionState } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  lastSeenAt: z.string().datetime(),
});

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const result = await syncSessionState(authCtx, id, new Date(body.lastSeenAt));
    return NextResponse.json(result);
  },
);
