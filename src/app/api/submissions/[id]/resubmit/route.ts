/**
 * POST /api/submissions/[id]/resubmit  — create a new attempt and resubmit
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getSubmission,
  resubmit,
  resubmitBodySchema,
} from "@/features/submission";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = resubmitBodySchema.parse(
    (await req.json().catch(() => ({}))) ?? {},
  );
  const submission = await getSubmission(auth, id);
  const result = await resubmit(auth, submission.attemptId, body.content);
  return NextResponse.json(result, { status: 201 });
});
