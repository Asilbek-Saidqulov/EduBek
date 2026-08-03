/**
 * EduBek — Grading service.
 *
 * Business logic for teachers grading, returning, and publishing student
 * submissions. The Grade row itself is stored in the submission repository
 * (Grade is a 1:1 child of Submission); this service composes the
 * submission repository, the assignment repository, and the event bus.
 *
 * Authorization model:
 *   • every action requires the caller to be the teacher of the classroom
 *     the submission's assignment belongs to (or superadmin), AND to hold
 *     the GRADING_MANAGE personal permission.
 *
 * Events published:
 *   • SUBMISSION_GRADED   — when a teacher saves a grade
 *   • SUBMISSION_RETURNED — when a teacher returns a submission with feedback
 *   • GRADE_PUBLISHED     — when a teacher releases grades to students
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
  GRADE_PUBLISHED,
  SUBMISSION_GRADED,
  SUBMISSION_RETURNED,
  type GradePublishedEvent,
  type SubmissionGradedEvent,
  type SubmissionReturnedEvent,
} from "@/infra/event-bus/events";
import * as attemptRepo from "@/features/assignment/repository";
import * as repo from "@/features/submission/repository";
import type { GradeDto } from "./types";

const log = getLogger("grading-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapGrade(g: any): GradeDto {
  return {
    id: g.id,
    submissionId: g.submissionId,
    teacherId: g.teacherId,
    points: g.points,
    maxPoints: g.maxPoints,
    rubric: g.rubric ? safeParse(g.rubric) : null,
    feedback: g.feedback,
    publishedAt: g.publishedAt ? g.publishedAt.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
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

async function assertTeacherOfSubmission(
  ctx: AuthContext,
  submissionId: string,
): Promise<{
  submission: any;
  attempt: any;
}> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.GRADING_MANAGE)) {
    throw forbidden("No permission to grade submissions");
  }
  const submission = await repo.findSubmission(submissionId);
  if (!submission) throw notFound("Submission not found");
  const classroom = submission.attempt.assignment.classroom;
  if (!ctx.isSuperadmin && classroom.teacherId !== ctx.userId) {
    throw forbidden("Only the classroom teacher can perform this action");
  }
  return { submission, attempt: submission.attempt };
}

// ---------------------------------------------------------------------------
// gradeSubmission
// ---------------------------------------------------------------------------

export async function gradeSubmission(
  ctx: AuthContext,
  submissionId: string,
  points: number,
  maxPoints: number,
  feedback?: string,
  rubric?: unknown,
): Promise<GradeDto> {
  const { submission, attempt } = await assertTeacherOfSubmission(
    ctx,
    submissionId,
  );
  if (maxPoints <= 0) throw badRequest("maxPoints must be > 0");
  if (points < 0 || points > maxPoints) {
    throw badRequest(`points must be between 0 and ${maxPoints}`);
  }

  const rubricString = rubric ? JSON.stringify(rubric) : null;
  const existing = await repo.findGrade(submissionId);
  let grade: any;
  if (existing) {
    grade = await repo.updateGrade(submissionId, {
      points,
      maxPoints,
      feedback: feedback ?? null,
      rubric: rubricString,
    });
  } else {
    grade = await repo.createGrade({
      submissionId,
      teacherId: ctx.userId!,
      points,
      maxPoints,
      feedback,
      rubric: rubricString ?? undefined,
    });
  }

  // Mark the attempt as graded.
  await attemptRepo.updateAttempt(attempt.id, {
    status: "graded",
    gradedAt: new Date(),
    score: points,
    maxScore: maxPoints,
  });

  // Reflect the grade on the submission row.
  await repo.updateSubmission(submissionId, {
    status: "graded",
    feedback: feedback ?? null,
  });

  eventBus.publish(
    buildEvent<SubmissionGradedEvent>({
      type: SUBMISSION_GRADED,
      actorId: ctx.userId,
      submissionId,
      attemptId: attempt.id,
      studentId: submission.studentId,
      points,
      maxPoints,
    }),
  );

  log.info("submission.graded", {
    submissionId,
    points,
    maxPoints,
  });

  return mapGrade(grade);
}

// ---------------------------------------------------------------------------
// returnSubmission
// ---------------------------------------------------------------------------

export async function returnSubmission(
  ctx: AuthContext,
  submissionId: string,
  feedback?: string,
): Promise<{ submissionId: string; status: string }> {
  const { submission, attempt } = await assertTeacherOfSubmission(
    ctx,
    submissionId,
  );

  await repo.updateSubmission(submissionId, {
    status: "returned",
    feedback: feedback ?? null,
    returnedAt: new Date(),
  });

  // Reset the attempt status to "returned" so the student can resubmit.
  await attemptRepo.updateAttempt(attempt.id, {
    status: "returned",
  });

  eventBus.publish(
    buildEvent<SubmissionReturnedEvent>({
      type: SUBMISSION_RETURNED,
      actorId: ctx.userId,
      submissionId,
      attemptId: attempt.id,
      studentId: submission.studentId,
    }),
  );

  log.info("submission.returned", { submissionId });

  return { submissionId, status: "returned" };
}

// ---------------------------------------------------------------------------
// publishGrade
// ---------------------------------------------------------------------------

export async function publishGrade(
  ctx: AuthContext,
  submissionId: string,
): Promise<{ submissionId: string; publishedAt: string }> {
  const { attempt } = await assertTeacherOfSubmission(ctx, submissionId);
  const grade = await repo.findGrade(submissionId);
  if (!grade) throw notFound("No grade exists for this submission yet");

  const published = await repo.publishGrade(submissionId);

  eventBus.publish(
    buildEvent<GradePublishedEvent>({
      type: GRADE_PUBLISHED,
      actorId: ctx.userId,
      submissionId,
      attemptId: attempt.id,
      studentId: attempt.studentId,
    }),
  );

  return {
    submissionId,
    publishedAt: published.publishedAt!.toISOString(),
  };
}
