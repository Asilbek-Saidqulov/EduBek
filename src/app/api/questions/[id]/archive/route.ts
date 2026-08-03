/**
 * POST /api/questions/[id]/archive  — archive a question
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { archiveQuestion } from "@/features/question-bank";

export const POST = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const archived = await archiveQuestion(authCtx, id);
    return NextResponse.json(archived);
  },
);
