/**
 * EduBek — Submission repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export interface CreateSubmissionInput {
  attemptId: string;
  studentId: string;
  content?: string;
  status?: string;
}

export async function createSubmission(input: CreateSubmissionInput) {
  return db.submission.create({
    data: {
      attemptId: input.attemptId,
      studentId: input.studentId,
      content: input.content ?? null,
      status: input.status ?? "draft",
    },
  });
}

export async function findSubmission(id: string) {
  return db.submission.findUnique({
    where: { id },
    include: {
      attempt: {
        include: {
          assignment: { include: { classroom: true } },
        },
      },
      grade: true,
    },
  });
}

export async function findSubmissionByAttempt(attemptId: string) {
  return db.submission.findUnique({
    where: { attemptId },
    include: {
      attempt: {
        include: {
          assignment: { include: { classroom: true } },
        },
      },
      grade: true,
    },
  });
}

export async function findSubmissionsByStudent(studentId: string) {
  return db.submission.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      attempt: {
        include: {
          assignment: { include: { classroom: true } },
        },
      },
    },
  });
}

export async function findSubmissionsByAssignment(assignmentId: string) {
  return db.submission.findMany({
    where: { attempt: { assignmentId } },
    orderBy: { createdAt: "desc" },
    include: {
      attempt: {
        include: {
          assignment: { include: { classroom: true } },
          student: { select: { id: true, name: true, email: true } },
        },
      },
      grade: true,
    },
  });
}

export async function findSubmissionsByClassroom(classroomId: string) {
  return db.submission.findMany({
    where: { attempt: { assignment: { classroomId } } },
    orderBy: { createdAt: "desc" },
    include: {
      attempt: {
        include: {
          assignment: { include: { classroom: true } },
          student: { select: { id: true, name: true, email: true } },
        },
      },
      grade: true,
    },
  });
}

export async function updateSubmission(
  id: string,
  data: {
    content?: string | null;
    feedback?: string | null;
    status?: string;
    submittedAt?: Date | null;
    returnedAt?: Date | null;
  },
) {
  return db.submission.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

export interface CreateGradeInput {
  submissionId: string;
  teacherId: string;
  points: number;
  maxPoints: number;
  rubric?: string;
  feedback?: string;
}

export async function createGrade(input: CreateGradeInput) {
  return db.grade.create({
    data: {
      submissionId: input.submissionId,
      teacherId: input.teacherId,
      points: input.points,
      maxPoints: input.maxPoints,
      rubric: input.rubric ?? null,
      feedback: input.feedback ?? null,
    },
  });
}

export async function findGrade(submissionId: string) {
  return db.grade.findUnique({ where: { submissionId } });
}

export async function updateGrade(
  submissionId: string,
  data: {
    points?: number;
    maxPoints?: number;
    rubric?: string | null;
    feedback?: string | null;
  },
) {
  return db.grade.update({ where: { submissionId }, data });
}

export async function publishGrade(submissionId: string) {
  return db.grade.update({
    where: { submissionId },
    data: { publishedAt: new Date() },
  });
}
