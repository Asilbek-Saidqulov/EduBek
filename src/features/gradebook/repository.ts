/**
 * EduBek — Gradebook repository.
 *
 * The gradebook is a denormalized read model. Writes happen through the
 * `upsertEntryForAttempt` helper, which the assessment/exam/grading
 * services call after a grade is finalized. Reads are SQL-first, no JS
 * filtering.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface UpsertEntryInput {
  classroomId?: string;
  studentId: string;
  sourceType: string;
  sourceId: string;
  attemptId?: string;
  assessmentAttemptId?: string;
  title: string;
  points?: number;
  maxPoints: number;
  percentage?: number;
  passed?: boolean;
  gradedAt?: Date;
  metadata?: string;
}

export async function upsertEntry(input: UpsertEntryInput) {
  // If assessmentAttemptId is provided, we can use its unique constraint.
  if (input.assessmentAttemptId) {
    return db.gradebookEntry.upsert({
      where: { assessmentAttemptId: input.assessmentAttemptId },
      create: {
        classroomId: input.classroomId ?? null,
        studentId: input.studentId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        attemptId: input.attemptId ?? null,
        assessmentAttemptId: input.assessmentAttemptId,
        title: input.title,
        points: input.points ?? null,
        maxPoints: input.maxPoints,
        percentage: input.percentage ?? null,
        passed: input.passed ?? null,
        gradedAt: input.gradedAt ?? null,
        metadata: input.metadata ?? null,
      },
      update: {
        points: input.points ?? null,
        maxPoints: input.maxPoints,
        percentage: input.percentage ?? null,
        passed: input.passed ?? null,
        gradedAt: input.gradedAt ?? null,
        metadata: input.metadata ?? null,
      },
    });
  }
  // No unique constraint to upsert on — fall back to create.
  return db.gradebookEntry.create({
    data: {
      classroomId: input.classroomId ?? null,
      studentId: input.studentId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      attemptId: input.attemptId ?? null,
      title: input.title,
      points: input.points ?? null,
      maxPoints: input.maxPoints,
      percentage: input.percentage ?? null,
      passed: input.passed ?? null,
      gradedAt: input.gradedAt ?? null,
      metadata: input.metadata ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function findByStudent(studentId: string): Promise<any[]> {
  return db.gradebookEntry.findMany({
    where: { studentId },
    orderBy: { gradedAt: "desc" },
  });
}

export async function findByStudentAndClassroom(
  studentId: string,
  classroomId: string,
): Promise<any[]> {
  return db.gradebookEntry.findMany({
    where: { studentId, classroomId },
    orderBy: { gradedAt: "desc" },
  });
}

export async function findByClassroom(classroomId: string): Promise<any[]> {
  return db.gradebookEntry.findMany({
    where: { classroomId },
    orderBy: { studentId: "asc" },
  });
}

export async function findByAssessment(assessmentId: string): Promise<any[]> {
  return db.gradebookEntry.findMany({
    where: { sourceType: { in: ["assessment", "exam"] }, sourceId: assessmentId },
    orderBy: { studentId: "asc" },
  });
}
