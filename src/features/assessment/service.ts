/**
 * EduBek — Assessment service.
 *
 * Business logic for assessments, attempts, and responses. The exam module
 * (timed/paused) wraps these primitives with extra timing invariants — see
 * `src/features/exam/service.ts`.
 *
 * Lifecycle:
 *
 *   draft ──publish──▶ published ──archive──▶ archived
 *
 *   student ──startAttempt──▶ in_progress attempt
 *          ──submitAttempt──▶ submitted + auto-graded (if all auto-gradable)
 *                            else submitted + needs manual grading
 *          ──gradeResponse (teacher)──▶ graded
 *
 * Authorization model:
 *   • create / update / publish / archive / duplicate / addQuestions — owner
 *     (or superadmin) with PersonalPermission.ASSESSMENT_MANAGE. If orgId
 *     is set, the caller must be an org member with
 *     OrgPermission.ORG_ASSESSMENT_MANAGE.
 *   • getAssessment / list — owner, classroom teacher, classroom student,
 *     or org member.
 *   • startAttempt / submitAttempt — student in the classroom (or any user
 *     if no classroom) with PersonalPermission.ASSESSMENT_TAKE.
 *   • gradeResponse (manual) — owner of the assessment (or superadmin)
 *     with PersonalPermission.ASSESSMENT_MANAGE.
 *
 * Events published:
 *   • ASSESSMENT_CREATED     • ASSESSMENT_PUBLISHED
 *   • ASSESSMENT_ARCHIVED    • ASSESSMENT_DUPLICATED
 *   • ASSESSMENT_STARTED     • ASSESSMENT_SUBMITTED
 *   • ASSESSMENT_AUTO_GRADED • ASSESSMENT_MANUALLY_GRADED
 */
