/**
 * POST /api/live/spectate  — mint a spectator token
 *   Body: { sessionId: string, expiresIn?: number }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { mintToken, createSpectatorTokenBodySchema } from "@/features/spectator";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createSpectatorTokenBodySchema.parse(await req.json());
  const token = await mintToken(ctx, body);
  return NextResponse.json(token, { status: 201 });
});
