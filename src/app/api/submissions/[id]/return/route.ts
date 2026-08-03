/**
 * POST /api/submissions/[id]/return  — return a submission with feedback
 *
 * Body: { feedback? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { returnSubmission } from "@/features/grading";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = (await req.json().catch(() => ({}))) as { feedback?: string };
  const result = await returnSubmission(auth, id, body.feedback);
  return NextResponse.json(result);
});
