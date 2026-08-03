/**
 * EduBek — Progress service.
 *
 * Aggregates per-student and per-classroom learning metrics for the teacher
 * dashboard and the student's "my progress" view.
 *
 * Authorization model:
 *   • getStudentProgress — a student sees their own progress; a teacher can
 *     view any student who is a member of a classroom the teacher owns.
 *   • getClassroomProgress — teacher of the classroom (or superadmin).
 *   • updateProgress — internal (no auth check) — called by other services
 *     when a state transition warrants a progress record. Always publishes
 *     PROGRESS_UPDATED so listeners (analytics, notifications) can react.
 *   • getLearningStreak — student sees their own streak.
 *
 * Events published:
 *   • PROGRESS_UPDATED — when updateProgress is called
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import { type AuthContext } from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  PROGRESS_UPDATED,
  type ProgressUpdatedEvent,
} from "@/infra/event-bus/events";
import * as classroomRepo from "@/features/classroom/repository";
import * as repo from "./repository";
import type {
  ClassroomProgressDto,
  ClassroomStudentProgressEntry,
  ProgressRecordDto,
  ProgressMetric,
  StudentProgressDto,
} from "./types";

const log = getLogger("progress-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapRecord(r: any): ProgressRecordDto {
  return {
    id: r.id,
    studentId: r.studentId,
    classroomId: r.classroomId,
    assignmentId: r.assignmentId,
    metric: r.metric,
    value: r.value,
    metadata: r.metadata ? safeParse(r.metadata) : null,
    createdAt: r.createdAt.toISOString(),
  };
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getStudentProgress
// ---------------------------------------------------------------------------

export async function getStudentProgress(
  ctx: AuthContext,
  studentId?: string,
  classroomId?: string,
): Promise<StudentProgressDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");

  const targetStudentId = studentId ?? ctx.userId;

  // If the caller is asking about someone else, they must be the teacher of
  // a classroom that student is in (or a superadmin).
  if (targetStudentId !== ctx.userId && !ctx.isSuperadmin) {
    // Verify teacher-of relationship via classroomId (or scan all classrooms
    // the caller teaches — but require classroomId for simplicity).
    if (!classroomId) {
      throw badRequest(
        "classroomId is required when viewing another student's progress",
      );
    }
    const classroom = await classroomRepo.findClassroomById(classroomId);
    if (!classroom) throw notFound("Classroom not found");
    if (classroom.teacherId !== ctx.userId) {
      throw forbidden("Only the classroom teacher can view student progress");
    }
    const membership = await classroomRepo.findStudent(
      classroomId,
      targetStudentId,
    );
    if (!membership || membership.status !== "active") {
      throw notFound("Student is not in this classroom");
    }
  }

  const aggregate = await repo.aggregateByStudent(targetStudentId);
  const recentRows = classroomId
    ? await repo.findByStudentAndClassroom(targetStudentId, classroomId)
    : await repo.findByStudent(targetStudentId);
  const streak = await repo.getStreak(targetStudentId);

  return {
    studentId: targetStudentId,
    assignmentsCompleted: aggregate.assignmentsCompleted,
    averageScore:
      aggregate.scoredCount > 0
        ? aggregate.totalScore / aggregate.scoredCount
        : null,
    totalTimeSpentMs: aggregate.totalTimeSpentMs,
    resourcesViewed: aggregate.resourcesViewed,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    recentRecords: recentRows.map(mapRecord),
  };
}

// ---------------------------------------------------------------------------
// getClassroomProgress
// ---------------------------------------------------------------------------

export async function getClassroomProgress(
  ctx: AuthContext,
  classroomId: string,
): Promise<ClassroomProgressDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const classroom = await classroomRepo.findClassroomById(classroomId);
  if (!classroom) throw notFound("Classroom not found");
  if (!ctx.isSuperadmin && classroom.teacherId !== ctx.userId) {
    throw forbidden("Only the classroom teacher can view classroom progress");
  }

  const aggregate = await repo.aggregateByClassroom(classroomId);
  const students = await classroomRepo.findStudents(classroomId);

  // Per-student roll-up.
  const studentEntries: ClassroomStudentProgressEntry[] = [];
  for (const s of students) {
    const agg = await repo.aggregateByStudent(s.studentId);
    const recent = await repo.findByStudentAndClassroom(
      s.studentId,
      classroomId,
    );
    const lastActivityAt = recent[0]?.createdAt ?? null;
    studentEntries.push({
      studentId: s.studentId,
      studentName: s.student?.name ?? null,
      studentEmail: s.student?.email ?? "",
      assignmentsCompleted: agg.assignmentsCompleted,
      averageScore:
        agg.scoredCount > 0 ? agg.totalScore / agg.scoredCount : null,
      totalTimeSpentMs: agg.totalTimeSpentMs,
      lastActivityAt: lastActivityAt ? lastActivityAt.toISOString() : null,
    });
  }

  return {
    classroomId,
    studentCount: aggregate.studentCount,
    averageScore: aggregate.averageScore,
    completionPct: aggregate.completionPct,
    lateSubmissions: aggregate.lateSubmissions,
    pendingGrading: aggregate.pendingGrading,
    students: studentEntries,
  };
}

// ---------------------------------------------------------------------------
// updateProgress (internal)
// ---------------------------------------------------------------------------

/**
 * Internal: append a ProgressRecord and publish PROGRESS_UPDATED. Other
 * services (assignment, submission, learning-session) call this after a
 * state transition that should be reflected in the student's progress
 * timeline.
 *
 * Streak handling: if the metric is `streak`, we additionally upsert the
 * `UserStreak` row so the streak counter is fast-readable without scanning
 * the ProgressRecord log.
 */
export async function updateProgress(
  studentId: string,
  metric: ProgressMetric,
  value: number,
  classroomId?: string,
  assignmentId?: string,
  metadata?: Record<string, unknown>,
): Promise<ProgressRecordDto> {
  const created = await repo.create({
    studentId,
    classroomId,
    assignmentId,
    metric,
    value,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });

  // Maintain the streak counter when the metric is `streak`. The value is
  // treated as the new currentStreak; longestStreak is bumped if exceeded.
  if (metric === "streak") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const existing = await repo.getStreak(studentId);
    const longestStreak = Math.max(existing.longestStreak, value);
    await repo.upsertStreak(studentId, {
      currentStreak: value,
      longestStreak,
      lastActivityDay: today,
    });
  }

  eventBus.publish(
    buildEvent<ProgressUpdatedEvent>({
      type: PROGRESS_UPDATED,
      actorId: studentId,
      studentId,
      metric,
      value,
      classroomId: classroomId ?? null,
    }),
  );

  log.debug("progress.updated", {
    studentId,
    metric,
    value,
    classroomId,
  });

  return mapRecord(created);
}

// ---------------------------------------------------------------------------
// getLearningStreak
// ---------------------------------------------------------------------------

export async function getLearningStreak(
  ctx: AuthContext,
): Promise<{ currentStreak: number; longestStreak: number; lastActivityDay: string | null }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const streak = await repo.getStreak(ctx.userId);
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActivityDay: streak.lastActivityDay
      ? streak.lastActivityDay.toISOString()
      : null,
  };
}
