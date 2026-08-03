/**
 * EduBek — Question Bank Zod schemas.
 *
 * Per-type payload validation. The service calls `parsePayloadForType` to
 * dispatch to the correct schema; the route handler only validates the
 * outer envelope.
 */
import { z } from "zod";

export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "short_answer",
  "essay",
  "matching",
  "ordering",
  "fill_blank",
] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionTypeString = (typeof QUESTION_TYPES)[number];

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

// ---------------------------------------------------------------------------
// Per-type payload schemas
// ---------------------------------------------------------------------------

export const multipleChoicePayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
}).refine((v) => v.correctIndex < v.options.length, {
  message: "correctIndex out of range",
  path: ["correctIndex"],
});

export const multipleSelectPayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10),
  correctIndices: z.array(z.number().int().min(0)).min(1).max(10),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
}).refine(
  (v) => v.correctIndices.every((i) => i < v.options.length),
  { message: "correctIndices out of range", path: ["correctIndices"] },
);

export const trueFalsePayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  correct: z.boolean(),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const shortAnswerPayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  acceptableAnswers: z.array(z.string().min(1).max(500)).min(1).max(20),
  maxLength: z.number().int().min(1).max(5_000).optional(),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const essayPayloadSchema = z.object({
  prompt: z.string().min(1).max(20_000),
  minWords: z.number().int().min(0).max(10_000).optional(),
  maxWords: z.number().int().min(1).max(50_000).optional(),
  rubricId: z.string().min(1).optional(),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const matchingPayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  pairs: z.array(
    z.object({ left: z.string().min(1).max(500), right: z.string().min(1).max(500) }),
  ).min(2).max(20),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const orderingPayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  items: z.array(z.string().min(1).max(500)).min(2).max(20),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const fillBlankPayloadSchema = z.object({
  prompt: z.string().min(1).max(5_000),
  blanks: z.array(z.string().min(1).max(500)).min(1).max(20),
  explanation: z.string().max(5_000).optional(),
  hint: z.string().max(1_000).optional(),
});

export const payloadSchemaByType: Record<
  QuestionTypeString,
  z.ZodTypeAny
> = {
  multiple_choice: multipleChoicePayloadSchema,
  multiple_select: multipleSelectPayloadSchema,
  true_false: trueFalsePayloadSchema,
  short_answer: shortAnswerPayloadSchema,
  essay: essayPayloadSchema,
  matching: matchingPayloadSchema,
  ordering: orderingPayloadSchema,
  fill_blank: fillBlankPayloadSchema,
};

export function parsePayloadForType(
  questionType: QuestionTypeString,
  raw: unknown,
): unknown {
  const schema = payloadSchemaByType[questionType];
  return schema.parse(raw);
}

// ---------------------------------------------------------------------------
// Envelope schemas (route handlers)
// ---------------------------------------------------------------------------

export const createQuestionBodySchema = z.object({
  questionType: questionTypeSchema,
  payload: z.record(z.string(), z.unknown()),
  subject: z.string().max(120).optional(),
  grade: z.string().max(120).optional(),
  difficulty: difficultySchema.default("medium"),
  topic: z.string().max(200).optional(),
  estimatedTime: z.number().int().min(0).max(3_600).optional(),
  learningObjective: z.string().max(500).optional(),
  points: z.number().int().min(0).max(100).default(1),
  orgId: z.string().min(1).optional(),
  aiGeneratedFrom: z.string().min(1).optional(),
});
export type CreateQuestionBody = z.infer<typeof createQuestionBodySchema>;

export const updateQuestionBodySchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  subject: z.string().max(120).nullable().optional(),
  grade: z.string().max(120).nullable().optional(),
  difficulty: difficultySchema.optional(),
  topic: z.string().max(200).nullable().optional(),
  estimatedTime: z.number().int().min(0).max(3_600).nullable().optional(),
  learningObjective: z.string().max(500).nullable().optional(),
  points: z.number().int().min(0).max(100).optional(),
  changelog: z.string().max(1_000).optional(),
});
export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>;

export const searchQuestionsQuerySchema = z.object({
  query: z.string().max(500).optional(),
  questionType: questionTypeSchema.optional(),
  subject: z.string().max(120).optional(),
  difficulty: difficultySchema.optional(),
  topic: z.string().max(200).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SearchQuestionsQuery = z.infer<typeof searchQuestionsQuerySchema>;

export const importQuestionsBodySchema = z.object({
  questions: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
  orgId: z.string().min(1).optional(),
});
export type ImportQuestionsBody = z.infer<typeof importQuestionsBodySchema>;
