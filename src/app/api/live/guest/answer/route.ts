/**
 * POST /api/live/guest/answer
 *
 * Submit an answer as a guest player. The server determines correctness —
 * the guest's browser never submits correctness or score.
 *
 * Body: { guestToken: string, roundId: string, answer: number }
 * Response: { recorded, isCorrect, score, correctAnswer }
 *
 * SECURITY:
 *   - Guest JWT is verified
 *   - Round must belong to the guest's session
 *   - Round must be active (not finished)
 *   - answerLockAt is enforced (late answers rejected)
 *   - Idempotency: duplicate answers return the existing result
 *   - Correctness is computed server-side from the question snapshot
 */
import { NextResponse, type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { z } from "zod";
import { guestAnswer } from "@/features/live-session/guest-service";

const answerSchema = z.object({
  guestToken: z.string().min(1),
  roundId: z.string().min(1),
  answer: z.number().int().min(-1).max(10),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid answer payload" } },
      { status: 400 },
    );
  }
  const result = await guestAnswer({
    guestToken: parsed.data.guestToken,
    roundId: parsed.data.roundId,
    answer: parsed.data.answer,
  });
  return NextResponse.json(result);
});
