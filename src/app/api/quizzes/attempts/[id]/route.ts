import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, unauthorized, type RouteContext } from "@/lib/errors";
import { quizService } from "@/features/quiz";

export const GET = withErrorHandler<{ id: string }>(
  async (_req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to view attempt results");
    }

    const { id } = await ctx.params;
    const result = await quizService.getAttemptResult(id, authCtx.userId);
    return NextResponse.json(result);
  }
);
