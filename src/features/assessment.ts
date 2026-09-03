import { z } from "zod";
import { db } from "@/lib/db";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
} from "@/lib/errors";
import { type AuthContext, requireAuth } from "@/features/auth";
import { generateStructuredJson, generateText, getGeneralModel } from "@/lib/ai";

function isAdmin(ctx: AuthContext) {
  return ctx.platformRoles.some((r) =>
    ["ADMIN", "SUPER_ADMIN", "admin", "super_admin"].includes(r)
  );
}

function requireUserId(ctx: AuthContext): string {
  requireAuth(ctx);
  if (!ctx.userId) throw unauthorized("Authentication required");
  return ctx.userId;
}

const questionTypeEnum = z.enum([
  "multiple_choice",
  "multiple_select",
  "true_false",
  "short_answer",
  "essay",
  "matching",
  "ordering",
  "fill_blank",
]);

export const listBankQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  subject: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard", "all"]).optional(),
  questionType: z.string().optional(),
  status: z.enum(["active", "archived", "all"]).optional(),
});
export type ListBankQuestionsQuery = z.infer<typeof listBankQuestionsQuerySchema>;

export const createBankQuestionBodySchema = z.object({
  questionType: questionTypeEnum.default("multiple_choice"),
  prompt: z.string().min(1, "Question prompt is required"),
  payload: z.record(z.string(), z.any()).optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  topic: z.string().optional(),
  points: z.number().int().min(1).default(1),
  estimatedTime: z.number().int().min(5).max(3600).optional(),
});
export type CreateBankQuestionBody = z.infer<typeof createBankQuestionBodySchema>;

export const createAssessmentBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  assessmentType: z.enum(["quiz", "exam", "practice"]).default("quiz"),
  duration: z.number().int().min(30).max(86400).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(100).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  openAt: z.string().datetime().optional().nullable(),
  closeAt: z.string().datetime().optional().nullable(),
  orgId: z.string().optional().nullable(),
  classroomId: z.string().optional().nullable(),
  resourceId: z.string().optional().nullable(),
  rubricId: z.string().optional().nullable(),
});
export type CreateAssessmentBody = z.infer<typeof createAssessmentBodySchema>;

export const updateAssessmentBodySchema = createAssessmentBodySchema.partial();
export type UpdateAssessmentBody = z.infer<typeof updateAssessmentBodySchema>;

export const listAssessmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["draft", "published", "archived", "all"]).optional(),
  assessmentType: z.enum(["quiz", "exam", "practice", "all"]).optional(),
  classroomId: z.string().optional(),
  orgId: z.string().optional(),
  mineOnly: z.coerce.boolean().optional(),
});
export type ListAssessmentsQuery = z.infer<typeof listAssessmentsQuerySchema>;

export const addQuestionsBodySchema = z.object({
  questions: z
    .array(
      z.object({
        questionId: z.string().optional(),
        questionType: questionTypeEnum.default("multiple_choice"),
        prompt: z.string().optional(),
        payload: z.record(z.string(), z.any()).optional(),
        points: z.number().int().min(1).default(1),
        order: z.number().int().default(0),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        subject: z.string().optional(),
        overrides: z.string().optional(),
      })
    )
    .min(1, "At least one question must be provided"),
});
export type AddQuestionsBody = z.infer<typeof addQuestionsBodySchema>;

export const submitAttemptBodySchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string(),
      answer: z.any().optional(),
      timeSpentMs: z.number().int().min(0).default(0),
    })
  ),
});
export type SubmitAttemptBody = z.infer<typeof submitAttemptBodySchema>;

