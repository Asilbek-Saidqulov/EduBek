/**
 * POST /api/live/leave  — leave a session
 *   Body: { sessionId: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { leaveSession } from "@/features/live-session";
import { z } from "zod";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await leaveSession(ctx, body.sessionId);
  return NextResponse.json(result);
});
