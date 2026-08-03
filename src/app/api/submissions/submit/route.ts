/**
 * POST /api/submissions/submit  — submit an attempt
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { submitAssignment, submitBodySchema } from "@/features/submission";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = submitBodySchema.parse(await req.json());
  const submission = await submitAssignment(ctx, body.attemptId, body.content);
  return NextResponse.json(submission);
});
