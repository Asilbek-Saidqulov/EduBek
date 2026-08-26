import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, badRequest, unauthorized, type RouteContext } from "@/lib/errors";
import { submitAttemptSchema, quizService } from "@/features/quiz";

export const POST = withErrorHandler<{ id: string }>(
  async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext().catch(() => null);
    if (!authCtx?.isAuthenticated || !authCtx.userId) {
      throw unauthorized("You must be logged in to submit a quiz attempt");
    }

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = submitAttemptSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid attempt submission payload", {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const gradedResult = await quizService.submitAttempt(id, authCtx.userId, parsed.data);
    return NextResponse.json(gradedResult);
  }
);
