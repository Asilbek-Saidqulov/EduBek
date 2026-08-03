/**
 * EduBek — Assessment Zod schemas.
 */
import { z } from "zod";

export const assessmentTypeSchema = z.enum(["quiz", "exam", "practice"]);

export const createAssessmentBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  instructions: z.string().max(20_000).optional(),
  assessmentType: assessmentTypeSchema.default("quiz"),
  duration: z.number().int().min(0).max(86_400).optional(), // seconds
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(100).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(false),
  allowReview: z.boolean().default(true),
  openAt: z.string().datetime().optional(),
  closeAt: z.string().datetime().optional(),
  classroomId: z.string().min(1).optional(),
  resourceId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  rubricId: z.string().min(1).optional(),
  orgId: z.string().min(1).optional(),
  // Optional: include questions at creation time
  questionIds: z.array(z.string().min(1)).max(200).optional(),
});
export type CreateAssessmentBody = z.infer<typeof createAssessmentBodySchema>;

export const updateAssessmentBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5_000).nullable().optional(),
  instructions: z.string().max(20_000).nullable().optional(),
  assessmentType: assessmentTypeSchema.optional(),
  duration: z.number().int().min(0).max(86_400).nullable().optional(),
  passingScore: z.number().min(0).max(100).nullable().optional(),
  maxAttempts: z.number().int().min(1).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleAnswers: z.boolean().optional(),
  showResultsImmediately: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  openAt: z.string().datetime().nullable().optional(),
  closeAt: z.string().datetime().nullable().optional(),
  rubricId: z.string().min(1).nullable().optional(),
});
export type UpdateAssessmentBody = z.infer<typeof updateAssessmentBodySchema>;

export const addQuestionsBodySchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1).max(200),
  points: z.number().int().min(0).max(100).optional(),
});
export type AddQuestionsBody = z.infer<typeof addQuestionsBodySchema>;

export const startAttemptBodySchema = z.object({});
export type StartAttemptBody = z.infer<typeof startAttemptBodySchema>;

export const submitAttemptBodySchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.unknown(),
      timeSpentMs: z.number().int().min(0).max(3_600_000).optional(),
    }),
  ).max(500),
});
export type SubmitAttemptBody = z.infer<typeof submitAttemptBodySchema>;

export const gradeResponseBodySchema = z.object({
  pointsAwarded: z.number().min(0),
  isCorrect: z.boolean().optional(),
  feedback: z.string().max(5_000).optional(),
});
export type GradeResponseBody = z.infer<typeof gradeResponseBodySchema>;

export const listAttemptsQuerySchema = z.object({
  assessmentId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  status: z.enum(["in_progress", "submitted", "graded", "expired", "paused"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAttemptsQuery = z.infer<typeof listAttemptsQuerySchema>;

export const listAssessmentsQuerySchema = z.object({
  classroomId: z.string().min(1).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  assessmentType: assessmentTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAssessmentsQuery = z.infer<typeof listAssessmentsQuerySchema>;
