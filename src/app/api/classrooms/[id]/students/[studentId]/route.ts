/**
 * DELETE /api/classrooms/[id]/students/[studentId]  — remove a student
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { removeStudent } from "@/features/classroom";

export const DELETE = withErrorHandler<{ id: string; studentId: string }>(
  async (req, ctx) => {
    const { id, studentId } = (await ctx.params) as {
      id: string;
      studentId: string;
    };
    const auth = await getAuthContext();
    await removeStudent(auth, id, studentId);
    return NextResponse.json({ success: true });
  },
);
