/**
 * GET /api/questions/[id]/versions  — list all versions of a question
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getQuestionVersions } from "@/features/question-bank";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const versions = await getQuestionVersions(authCtx, id);
    return NextResponse.json({ versions });
  },
);
