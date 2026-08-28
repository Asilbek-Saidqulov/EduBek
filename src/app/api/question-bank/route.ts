/**
 * GET  /api/question-bank  — list bank questions (paginated, filterable)
 * POST /api/question-bank  — create a bank question
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listBankQuestions,
  createBankQuestion,
  listBankQuestionsQuerySchema,
  createBankQuestionBodySchema,
} from "@/features/assessment";

export const GET = withErrorHandler(async (req) => {
  const authCtx = await getAuthContext();
  const url = new URL(req.url);
  const query = listBankQuestionsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listBankQuestions(authCtx, query);
  return NextResponse.json(result);
});

export const POST = withErrorHandler(async (req) => {
  const authCtx = await getAuthContext();
  const body = createBankQuestionBodySchema.parse(await req.json());
  const question = await createBankQuestion(authCtx, body);
  return NextResponse.json(question, { status: 201 });
});