export const listAttemptsQuerySchema = z.object({
  assessmentId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(["in_progress", "submitted", "graded", "expired", "paused", "all"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAttemptsQuery = z.infer<typeof listAttemptsQuerySchema>;

export const gradeResponseBodySchema = z.object({
  pointsAwarded: z.number().int().min(0),
  isCorrect: z.boolean().optional(),
  feedback: z.string().max(2000).optional(),
});
export type GradeResponseBody = z.infer<typeof gradeResponseBodySchema>;

export async function createAssessment(authCtx: AuthContext, body: CreateAssessmentBody) {
  const userId = requireUserId(authCtx);

  return db.assessment.create({
    data: {
      ownerId: userId,
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      assessmentType: body.assessmentType || "quiz",
      duration: body.duration,
      passingScore: body.passingScore,
      maxAttempts: body.maxAttempts ?? 1,
      shuffleQuestions: body.shuffleQuestions ?? false,
      shuffleAnswers: body.shuffleAnswers ?? false,
      showResultsImmediately: body.showResultsImmediately ?? true,
      allowReview: body.allowReview ?? true,
      openAt: body.openAt ? new Date(body.openAt) : null,
      closeAt: body.closeAt ? new Date(body.closeAt) : null,
      orgId: body.orgId,
      classroomId: body.classroomId,
      resourceId: body.resourceId,
      rubricId: body.rubricId,
      status: "draft",
    },
    include: {
      questions: { include: { question: true } },
      rubric: true,
    },
  });
}

export async function listAssessments(authCtx: AuthContext, query: ListAssessmentsQuery) {
  const { page, pageSize, search, status, assessmentType, classroomId, orgId, mineOnly } = query;
  const skip = (page - 1) * pageSize;
  const where: Record<string, unknown> = {};

  if (mineOnly) {
    const userId = requireUserId(authCtx);
    where.ownerId = userId;
  } else if (authCtx.userId && !isAdmin(authCtx)) {
    where.OR = [{ ownerId: authCtx.userId }, { status: "published" }];
  } else if (!authCtx.userId) {
    where.status = "published";
  }

  if (status && status !== "all") where.status = status;
  if (assessmentType && assessmentType !== "all") where.assessmentType = assessmentType;
  if (classroomId) where.classroomId = classroomId;
  if (orgId) where.orgId = orgId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.assessment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true, primaryRole: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    db.assessment.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAssessment(authCtx: AuthContext, id: string) {
  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, primaryRole: true } },
      questions: { orderBy: { order: "asc" }, include: { question: true } },
      rubric: { include: { criteria: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!assessment) throw notFound("Assessment not found");

  const owner = authCtx.userId === assessment.ownerId;
  if (assessment.status !== "published" && !owner && !isAdmin(authCtx)) {
    throw forbidden("Assessment is not published");
  }
  return assessment;
}

export async function updateAssessment(authCtx: AuthContext, id: string, body: UpdateAssessmentBody) {
  const userId = requireUserId(authCtx);
  const existing = await db.assessment.findUnique({ where: { id } });
  if (!existing) throw notFound("Assessment not found");
  if (existing.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to update this assessment");
  }

  const data: Record<string, unknown> = { ...body };
  if (body.openAt !== undefined) data.openAt = body.openAt ? new Date(body.openAt) : null;
  if (body.closeAt !== undefined) data.closeAt = body.closeAt ? new Date(body.closeAt) : null;

  return db.assessment.update({
    where: { id },
    data,
    include: {
      questions: { include: { question: true }, orderBy: { order: "asc" } },
      rubric: true,
    },
  });
}

export async function addQuestions(authCtx: AuthContext, assessmentId: string, body: AddQuestionsBody) {
  const userId = requireUserId(authCtx);
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to modify this assessment");
  }

  const results = [];
  let currentOrder = (await db.assessmentQuestion.count({ where: { assessmentId } })) || 0;

  for (const item of body.questions) {
    let qId = item.questionId;
    if (!qId) {
      const payloadStr =
        typeof item.payload === "string"
          ? item.payload
          : JSON.stringify(item.payload || { prompt: item.prompt || "" });
      const created = await db.bankQuestion.create({
        data: {
          ownerId: userId,
          questionType: item.questionType || "multiple_choice",
          payload: payloadStr,
          subject: item.subject,
          difficulty: item.difficulty || "medium",
          points: item.points || 1,
        },
      });
      qId = created.id;
    }

    const link = await db.assessmentQuestion.upsert({
      where: { assessmentId_questionId: { assessmentId, questionId: qId } },
      update: { order: item.order ?? currentOrder++, points: item.points ?? 1, overrides: item.overrides },
      create: {
        assessmentId,
        questionId: qId,
        order: item.order ?? currentOrder++,
        points: item.points ?? 1,
        overrides: item.overrides,
      },
      include: { question: true },
    });
    results.push(link);
  }

  return { success: true, count: results.length, questions: results };
}

export async function removeQuestion(authCtx: AuthContext, assessmentId: string, questionId: string) {
  const userId = requireUserId(authCtx);
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to modify this assessment");
  }
  await db.assessmentQuestion.deleteMany({ where: { assessmentId, questionId } });
  return { success: true, removedQuestionId: questionId };
}

export async function publishAssessment(authCtx: AuthContext, id: string) {
  const userId = requireUserId(authCtx);
  const assessment = await db.assessment.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to publish this assessment");
  }
  if (assessment._count.questions === 0) {
    throw badRequest("Cannot publish an assessment with no questions");
  }
  return db.assessment.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function archiveAssessment(authCtx: AuthContext, id: string) {
  const userId = requireUserId(authCtx);
  const assessment = await db.assessment.findUnique({ where: { id } });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to archive this assessment");
  }
  return db.assessment.update({ where: { id }, data: { status: "archived" } });
}

export async function duplicateAssessment(authCtx: AuthContext, id: string) {
  const userId = requireUserId(authCtx);
  const original = await db.assessment.findUnique({
    where: { id },
    include: { questions: true },
  });
  if (!original) throw notFound("Assessment not found");

  return db.assessment.create({
    data: {
      ownerId: userId,
      title: `${original.title} (Copy)`,
      description: original.description,
      instructions: original.instructions,
      assessmentType: original.assessmentType,
      duration: original.duration,
      passingScore: original.passingScore,
      maxAttempts: original.maxAttempts,
      shuffleQuestions: original.shuffleQuestions,
      shuffleAnswers: original.shuffleAnswers,
      showResultsImmediately: original.showResultsImmediately,
      allowReview: original.allowReview,
      status: "draft",
      questions: {
        create: original.questions.map((q) => ({
          questionId: q.questionId,
          order: q.order,
          points: q.points,
          overrides: q.overrides,
        })),
      },
    },
    include: { questions: { include: { question: true } } },
  });
}

export function sanitizeAssessmentForStudent(assessment: any) {
  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    instructions: assessment.instructions,
    assessmentType: assessment.assessmentType,
    duration: assessment.duration,
    passingScore: assessment.passingScore,
    questions: assessment.questions.map((aq: any) => {
      let parsedPayload: any = {};
      try {
        parsedPayload =
          typeof aq.question.payload === "string" ? JSON.parse(aq.question.payload) : aq.question.payload;
      } catch {
        parsedPayload = {};
      }
      const sanitizedPayload = { ...parsedPayload };
      delete sanitizedPayload.correctAnswer;
      delete sanitizedPayload.answerKey;
      delete sanitizedPayload.explanation;
      if (Array.isArray(sanitizedPayload.options)) {
        sanitizedPayload.options = sanitizedPayload.options.map((opt: any) => {
          if (typeof opt === "object" && opt !== null) {
            const { isCorrect, ...rest } = opt;
            return rest;
          }
          return opt;
        });
      }
      return {
        id: aq.id,
        questionId: aq.questionId,
        questionType: aq.question.questionType,
        points: aq.points,
        order: aq.order,
        payload: sanitizedPayload,
      };
    }),
  };
}

