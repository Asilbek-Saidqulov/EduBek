/**
 * POST /api/live/guest/status
 *
 * Get the current session state + current round question (without the
 * correct answer) so the guest can see and answer it.
 *
 * Body: { guestToken: string }
 * Response: { session, player, currentRound }
 *
 * SECURITY:
 *   - Guest JWT is verified
 *   - Question preview is built WITHOUT the correct answer
 *   - Player must belong to the session (playerId from token)
 */
import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { z } from "zod";
import { guestStatus } from "@/features/live-session/guest-service";

const statusSchema = z.object({
  guestToken: z.string().min(1),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid status payload" } },
      { status: 400 },
    );
  }
  const result = await guestStatus({ guestToken: parsed.data.guestToken });
  return NextResponse.json(result);
});
