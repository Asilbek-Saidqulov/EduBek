/**
 * EduBek — Assessment repository.
 *
 * The ONLY layer in this feature that imports `db`. Services compose these
 * primitives; routes never touch the data layer directly.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

export interface CreateAssessmentInput {
  ownerId: string;
  orgId?: string;
  classroomId?: string;
  resourceId?: string;
  assignmentId?: string;
  rubricId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assessmentType: string;
  duration?: number;
  passingScore?: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResultsImmediately: boolean;
  allowReview: boolean;
  openAt?: Date;
  closeAt?: Date;
}

export async function createAssessment(input: CreateAssessmentInput) {
  return db.assessment.create({
    data: {
      ownerId: input.ownerId,
      orgId: input.orgId ?? null,
      classroomId: input.classroomId ?? null,
      resourceId: input.resourceId ?? null,
      assignmentId: input.assignmentId ?? null,
      rubricId: input.rubricId ?? null,
      title: input.title,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      assessmentType: input.assessmentType,
      duration: input.duration ?? null,
      passingScore: input.passingScore ?? null,
      maxAttempts: input.maxAttempts,
      shuffleQuestions: input.shuffleQuestions,
      shuffleAnswers: input.shuffleAnswers,
      showResultsImmediately: input.showResultsImmediately,
      allowReview: input.allowReview,
      openAt: input.openAt ?? null,
      closeAt: input.closeAt ?? null,
      status: "draft",
    },
  });
}

export async function findAssessmentById(id: string) {
  return db.assessment.findUnique({ where: { id } });
}

export async function findAssessmentWithQuestions(id: string) {
  return db.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          question: true,
        },
      },
    },
  });
}

export interface ListAssessmentsInput {
  ownerId?: string;
  classroomId?: string;
  status?: string;
  assessmentType?: string;
  page: number;
  pageSize: number;
}

export async function listAssessments(input: ListAssessmentsInput) {
  const where: Record<string, unknown> = {};
  if (input.ownerId) where.ownerId = input.ownerId;
  if (input.classroomId) where.classroomId = input.classroomId;
  if (input.status) where.status = input.status;
  if (input.assessmentType) where.assessmentType = input.assessmentType;
  const [items, total] = await Promise.all([
    db.assessment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { _count: { select: { questions: true } } },
    }),
    db.assessment.count({ where }),
  ]);
  return { items, total };
}

export async function updateAssessment(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    instructions?: string | null;
    assessmentType?: string;
    duration?: number | null;
    passingScore?: number | null;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
    showResultsImmediately?: boolean;
    allowReview?: boolean;
    openAt?: Date | null;
    closeAt?: Date | null;
    rubricId?: string | null;
  },
) {
  return db.assessment.update({ where: { id }, data });
}

export async function setStatus(
  id: string,
  status: "draft" | "published" | "archived",
) {
  return db.assessment.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : undefined,
    },
  });
}

// ---------------------------------------------------------------------------
// AssessmentQuestion
// ---------------------------------------------------------------------------

export async function addQuestionsToAssessment(
  assessmentId: string,
  items: Array<{ questionId: string; points: number; order: number }>,
): Promise<void> {
  await db.$transaction(
    items.map((i) =>
      db.assessmentQuestion.create({
        data: {
          assessmentId,
          questionId: i.questionId,
          points: i.points,
          order: i.order,
        },
      }),
    ),
  );
}

export async function removeQuestionFromAssessment(
  assessmentId: string,
  questionId: string,
): Promise<void> {
  await db.assessmentQuestion.delete({
    where: { assessmentId_questionId: { assessmentId, questionId } },
  });
}

export async function findAssessmentQuestions(assessmentId: string) {
  return db.assessmentQuestion.findMany({
    where: { assessmentId },
    orderBy: { order: "asc" },
    include: { question: true },
  });
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export async function createAttempt(input: {
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  expiresAt?: Date;
  questionOrder?: string;
}) {
  return db.assessmentAttempt.create({
    data: {
      assessmentId: input.assessmentId,
      studentId: input.studentId,
      attemptNumber: input.attemptNumber,
      expiresAt: input.expiresAt ?? null,
      questionOrder: input.questionOrder ?? null,
      status: "in_progress",
    },
  });
}

export async function findAttempt(id: string) {
  return db.assessmentAttempt.findUnique({
    where: { id },
    include: {
      assessment: {
        select: {
          id: true, title: true, assessmentType: true, duration: true,
          passingScore: true, showResultsImmediately: true, allowReview: true,
          ownerId: true, classroomId: true, orgId: true,
        },
      },
      responses: true,
    },
  });
}

export async function findAttemptByAttemptNumber(
  assessmentId: string,
  studentId: string,
  attemptNumber: number,
) {
  return db.assessmentAttempt.findUnique({
    where: {
      assessmentId_studentId_attemptNumber: {
        assessmentId, studentId, attemptNumber,
      },
    },
  });
}

export async function findAttemptsByStudentAndAssessment(
  assessmentId: string,
  studentId: string,
) {
  return db.assessmentAttempt.findMany({
    where: { assessmentId, studentId },
    orderBy: { attemptNumber: "desc" },
  });
}

export async function findAttemptsByAssessment(assessmentId: string) {
  return db.assessmentAttempt.findMany({
    where: { assessmentId },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function countAttemptsByStudent(
  assessmentId: string,
  studentId: string,
): Promise<number> {
  return db.assessmentAttempt.count({
    where: { assessmentId, studentId },
  });
}

export async function findExpiringAttempts(now: Date): Promise<any[]> {
  return db.assessmentAttempt.findMany({
    where: {
      status: "in_progress",
      expiresAt: { lte: now },
    },
  });
}

export async function updateAttempt(
  id: string,
  data: {
    status?: string;
    submittedAt?: Date | null;
    gradedAt?: Date | null;
    expiresAt?: Date | null;
    pausedAt?: Date | null;
    resumedAt?: Date | null;
    timeRemainingMs?: number | null;
    score?: number | null;
    pointsAwarded?: number | null;
    pointsMax?: number;
    passed?: boolean | null;
    autoGradedAt?: Date | null;
    manualGradedAt?: Date | null;
    proctoringIncidentCount?: number;
    proctoringFlagged?: boolean;
    plagiarismScore?: number | null;
    plagiarismFlagged?: boolean;
  },
) {
  return db.assessmentAttempt.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export async function upsertResponse(input: {
  attemptId: string;
  questionId: string;
  questionType: string;
  answer?: string;
  timeSpentMs?: number;
}) {
  return db.assessmentResponse.upsert({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    create: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      questionType: input.questionType,
      answer: input.answer ?? null,
      timeSpentMs: input.timeSpentMs ?? 0,
    },
    update: {
      answer: input.answer ?? null,
      timeSpentMs: input.timeSpentMs ?? undefined,
    },
  });
}

export async function findResponse(attemptId: string, questionId: string) {
  return db.assessmentResponse.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
  });
}

export async function findResponsesByAttempt(attemptId: string) {
  return db.assessmentResponse.findMany({ where: { attemptId } });
}

export async function updateResponse(
  id: string,
  data: {
    pointsAwarded?: number | null;
    isCorrect?: boolean | null;
    gradedBy?: string | null;
    gradedAt?: Date | null;
    feedback?: string | null;
  },
) {
  return db.assessmentResponse.update({ where: { id }, data });
}

export async function bulkUpdateResponses(
  updates: Array<{
    id: string;
    pointsAwarded?: number | null;
    isCorrect?: boolean | null;
    gradedBy?: string | null;
    gradedAt?: Date | null;
    feedback?: string | null;
  }>,
): Promise<void> {
  if (updates.length === 0) return;
  await db.$transaction(
    updates.map((u) =>
      db.assessmentResponse.update({
        where: { id: u.id },
        data: {
          pointsAwarded: u.pointsAwarded,
          isCorrect: u.isCorrect,
          gradedBy: u.gradedBy,
          gradedAt: u.gradedAt,
          feedback: u.feedback,
        },
      }),
    ),
  );
}
