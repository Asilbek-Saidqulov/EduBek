import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, unauthorized, type RouteContext } from "@/lib/errors";
import { quizService } from "@/features/quiz";

export const POST = withErrorHandler<{ id: string }>(
  async (_req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to start a quiz attempt");
    }

    const { id } = await ctx.params;
    const attempt = await quizService.startAttempt(id, authCtx.userId);
    return NextResponse.json(attempt, { status: 201 });
  }
);
