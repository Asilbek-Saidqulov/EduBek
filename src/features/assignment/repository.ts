/**
 * EduBek — Assignment repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export interface CreateAssignmentInput {
  classroomId: string;
  resourceId: string;
  teacherId: string;
  title: string;
  instructions?: string;
  dueDate?: Date;
  maxAttempts: number;
  allowLate: boolean;
  points: number;
}

export async function createAssignment(input: CreateAssignmentInput) {
  return db.assignment.create({
    data: {
      classroomId: input.classroomId,
      resourceId: input.resourceId,
      teacherId: input.teacherId,
      title: input.title,
      instructions: input.instructions ?? null,
      dueDate: input.dueDate ?? null,
      visibility: "draft",
      maxAttempts: input.maxAttempts,
      allowLate: input.allowLate,
      points: input.points,
      status: "active",
    },
  });
}

export async function findAssignmentById(id: string) {
  return db.assignment.findUnique({ where: { id } });
}

export async function findAssignmentWithAttempts(id: string) {
  return db.assignment.findUnique({
    where: { id },
    include: {
      attempts: {
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      },
      classroom: { select: { id: true, teacherId: true, orgId: true } },
    },
  });
}

export async function findAssignmentsByClassroom(classroomId: string) {
  return db.assignment.findMany({
    where: { classroomId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function findAssignmentsByTeacher(teacherId: string) {
  return db.assignment.findMany({
    where: { teacherId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAssignment(
  id: string,
  data: {
    title?: string;
    instructions?: string | null;
    dueDate?: Date | null;
    maxAttempts?: number;
    allowLate?: boolean;
    points?: number;
  },
) {
  return db.assignment.update({ where: { id }, data });
}

export async function setAssignmentVisibility(
  id: string,
  visibility: "draft" | "published" | "archived",
) {
  return db.assignment.update({
    where: { id },
    data: {
      visibility,
      publishedAt: visibility === "published" ? new Date() : undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export async function createAttempt(input: {
  assignmentId: string;
  studentId: string;
  resourceCopyId: string;
  attemptNumber: number;
}) {
  return db.assignmentAttempt.create({
    data: {
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      resourceCopyId: input.resourceCopyId,
      attemptNumber: input.attemptNumber,
      status: "not_started",
    },
  });
}

export async function findAttempt(id: string) {
  return db.assignmentAttempt.findUnique({
    where: { id },
    include: {
      assignment: { include: { classroom: true } },
    },
  });
}

export async function findAttemptsByStudent(
  assignmentId: string,
  studentId: string,
) {
  return db.assignmentAttempt.findMany({
    where: { assignmentId, studentId },
    orderBy: { attemptNumber: "desc" },
  });
}

export async function findAttemptsByAssignment(assignmentId: string) {
  return db.assignmentAttempt.findMany({
    where: { assignmentId },
    orderBy: { attemptNumber: "desc" },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findLatestAttempt(
  assignmentId: string,
  studentId: string,
) {
  return db.assignmentAttempt.findFirst({
    where: { assignmentId, studentId },
    orderBy: { attemptNumber: "desc" },
  });
}

export async function updateAttempt(
  id: string,
  data: {
    status?: string;
    startedAt?: Date | null;
    submittedAt?: Date | null;
    gradedAt?: Date | null;
    score?: number | null;
    maxScore?: number;
  },
) {
  return db.assignmentAttempt.update({ where: { id }, data });
}

export async function countAttemptsByStudent(
  assignmentId: string,
  studentId: string,
): Promise<number> {
  return db.assignmentAttempt.count({
    where: { assignmentId, studentId },
  });
}
