/**
 * GET /api/progress/classroom/[id]  — classroom progress (teacher only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getClassroomProgress } from "@/features/progress";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getClassroomProgress(auth, id));
});
