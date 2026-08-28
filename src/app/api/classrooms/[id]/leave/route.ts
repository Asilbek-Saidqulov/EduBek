/**
 * POST /api/classrooms/[id]/leave — student leaves a classroom
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { leaveClassroom } from "@/features/classroom";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await leaveClassroom(auth, id));
});
