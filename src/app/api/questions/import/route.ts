/**
 * POST /api/questions/import  — bulk import questions
 * GET  /api/questions/export?ids=...&ids=...  — export questions
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  importQuestions,
  exportQuestions,
  importQuestionsBodySchema,
} from "@/features/question-bank";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = importQuestionsBodySchema.parse(await req.json());
  const result = await importQuestions(ctx, body);
  return NextResponse.json(result, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const ids = url.searchParams.getAll("ids");
  const questions = await exportQuestions(ctx, ids);
  return NextResponse.json({ questions });
});
