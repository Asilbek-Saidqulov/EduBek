/**
 * EduBek — Proctoring repository.
 */
import { db } from "@/lib/db";

export async function findByAttempt(attemptId: string) {
  return db.proctoringIncident.findMany({
    where: { attemptId },
    orderBy: { occurredAt: "desc" },
  });
}

export async function findByStudent(studentId: string, limit = 100) {
  return db.proctoringIncident.findMany({
    where: { studentId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function findByFilters(input: {
  attemptId?: string;
  studentId?: string;
  severity?: string;
  incidentType?: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.attemptId) where.attemptId = input.attemptId;
  if (input.studentId) where.studentId = input.studentId;
  if (input.severity) where.severity = input.severity;
  if (input.incidentType) where.incidentType = input.incidentType;
  const [items, total] = await Promise.all([
    db.proctoringIncident.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    db.proctoringIncident.count({ where }),
  ]);
  return { items, total };
}

export async function countByAttempt(attemptId: string): Promise<number> {
  return db.proctoringIncident.count({ where: { attemptId } });
}