export async function startAttempt(authCtx: AuthContext, assessmentId: string) {
  const userId = requireUserId(authCtx);
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { include: { question: true }, orderBy: { order: "asc" } } },
  });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.status !== "published" && assessment.ownerId !== userId) {
    throw forbidden("Assessment is not currently published");
  }

  const now = new Date();
  if (assessment.openAt && now < assessment.openAt) throw badRequest("Assessment is not open yet");
  if (assessment.closeAt && now > assessment.closeAt) throw badRequest("Assessment is closed");

  const existingAttempts = await db.assessmentAttempt.findMany({
    where: { assessmentId, studentId: userId },
    orderBy: { attemptNumber: "desc" },
  });
  const activeAttempt = existingAttempts.find((a) => a.status === "in_progress" || a.status === "paused");
  if (activeAttempt) {
    return { attempt: activeAttempt, resumed: true, assessment: sanitizeAssessmentForStudent(assessment) };
  }
  if (existingAttempts.length >= assessment.maxAttempts && assessment.ownerId !== userId) {
    throw conflict("Maximum number of attempts reached for this assessment");
  }

  let orderedQuestionIds = assessment.questions.map((q) => q.questionId);
  if (assessment.shuffleQuestions) {
    orderedQuestionIds = [...orderedQuestionIds].sort(() => Math.random() - 0.5);
  }
  const expiresAt = assessment.duration ? new Date(Date.now() + assessment.duration * 1000) : null;
  const totalMaxPoints = assessment.questions.reduce((sum, q) => sum + (q.points || 1), 0);

  const attempt = await db.assessmentAttempt.create({
    data: {
      assessmentId,
      studentId: userId,
      attemptNumber: existingAttempts.length + 1,
      status: "in_progress",
      expiresAt,
      pointsMax: totalMaxPoints,
      questionOrder: JSON.stringify(orderedQuestionIds),
    },
  });

  return { attempt, resumed: false, assessment: sanitizeAssessmentForStudent(assessment) };
}

