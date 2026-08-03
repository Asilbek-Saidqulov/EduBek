/**
 * POST /api/live/matchmaking  — find a match for the caller
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { findMatch, matchmakingBodySchema } from "@/features/matchmaking";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = matchmakingBodySchema.parse(await req.json());
  const result = await findMatch(ctx, body);
  return NextResponse.json(result);
});
