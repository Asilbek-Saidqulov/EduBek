/**
 * GET /api/classrooms/[id]/analytics — get classroom analytics summary
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getClassroomAnalytics } from "@/features/classroom";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getClassroomAnalytics(auth, id));
});