export async function submitAttempt(authCtx: AuthContext, attemptId: string, body: SubmitAttemptBody) {
  const userId = requireUserId(authCtx);
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: { include: { questions: { include: { question: true } } } } },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.studentId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Cannot submit attempt belonging to another user");
  }
  if (attempt.status === "submitted" || attempt.status === "graded") return attempt;

  let totalPointsAwarded = 0;
  let totalPointsMax = 0;
  const responsesToCreate: any[] = [];

  for (const aq of attempt.assessment.questions) {
    const qPoints = aq.points || 1;
    totalPointsMax += qPoints;
    const studentResp = body.responses.find((r) => r.questionId === aq.questionId);
    const rawAnswer = studentResp ? studentResp.answer : null;
    const answerStr = typeof rawAnswer === "string" ? rawAnswer : JSON.stringify(rawAnswer ?? null);
    let parsedPayload: any = {};
    try {
      parsedPayload =
        typeof aq.question.payload === "string" ? JSON.parse(aq.question.payload) : aq.question.payload;
    } catch {
      parsedPayload = {};
    }

    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;
    const qType = aq.question.questionType;
    if (qType === "multiple_choice" || qType === "true_false") {
      const correctVal = parsedPayload.correctAnswer ?? parsedPayload.answerKey;
      if (correctVal !== undefined && rawAnswer != null) {
        isCorrect = String(correctVal).trim().toLowerCase() === String(rawAnswer).trim().toLowerCase();
        pointsAwarded = isCorrect ? qPoints : 0;
      }
    } else if (qType === "multiple_select") {
      const correctArr = parsedPayload.correctAnswers || parsedPayload.answerKey || [];
      if (Array.isArray(correctArr) && Array.isArray(rawAnswer)) {
        isCorrect = JSON.stringify([...correctArr].map(String).sort()) === JSON.stringify([...rawAnswer].map(String).sort());
        pointsAwarded = isCorrect ? qPoints : 0;
      }
    } else if (qType === "short_answer" || qType === "fill_blank") {
      const acceptable: string[] = Array.isArray(parsedPayload.acceptableAnswers)
        ? parsedPayload.acceptableAnswers
        : [parsedPayload.correctAnswer || ""];
      if (typeof rawAnswer === "string") {
        isCorrect = acceptable.some((ans) => ans.trim().toLowerCase() === rawAnswer.trim().toLowerCase());
        pointsAwarded = isCorrect ? qPoints : 0;
      }
    }
    if (pointsAwarded > 0) totalPointsAwarded += pointsAwarded;

    responsesToCreate.push({
      attemptId,
      questionId: aq.questionId,
      questionType: qType,
      answer: answerStr,
      pointsMax: qPoints,
      pointsAwarded,
      isCorrect,
      gradedBy: isCorrect !== null ? "auto" : null,
      gradedAt: isCorrect !== null ? new Date() : null,
      timeSpentMs: studentResp?.timeSpentMs ?? 0,
    });
  }

  for (const resp of responsesToCreate) {
    await db.assessmentResponse.upsert({
      where: { attemptId_questionId: { attemptId: resp.attemptId, questionId: resp.questionId } },
      update: resp,
      create: resp,
    });
  }

  const scorePct = totalPointsMax > 0 ? (totalPointsAwarded / totalPointsMax) * 100 : 100;
  const passed =
    attempt.assessment.passingScore != null ? scorePct >= attempt.assessment.passingScore : scorePct >= 60;

  return db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "graded",
      submittedAt: new Date(),
      gradedAt: new Date(),
      autoGradedAt: new Date(),
      score: Math.round(scorePct * 100) / 100,
      pointsAwarded: totalPointsAwarded,
      pointsMax: totalPointsMax,
      passed,
    },
    include: { responses: true },
  });
}

