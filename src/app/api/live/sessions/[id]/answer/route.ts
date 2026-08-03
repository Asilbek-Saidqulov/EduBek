/**
 * POST /api/live/sessions/[id]/answer  — submit an answer for the current round
 *   Body: { answer: unknown, responseMs: number }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { submitAnswer, submitAnswerBodySchema } from "@/features/live-session";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = submitAnswerBodySchema.parse(await req.json());
    const answer = await submitAnswer(authCtx, id, body);
    return NextResponse.json(answer, { status: 201 });
  },
);
