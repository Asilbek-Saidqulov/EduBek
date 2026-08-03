/**
 * GET /api/progress/student  — student's own progress
 *
 * Optional query:
 *   ?studentId=<id>     — view another student (requires teacher-of classroom)
 *   ?classroomId=<id>   — scope to a single classroom
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getStudentProgress } from "@/features/progress";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const classroomId = url.searchParams.get("classroomId") ?? undefined;
  const progress = await getStudentProgress(ctx, studentId, classroomId);
  return NextResponse.json(progress);
});
