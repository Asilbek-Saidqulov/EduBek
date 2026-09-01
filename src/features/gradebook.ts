import { db } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/errors";
import type { AuthContext } from "@/features/auth";

function requireUser(ctx: AuthContext) {
  if (!ctx?.userId) throw unauthorized();
  return ctx.userId;
}

export async function recordAssignmentGrade(input: {
  classroomId?: string | null;
  studentId: string;
  assignmentId: string;
  attemptId?: string;
  assessmentAttemptId?: string;
  title: string;
  points: number;
  maxPoints: number;
  percentage: number;
  passed: boolean;
}) {
  const existing = input.assessmentAttemptId
    ? await db.gradebookEntry.findUnique({ where: { assessmentAttemptId: input.assessmentAttemptId } })
    : await db.gradebookEntry.findFirst({
        where: { studentId: input.studentId, sourceType: "assignment", sourceId: input.assignmentId },
      });
  const data = {
    classroomId: input.classroomId || null,
    studentId: input.studentId,
    sourceType: "assignment",
    sourceId: input.assignmentId,
    attemptId: input.attemptId,
    assessmentAttemptId: input.assessmentAttemptId,
    title: input.title,
    points: input.points,
    maxPoints: input.maxPoints,
    percentage: input.percentage,
    passed: input.passed,
    gradedAt: new Date(),
  };
  if (existing) {
    return db.gradebookEntry.update({ where: { id: existing.id }, data });
  }
  return db.gradebookEntry.create({ data });
}

export async function getClassroomGrades(authCtx: AuthContext, classroomId: string) {
  const userId = requireUser(authCtx);
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    include: { students: { where: { status: "active" } }, assignments: true },
  });
  if (!classroom) return { success: true, classroomId, students: [], assignments: [], entries: [] };
  if (classroom.teacherId !== userId && !authCtx.platformRoles.includes("ADMIN")) {
    throw forbidden("Only the teacher can view this gradebook");
  }
  const entries = await db.gradebookEntry.findMany({
    where: { classroomId },
    orderBy: { updatedAt: "desc" },
  });
  return {
    success: true,
    classroomId,
    classroomName: classroom.name,
    students: classroom.students,
    assignments: classroom.assignments.map((a) => ({ id: a.id, title: a.title })),
    entries,
  };
}

export async function getStudentGrades(authCtx: AuthContext, classroomId?: string | null) {
  const userId = requireUser(authCtx);
  const where: any = { studentId: userId };
  if (classroomId) where.classroomId = classroomId;
  const entries = await db.gradebookEntry.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  return { success: true, studentId: userId, entries };
}

export async function exportGradebook(authCtx: AuthContext, classroomId: string) {
  const book = await getClassroomGrades(authCtx, classroomId);
  const rows = (book.entries || []).map((e: any) => ({
    studentId: e.studentId,
    title: e.title,
    points: e.points,
    maxPoints: e.maxPoints,
    percentage: e.percentage,
    passed: e.passed,
    gradedAt: e.gradedAt,
  }));
  return { success: true, format: "json", rows };
}
