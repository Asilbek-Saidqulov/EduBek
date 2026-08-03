/**
 * EduBek — Gradebook service.
 *
 * Read-side: getStudentGrades, getClassroomGrades, exportGradebook.
 * Write-side: recordGrade (called by assessment / exam / grading services
 * when a grade is finalized).
 *
 * Authorization model:
 *   • getStudentGrades (own) — any authenticated user with
 *     PersonalPermission.GRADEBOOK_VIEW_OWN.
 *   • getStudentGrades (other) / getClassroomGrades — caller must be the
 *     classroom teacher (or superadmin) with PersonalPermission.GRADEBOOK_VIEW.
 *   • recordGrade — internal API, called only from other services; not
 *     exposed via a public route.
 *
 * Events published:
 *   • GRADEBOOK_UPDATED — whenever recordGrade writes a new/updated entry.
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  GRADEBOOK_UPDATED,
  type GradebookUpdatedEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type {
  ClassroomGradebookDto,
  GradebookEntryDto,
  StudentGradebookDto,
} from "./types";

const log = getLogger("gradebook-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function mapEntry(e: any): GradebookEntryDto {
  return {
    id: e.id,
    classroomId: e.classroomId,
    studentId: e.studentId,
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    attemptId: e.attemptId,
    title: e.title,
    points: e.points,
    maxPoints: e.maxPoints,
    percentage: e.percentage,
    passed: e.passed,
    gradedAt: e.gradedAt ? e.gradedAt.toISOString() : null,
    metadata: safeParseMetadata(e.metadata),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function aggregateStudent(entries: GradebookEntryDto[]): {
  averagePercentage: number | null;
  passedCount: number;
  totalCount: number;
} {
  const graded = entries.filter((e) => e.percentage != null);
  if (graded.length === 0) {
    return { averagePercentage: null, passedCount: 0, totalCount: entries.length };
  }
  const sum = graded.reduce((s, e) => s + (e.percentage ?? 0), 0);
  const averagePercentage = Math.round((sum / graded.length) * 100) / 100;
  const passedCount = graded.filter((e) => e.passed === true).length;
  return { averagePercentage, passedCount, totalCount: entries.length };
}

// ---------------------------------------------------------------------------
// recordGrade (internal API)
// ---------------------------------------------------------------------------

export interface RecordGradeInput {
  studentId: string;
  classroomId?: string;
  sourceType: "assignment" | "assessment" | "exam";
  sourceId: string;
  attemptId?: string;
  assessmentAttemptId?: string;
  title: string;
  points?: number;
  maxPoints: number;
  percentage?: number;
  passed?: boolean;
  gradedAt?: Date;
  metadata?: Record<string, unknown>;
}

export async function recordGrade(input: RecordGradeInput): Promise<GradebookEntryDto> {
  const entry = await repo.upsertEntry({
    studentId: input.studentId,
    classroomId: input.classroomId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    attemptId: input.attemptId,
    assessmentAttemptId: input.assessmentAttemptId,
    title: input.title,
    points: input.points,
    maxPoints: input.maxPoints,
    percentage: input.percentage,
    passed: input.passed,
    gradedAt: input.gradedAt ?? new Date(),
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });

  eventBus.publish(
    buildEvent<GradebookUpdatedEvent>({
      type: GRADEBOOK_UPDATED,
      actorId: "system",
      entryId: entry.id,
      studentId: input.studentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      classroomId: input.classroomId ?? null,
    }),
  );

  return mapEntry(entry);
}

// ---------------------------------------------------------------------------
// getStudentGrades (own or other)
// ---------------------------------------------------------------------------

export async function getStudentGrades(
  ctx: AuthContext,
  studentId: string,
  classroomId?: string,
): Promise<StudentGradebookDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (studentId === ctx.userId) {
    if (!can(ctx, PersonalPermission.GRADEBOOK_VIEW_OWN)) {
      throw forbidden("No permission to view own grades");
    }
  } else {
    if (!can(ctx, PersonalPermission.GRADEBOOK_VIEW) && !ctx.isSuperadmin) {
      throw forbidden("No permission to view other students' grades");
    }
    // If classroomId is provided, verify caller is the classroom teacher.
    if (classroomId) {
      const classroom = await db.classroom.findUnique({
        where: { id: classroomId },
        select: { teacherId: true },
      });
      if (!classroom) throw notFound("Classroom not found");
      if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
        throw forbidden("Only the classroom teacher can view student grades");
      }
    }
  }

  const rows = classroomId
    ? await repo.findByStudentAndClassroom(studentId, classroomId)
    : await repo.findByStudent(studentId);

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true },
  });
  if (!student) throw notFound("Student not found");

  const entries = rows.map(mapEntry);
  const agg = aggregateStudent(entries);
  return {
    studentId,
    studentName: student.name,
    studentEmail: student.email,
    entries,
    ...agg,
  };
}

// ---------------------------------------------------------------------------
// getClassroomGrades
// ---------------------------------------------------------------------------

export async function getClassroomGrades(
  ctx: AuthContext,
  classroomId: string,
): Promise<ClassroomGradebookDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.GRADEBOOK_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view classroom grades");
  }
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, name: true, teacherId: true },
  });
  if (!classroom) throw notFound("Classroom not found");
  if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the classroom teacher can view classroom grades");
  }

  const rows = await repo.findByClassroom(classroomId);
  const students = await db.classroomStudent.findMany({
    where: { classroomId, status: "active" },
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  const entriesByStudent = new Map<string, GradebookEntryDto[]>();
  for (const r of rows) {
    const list = entriesByStudent.get(r.studentId) ?? [];
    list.push(mapEntry(r));
    entriesByStudent.set(r.studentId, list);
  }

  const studentDtos: StudentGradebookDto[] = students.map((s: any) => {
    const entries = entriesByStudent.get(s.studentId) ?? [];
    return {
      studentId: s.studentId,
      studentName: s.student?.name ?? null,
      studentEmail: s.student?.email ?? "",
      entries,
      ...aggregateStudent(entries),
    };
  });

  // Class average across all student averages.
  const studentAverages = studentDtos
    .map((s) => s.averagePercentage)
    .filter((a): a is number => a != null);
  const classAverage = studentAverages.length > 0
    ? Math.round((studentAverages.reduce((s, a) => s + a, 0) / studentAverages.length) * 100) / 100
    : null;

  return {
    classroomId,
    classroomName: classroom.name,
    studentCount: students.length,
    students: studentDtos,
    classAverage,
  };
}

// ---------------------------------------------------------------------------
// exportGradebook (CSV-ready)
// ---------------------------------------------------------------------------

export async function exportGradebook(
  ctx: AuthContext,
  classroomId: string,
): Promise<{ classroomId: string; rows: Array<Record<string, unknown>> }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.GRADEBOOK_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to export gradebook");
  }
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    select: { teacherId: true },
  });
  if (!classroom) throw notFound("Classroom not found");
  if (classroom.teacherId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the classroom teacher can export the gradebook");
  }
  const gradebook = await getClassroomGrades(ctx, classroomId);
  const rows: Array<Record<string, unknown>> = [];
  for (const student of gradebook.students) {
    for (const entry of student.entries) {
      rows.push({
        studentId: student.studentId,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        sourceType: entry.sourceType,
        title: entry.title,
        points: entry.points,
        maxPoints: entry.maxPoints,
        percentage: entry.percentage,
        passed: entry.passed,
        gradedAt: entry.gradedAt,
      });
    }
    // Include the student's summary row.
    rows.push({
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
      sourceType: "summary",
      title: "Average",
      points: null,
      maxPoints: 100,
      percentage: student.averagePercentage,
      passed: student.passedCount > 0,
      gradedAt: null,
    });
  }
  if (rows.length === 0) {
    throw badRequest("Gradebook is empty");
  }
  log.info("gradebook.exported", { classroomId, rowCount: rows.length });
  return { classroomId, rows };
}
