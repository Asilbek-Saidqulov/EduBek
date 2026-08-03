/**
 * POST /api/live/join  — join a session by join code
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { joinSession, joinSessionBodySchema } from "@/features/live-session";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = joinSessionBodySchema.parse(await req.json());
  const result = await joinSession(ctx, body);
  return NextResponse.json(result, { status: 201 });
});
