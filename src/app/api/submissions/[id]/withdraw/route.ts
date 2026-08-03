/**
 * POST /api/submissions/[id]/withdraw  — withdraw a submission
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSubmission, withdrawSubmission } from "@/features/submission";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const submission = await getSubmission(auth, id);
  return NextResponse.json(await withdrawSubmission(auth, submission.attemptId));
});
