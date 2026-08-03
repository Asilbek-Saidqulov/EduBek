/**
 * POST /api/classrooms/[id]/students  — invite a student (by id or email)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  inviteStudent,
  inviteStudentBodySchema,
} from "@/features/classroom";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = inviteStudentBodySchema.parse(await req.json());
  const student = await inviteStudent(auth, id, body);
  return NextResponse.json(student, { status: 201 });
});