import { getLogger } from "@/lib/logger";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/errors";
import {
  can,
  canInOrg,
  isOrgMember,
  PersonalPermission,
  OrgPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  ASSESSMENT_ARCHIVED,
  ASSESSMENT_AUTO_GRADED,
  ASSESSMENT_CREATED,
  ASSESSMENT_DUPLICATED,
  ASSESSMENT_MANUALLY_GRADED,
  ASSESSMENT_PUBLISHED,
  ASSESSMENT_STARTED,
  ASSESSMENT_SUBMITTED,
  type AssessmentArchivedEvent,
  type AssessmentAutoGradedEvent,
  type AssessmentCreatedEvent,
  type AssessmentDuplicatedEvent,
  type AssessmentManuallyGradedEvent,
  type AssessmentPublishedEvent,
  type AssessmentStartedEvent,
  type AssessmentSubmittedEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import { batchGradeResponses, type BatchGradeItem } from "./auto-grader";
import { recordGrade as recordGradebookEntry } from "@/features/gradebook";
import type {
  AssessmentDto,
  AssessmentQuestionDto,
  AssessmentStatus,
  AssessmentType,
  AssessmentWithQuestionsDto,
  AttemptStatus,
  AttemptWithResponsesDto,
  AssessmentAttemptDto,
  AssessmentResponseDto,
} from "./types";
import type {
  AddQuestionsBody,
  CreateAssessmentBody,
  GradeResponseBody,
  ListAssessmentsQuery,
  ListAttemptsQuery,
  SubmitAttemptBody,
  UpdateAssessmentBody,
} from "./schema";

const log = getLogger("assessment-service");

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapAssessment(a: any): AssessmentDto {
  return {
    id: a.id,
    ownerId: a.ownerId,
    orgId: a.orgId,
    classroomId: a.classroomId,
    resourceId: a.resourceId,
    assignmentId: a.assignmentId,
    rubricId: a.rubricId,
    title: a.title,
    description: a.description,
    instructions: a.instructions,
    assessmentType: a.assessmentType as AssessmentType,
    duration: a.duration,
    passingScore: a.passingScore,
    maxAttempts: a.maxAttempts,
    shuffleQuestions: a.shuffleQuestions,
    shuffleAnswers: a.shuffleAnswers,
    showResultsImmediately: a.showResultsImmediately,
    allowReview: a.allowReview,
    openAt: a.openAt ? a.openAt.toISOString() : null,
    closeAt: a.closeAt ? a.closeAt.toISOString() : null,
    status: a.status as AssessmentStatus,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    questionCount: a._count?.questions ?? a.questions?.length ?? 0,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function mapQuestion(q: any): AssessmentQuestionDto {
  let overrides: Record<string, unknown> | null = null;
  if (q.overrides) {
    try { overrides = JSON.parse(q.overrides); } catch { overrides = null; }
  }
  let payload: unknown = undefined;
  if (q.question?.payload) {
    try { payload = JSON.parse(q.question.payload); } catch { payload = undefined; }
  }
  return {
    id: q.id,
    assessmentId: q.assessmentId,
    questionId: q.questionId,
    order: q.order,
    points: q.points,
    overrides,
    questionType: q.question?.questionType,
    payload,
    createdAt: q.createdAt.toISOString(),
  };
}

function mapAttempt(a: any): AssessmentAttemptDto {
  let questionOrder: string[] | null = null;
  if (a.questionOrder) {
    try { questionOrder = JSON.parse(a.questionOrder); } catch { questionOrder = null; }
  }
  return {
    id: a.id,
    assessmentId: a.assessmentId,
    studentId: a.studentId,
    status: a.status as AttemptStatus,
    attemptNumber: a.attemptNumber,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
    gradedAt: a.gradedAt ? a.gradedAt.toISOString() : null,
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    pausedAt: a.pausedAt ? a.pausedAt.toISOString() : null,
    resumedAt: a.resumedAt ? a.resumedAt.toISOString() : null,
    timeRemainingMs: a.timeRemainingMs,
    score: a.score,
    pointsAwarded: a.pointsAwarded,
    pointsMax: a.pointsMax,
    passed: a.passed,
    questionOrder,
    autoGradedAt: a.autoGradedAt ? a.autoGradedAt.toISOString() : null,
    manualGradedAt: a.manualGradedAt ? a.manualGradedAt.toISOString() : null,
    proctoringIncidentCount: a.proctoringIncidentCount,
    proctoringFlagged: a.proctoringFlagged,
    plagiarismScore: a.plagiarismScore,
    plagiarismFlagged: a.plagiarismFlagged,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function mapResponse(r: any): AssessmentResponseDto {
  let answer: unknown = null;
  if (r.answer) {
    try { answer = JSON.parse(r.answer); } catch { answer = r.answer; }
  }
  return {
    id: r.id,
    attemptId: r.attemptId,
    questionId: r.questionId,
    questionType: r.questionType,
    answer,
    pointsAwarded: r.pointsAwarded,
    pointsMax: r.pointsMax,
    isCorrect: r.isCorrect,
    gradedBy: r.gradedBy as AssessmentResponseDto["gradedBy"],
    gradedAt: r.gradedAt ? r.gradedAt.toISOString() : null,
    feedback: r.feedback,
    timeSpentMs: r.timeSpentMs,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

function isOwner(ctx: AuthContext, a: { ownerId: string }): boolean {
  return ctx.isSuperadmin || a.ownerId === ctx.userId;
}

// ---------------------------------------------------------------------------
// createAssessment
// ---------------------------------------------------------------------------

export async function createAssessment(
  ctx: AuthContext,
  input: CreateAssessmentBody,
): Promise<AssessmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSESSMENT_MANAGE)) {
    throw forbidden("No permission to manage assessments");
  }
  if (input.orgId) {
    if (!isOrgMember(ctx, input.orgId) && !ctx.isSuperadmin) {
      throw forbidden("You are not a member of this organization");
    }
    if (!ctx.isSuperadmin && !canInOrg(ctx, input.orgId, OrgPermission.ORG_ASSESSMENT_MANAGE)) {
      throw forbidden("No org permission to manage assessments");
    }
  }
  // If classroomId is provided, caller must be the teacher of that classroom.
  if (input.classroomId) {
    const { db } = await import("@/lib/db");
    const classroom = await db.classroom.findUnique({
      where: { id: input.classroomId },
      select: { teacherId: true },
    });
    if (!classroom) throw notFound("Classroom not found");
    if (!ctx.isSuperadmin && classroom.teacherId !== ctx.userId) {
      throw forbidden("Only the classroom teacher can create assessments in this classroom");
    }
  }

  const created = await repo.createAssessment({
    ownerId: ctx.userId,
    orgId: input.orgId,
    classroomId: input.classroomId,
    resourceId: input.resourceId,
    assignmentId: input.assignmentId,
    rubricId: input.rubricId,
    title: input.title,
    description: input.description,
    instructions: input.instructions,
    assessmentType: input.assessmentType,
    duration: input.duration,
    passingScore: input.passingScore,
    maxAttempts: input.maxAttempts,
    shuffleQuestions: input.shuffleQuestions,
    shuffleAnswers: input.shuffleAnswers,
    showResultsImmediately: input.showResultsImmediately,
    allowReview: input.allowReview,
    openAt: input.openAt ? new Date(input.openAt) : undefined,
    closeAt: input.closeAt ? new Date(input.closeAt) : undefined,
  });

  // Optionally attach initial question set.
  if (input.questionIds && input.questionIds.length > 0) {
    await repo.addQuestionsToAssessment(
      created.id,
      input.questionIds.map((qid, i) => ({
        questionId: qid,
        points: 1,
        order: i,
      })),
    );
  }

  const withCount = await repo.findAssessmentById(created.id);
  eventBus.publish(
    buildEvent<AssessmentCreatedEvent>({
      type: ASSESSMENT_CREATED,
      actorId: ctx.userId,
      assessmentId: created.id,
      ownerId: created.ownerId,
      assessmentType: created.assessmentType,
      classroomId: created.classroomId,
      title: created.title,
    }),
  );

  log.info("assessment.created", { assessmentId: created.id });

  return mapAssessment({ ...withCount, _count: { questions: input.questionIds?.length ?? 0 } });
}

// ---------------------------------------------------------------------------
// getAssessment
// ---------------------------------------------------------------------------

export async function getAssessment(
  ctx: AuthContext,
  id: string,
): Promise<AssessmentWithQuestionsDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const assessment = await repo.findAssessmentWithQuestions(id);
  if (!assessment) throw notFound("Assessment not found");

  if (!isOwner(ctx, assessment)) {
    // For classroom-scoped assessments, allow classroom teacher or active student.
    if (assessment.classroomId) {
      const { db } = await import("@/lib/db");
      const membership = await db.classroomStudent.findUnique({
        where: {
          classroomId_studentId: {
            classroomId: assessment.classroomId,
            studentId: ctx.userId,
          },
        },
      });
      const classroom = await db.classroom.findUnique({
        where: { id: assessment.classroomId },
        select: { teacherId: true },
      });
      const isTeacher = classroom?.teacherId === ctx.userId;
      const isStudent = membership?.status === "active";
      if (!isTeacher && !isStudent && !(assessment.orgId && isOrgMember(ctx, assessment.orgId))) {
        throw forbidden("You do not have access to this assessment");
      }
    } else if (assessment.orgId && !isOrgMember(ctx, assessment.orgId)) {
      throw forbidden("You do not have access to this assessment");
    } else if (!assessment.orgId) {
      throw forbidden("You do not have access to this assessment");
    }
  }

  return {
    ...mapAssessment(assessment),
    questions: assessment.questions.map(mapQuestion),
  };
}

// ---------------------------------------------------------------------------
// listAssessments
// ---------------------------------------------------------------------------

export async function listAssessments(
  ctx: AuthContext,
  query: ListAssessmentsQuery,
): Promise<{ assessments: AssessmentDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  // Default scope: caller's own assessments (or classroom-filtered).
  const result = await repo.listAssessments({
    ownerId: query.classroomId ? undefined : ctx.userId,
    classroomId: query.classroomId,
    status: query.status,
    assessmentType: query.assessmentType,
    page: query.page,
    pageSize: query.pageSize,
  });
  return {
    assessments: result.items.map(mapAssessment),
    total: result.total,
  };
}

// ---------------------------------------------------------------------------
// updateAssessment
// ---------------------------------------------------------------------------

export async function updateAssessment(
  ctx: AuthContext,
  id: string,
  input: UpdateAssessmentBody,
): Promise<AssessmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssessmentById(id);
  if (!existing) throw notFound("Assessment not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can update this assessment");
  }
  if (existing.status === "published") {
    throw badRequest("Cannot update a published assessment — archive and create a new one");
  }

  const updated = await repo.updateAssessment(id, {
    title: input.title,
    description: input.description,
    instructions: input.instructions,
    assessmentType: input.assessmentType,
    duration: input.duration,
    passingScore: input.passingScore,
    maxAttempts: input.maxAttempts,
    shuffleQuestions: input.shuffleQuestions,
    shuffleAnswers: input.shuffleAnswers,
    showResultsImmediately: input.showResultsImmediately,
    allowReview: input.allowReview,
    openAt: input.openAt ? new Date(input.openAt) : input.openAt === null ? null : undefined,
    closeAt: input.closeAt ? new Date(input.closeAt) : input.closeAt === null ? null : undefined,
    rubricId: input.rubricId,
  });

  const withCount = await repo.findAssessmentById(id);
  return mapAssessment({ ...updated, _count: (withCount as any)?._count ?? { questions: 0 } });
}

// ---------------------------------------------------------------------------
// publishAssessment
// ---------------------------------------------------------------------------

export async function publishAssessment(
  ctx: AuthContext,
  id: string,
): Promise<AssessmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssessmentWithQuestions(id);
  if (!existing) throw notFound("Assessment not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can publish this assessment");
  }
  if (existing.questions.length === 0) {
    throw badRequest("Cannot publish an assessment with no questions");
  }

  const published = await repo.setStatus(id, "published");
  eventBus.publish(
    buildEvent<AssessmentPublishedEvent>({
      type: ASSESSMENT_PUBLISHED,
      actorId: ctx.userId,
      assessmentId: published.id,
      classroomId: published.classroomId,
    }),
  );

  return mapAssessment({ ...published, _count: { questions: existing.questions.length } });
}

