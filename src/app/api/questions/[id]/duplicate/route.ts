/**
 * POST /api/questions/[id]/duplicate  — duplicate a question
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { duplicateQuestion } from "@/features/question-bank";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const duplicated = await duplicateQuestion(authCtx, id);
    return NextResponse.json(duplicated, { status: 201 });
  },
);
