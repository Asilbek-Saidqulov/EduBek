/**
 * EduBek — Learning-session repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  studentId: string;
  attemptId?: string;
  resourceId?: string;
}

export async function create(input: CreateSessionInput) {
  return db.learningSession.create({
    data: {
      studentId: input.studentId,
      attemptId: input.attemptId ?? null,
      resourceId: input.resourceId ?? null,
      status: "active",
      durationMs: 0,
      interactions: 0,
    },
  });
}

export async function findById(id: string) {
  return db.learningSession.findUnique({ where: { id } });
}

export async function findByStudent(studentId: string, limit = 50) {
  return db.learningSession.findMany({
    where: { studentId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function findActive(studentId: string) {
  return db.learningSession.findMany({
    where: { studentId, status: "active" },
    orderBy: { startedAt: "desc" },
  });
}

export async function update(
  id: string,
  data: {
    status?: string;
    durationMs?: number;
    interactions?: number;
    completedAt?: Date | null;
  },
) {
  return db.learningSession.update({ where: { id }, data });
}

export async function complete(
  id: string,
  durationMs: number,
  interactions: number,
) {
  return db.learningSession.update({
    where: { id },
    data: {
      status: "completed",
      durationMs,
      interactions,
      completedAt: new Date(),
    },
  });
}
