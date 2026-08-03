/**
 * POST /api/submissions/draft  — save a draft submission
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { saveDraft, saveDraftBodySchema } from "@/features/submission";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = saveDraftBodySchema.parse(await req.json());
  const submission = await saveDraft(ctx, body.attemptId, body.content);
  return NextResponse.json(submission, { status: 201 });
});
