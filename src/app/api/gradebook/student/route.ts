/**
 * GET /api/gradebook/student  — get the caller's gradebook (optionally filtered by classroomId)
 *
 * Query: ?classroomId=...     — limit to one classroom
 *       ?studentId=...        — (teachers only) view another student
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getStudentGrades } from "@/features/gradebook";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? ctx.userId!;
  const classroomId = url.searchParams.get("classroomId") ?? undefined;
  const result = await getStudentGrades(ctx, studentId, classroomId);
  return NextResponse.json(result);
});
