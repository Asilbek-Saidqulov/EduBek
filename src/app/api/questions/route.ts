/**
 * POST /api/questions  — create a question (any type)
 * GET  /api/questions  — search questions (paginated)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createQuestion,
  searchQuestions,
  createQuestionBodySchema,
  searchQuestionsQuerySchema,
} from "@/features/question-bank";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createQuestionBodySchema.parse(await req.json());
  const question = await createQuestion(ctx, body);
  return NextResponse.json(question, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = searchQuestionsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await searchQuestions(ctx, query);
  return NextResponse.json(result);
});
