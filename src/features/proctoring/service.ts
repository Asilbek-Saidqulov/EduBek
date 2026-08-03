/**
 * EduBek — Proctoring service.
 *
 * Read-side only — incidents are WRITTEN by the exam service's
 * `recordProctoring()` function (so that the attempt row is updated
 * atomically). This module exposes the read endpoints that teachers use
 * to review integrity incidents during grading.
 *
 * Authorization model:
 *   • getAttemptSummary / listIncidents — caller must be the teacher of
 *     the classroom the attempt's assessment belongs to (or superadmin)
 *     with PersonalPermission.PROCTORING_VIEW.
 *   • getMyIncidents — student can view their own incidents.
 *
 * No events published (incidents are already recorded via the exam
 * service; this module only reads them).
 */
import { getLogger } from "@/lib/logger";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { db } from "@/lib/db";
import * as repo from "./repository";
import type {
  ProctoringIncidentDto,
  ProctoringSeverity,
  ProctoringSummaryDto,
  ProctoringIncidentType,
} from "./types";
import type { ListIncidentsQuery } from "./schema";

const log = getLogger("proctoring-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function safeParseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function mapIncident(i: any): ProctoringIncidentDto {
  return {
    id: i.id,
    attemptId: i.attemptId,
    studentId: i.studentId,
    incidentType: i.incidentType as ProctoringIncidentType,
    severity: i.severity as ProctoringSeverity,
    description: i.description,
    metadata: safeParseMetadata(i.metadata),
    occurredAt: i.occurredAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

async function assertTeacherOfAttempt(ctx: AuthContext, attemptId: string): Promise<void> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.PROCTORING_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view proctoring incidents");
  }
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      studentId: true,
      assessment: { select: { ownerId: true, classroomId: true } },
    },
  });
  if (!attempt) throw notFound("Attempt not found");
  // Owner of the assessment, or teacher of the classroom.
  const isOwner = attempt.assessment.ownerId === ctx.userId;
  let isClassroomTeacher = false;
  if (attempt.assessment.classroomId) {
    const classroom = await db.classroom.findUnique({
      where: { id: attempt.assessment.classroomId },
      select: { teacherId: true },
    });
    isClassroomTeacher = classroom?.teacherId === ctx.userId;
  }
  if (!isOwner && !isClassroomTeacher && !ctx.isSuperadmin) {
    throw forbidden("Only the assessment owner or classroom teacher can view proctoring incidents");
  }
}

// ---------------------------------------------------------------------------
// getAttemptSummary
// ---------------------------------------------------------------------------

export async function getAttemptSummary(
  ctx: AuthContext,
  attemptId: string,
): Promise<ProctoringSummaryDto> {
  await assertTeacherOfAttempt(ctx, attemptId);
  const incidents = await repo.findByAttempt(attemptId);
  const bySeverity: Record<ProctoringSeverity, number> = { info: 0, warning: 0, critical: 0 };
  const byType: Partial<Record<ProctoringIncidentType, number>> = {};
  for (const inc of incidents) {
    bySeverity[inc.severity as ProctoringSeverity] += 1;
    byType[inc.incidentType as ProctoringIncidentType] =
      (byType[inc.incidentType as ProctoringIncidentType] ?? 0) + 1;
  }
  const flagged = incidents.length >= 3 || bySeverity.critical > 0;
  return {
    attemptId,
    studentId: incidents[0]?.studentId ?? "",
    incidentCount: incidents.length,
    flagged,
    bySeverity,
    byType,
    recent: incidents.slice(0, 10).map(mapIncident),
  };
}

// ---------------------------------------------------------------------------
// listIncidents
// ---------------------------------------------------------------------------

export async function listIncidents(
  ctx: AuthContext,
  query: ListIncidentsQuery,
): Promise<{ incidents: ProctoringIncidentDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.PROCTORING_VIEW) && !ctx.isSuperadmin) {
    throw forbidden("No permission to view proctoring incidents");
  }
  const result = await repo.findByFilters({
    attemptId: query.attemptId,
    studentId: query.studentId,
    severity: query.severity,
    incidentType: query.incidentType,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    incidents: result.items.map(mapIncident),
    total: result.total,
  };
}

// ---------------------------------------------------------------------------
// getMyIncidents (student view)
// ---------------------------------------------------------------------------

export async function getMyIncidents(
  ctx: AuthContext,
): Promise<ProctoringIncidentDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const incidents = await repo.findByStudent(ctx.userId);
  return incidents.map(mapIncident);
}
