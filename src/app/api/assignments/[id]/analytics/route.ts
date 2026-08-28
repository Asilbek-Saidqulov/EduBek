/**
 * GET /api/assignments/[id]/analytics — get assignment analytics summary
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAssignmentAnalytics } from "@/features/assignment";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getAssignmentAnalytics(auth, id));
});
