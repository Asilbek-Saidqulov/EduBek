/**
 * EduBek — Exam service.
 *
 * Wraps the assessment service with timing invariants:
 *   • startExam()   — calls assessment.startAttempt but enforces `exam` type
 *                      + duration set, and emits EXAM_STARTED.
 *   • pauseExam()   — snapshots remaining time, marks attempt paused
 *   • resumeExam()  — re-derives remaining time from expiresAt - now
 *                      (so refresh / reconnect recovery works transparently)
 *   • submitExam()  — delegates to assessment.submitAttempt, emits EXAM_COMPLETED
 *   • autoSubmit()  — called by the scheduler; submits any expired in_progress
 *                      attempt, emits EXAM_AUTO_SUBMITTED
 *
 * Authorization model:
 *   • All student actions require PersonalPermission.EXAM_TAKE and the
 *     attempt to belong to the caller.
 *   • autoSubmit is system-initiated — callers pass `system` as the actor.
 *
 * Events published:
 *   • EXAM_STARTED, EXAM_PAUSED, EXAM_RESUMED, EXAM_COMPLETED,
 *     EXAM_AUTO_SUBMITTED, EXAM_EXPIRED
 *   • Also publishes PROCTORING_INCIDENT when recordProctoring is called.
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
  EXAM_AUTO_SUBMITTED,
  EXAM_COMPLETED,
  EXAM_EXPIRED,
  EXAM_PAUSED,
  EXAM_RESUMED,
  EXAM_STARTED,
  PROCTORING_INCIDENT,
  type ExamAutoSubmittedEvent,
  type ExamCompletedEvent,
  type ExamExpiredEvent,
  type ExamPausedEvent,
  type ExamResumedEvent,
  type ExamStartedEvent,
  type ProctoringIncidentEvent,
} from "@/infra/event-bus/events";
import { db } from "@/lib/db";
import {
  startAttempt as startAssessmentAttempt,
  submitAttempt as submitAssessmentAttempt,
} from "@/features/assessment/service";
import type {
  ExamAutoSubmitBatchResult,
  ExamAutoSubmitResult,
  ExamResumeResult,
  ExamStateDto,
} from "./types";
import type { RecordProctoringBody, StartExamBody } from "./schema";

const log = getLogger("exam-service");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeRemainingMs(expiresAt: Date | null, paused: boolean, timeRemainingMs: number | null): number | null {
  if (!expiresAt) return null;
  if (paused) return timeRemainingMs;
  const remaining = expiresAt.getTime() - Date.now();
  return Math.max(0, remaining);
}

function buildExamState(attempt: any): ExamStateDto {
  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    studentId: attempt.studentId,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt ? attempt.expiresAt.toISOString() : null,
    pausedAt: attempt.pausedAt ? attempt.pausedAt.toISOString() : null,
    resumedAt: attempt.resumedAt ? attempt.resumedAt.toISOString() : null,
    timeRemainingMs: computeRemainingMs(attempt.expiresAt, attempt.status === "paused", attempt.timeRemainingMs),
    serverNow: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// startExam
// ---------------------------------------------------------------------------

export async function startExam(
  ctx: AuthContext,
  input: StartExamBody,
): Promise<ExamResumeResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.EXAM_TAKE)) {
    throw forbidden("No permission to take exams");
  }
  // Verify the assessment is an exam with a duration set.
  const assessment = await db.assessment.findUnique({
    where: { id: input.assessmentId },
    select: { id: true, assessmentType: true, duration: true, status: true },
  });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.assessmentType !== "exam") {
    throw badRequest("Only assessments of type 'exam' can be started as an exam");
  }
  if (!assessment.duration || assessment.duration <= 0) {
    throw badRequest("Exam assessments must have a positive duration");
  }
  if (assessment.status !== "published") {
    throw badRequest("Exam is not published");
  }

  // Delegates to the assessment service — which respects maxAttempts and
  // returns the existing in_progress attempt if one exists.
  const attempt = await startAssessmentAttempt(ctx, input.assessmentId);

  eventBus.publish(
    buildEvent<ExamStartedEvent>({
      type: EXAM_STARTED,
      actorId: ctx.userId,
      assessmentId: input.assessmentId,
      attemptId: attempt.id,
      studentId: ctx.userId,
      expiresAt: attempt.expiresAt ?? new Date().toISOString(),
    }),
  );

  const refreshed = await db.assessmentAttempt.findUnique({
    where: { id: attempt.id },
    include: {
      assessment: {
        select: {
          id: true, title: true, assessmentType: true, duration: true,
          passingScore: true, showResultsImmediately: true, allowReview: true,
        },
      },
      responses: true,
    },
  });

  return {
    ...attempt,
    examState: buildExamState(refreshed),
  };
}

// ---------------------------------------------------------------------------
// pauseExam
// ---------------------------------------------------------------------------

export async function pauseExam(
  ctx: AuthContext,
  attemptId: string,
): Promise<ExamStateDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: { select: { assessmentType: true, ownerId: true } } },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("You can only pause your own exam");
  }
  if (attempt.assessment.assessmentType !== "exam") {
    throw badRequest("Only exam attempts can be paused");
  }
  if (attempt.status !== "in_progress") {
    throw badRequest(`Cannot pause attempt with status ${attempt.status}`);
  }

  const timeRemainingMs = computeRemainingMs(attempt.expiresAt, false, null);
  const updated = await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "paused",
      pausedAt: new Date(),
      timeRemainingMs,
    },
  });

  eventBus.publish(
    buildEvent<ExamPausedEvent>({
      type: EXAM_PAUSED,
      actorId: ctx.userId,
      assessmentId: attempt.assessmentId,
      attemptId,
      studentId: attempt.studentId,
      timeRemainingMs: timeRemainingMs ?? 0,
    }),
  );

  return buildExamState(updated);
}

// ---------------------------------------------------------------------------
// resumeExam
// ---------------------------------------------------------------------------

export async function resumeExam(
  ctx: AuthContext,
  attemptId: string,
): Promise<ExamResumeResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        select: {
          id: true, title: true, assessmentType: true, duration: true,
          passingScore: true, showResultsImmediately: true, allowReview: true,
          ownerId: true,
        },
      },
      responses: true,
    },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("You can only resume your own exam");
  }
  if (attempt.assessment.assessmentType !== "exam") {
    throw badRequest("Only exam attempts can be resumed");
  }

  // Already submitted / graded / expired — return as-is.
  if (attempt.status === "submitted" || attempt.status === "graded" || attempt.status === "expired") {
    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      studentId: attempt.studentId,
      status: attempt.status as any,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      gradedAt: attempt.gradedAt?.toISOString() ?? null,
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      pausedAt: attempt.pausedAt?.toISOString() ?? null,
      resumedAt: attempt.resumedAt?.toISOString() ?? null,
      timeRemainingMs: attempt.timeRemainingMs,
      score: attempt.score,
      pointsAwarded: attempt.pointsAwarded,
      pointsMax: attempt.pointsMax,
      passed: attempt.passed,
      questionOrder: attempt.questionOrder ? JSON.parse(attempt.questionOrder) : null,
      autoGradedAt: attempt.autoGradedAt?.toISOString() ?? null,
      manualGradedAt: attempt.manualGradedAt?.toISOString() ?? null,
      proctoringIncidentCount: attempt.proctoringIncidentCount,
      proctoringFlagged: attempt.proctoringFlagged,
      plagiarismScore: attempt.plagiarismScore,
      plagiarismFlagged: attempt.plagiarismFlagged,
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
      responses: (attempt.responses ?? []).map((r: any) => ({
        id: r.id,
        attemptId: r.attemptId,
        questionId: r.questionId,
        questionType: r.questionType,
        answer: r.answer ? JSON.parse(r.answer) : null,
        pointsAwarded: r.pointsAwarded,
        pointsMax: r.pointsMax,
        isCorrect: r.isCorrect,
        gradedBy: r.gradedBy,
        gradedAt: r.gradedAt?.toISOString() ?? null,
        feedback: r.feedback,
        timeSpentMs: r.timeSpentMs,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        assessmentType: attempt.assessment.assessmentType,
        duration: attempt.assessment.duration,
        passingScore: attempt.assessment.passingScore,
        showResultsImmediately: attempt.assessment.showResultsImmediately,
        allowReview: attempt.assessment.allowReview,
      },
      examState: buildExamState(attempt),
    };
  }

  // If paused, recompute expiresAt from timeRemainingMs and resume.
  if (attempt.status === "paused") {
    const remainingMs = attempt.timeRemainingMs ?? 0;
    const newExpiresAt = new Date(Date.now() + remainingMs);
    const updated = await db.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "in_progress",
        resumedAt: new Date(),
        expiresAt: newExpiresAt,
      },
      include: {
        assessment: {
          select: {
            id: true, title: true, assessmentType: true, duration: true,
            passingScore: true, showResultsImmediately: true, allowReview: true,
          },
        },
        responses: true,
      },
    });

    eventBus.publish(
      buildEvent<ExamResumedEvent>({
        type: EXAM_RESUMED,
        actorId: ctx.userId,
        assessmentId: attempt.assessmentId,
        attemptId,
        studentId: attempt.studentId,
      }),
    );

    return {
      id: updated.id,
      assessmentId: updated.assessmentId,
      studentId: updated.studentId,
      status: updated.status as any,
      attemptNumber: updated.attemptNumber,
      startedAt: updated.startedAt.toISOString(),
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      gradedAt: updated.gradedAt?.toISOString() ?? null,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      pausedAt: updated.pausedAt?.toISOString() ?? null,
      resumedAt: updated.resumedAt?.toISOString() ?? null,
      timeRemainingMs: updated.timeRemainingMs,
      score: updated.score,
      pointsAwarded: updated.pointsAwarded,
      pointsMax: updated.pointsMax,
      passed: updated.passed,
      questionOrder: updated.questionOrder ? JSON.parse(updated.questionOrder) : null,
      autoGradedAt: updated.autoGradedAt?.toISOString() ?? null,
      manualGradedAt: updated.manualGradedAt?.toISOString() ?? null,
      proctoringIncidentCount: updated.proctoringIncidentCount,
      proctoringFlagged: updated.proctoringFlagged,
      plagiarismScore: updated.plagiarismScore,
      plagiarismFlagged: updated.plagiarismFlagged,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      responses: (updated.responses ?? []).map((r: any) => ({
        id: r.id,
        attemptId: r.attemptId,
        questionId: r.questionId,
        questionType: r.questionType,
        answer: r.answer ? JSON.parse(r.answer) : null,
        pointsAwarded: r.pointsAwarded,
        pointsMax: r.pointsMax,
        isCorrect: r.isCorrect,
        gradedBy: r.gradedBy,
        gradedAt: r.gradedAt?.toISOString() ?? null,
        feedback: r.feedback,
        timeSpentMs: r.timeSpentMs,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      assessment: {
        id: updated.assessment.id,
        title: updated.assessment.title,
        assessmentType: updated.assessment.assessmentType,
        duration: updated.assessment.duration,
        passingScore: updated.assessment.passingScore,
        showResultsImmediately: updated.assessment.showResultsImmediately,
        allowReview: updated.assessment.allowReview,
      },
      examState: buildExamState(updated),
    };
  }

  // In-progress — return as-is with refreshed state.
  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    studentId: attempt.studentId,
    status: attempt.status as any,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    gradedAt: attempt.gradedAt?.toISOString() ?? null,
    expiresAt: attempt.expiresAt?.toISOString() ?? null,
    pausedAt: attempt.pausedAt?.toISOString() ?? null,
    resumedAt: attempt.resumedAt?.toISOString() ?? null,
    timeRemainingMs: attempt.timeRemainingMs,
    score: attempt.score,
    pointsAwarded: attempt.pointsAwarded,
    pointsMax: attempt.pointsMax,
    passed: attempt.passed,
    questionOrder: attempt.questionOrder ? JSON.parse(attempt.questionOrder) : null,
    autoGradedAt: attempt.autoGradedAt?.toISOString() ?? null,
    manualGradedAt: attempt.manualGradedAt?.toISOString() ?? null,
    proctoringIncidentCount: attempt.proctoringIncidentCount,
    proctoringFlagged: attempt.proctoringFlagged,
    plagiarismScore: attempt.plagiarismScore,
    plagiarismFlagged: attempt.plagiarismFlagged,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    responses: (attempt.responses ?? []).map((r: any) => ({
      id: r.id,
      attemptId: r.attemptId,
      questionId: r.questionId,
      questionType: r.questionType,
      answer: r.answer ? JSON.parse(r.answer) : null,
      pointsAwarded: r.pointsAwarded,
      pointsMax: r.pointsMax,
      isCorrect: r.isCorrect,
      gradedBy: r.gradedBy,
      gradedAt: r.gradedAt?.toISOString() ?? null,
      feedback: r.feedback,
      timeSpentMs: r.timeSpentMs,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    assessment: {
      id: attempt.assessment.id,
      title: attempt.assessment.title,
      assessmentType: attempt.assessment.assessmentType,
      duration: attempt.assessment.duration,
      passingScore: attempt.assessment.passingScore,
      showResultsImmediately: attempt.assessment.showResultsImmediately,
      allowReview: attempt.assessment.allowReview,
    },
    examState: buildExamState(attempt),
  };
}

// ---------------------------------------------------------------------------
// submitExam
// ---------------------------------------------------------------------------

export async function submitExam(
  ctx: AuthContext,
  attemptId: string,
  input: { responses: Array<{ questionId: string; answer: unknown; timeSpentMs?: number }> },
): Promise<{ attemptId: string; status: string; durationMs: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, studentId: true, startedAt: true, assessment: { select: { assessmentType: true } } },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("You can only submit your own exam");
  }
  if (attempt.assessment.assessmentType !== "exam") {
    throw badRequest("Only exam attempts can be submitted via submitExam");
  }

  await submitAssessmentAttempt(ctx, attemptId, input);

  const durationMs = Date.now() - attempt.startedAt.getTime();
  eventBus.publish(
    buildEvent<ExamCompletedEvent>({
      type: EXAM_COMPLETED,
      actorId: ctx.userId,
      assessmentId: (await db.assessmentAttempt.findUnique({ where: { id: attemptId }, select: { assessmentId: true } }))!.assessmentId,
      attemptId,
      studentId: attempt.studentId,
      durationMs,
    }),
  );

  return {
    attemptId,
    status: "submitted",
    durationMs,
  };
}

// ---------------------------------------------------------------------------
// autoSubmit (system-initiated)
// ---------------------------------------------------------------------------

export async function autoSubmitExpiredExams(): Promise<ExamAutoSubmitBatchResult> {
  const now = new Date();
  const expired = await db.assessmentAttempt.findMany({
    where: {
      status: { in: ["in_progress", "paused"] },
      expiresAt: { lte: now },
    },
    include: {
      assessment: { select: { assessmentType: true } },
    },
  });

  const results: ExamAutoSubmitResult[] = [];
  for (const attempt of expired) {
    if (attempt.assessment.assessmentType !== "exam") continue;
    try {
      // Mark as expired; we don't auto-save responses — those already on the
      // attempt row will be auto-graded if the assessment has no manual-grade
      // questions. The assessment submitAttempt service expects a studentId
      // context, so we short-circuit by directly updating the attempt.
      await db.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "expired",
          submittedAt: now,
        },
      });

      // Try auto-grading whatever responses exist on the attempt.
      const responses = await db.assessmentResponse.findMany({
        where: { attemptId: attempt.id },
      });
      if (responses.length > 0) {
        // Defer to the assessment service via a system context — we bypass
        // by directly invoking the auto-grader pipeline.
        const { batchGradeResponses } = await import("@/features/assessment/auto-grader");
        const { db: _db } = await import("@/lib/db");
        const aqList = await _db.assessmentQuestion.findMany({
          where: { assessmentId: attempt.assessmentId },
          include: { question: true },
        });
        const aqMap = new Map(aqList.map((aq: any) => [aq.questionId, aq]));
        const items = responses.map((r: any) => {
          const aq = aqMap.get(r.questionId);
          let payload: any = {};
          try { payload = JSON.parse((aq?.question as any)?.payload ?? "{}"); } catch {}
          return {
            responseId: r.id,
            questionType: r.questionType,
            payload,
            answer: r.answer ? JSON.parse(r.answer) : null,
            pointsMax: r.pointsMax,
          };
        });
        const batch = batchGradeResponses(items);
        if (batch.updates.length > 0) {
          await _db.$transaction(
            batch.updates.map((u) =>
              _db.assessmentResponse.update({
                where: { id: u.id },
                data: {
                  pointsAwarded: u.pointsAwarded,
                  isCorrect: u.isCorrect,
                  gradedBy: "auto",
                  gradedAt: now,
                  feedback: u.feedback,
                },
              }),
            ),
          );
        }
        const score = batch.totalMax > 0 ? (batch.totalAwarded / batch.totalMax) * 100 : 0;
        // Refetch the assessment for passingScore (the include above only had assessmentType).
        const fullAssessment = await _db.assessment.findUnique({
          where: { id: attempt.assessmentId },
          select: { passingScore: true },
        });
        const passed = fullAssessment?.passingScore != null ? score >= (fullAssessment.passingScore ?? 0) : null;
        const fullyGraded = batch.needsManualCount === 0;
        await _db.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: fullyGraded ? "graded" : "expired",
            gradedAt: fullyGraded ? now : null,
            autoGradedAt: now,
            score,
            pointsAwarded: batch.totalAwarded,
            pointsMax: batch.totalMax,
            passed,
          },
        });
      }

      eventBus.publish(
        buildEvent<ExamAutoSubmittedEvent>({
          type: EXAM_AUTO_SUBMITTED,
          actorId: "system",
          assessmentId: attempt.assessmentId,
          attemptId: attempt.id,
          studentId: attempt.studentId,
          reason: "timeout",
        }),
      );
      eventBus.publish(
        buildEvent<ExamExpiredEvent>({
          type: EXAM_EXPIRED,
          actorId: "system",
          assessmentId: attempt.assessmentId,
          attemptId: attempt.id,
          studentId: attempt.studentId,
        }),
      );

      results.push({
        attemptId: attempt.id,
        status: "expired",
        reason: "timeout",
        submittedAt: now.toISOString(),
      });
    } catch (err) {
      log.error("exam.auto_submit_failed", {
        attemptId: attempt.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("exam.auto_submit_batch", { processed: results.length });
  return { processed: results.length, results };
}

// ---------------------------------------------------------------------------
// recordProctoring (called by the exam client)
// ---------------------------------------------------------------------------

export async function recordProctoring(
  ctx: AuthContext,
  attemptId: string,
  input: RecordProctoringBody,
): Promise<{ incidentId: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, studentId: true, assessmentId: true },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("You can only report proctoring incidents for your own exam");
  }

  const incident = await db.proctoringIncident.create({
    data: {
      attemptId,
      studentId: attempt.studentId,
      incidentType: input.incidentType,
      severity: input.severity,
      description: input.description ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });

  // Bump the attempt's proctoring summary.
  const newCount = (await db.proctoringIncident.count({ where: { attemptId } }));
  const flagged = newCount >= 3 || input.severity === "critical";
  await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      proctoringIncidentCount: newCount,
      proctoringFlagged: flagged,
    },
  });

  eventBus.publish(
    buildEvent<ProctoringIncidentEvent>({
      type: PROCTORING_INCIDENT,
      actorId: ctx.userId,
      attemptId,
      studentId: attempt.studentId,
      incidentType: input.incidentType,
      severity: input.severity,
    }),
  );

  return { incidentId: incident.id };
}