// ---------------------------------------------------------------------------
// archiveAssessment
// ---------------------------------------------------------------------------

export async function archiveAssessment(
  ctx: AuthContext,
  id: string,
): Promise<AssessmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssessmentById(id);
  if (!existing) throw notFound("Assessment not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can archive this assessment");
  }
  const archived = await repo.setStatus(id, "archived");
  eventBus.publish(
    buildEvent<AssessmentArchivedEvent>({
      type: ASSESSMENT_ARCHIVED,
      actorId: ctx.userId,
      assessmentId: archived.id,
    }),
  );
  return mapAssessment({ ...archived, _count: { questions: 0 } });
}

// ---------------------------------------------------------------------------
// duplicateAssessment
// ---------------------------------------------------------------------------

export async function duplicateAssessment(
  ctx: AuthContext,
  id: string,
): Promise<AssessmentDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSESSMENT_MANAGE)) {
    throw forbidden("No permission to manage assessments");
  }
  const source = await repo.findAssessmentWithQuestions(id);
  if (!source) throw notFound("Source assessment not found");

  const created = await repo.createAssessment({
    ownerId: ctx.userId,
    orgId: source.orgId ?? undefined,
    classroomId: source.classroomId ?? undefined,
    resourceId: source.resourceId ?? undefined,
    rubricId: source.rubricId ?? undefined,
    title: `${source.title} (Copy)`,
    description: source.description ?? undefined,
    instructions: source.instructions ?? undefined,
    assessmentType: source.assessmentType,
    duration: source.duration ?? undefined,
    passingScore: source.passingScore ?? undefined,
    maxAttempts: source.maxAttempts,
    shuffleQuestions: source.shuffleQuestions,
    shuffleAnswers: source.shuffleAnswers,
    showResultsImmediately: source.showResultsImmediately,
    allowReview: source.allowReview,
  });

  if (source.questions.length > 0) {
    await repo.addQuestionsToAssessment(
      created.id,
      source.questions.map((q: any, i: number) => ({
        questionId: q.questionId,
        points: q.points,
        order: q.order ?? i,
      })),
    );
  }

  eventBus.publish(
    buildEvent<AssessmentDuplicatedEvent>({
      type: ASSESSMENT_DUPLICATED,
      actorId: ctx.userId,
      assessmentId: created.id,
      originalAssessmentId: source.id,
    }),
  );

  const withCount = await repo.findAssessmentById(created.id);
  return mapAssessment({ ...withCount, _count: { questions: source.questions.length } });
}

