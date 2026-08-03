/**
 * POST /api/live/spectate/verify  — verify a spectator token (called by the socket layer)
 *   Body: { token: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { verifyToken } from "@/features/spectator";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const body = bodySchema.parse(await req.json());
  const result = await verifyToken(body.token);
  return NextResponse.json(result);
});
