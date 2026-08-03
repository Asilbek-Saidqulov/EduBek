/**
 * GET /api/questions/search  — search questions (paginated, filterable)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  searchQuestions,
  searchQuestionsQuerySchema,
} from "@/features/question-bank";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = searchQuestionsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await searchQuestions(ctx, query);
  return NextResponse.json(result);
});
