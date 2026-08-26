import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/features/auth";
import { withErrorHandler, badRequest, unauthorized } from "@/lib/errors";
import { createQuizSchema, listQuizzesQuerySchema, quizService } from "@/features/quiz";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authCtx = await getAuthContext().catch(() => null);
  const { searchParams } = new URL(req.url);

  const queryObj = {
    category: searchParams.get("category") || undefined,
    difficulty: (searchParams.get("difficulty") as any) || undefined,
    search: searchParams.get("search") || undefined,
    mine: (searchParams.get("mine") as any) || undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
  };

  const parsed = listQuizzesQuerySchema.safeParse(queryObj);
  if (!parsed.success) {
    throw badRequest("Invalid quiz query parameters", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const result = await quizService.listQuizzes(parsed.data, authCtx?.userId);
  return NextResponse.json(result);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authCtx = await getAuthContext().catch(() => null);
  if (!authCtx?.isAuthenticated || !authCtx.userId) {
    throw unauthorized("You must be logged in to create a quiz");
  }

  const body = await req.json().catch(() => null);
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid quiz payload", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  const created = await quizService.createQuiz(authCtx.userId, parsed.data);
  return NextResponse.json(created, { status: 201 });
});
