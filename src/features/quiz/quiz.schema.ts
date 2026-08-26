import { z } from "zod";

export const questionTypeEnum = z.enum([
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
]);

export const difficultyEnum = z.enum(["easy", "medium", "hard", "expert"]);
export const quizModeEnum = z.enum(["classic", "survival"]);

export const questionInputSchema = z.object({
  type: questionTypeEnum.default("multiple_choice"),
  question: z.string().trim().min(3, "Question text must be at least 3 characters").max(1000),
  options: z.array(z.string().trim().min(1, "Option cannot be empty")).min(2, "At least 2 options are required").max(8),
  correctIndex: z.number().int().min(0, "Correct option index must be non-negative"),
  explanation: z.string().trim().max(1000).optional().nullable(),
  difficulty: difficultyEnum.default("medium"),
  points: z.number().int().min(1, "Points must be at least 1").max(100).default(1),
  tags: z.array(z.string().trim()).optional().default([]),
  orderNum: z.number().int().min(0).default(0),
  mediaUrl: z.string().url().optional().nullable(),
});

export const updateQuestionInputSchema = questionInputSchema.partial();

export const createQuizSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(1).max(50).default("general"),
  difficulty: difficultyEnum.default("medium"),
  mode: quizModeEnum.default("classic"),
  language: z.string().min(2).max(10).default("uz"),
  questions: z.array(questionInputSchema).optional().default([]),
});

export const updateQuizSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(1).max(50).optional(),
  difficulty: difficultyEnum.optional(),
  mode: quizModeEnum.optional(),
  language: z.string().min(2).max(10).optional(),
});

export const listQuizzesQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: difficultyEnum.optional(),
  search: z.string().optional(),
  mine: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const submitAnswerItemSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  selectedIndex: z.number().int().min(0).nullable().optional(),
  textAnswer: z.string().trim().max(1000).optional().nullable(),
  timeTakenMs: z.number().int().min(0).optional(),
});

export const submitAttemptSchema = z.object({
  answers: z.array(submitAnswerItemSchema).min(1, "At least one answer must be submitted"),
  timeSpentMs: z.number().int().min(0).optional().default(0),
});

export type QuestionInput = z.infer<typeof questionInputSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type ListQuizzesQuery = z.infer<typeof listQuizzesQuerySchema>;
export type SubmitAnswerItem = z.infer<typeof submitAnswerItemSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