// ---------------------------------------------------------------------------
// addQuestions / removeQuestion
// ---------------------------------------------------------------------------

export async function addQuestions(
  ctx: AuthContext,
  id: string,
  input: AddQuestionsBody,
): Promise<{ assessmentId: string; addedCount: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssessmentWithQuestions(id);
  if (!existing) throw notFound("Assessment not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can add questions to this assessment");
  }
  if (existing.status === "published") {
    throw badRequest("Cannot add questions to a published assessment");
  }

  // Compute the next order number.
  const maxOrder = existing.questions.reduce(
    (max: number, q: any) => Math.max(max, q.order ?? 0),
    -1,
  );

  await repo.addQuestionsToAssessment(
    id,
    input.questionIds.map((qid, i) => ({
      questionId: qid,
      points: input.points ?? 1,
      order: maxOrder + 1 + i,
    })),
  );

  return { assessmentId: id, addedCount: input.questionIds.length };
}

export async function removeQuestion(
  ctx: AuthContext,
  id: string,
  questionId: string,
): Promise<{ assessmentId: string; questionId: string }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const existing = await repo.findAssessmentById(id);
  if (!existing) throw notFound("Assessment not found");
  if (!isOwner(ctx, existing)) {
    throw forbidden("Only the owner can remove questions");
  }
  if (existing.status === "published") {
    throw badRequest("Cannot remove questions from a published assessment");
  }
  await repo.removeQuestionFromAssessment(id, questionId);
  return { assessmentId: id, questionId };
}