export async function listAttempts(authCtx: AuthContext, query: ListAttemptsQuery) {
  const userId = requireUserId(authCtx);
  const { assessmentId, studentId, status, page, pageSize } = query;
  const skip = (page - 1) * pageSize;
  const where: Record<string, unknown> = {};

  if (assessmentId) {
    where.assessmentId = assessmentId;
    const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
    if (assessment && assessment.ownerId !== userId && !isAdmin(authCtx)) {
      where.studentId = userId;
    }
  } else if (!isAdmin(authCtx)) {
    where.studentId = userId;
  }

  if (studentId && (isAdmin(authCtx) || userId === studentId)) where.studentId = studentId;
  if (status && status !== "all") where.status = status;

  const [items, total] = await Promise.all([
    db.assessmentAttempt.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assessment: { select: { id: true, title: true, assessmentType: true, passingScore: true } },
      },
    }),
    db.assessmentAttempt.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAttempt(authCtx: AuthContext, attemptId: string) {
  const userId = requireUserId(authCtx);
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assessment: { include: { questions: { include: { question: true }, orderBy: { order: "asc" } } } },
      responses: true,
    },
  });
  if (!attempt) throw notFound("Attempt not found");
  const allowed =
    userId === attempt.studentId || userId === attempt.assessment.ownerId || isAdmin(authCtx);
  if (!allowed) throw forbidden("Not authorized to view this attempt");
  return attempt;
}

export async function gradeResponse(
  authCtx: AuthContext,
  attemptId: string,
  questionId: string,
  body: GradeResponseBody
) {
  const userId = requireUserId(authCtx);
  const attempt = await db.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true, responses: true },
  });
  if (!attempt) throw notFound("Attempt not found");
  if (attempt.assessment.ownerId !== userId && !isAdmin(authCtx)) {
    throw forbidden("Not authorized to grade this attempt");
  }

  const updatedResponse = await db.assessmentResponse.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: {
      pointsAwarded: body.pointsAwarded,
      isCorrect: body.isCorrect ?? body.pointsAwarded > 0,
      feedback: body.feedback,
      gradedBy: userId,
      gradedAt: new Date(),
    },
    create: {
      attemptId,
      questionId,
      questionType: "essay",
      pointsAwarded: body.pointsAwarded,
      isCorrect: body.isCorrect ?? body.pointsAwarded > 0,
      feedback: body.feedback,
      gradedBy: userId,
      gradedAt: new Date(),
    },
  });

  const allResponses = await db.assessmentResponse.findMany({ where: { attemptId } });
  const totalAwarded = allResponses.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
  const totalMax = attempt.pointsMax || 100;
  const scorePct = (totalAwarded / totalMax) * 100;
  const passed = attempt.assessment.passingScore != null ? scorePct >= attempt.assessment.passingScore : scorePct >= 60;

  const updatedAttempt = await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      pointsAwarded: totalAwarded,
      score: Math.round(scorePct * 100) / 100,
      passed,
      status: "graded",
      manualGradedAt: new Date(),
    },
  });

  return { response: updatedResponse, attempt: updatedAttempt };
}

export async function listBankQuestions(authCtx: AuthContext, query: ListBankQuestionsQuery) {
  const userId = requireUserId(authCtx);
  const { page, pageSize, search, subject, difficulty, questionType, status } = query;
  const skip = (page - 1) * pageSize;
  const where: Record<string, unknown> = { ownerId: userId };
  if (subject) where.subject = subject;
  if (difficulty && difficulty !== "all") where.difficulty = difficulty;
  if (questionType) where.questionType = questionType;
  if (status && status !== "all") where.status = status;
  else where.status = "active";
  if (search) where.payload = { contains: search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    db.bankQuestion.findMany({ where, skip, take: pageSize, orderBy: { updatedAt: "desc" } }),
    db.bankQuestion.count({ where }),
  ]);

  return {
    items: items.map((q) => {
      let parsedPayload: any = {};
      try {
        parsedPayload = typeof q.payload === "string" ? JSON.parse(q.payload) : q.payload;
      } catch {
        parsedPayload = {};
      }
      return { ...q, parsedPayload };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createBankQuestion(authCtx: AuthContext, body: CreateBankQuestionBody) {
  const userId = requireUserId(authCtx);
  const payloadStr =
    typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload || { prompt: body.prompt });
  return db.bankQuestion.create({
    data: {
      ownerId: userId,
      questionType: body.questionType,
      payload: payloadStr,
      subject: body.subject,
      grade: body.grade,
      difficulty: body.difficulty,
      topic: body.topic,
      points: body.points,
      estimatedTime: body.estimatedTime,
      status: "active",
    },
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 45000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("AI generation timeout")), timeoutMs)),
  ]);
}

