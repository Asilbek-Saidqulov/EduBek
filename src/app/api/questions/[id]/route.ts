/**
 * GET    /api/questions/[id]  — get a question
 * PATCH  /api/questions/[id]  — update a question (creates a new version)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getQuestion,
  updateQuestion,
  updateQuestionBodySchema,
} from "@/features/question-bank";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const question = await getQuestion(authCtx, id);
    return NextResponse.json(question);
  },
);

export const PATCH = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = updateQuestionBodySchema.parse(await req.json());
    const updated = await updateQuestion(authCtx, id, body);
    return NextResponse.json(updated);
  },
);
