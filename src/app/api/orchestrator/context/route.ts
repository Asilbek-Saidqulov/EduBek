/**
 * GET /api/orchestrator/context — Build a Global AI Context snapshot.
 *
 * Query params:
 *   - organizationId (optional)
 *   - classroomId, courseId, assessmentId, studentId, teacherId (optional scope)
 *   - skip (comma-separated list of subsystems to skip)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildAIContext } from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  const scope: Parameters<typeof buildAIContext>[0]["scope"] = {};
  const classroomId = url.searchParams.get("classroomId");
  const courseId = url.searchParams.get("courseId");
  const assessmentId = url.searchParams.get("assessmentId");
  const studentId = url.searchParams.get("studentId");
  const teacherId = url.searchParams.get("teacherId");
  if (classroomId) scope.classroomId = classroomId;
  if (courseId) scope.courseId = courseId;
  if (assessmentId) scope.assessmentId = assessmentId;
  if (studentId) scope.studentId = studentId;
  if (teacherId) scope.teacherId = teacherId;
  const skipParam = url.searchParams.get("skip");
  type SkipKey = NonNullable<Parameters<typeof buildAIContext>[0]["skip"]>[number];
  const skip = skipParam ? (skipParam.split(",") as SkipKey[]) : undefined;

  const context = await buildAIContext({ ctx, organizationId, scope, skip });
  return NextResponse.json(context);
});
