/**
 * POST /api/live/reconnect  — mark a player as reconnected (socket layer calls this)
 *   Body: { sessionId: string, socketId: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { reconnectPlayer } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  socketId: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await reconnectPlayer(ctx, body.sessionId, body.socketId);
  return NextResponse.json(result);
});
