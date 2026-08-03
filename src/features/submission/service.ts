/**
 * EduBek — Submission service.
 *
 * Business logic for students saving drafts, submitting work, withdrawing,
 * and resubmitting. Grading itself lives in the sibling `grading` feature,
 * but the `Grade` row is stored in this repository because Grade is a
 * 1:1 child of Submission.
 *
 * Authorization model:
 *   • saveDraft / submitAssignment / withdraw / resubmit — the student who
 *     owns the attempt (or superadmin).
 *   • listSubmissions — teachers see all submissions in a classroom (or for
 *     an assignment); students see only their own.
 *   • getSubmission — teacher of the classroom or the owning student.
 *
 * Events published:
 *   • ASSIGNMENT_SUBMITTED  — when a student submits a draft attempt
 *   • ASSIGNMENT_RESUBMITTED — when a student creates a new attempt after a
 *                              returned/graded submission (maxAttempts
 *                              permitting)
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
  ASSIGNMENT_RESUBMITTED,
  ASSIGNMENT_SUBMITTED,
  type AssignmentResubmittedEvent,
  type AssignmentSubmittedEvent,
} from "@/infra/event-bus/events";
import * as attemptRepo from "@/features/assignment/repository";
import * as classroomRepo from "@/features/classroom/repository";
import * as repo from "./repository";
import type { SubmissionDto, SubmissionStatus } from "./types";
import type {
  ListSubmissionsQuery,
  SaveDraftBody,
  SubmitBody,
} from "./schema";

const log = getLogger("submission-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSubmission(s: any): SubmissionDto {
  return {
    id: s.id,
    attemptId: s.attemptId,
    studentId: s.studentId,
    content: s.content,
    feedback: s.feedback,
    status: s.status as SubmissionStatus,
    attachments: s.attachments ? safeParse(s.attachments) : null,
    submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
    returnedAt: s.returnedAt ? s.returnedAt.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    grade: s.grade
      ? {
          id: s.grade.id,
          points: s.grade.points,
          maxPoints: s.grade.maxPoints,
          feedback: s.grade.feedback,
          publishedAt: s.grade.publishedAt
            ? s.grade.publishedAt.toISOString()
            : null,
          teacherId: s.grade.teacherId,
        }
      : null,
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
// Authorization helpers
// ---------------------------------------------------------------------------

async function assertStudentOwnsAttempt(
  ctx: AuthContext,
  attemptId: string,
): Promise<NonNullable<Awaited<ReturnType<typeof attemptRepo.findAttempt>>>> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await attemptRepo.findAttempt(attemptId);
  if (!attempt) throw notFound("Attempt not found");
  if (!ctx.isSuperadmin && attempt.studentId !== ctx.userId) {
    throw forbidden("You can only manage your own attempt");
  }
  return attempt as any;
}

async function assertTeacherOfClassroomForAttempt(
  ctx: AuthContext,
  attempt: { assignment: { classroom: { teacherId: string } } },
): Promise<void> {
  if (ctx.isSuperadmin) return;
  if (attempt.assignment.classroom.teacherId !== ctx.userId) {
    throw forbidden("Only the classroom teacher can perform this action");
  }
}

// ---------------------------------------------------------------------------
// saveDraft
// ---------------------------------------------------------------------------

export async function saveDraft(
  ctx: AuthContext,
  attemptId: string,
  content?: string,
): Promise<SubmissionDto> {
  const attempt = await assertStudentOwnsAttempt(ctx, attemptId);
  if (!can(ctx, PersonalPermission.ASSIGNMENT_SUBMIT)) {
    throw forbidden("No permission to submit assignments");
  }
  if (
    attempt.status === "submitted" ||
    attempt.status === "graded" ||
    attempt.status === "returned"
  ) {
    throw badRequest(
      `Cannot save a draft for an attempt that is already ${attempt.status}`,
    );
  }

  const existing = await repo.findSubmissionByAttempt(attemptId);
  if (existing) {
    const updated = await repo.updateSubmission(existing.id, {
      content: content ?? null,
      status: "draft",
    });
    return mapSubmission({ ...updated, attempt: existing.attempt, grade: existing.grade });
  }

  const created = await repo.createSubmission({
    attemptId,
    studentId: ctx.userId!,
    content,
    status: "draft",
  });
  return mapSubmission({
    ...created,
    attempt: attempt,
    grade: null,
  });
}

// ---------------------------------------------------------------------------
// submitAssignment
// ---------------------------------------------------------------------------

export async function submitAssignment(
  ctx: AuthContext,
  attemptId: string,
  content?: string,
): Promise<SubmissionDto> {
  const attempt = await assertStudentOwnsAttempt(ctx, attemptId);
  if (!can(ctx, PersonalPermission.ASSIGNMENT_SUBMIT)) {
    throw forbidden("No permission to submit assignments");
  }

  // Enforce late-submission policy.
  if (attempt.assignment.dueDate) {
    const due = new Date(attempt.assignment.dueDate);
    const now = new Date();
    if (now > due && !attempt.assignment.allowLate) {
      throw badRequest("The due date has passed and late submissions are not allowed");
    }
  }

  if (attempt.status === "submitted" || attempt.status === "graded") {
    throw badRequest(
      `Attempt is already ${attempt.status}; use resubmit instead`,
    );
  }

  const existing = await repo.findSubmissionByAttempt(attemptId);
  let submission: any;
  if (existing) {
    submission = await repo.updateSubmission(existing.id, {
      content: content ?? existing.content,
      status: "submitted",
      submittedAt: new Date(),
    });
    submission = { ...submission, attempt: existing.attempt, grade: existing.grade };
  } else {
    const created = await repo.createSubmission({
      attemptId,
      studentId: ctx.userId!,
      content,
      status: "submitted",
    });
    submission = { ...created, attempt, grade: null };
  }

  // Mark the attempt as submitted.
  await attemptRepo.updateAttempt(attemptId, {
    status: "submitted",
    submittedAt: new Date(),
  });

  eventBus.publish(
    buildEvent<AssignmentSubmittedEvent>({
      type: ASSIGNMENT_SUBMITTED,
      actorId: ctx.userId,
      assignmentId: attempt.assignmentId,
      attemptId,
      studentId: ctx.userId!,
      attemptNumber: attempt.attemptNumber,
    }),
  );

  log.info("submission.submitted", {
    submissionId: submission.id,
    attemptId,
  });

  return mapSubmission(submission);
}

// ---------------------------------------------------------------------------
// withdrawSubmission
// ---------------------------------------------------------------------------

export async function withdrawSubmission(
  ctx: AuthContext,
  attemptId: string,
): Promise<SubmissionDto> {
  const attempt = await assertStudentOwnsAttempt(ctx, attemptId);
  const existing = await repo.findSubmissionByAttempt(attemptId);
  if (!existing) throw notFound("No submission exists for this attempt yet");
  if (existing.status === "graded") {
    throw badRequest("Cannot withdraw a graded submission");
  }

  const updated = await repo.updateSubmission(existing.id, {
    status: "draft",
    submittedAt: null,
  });

  // Reset the attempt back to in_progress so the student can edit.
  await attemptRepo.updateAttempt(attemptId, {
    status: "in_progress",
    submittedAt: null,
  });

  return mapSubmission({ ...updated, attempt: existing.attempt, grade: existing.grade });
}

// ---------------------------------------------------------------------------
// resubmit
// ---------------------------------------------------------------------------

export async function resubmit(
  ctx: AuthContext,
  attemptId: string,
  content?: string,
): Promise<{ attemptId: string; submission: SubmissionDto }> {
  const oldAttempt = await assertStudentOwnsAttempt(ctx, attemptId);
  if (!can(ctx, PersonalPermission.ASSIGNMENT_SUBMIT)) {
    throw forbidden("No permission to submit assignments");
  }
  if (oldAttempt.status !== "returned" && oldAttempt.status !== "graded") {
    throw badRequest(
      "Can only resubmit an attempt that was returned or graded",
    );
  }

  const assignment = oldAttempt.assignment;
  const attemptsSoFar = await attemptRepo.countAttemptsByStudent(
    assignment.id,
    ctx.userId!,
  );
  if (attemptsSoFar >= assignment.maxAttempts) {
    throw badRequest(
      `Maximum attempts (${assignment.maxAttempts}) reached for this assignment`,
    );
  }

  // Duplicate the original resource copy into a fresh copy for the new attempt.
  const newAttempt = await attemptRepo.createAttempt({
    assignmentId: assignment.id,
    studentId: ctx.userId!,
    resourceCopyId: oldAttempt.resourceCopyId, // share the same workspace copy
    attemptNumber: oldAttempt.attemptNumber + 1,
  });

  // Mark the new attempt as in_progress immediately (student is resubmitting).
  await attemptRepo.updateAttempt(newAttempt.id, {
    status: "in_progress",
    startedAt: new Date(),
  });

  // Create a new submission row tied to the new attempt.
  const created = await repo.createSubmission({
    attemptId: newAttempt.id,
    studentId: ctx.userId!,
    content,
    status: "submitted",
  });

  // Mark the new attempt as submitted.
  await attemptRepo.updateAttempt(newAttempt.id, {
    status: "submitted",
    submittedAt: new Date(),
  });

  eventBus.publish(
    buildEvent<AssignmentResubmittedEvent>({
      type: ASSIGNMENT_RESUBMITTED,
      actorId: ctx.userId,
      assignmentId: assignment.id,
      attemptId: newAttempt.id,
      studentId: ctx.userId!,
      attemptNumber: newAttempt.attemptNumber,
    }),
  );

  log.info("submission.resubmitted", {
    oldAttemptId: attemptId,
    newAttemptId: newAttempt.id,
  });

  return {
    attemptId: newAttempt.id,
    submission: mapSubmission({
      ...created,
      attempt: { ...newAttempt, assignment: { ...assignment, classroom: oldAttempt.assignment.classroom } },
      grade: null,
    }),
  };
}

// ---------------------------------------------------------------------------
// listSubmissions
// ---------------------------------------------------------------------------

export async function listSubmissions(
  ctx: AuthContext,
  query: ListSubmissionsQuery,
): Promise<SubmissionDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");

  // Determine whether the caller is acting as a teacher (sees all) or a
  // student (sees only their own). The decision is driven by the filter:
  //   • classroomId or assignmentId filter → teacher of that classroom
  //     sees all; otherwise the student only sees their own.
  //   • explicit studentId === ctx.userId  → student viewing own.
  let scope: "teacher" | "student" = "student";

  if (query.classroomId) {
    const classroom = await classroomRepo.findClassroomById(query.classroomId);
    if (!classroom) throw notFound("Classroom not found");
    if (ctx.isSuperadmin || classroom.teacherId === ctx.userId) {
      scope = "teacher";
    } else {
      // Verify the student is in the classroom.
      const membership = await classroomRepo.findStudent(
        query.classroomId,
        ctx.userId,
      );
      if (!membership || membership.status !== "active") {
        throw forbidden("You do not have access to this classroom");
      }
    }
  } else if (query.assignmentId) {
    const assignment = await attemptRepo.findAssignmentById(query.assignmentId);
    if (!assignment) throw notFound("Assignment not found");
    const classroom = await classroomRepo.findClassroomById(
      assignment.classroomId,
    );
    if (!classroom) throw notFound("Classroom not found");
    if (ctx.isSuperadmin || classroom.teacherId === ctx.userId) {
      scope = "teacher";
    }
  } else if (query.studentId && query.studentId !== ctx.userId) {
    // Cross-student view requires teacher context. Without a classroomId /
    // assignmentId anchor we cannot verify teacher-hood, so refuse.
    throw forbidden("Specify a classroomId or assignmentId to view other students' submissions");
  }

  let rows: any[];
  if (query.classroomId) {
    rows = await repo.findSubmissionsByClassroom(query.classroomId);
  } else if (query.assignmentId) {
    rows = await repo.findSubmissionsByAssignment(query.assignmentId);
  } else {
    // No anchor — return only the caller's own submissions.
    rows = await repo.findSubmissionsByStudent(ctx.userId);
    scope = "student";
  }

  if (scope === "student") {
    rows = rows.filter((r) => r.studentId === ctx.userId);
  }

  // Apply optional status filter.
  if (query.status) {
    rows = rows.filter((r) => r.status === query.status);
  }

  // Apply pagination.
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 50;
  rows = rows.slice(offset, offset + limit);

  return rows.map(mapSubmission);
}

// ---------------------------------------------------------------------------
// getSubmission
// ---------------------------------------------------------------------------

export async function getSubmission(
  ctx: AuthContext,
  id: string,
): Promise<SubmissionDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const submission = await repo.findSubmission(id);
  if (!submission) throw notFound("Submission not found");

  const classroom = submission.attempt.assignment.classroom;
  const isTeacher = ctx.isSuperadmin || classroom.teacherId === ctx.userId;
  const isOwner = submission.studentId === ctx.userId;
  if (!isTeacher && !isOwner) {
    throw forbidden("You do not have access to this submission");
  }
  return mapSubmission(submission);
}
