import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, badRequest, unauthorized, type RouteContext } from "@/lib/errors";
import { updateQuestionInputSchema, quizService } from "@/features/quiz";

export const PUT = withErrorHandler<{ id: string; questionId: string }>(
  async (req: NextRequest, ctx: RouteContext<{ id: string; questionId: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to update questions on this quiz");
    }

    const { id, questionId } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = updateQuestionInputSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid question update payload", {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const updated = await quizService.updateQuestion(id, questionId, authCtx.userId, parsed.data);
    return NextResponse.json(updated);
  }
);

export const DELETE = withErrorHandler<{ id: string; questionId: string }>(
  async (_req: NextRequest, ctx: RouteContext<{ id: string; questionId: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to delete questions from this quiz");
    }

    const { id, questionId } = await ctx.params;
    const result = await quizService.deleteQuestion(id, questionId, authCtx.userId);
    return NextResponse.json(result);
  }
);
