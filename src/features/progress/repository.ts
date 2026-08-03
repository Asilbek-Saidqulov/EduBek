/**
 * EduBek — Progress repository.
 *
 * The ONLY layer in this feature that imports `db`. The service composes
 * these primitives; routes never touch the data layer directly.
 *
 * ProgressRecord is an append-only event log keyed by `(studentId, metric,
 * createdAt)`. Aggregations are computed at read time — the table is small
 * (one row per metric per discrete action) and we read by index.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Progress records
// ---------------------------------------------------------------------------

export interface CreateProgressInput {
  studentId: string;
  classroomId?: string;
  assignmentId?: string;
  metric: string;
  value: number;
  metadata?: string;
}

export async function create(input: CreateProgressInput) {
  return db.progressRecord.create({
    data: {
      studentId: input.studentId,
      classroomId: input.classroomId ?? null,
      assignmentId: input.assignmentId ?? null,
      metric: input.metric,
      value: input.value,
      metadata: input.metadata ?? null,
    },
  });
}

export async function findByStudent(
  studentId: string,
  limit = 50,
): Promise<any[]> {
  return db.progressRecord.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findByClassroom(classroomId: string): Promise<any[]> {
  return db.progressRecord.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findByStudentAndClassroom(
  studentId: string,
  classroomId: string,
): Promise<any[]> {
  return db.progressRecord.findMany({
    where: { studentId, classroomId },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export interface StudentAggregate {
  assignmentsCompleted: number;
  totalScore: number;
  scoredCount: number;
  totalTimeSpentMs: number;
  resourcesViewed: number;
}

export async function aggregateByStudent(studentId: string): Promise<StudentAggregate> {
  const rows = await db.progressRecord.findMany({
    where: { studentId },
    select: { metric: true, value: true },
  });
  let assignmentsCompleted = 0;
  let totalScore = 0;
  let scoredCount = 0;
  let totalTimeSpentMs = 0;
  let resourcesViewed = 0;
  for (const r of rows) {
    switch (r.metric) {
      case "assignment_completed":
        assignmentsCompleted += 1;
        break;
      case "score":
        totalScore += r.value;
        scoredCount += 1;
        break;
      case "time_spent":
        totalTimeSpentMs += r.value;
        break;
      case "resource_viewed":
        resourcesViewed += 1;
        break;
      default:
        // other metrics (e.g. 'streak') are not part of this aggregate.
        break;
    }
  }
  return {
    assignmentsCompleted,
    totalScore,
    scoredCount,
    totalTimeSpentMs,
    resourcesViewed,
  };
}

export interface ClassroomAggregate {
  studentCount: number;
  averageScore: number | null;
  completionPct: number;
  lateSubmissions: number;
  pendingGrading: number;
}

/**
 * Aggregate progress across a classroom. We derive the numbers from the
 * underlying AssignmentAttempt / Submission tables (not the ProgressRecord
 * log) so that the classroom view stays consistent with the live state of
 * submissions, even if a `PROGRESS_UPDATED` event was lost.
 */
export async function aggregateByClassroom(
  classroomId: string,
): Promise<ClassroomAggregate> {
  const classroom = await db.classroom.findUnique({
    where: { id: classroomId },
    include: {
      _count: { select: { students: true } },
    },
  });
  if (!classroom) {
    return {
      studentCount: 0,
      averageScore: null,
      completionPct: 0,
      lateSubmissions: 0,
      pendingGrading: 0,
    };
  }
  const studentCount = classroom._count.students;

  const assignments = await db.assignment.findMany({
    where: { classroomId, visibility: "published", status: "active" },
    select: { id: true, dueDate: true },
  });
  const assignmentIds = assignments.map((a) => a.id);

  const attempts = assignmentIds.length
    ? await db.assignmentAttempt.findMany({
        where: { assignmentId: { in: assignmentIds } },
        include: {
          submission: { include: { grade: true } },
        },
      })
    : [];

  // Average score across graded attempts.
  const graded = attempts.filter((a) => a.score !== null);
  const averageScore =
    graded.length > 0
      ? graded.reduce((sum, a) => sum + (a.score ?? 0), 0) / graded.length
      : null;

  // Completion %: fraction of (student, assignment) pairs that have at
  // least one submitted/graded attempt.
  const activeStudentIds = (
    await db.classroomStudent.findMany({
      where: { classroomId, status: "active" },
      select: { studentId: true },
    })
  ).map((s) => s.studentId);
  const expectedPairs =
    assignmentIds.length * Math.max(activeStudentIds.length, 1);
  const completedPairs = new Set<string>();
  for (const a of attempts) {
    if (a.status === "submitted" || a.status === "graded" || a.status === "returned") {
      completedPairs.add(`${a.studentId}:${a.assignmentId}`);
    }
  }
  const completionPct =
    expectedPairs > 0
      ? Math.round((completedPairs.size / expectedPairs) * 100)
      : 0;

  // Late submissions: submissions submitted past their assignment's due date.
  const dueByAssignment = new Map<string, Date | null>(
    assignments.map((a) => [a.id, a.dueDate]),
  );
  let lateSubmissions = 0;
  let pendingGrading = 0;
  for (const a of attempts) {
    const sub = a.submission;
    if (!sub) continue;
    if (sub.submittedAt) {
      const due = dueByAssignment.get(a.assignmentId);
      if (due && new Date(sub.submittedAt) > due) lateSubmissions += 1;
    }
    if (sub.status === "submitted" && !sub.grade) {
      pendingGrading += 1;
    }
  }

  return {
    studentCount,
    averageScore,
    completionPct,
    lateSubmissions,
    pendingGrading,
  };
}

// ---------------------------------------------------------------------------
// Streaks (UserStreak table)
// ---------------------------------------------------------------------------

export async function getStreak(
  studentId: string,
): Promise<{ currentStreak: number; longestStreak: number; lastActivityDay: Date | null }> {
  const row = await db.userStreak.findUnique({ where: { userId: studentId } });
  return {
    currentStreak: row?.currentStreak ?? 0,
    longestStreak: row?.longestStreak ?? 0,
    lastActivityDay: row?.lastActivityDay ?? null,
  };
}

export async function upsertStreak(
  studentId: string,
  data: { currentStreak: number; longestStreak: number; lastActivityDay: Date },
): Promise<void> {
  await db.userStreak.upsert({
    where: { userId: studentId },
    create: {
      userId: studentId,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActivityDay: data.lastActivityDay,
    },
    update: {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActivityDay: data.lastActivityDay,
    },
  });
}
