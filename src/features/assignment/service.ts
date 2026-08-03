/**
 * EduBek — Assignment service.
 *
 * Business logic for assignments and the per-student attempt lifecycle:
 *
 *   draft assignment ──publish──▶ distribute one Resource copy + Attempt
 *                                                  per student
 *   student ──start──▶ in_progress attempt
 *   student ──(submission service)──▶ submitted / graded / returned
 *
 * Authorization model:
 *   • createAssignment / publish / archive / duplicate — teacher of the
 *     classroom (or superadmin).
 *   • getAssignment / listAssignmentsByClassroom — teacher or any active
 *     student in the classroom.
 *   • startAssignment / getMyAttempts — student in the classroom.
 *
 * Events published:
 *   • ASSIGNMENT_CREATED    — when an assignment is created (in draft)
 *   • ASSIGNMENT_PUBLISHED  — when an assignment is distributed to students
 *   • ASSIGNMENT_STARTED    — when a student starts an attempt
 *   • ASSIGNMENT_ARCHIVED   — when a teacher archives an assignment
 *   • ASSIGNMENT_DUPLICATED — when an assignment is copied to another classroom
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  isOrgMember,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  ASSIGNMENT_ARCHIVED,
  ASSIGNMENT_CREATED,
  ASSIGNMENT_DUPLICATED,
  ASSIGNMENT_PUBLISHED,
  ASSIGNMENT_STARTED,
  type AssignmentArchivedEvent,
  type AssignmentCreatedEvent,
  type AssignmentDuplicatedEvent,
  type AssignmentPublishedEvent,
  type AssignmentStartedEvent,
} from "@/infra/event-bus/events";
import { duplicateResource } from "@/features/resource/resource.service";
import * as classroomRepo from "@/features/classroom/repository";
import * as repo from "./repository";
import type {
  AssignmentAttemptDto,
  AssignmentDto,
  AssignmentWithAttemptsDto,
  AttemptStatus,
} from "./types";
import type {
  CreateAssignmentBody,
  DuplicateAssignmentBody,
  UpdateAssignmentBody,
} from "./schema";

const log = getLogger("assignment-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapAssignment(a: any): AssignmentDto {
  return {
    id: a.id,
    classroomId: a.classroomId,
    resourceId: a.resourceId,
    teacherId: a.teacherId,
    title: a.title,
    instructions: a.instructions,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    visibility: a.visibility,
    maxAttempts: a.maxAttempts,
    allowLate: a.allowLate,
    points: a.points,
    status: a.status,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function mapAttempt(a: any): AssignmentAttemptDto {
  return {
    id: a.id,
    assignmentId: a.assignmentId,
    studentId: a.studentId,
    resourceCopyId: a.resourceCopyId,
    status: a.status as AttemptStatus,
    attemptNumber: a.attemptNumber,
    startedAt: a.startedAt ? a.startedAt.toISOString() : null,
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
    gradedAt: a.gradedAt ? a.gradedAt.toISOString() : null,
    score: a.score,
    maxScore: a.maxScore,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

async function requireTeacherOfClassroom(
  ctx: AuthContext,
  classroomId: string,
): Promise<void> {
  const classroom = await classroomRepo.findClassroomById(classroomId);
  if (!classroom) throw notFound("Classroom not found");
  if (!ctx.isSuperadmin && classroom.teacherId !== ctx.userId) {
    throw forbidden("Only the teacher can perform this action");
  }
}

async function canAccessClassroom(
  ctx: AuthContext,
  classroomId: string,
): Promise<boolean> {
  const classroom = await classroomRepo.findClassroomById(classroomId);
  if (!classroom) return false;
  if (ctx.isSuperadmin) return true;
  if (classroom.teacherId === ctx.userId) return true;
  const membership = await classroomRepo.findStudent(classroomId, ctx.userId!);
  if (membership?.status === "active") return true;
  if (classroom.orgId && isOrgMember(ctx, classroom.orgId)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// createAssignment
// ---------------------------------------------------------------------------

export async function createAssignment(
  ctx: AuthContext,
  input: CreateAssignmentBody,
): Promise<AssignmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSIGNMENT_MANAGE)) {
    throw forbidden("No permission to manage assignments");
  }
  await requireTeacherOfClassroom(ctx, input.classroomId);

  const created = await repo.createAssignment({
    classroomId: input.classroomId,
    resourceId: input.resourceId,
    teacherId: ctx.userId,
    title: input.title,
    instructions: input.instructions,
    dueDate: input.dueDate,
    maxAttempts: input.maxAttempts,
    allowLate: input.allowLate,
    points: input.points,
  });

  eventBus.publish(
    buildEvent<AssignmentCreatedEvent>({
      type: ASSIGNMENT_CREATED,
      actorId: ctx.userId,
      assignmentId: created.id,
      classroomId: created.classroomId,
      resourceId: created.resourceId,
      title: created.title,
    }),
  );

  log.info("assignment.created", { assignmentId: created.id });

  return mapAssignment(created);
}

// ---------------------------------------------------------------------------
// getAssignment
// ---------------------------------------------------------------------------

export async function getAssignment(
  ctx: AuthContext,
  id: string,
): Promise<AssignmentWithAttemptsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const assignment = await repo.findAssignmentWithAttempts(id);
  if (!assignment) throw notFound("Assignment not found");

  const classroom = assignment.classroom;
  const isTeacher = ctx.isSuperadmin || classroom.teacherId === ctx.userId;
  if (!isTeacher) {
    const accessible = await canAccessClassroom(ctx, classroom.id);
    if (!accessible) {
      throw forbidden("You do not have access to this assignment");
    }
  }

  const dto: AssignmentWithAttemptsDto = mapAssignment(assignment);
  // Only teachers see other students' attempts. Students see only their own.
  if (isTeacher) {
    dto.attempts = assignment.attempts.map(mapAttempt);
  } else {
    dto.attempts = assignment.attempts
      .filter((a: any) => a.studentId === ctx.userId)
      .map(mapAttempt);
  }
  return dto;
}

// ---------------------------------------------------------------------------
// listAssignmentsByClassroom
// ---------------------------------------------------------------------------

export async function listAssignmentsByClassroom(
  ctx: AuthContext,
  classroomId: string,
): Promise<AssignmentDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const accessible = await canAccessClassroom(ctx, classroomId);
  if (!accessible) {
    throw forbidden("You do not have access to this classroom");
  }
  const assignments = await repo.findAssignmentsByClassroom(classroomId);
  // Students only see published assignments; teachers see all (draft + published).
  const classroom = await classroomRepo.findClassroomById(classroomId);
  const isTeacher = ctx.isSuperadmin || classroom?.teacherId === ctx.userId;
  return assignments
    .filter((a) => isTeacher || a.visibility === "published")
    .map(mapAssignment);
}

// ---------------------------------------------------------------------------
// updateAssignment
// ---------------------------------------------------------------------------

export async function updateAssignment(
  ctx: AuthContext,
  id: string,
  input: UpdateAssignmentBody,
): Promise<AssignmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssignmentById(id);
  if (!existing) throw notFound("Assignment not found");
  await requireTeacherOfClassroom(ctx, existing.classroomId);

  const updated = await repo.updateAssignment(id, {
    title: input.title,
    instructions: input.instructions,
    dueDate: input.dueDate ?? undefined,
    maxAttempts: input.maxAttempts,
    allowLate: input.allowLate,
    points: input.points,
  });

  return mapAssignment(updated);
}

// ---------------------------------------------------------------------------
// publishAssignment
// ---------------------------------------------------------------------------

export async function publishAssignment(
  ctx: AuthContext,
  id: string,
): Promise<AssignmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssignmentById(id);
  if (!existing) throw notFound("Assignment not found");
  await requireTeacherOfClassroom(ctx, existing.classroomId);

  if (existing.visibility === "archived") {
    throw badRequest("Cannot publish an archived assignment");
  }

  // Distribute to every active student in the classroom. For each student we
  // call `duplicateResource` (resource feature) to give them their own copy
  // of the source material, then create an AssignmentAttempt linking the
  // student to that copy. Idempotent: students who already have an attempt
  // for this assignment are skipped.
  const students = await classroomRepo.findStudents(existing.classroomId);
  let distributed = 0;
  for (const student of students) {
    const existingAttempt = await repo.findLatestAttempt(id, student.studentId);
    if (existingAttempt) continue;

    const copy = await duplicateResource(ctx, existing.resourceId, {
      title: `${existing.title} — ${student.student?.name ?? student.studentId}`,
    });

    await repo.createAttempt({
      assignmentId: id,
      studentId: student.studentId,
      resourceCopyId: copy.id,
      attemptNumber: 1,
    });
    distributed += 1;
  }

  const updated = await repo.setAssignmentVisibility(id, "published");

  eventBus.publish(
    buildEvent<AssignmentPublishedEvent>({
      type: ASSIGNMENT_PUBLISHED,
      actorId: ctx.userId,
      assignmentId: id,
      classroomId: existing.classroomId,
      studentCount: distributed,
    }),
  );

  log.info("assignment.published", {
    assignmentId: id,
    distributed,
  });

  return mapAssignment(updated);
}

// ---------------------------------------------------------------------------
// archiveAssignment
// ---------------------------------------------------------------------------

export async function archiveAssignment(
  ctx: AuthContext,
  id: string,
): Promise<AssignmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssignmentById(id);
  if (!existing) throw notFound("Assignment not found");
  await requireTeacherOfClassroom(ctx, existing.classroomId);

  const updated = await repo.setAssignmentVisibility(id, "archived");

  eventBus.publish(
    buildEvent<AssignmentArchivedEvent>({
      type: ASSIGNMENT_ARCHIVED,
      actorId: ctx.userId,
      assignmentId: id,
      classroomId: existing.classroomId,
    }),
  );

  return mapAssignment(updated);
}

// ---------------------------------------------------------------------------
// duplicateAssignment
// ---------------------------------------------------------------------------

export async function duplicateAssignment(
  ctx: AuthContext,
  id: string,
  input: DuplicateAssignmentBody,
): Promise<AssignmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssignmentById(id);
  if (!existing) throw notFound("Assignment not found");
  await requireTeacherOfClassroom(ctx, existing.classroomId);
  // The teacher must also be the teacher of the target classroom.
  await requireTeacherOfClassroom(ctx, input.targetClassroomId);

  const created = await repo.createAssignment({
    classroomId: input.targetClassroomId,
    resourceId: existing.resourceId,
    teacherId: ctx.userId,
    title: `Copy of ${existing.title}`,
    instructions: existing.instructions ?? undefined,
    dueDate: existing.dueDate ?? undefined,
    maxAttempts: existing.maxAttempts,
    allowLate: existing.allowLate,
    points: existing.points,
  });

  eventBus.publish(
    buildEvent<AssignmentDuplicatedEvent>({
      type: ASSIGNMENT_DUPLICATED,
      actorId: ctx.userId,
      assignmentId: created.id,
      originalAssignmentId: id,
      classroomId: created.classroomId,
    }),
  );

  return mapAssignment(created);
}

// ---------------------------------------------------------------------------
// startAssignment
// ---------------------------------------------------------------------------

export async function startAssignment(
  ctx: AuthContext,
  assignmentId: string,
): Promise<AssignmentAttemptDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSIGNMENT_SUBMIT)) {
    throw forbidden("No permission to start assignments");
  }

  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw notFound("Assignment not found");
  if (assignment.visibility !== "published") {
    throw badRequest("Assignment is not published yet");
  }
  // Must be an active student in the classroom.
  const membership = await classroomRepo.findStudent(
    assignment.classroomId,
    ctx.userId,
  );
  if (!membership || membership.status !== "active") {
    throw forbidden("You are not a student in this classroom");
  }

  // Find the not_started / in_progress attempt for this student. We always
  // reuse the most recent attempt — the resubmit flow (in the submission
  // service) is responsible for creating additional attempts.
  let attempt = await repo.findLatestAttempt(assignmentId, ctx.userId);
  if (!attempt) {
    throw notFound(
      "No attempt has been distributed to you for this assignment yet",
    );
  }
  if (attempt.status === "submitted" || attempt.status === "graded") {
    // Already finalized — student must use resubmit flow.
    throw badRequest(
      `Cannot start an attempt that is already ${attempt.status}`,
    );
  }

  if (attempt.status === "not_started") {
    attempt = await repo.updateAttempt(attempt.id, {
      status: "in_progress",
      startedAt: new Date(),
    });
  }

  eventBus.publish(
    buildEvent<AssignmentStartedEvent>({
      type: ASSIGNMENT_STARTED,
      actorId: ctx.userId,
      assignmentId,
      attemptId: attempt.id,
      studentId: ctx.userId,
    }),
  );

  log.info("assignment.started", {
    assignmentId,
    attemptId: attempt.id,
  });

  return mapAttempt(attempt);
}

// ---------------------------------------------------------------------------
// getMyAttempts
// ---------------------------------------------------------------------------

export async function getMyAttempts(
  ctx: AuthContext,
  assignmentId: string,
): Promise<AssignmentAttemptDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw notFound("Assignment not found");
  const accessible = await canAccessClassroom(ctx, assignment.classroomId);
  if (!accessible) {
    throw forbidden("You do not have access to this assignment");
  }
  const attempts = await repo.findAttemptsByStudent(assignmentId, ctx.userId);
  return attempts.map(mapAttempt);
}