// ---------------------------------------------------------------------------
// startAttempt
// ---------------------------------------------------------------------------

export async function startAttempt(
  ctx: AuthContext,
  id: string,
): Promise<AttemptWithResponsesDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSESSMENT_TAKE)) {
    throw forbidden("No permission to take assessments");
  }
  const assessment = await repo.findAssessmentWithQuestions(id);
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.status !== "published") {
    throw badRequest("Assessment is not published");
  }
  // Open/close window check.
  const now = new Date();
  if (assessment.openAt && now < assessment.openAt) {
    throw badRequest("Assessment is not yet open");
  }
  if (assessment.closeAt && now > assessment.closeAt) {
    throw badRequest("Assessment is closed");
  }
  // Max attempts check.
  const attemptCount = await repo.countAttemptsByStudent(id, ctx.userId);
  if (attemptCount >= assessment.maxAttempts) {
    throw badRequest(`Maximum attempts (${assessment.maxAttempts}) reached`);
  }
  // Check for any in-progress attempts — disallow starting a new one.
  const existingAttempts = await repo.findAttemptsByStudentAndAssessment(id, ctx.userId);
  const inProgress = existingAttempts.find((a: any) => a.status === "in_progress" || a.status === "paused");
  if (inProgress) {
    // Return the existing attempt instead of creating a new one.
    const fetched = await repo.findAttempt(inProgress.id);
    return {
      ...mapAttempt(fetched),
      responses: (fetched?.responses ?? []).map(mapResponse),
      assessment: {
        id: assessment.id,
        title: assessment.title,
        assessmentType: assessment.assessmentType,
        duration: assessment.duration,
        passingScore: assessment.passingScore,
        showResultsImmediately: assessment.showResultsImmediately,
        allowReview: assessment.allowReview,
      },
    };
  }

  // Shuffle question order if enabled.
  let questionOrder: string[] | null = null;
  if (assessment.shuffleQuestions && assessment.questions.length > 0) {
    const shuffled = [...assessment.questions].sort(() => Math.random() - 0.5);
    questionOrder = shuffled.map((q: any) => q.questionId);
  }

  const attemptNumber = attemptCount + 1;
  let expiresAt: Date | undefined;
  if (assessment.duration) {
    expiresAt = new Date(now.getTime() + assessment.duration * 1000);
  }

  const created = await repo.createAttempt({
    assessmentId: id,
    studentId: ctx.userId,
    attemptNumber,
    expiresAt,
    questionOrder: questionOrder ? JSON.stringify(questionOrder) : undefined,
  });

  eventBus.publish(
    buildEvent<AssessmentStartedEvent>({
      type: ASSESSMENT_STARTED,
      actorId: ctx.userId,
      assessmentId: id,
      attemptId: created.id,
      studentId: ctx.userId,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    }),
  );

  const fetched = await repo.findAttempt(created.id);
  return {
    ...mapAttempt(fetched),
    responses: [],
    assessment: {
      id: assessment.id,
      title: assessment.title,
      assessmentType: assessment.assessmentType,
      duration: assessment.duration,
      passingScore: assessment.passingScore,
      showResultsImmediately: assessment.showResultsImmediately,
      allowReview: assessment.allowReview,
    },
  };
}

