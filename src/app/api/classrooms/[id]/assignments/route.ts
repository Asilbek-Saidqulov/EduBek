/**
 * GET /api/classrooms/[id]/assignments  — list assignments in a classroom
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAssignmentsByClassroom } from "@/features/assignment";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const assignments = await listAssignmentsByClassroom(auth, id);
  return NextResponse.json({ assignments });
});