export async function generateAssessment(authCtx: AuthContext, body: any) {
  requireUserId(authCtx);
  const topic = body.topic || "General Knowledge";
  const questionCount = Math.min(Math.max(Number(body.questionCount) || 5, 1), 15);
  const language = body.language || "English";
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");

  const prompt = `Create a ${body.assessmentType || "quiz"} about "${topic}".
Subject: ${body.subject || "General"}
Grade: ${body.grade || "Secondary"}
Write exactly ${questionCount} questions, all text in ${language}.

Return ONLY a JSON object.
{"title":"string","description":"string","instructions":"string","assessmentType":"quiz","passingScore":70,"durationMinutes":20,"questions":[{"questionType":"multiple_choice","prompt":"string","points":1,"difficulty":"medium","payload":{"options":["A","B","C","D"],"correctAnswer":"A","explanation":"string"}}]}`;

  const { data } = await withTimeout(
    generateStructuredJson<any>({
      prompt,
      systemPrompt: "JSON only.",
      model: getGeneralModel(),
      maxTokens: 8000,
      temperature: 0.2,
    }),
    60000
  );
  if (!data?.questions?.length) throw new Error("AI returned no questions");
  return { success: true, ...data };
}

export async function generateQuestions(authCtx: AuthContext, body: any) {
  requireUserId(authCtx);
  const topic = body.topic || "General Knowledge";
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 15);
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");

  const prompt = `Generate ${count} ${body.difficulty || "medium"} questions on "${topic}".
Type: ${body.questionType || "multiple_choice"}
Language: ${body.language || "English"}
Return ONLY JSON: {"questions":[{"questionType":"multiple_choice","prompt":"string","difficulty":"medium","points":1,"payload":{"options":["A","B","C","D"],"correctAnswer":"A","explanation":"string"}}]}`;

  const { data } = await withTimeout(
    generateStructuredJson<{ questions: any[] }>({
      prompt,
      systemPrompt: "JSON only.",
      model: getGeneralModel(),
      maxTokens: count * 350,
      temperature: 0.2,
    }),
    60000
  );
  return { success: true, questions: data.questions || [] };
}

export async function generateExplanation(authCtx: AuthContext, body: any) {
  requireUserId(authCtx);
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      success: true,
      explanation: `The correct answer is "${body.correctAnswer}".`,
    };
  }
  const prompt = `Explain why "${body.correctAnswer}" is correct for: "${body.questionPrompt}".
Student answered: "${body.studentAnswer || "None"}".
Language: ${body.language || "English"}.`;
  const { text } = await withTimeout(
    generateText({ prompt, model: getGeneralModel(), maxTokens: 1000, temperature: 0.3 }),
    45000
  );
  return { success: true, explanation: text };
}

export async function generatePracticeQuiz(authCtx: AuthContext, body: any) {
  return generateAssessment(authCtx, {
    topic: body.topic,
    assessmentType: "practice",
    questionCount: body.questionCount || 5,
    language: body.language,
  });
}

export async function generateRubric(authCtx: AuthContext, body: any) {
  const topic = body.topic || "Educational Assessment";
  const maxPoints = body.maxPoints || 100;
  return {
    success: true,
    name: `${topic} Evaluation Rubric`,
    maxPoints,
    criteria: [
      { name: "Conceptual Understanding", maxPoints: Math.round(maxPoints * 0.4), description: "Key ideas and principles." },
      { name: "Application & Problem Solving", maxPoints: Math.round(maxPoints * 0.4), description: "Apply concepts to problems." },
      { name: "Clarity & Organization", maxPoints: Math.round(maxPoints * 0.2), description: "Clear structure and terms." },
    ],
  };
}
