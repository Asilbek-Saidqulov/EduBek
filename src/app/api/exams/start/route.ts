/**
 * POST /api/exams/start  — start an exam attempt
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startExam, startExamBodySchema } from "@/features/exam";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = startExamBodySchema.parse(await req.json());
  const attempt = await startExam(ctx, body);
  return NextResponse.json(attempt, { status: 201 });
});
