/**
 * GET /api/submissions/[id]  — get a single submission
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getSubmission } from "@/features/submission";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getSubmission(auth, id));
});
