import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, badRequest, unauthorized, type RouteContext } from "@/lib/errors";
import { updateQuizSchema, quizService } from "@/features/quiz";

export const GET = withErrorHandler<{ id: string }>(
  async (_req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    const { id } = await ctx.params;

    const quiz = await quizService.getQuizById(id, authCtx?.userId);
    return NextResponse.json(quiz);
  }
);

export const PUT = withErrorHandler<{ id: string }>(
  async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to update this quiz");
    }

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = updateQuizSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid update quiz payload", {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const updated = await quizService.updateQuiz(id, authCtx.userId, parsed.data);
    return NextResponse.json(updated);
  }
);