// ---------------------------------------------------------------------------
// submitAttempt
// ---------------------------------------------------------------------------

export async function submitAttempt(
  ctx: AuthContext,
  attemptId: string,
  input: SubmitAttemptBody,
): Promise<AttemptWithResponsesDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await repo.findAttempt(attemptId);
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("You can only submit your own attempt");
  }
  if (attempt.status !== "in_progress" && attempt.status !== "paused") {
    throw badRequest(`Cannot submit attempt with status ${attempt.status}`);
  }

  // Save all responses.
  const questionMap = new Map<string, { questionType: string; payload: any; pointsMax: number }>();
  const aqList = await repo.findAssessmentQuestions(attempt.assessmentId);
  for (const aq of aqList) {
    let payload: any = {};
    try { payload = JSON.parse((aq.question as any).payload); } catch {}
    questionMap.set(aq.questionId, {
      questionType: (aq.question as any).questionType,
      payload,
      pointsMax: aq.points,
    });
  }

  const gradeItems: BatchGradeItem[] = [];
  for (const r of input.responses) {
    const qMeta = questionMap.get(r.questionId);
    if (!qMeta) continue;
    const saved = await repo.upsertResponse({
      attemptId,
      questionId: r.questionId,
      questionType: qMeta.questionType,
      answer: JSON.stringify(r.answer),
      timeSpentMs: r.timeSpentMs,
    });
    gradeItems.push({
      responseId: saved.id,
      questionType: qMeta.questionType,
      payload: qMeta.payload,
      answer: r.answer,
      pointsMax: qMeta.pointsMax,
    });
  }

  // Auto-grade all auto-gradable responses.
  const batch = batchGradeResponses(gradeItems);
  if (batch.updates.length > 0) {
    await repo.bulkUpdateResponses(
      batch.updates.map((u) => ({
        id: u.id,
        pointsAwarded: u.pointsAwarded,
        isCorrect: u.isCorrect,
        gradedBy: u.gradedBy,
        gradedAt: new Date(),
        feedback: u.feedback,
      })),
    );
  }

  // Update attempt row.
  const score = batch.totalMax > 0 ? (batch.totalAwarded / batch.totalMax) * 100 : 0;
  const assessment = attempt.assessment;
  const passingScore = assessment.passingScore ?? 0;
  const passed = assessment.passingScore != null ? score >= passingScore : null;
  const now = new Date();
  const fullyGraded = batch.needsManualCount === 0;

  const updated = await repo.updateAttempt(attemptId, {
    status: fullyGraded ? "graded" : "submitted",
    submittedAt: now,
    gradedAt: fullyGraded ? now : null,
    autoGradedAt: now,
    score,
    pointsAwarded: batch.totalAwarded,
    pointsMax: batch.totalMax,
    passed,
  });

  eventBus.publish(
    buildEvent<AssessmentSubmittedEvent>({
      type: ASSESSMENT_SUBMITTED,
      actorId: ctx.userId,
      assessmentId: attempt.assessmentId,
      attemptId,
      studentId: attempt.studentId,
      attemptNumber: attempt.attemptNumber,
    }),
  );

  if (fullyGraded) {
    eventBus.publish(
      buildEvent<AssessmentAutoGradedEvent>({
        type: ASSESSMENT_AUTO_GRADED,
        actorId: ctx.userId,
        assessmentId: attempt.assessmentId,
        attemptId,
        studentId: attempt.studentId,
        score,
        pointsAwarded: batch.totalAwarded,
        pointsMax: batch.totalMax,
        passed,
      }),
    );

    // Record into the gradebook.
    const classroomId = (assessment as any).classroomId ?? null;
    try {
      await recordGradebookEntry({
        studentId: attempt.studentId,
        classroomId: classroomId ?? undefined,
        sourceType: assessment.assessmentType === "exam" ? "exam" : "assessment",
        sourceId: attempt.assessmentId,
        assessmentAttemptId: attemptId,
        title: assessment.title,
        points: batch.totalAwarded,
        maxPoints: batch.totalMax,
        percentage: Math.round(score * 100) / 100,
        passed: passed ?? undefined,
        gradedAt: now,
      });
    } catch (err) {
      log.warn("gradebook.record_failed", {
        attemptId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("attempt.submitted", {
    attemptId,
    score,
    needsManualCount: batch.needsManualCount,
  });

  // Refresh and return.
  const refreshed = await repo.findAttempt(attemptId);
  return {
    ...mapAttempt(updated ?? refreshed),
    responses: (refreshed?.responses ?? []).map(mapResponse),
    assessment: {
      id: assessment.id,
      title: assessment.title,
      assessmentType: assessment.assessmentType,
      duration: assessment.duration,
      passingScore: assessment.passingScore,
      showResultsImmediately: assessment.showResultsImmediately,
      allowReview: assessment.allowReview,
    },
  };
}

// ---------------------------------------------------------------------------
// getAttempt
// ---------------------------------------------------------------------------

export async function getAttempt(
  ctx: AuthContext,
  attemptId: string,
): Promise<AttemptWithResponsesDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempt = await repo.findAttempt(attemptId);
  if (!attempt) throw notFound("Attempt not found");
  // Student can see their own attempt; teacher of the assessment can see any.
  const isOwner = attempt.studentId === ctx.userId;
  const isTeacher =
    !ctx.isSuperadmin &&
    (attempt.assessment as any)?.ownerId === ctx.userId;
  if (!isOwner && !isTeacher && !ctx.isSuperadmin) {
    throw forbidden("You do not have access to this attempt");
  }
  return {
    ...mapAttempt(attempt),
    responses: (attempt.responses ?? []).map(mapResponse),
    assessment: {
      id: (attempt.assessment as any).id,
      title: (attempt.assessment as any).title,
      assessmentType: (attempt.assessment as any).assessmentType,
      duration: (attempt.assessment as any).duration,
      passingScore: (attempt.assessment as any).passingScore,
      showResultsImmediately: (attempt.assessment as any).showResultsImmediately,
      allowReview: (attempt.assessment as any).allowReview,
    },
  };
}

// ---------------------------------------------------------------------------
// listAttempts
// ---------------------------------------------------------------------------

export async function listAttempts(
  ctx: AuthContext,
  query: ListAttemptsQuery,
): Promise<{ attempts: AssessmentAttemptDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  // If no filter given, default to the caller's own attempts.
  const studentId = query.studentId ?? ctx.userId;
  // Caller can only list their own attempts unless they're a teacher.
  if (studentId !== ctx.userId && !ctx.isSuperadmin) {
    if (!can(ctx, PersonalPermission.ASSESSMENT_MANAGE)) {
      throw forbidden("You can only view your own attempts");
    }
  }
  let attempts: any[];
  if (query.assessmentId) {
    attempts = await repo.findAttemptsByAssessment(query.assessmentId);
    // Filter by studentId if provided.
    if (studentId) {
      attempts = attempts.filter((a) => a.studentId === studentId);
    }
  } else {
    // Fall back to listing the caller's attempts across all assessments.
    const { db } = await import("@/lib/db");
    attempts = await db.assessmentAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }
  return {
    attempts: attempts.map(mapAttempt),
    total: attempts.length,
  };
}

// ---------------------------------------------------------------------------
// gradeResponse (manual)
// ---------------------------------------------------------------------------

export async function gradeResponse(
  ctx: AuthContext,
  attemptId: string,
  questionId: string,
  input: GradeResponseBody,
): Promise<AssessmentResponseDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSESSMENT_MANAGE)) {
    throw forbidden("No permission to grade responses");
  }
  const attempt = await repo.findAttempt(attemptId);
  if (!attempt) throw notFound("Attempt not found");
  if ((attempt.assessment as any).ownerId !== ctx.userId && !ctx.isSuperadmin) {
    throw forbidden("Only the assessment owner can grade responses");
  }
  const response = await repo.findResponse(attemptId, questionId);
  if (!response) throw notFound("Response not found");

  if (input.pointsAwarded < 0 || input.pointsAwarded > response.pointsMax) {
    throw badRequest(`pointsAwarded must be between 0 and ${response.pointsMax}`);
  }

  const updated = await repo.updateResponse(response.id, {
    pointsAwarded: input.pointsAwarded,
    isCorrect: input.isCorrect,
    gradedBy: ctx.userId,
    gradedAt: new Date(),
    feedback: input.feedback,
  });

  // Recompute attempt totals and mark as fully graded.
  const allResponses = await repo.findResponsesByAttempt(attemptId);
  const totalAwarded = allResponses.reduce((sum: number, r: any) => sum + (r.pointsAwarded ?? 0), 0);
  const totalMax = allResponses.reduce((sum: number, r: any) => sum + r.pointsMax, 0);
  const allGraded = allResponses.every((r: any) => r.gradedAt !== null);
  const score = totalMax > 0 ? (totalAwarded / totalMax) * 100 : 0;
  const passingScore = (attempt.assessment as any).passingScore ?? 0;
  const passed = (attempt.assessment as any).passingScore != null ? score >= passingScore : null;

  if (allGraded) {
    await repo.updateAttempt(attemptId, {
      status: "graded",
      gradedAt: new Date(),
      manualGradedAt: new Date(),
      score,
      pointsAwarded: totalAwarded,
      pointsMax: totalMax,
      passed,
    });

    eventBus.publish(
      buildEvent<AssessmentManuallyGradedEvent>({
        type: ASSESSMENT_MANUALLY_GRADED,
        actorId: ctx.userId,
        assessmentId: attempt.assessmentId,
        attemptId,
        studentId: attempt.studentId,
        gradedById: ctx.userId,
        score,
      }),
    );

    // Record into the gradebook.
    const classroomId = (attempt.assessment as any).classroomId ?? null;
    const title = (attempt.assessment as any).title;
    const assessmentType = (attempt.assessment as any).assessmentType;
    try {
      await recordGradebookEntry({
        studentId: attempt.studentId,
        classroomId: classroomId ?? undefined,
        sourceType: assessmentType === "exam" ? "exam" : "assessment",
        sourceId: attempt.assessmentId,
        assessmentAttemptId: attemptId,
        title,
        points: totalAwarded,
        maxPoints: totalMax,
        percentage: Math.round(score * 100) / 100,
        passed: passed ?? undefined,
        gradedAt: new Date(),
      });
    } catch (err) {
      log.warn("gradebook.record_failed_manual", {
        attemptId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return mapResponse(updated);
}

// ---------------------------------------------------------------------------
// getMyAttempts
// ---------------------------------------------------------------------------

export async function getMyAttempts(
  ctx: AuthContext,
  assessmentId: string,
): Promise<AssessmentAttemptDto[]> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const attempts = await repo.findAttemptsByStudentAndAssessment(assessmentId, ctx.userId);
  return attempts.map(mapAttempt);
}
