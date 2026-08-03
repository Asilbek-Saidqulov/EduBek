/**
 * Quiz feature — Zod validation schemas.
 *
 * These schemas validate ALL inputs to the quiz service. The API route
 * parses the input with these schemas before calling the service, so the
 * service can trust its inputs are well-formed.
 *
 * Benefits over manual `if` checks:
 *   - Field-level error messages
 *   - Type narrowing (parsed output is typed, not `any`)
 *   - Composable (reuse partial schemas in larger schemas)
 *   - Single source of truth for validation rules
 */

import { z } from 'zod'

// ----------------------------------------------------------------------------
// GET /api/quiz/[id] — path param
// ----------------------------------------------------------------------------

export const getQuizByIdParamsSchema = z.object({
  id: z.string().min(1, 'Quiz ID is required'),
})

export type GetQuizByIdParams = z.infer<typeof getQuizByIdParamsSchema>

// ----------------------------------------------------------------------------
// Input types for the service (framework-agnostic — no Next.js types)
// ----------------------------------------------------------------------------

export interface GetQuizByIdInput {
  id: string
}

// ----------------------------------------------------------------------------
// POST /api/quiz — create a quiz with optional questions
// ----------------------------------------------------------------------------
//
// MVP scope (Phase MVP-Quiz-Image):
//   - Each question may carry an optional `media.imageUrl` (single image).
//   - When `media` is absent the question is text-only — exactly like before.
//   - Only image media is supported. The schema is structured so future
//     media kinds can be added without breaking existing callers.

export const quizQuestionMediaSchema = z.object({
  /** Image URL or internal storage path. Must be a non-empty string. */
  imageUrl: z.string().min(1).max(2_000),
  /** Optional alt text for accessibility. */
  alt: z.string().max(500).nullable().optional(),
})

export const createQuizQuestionSchema = z.object({
  question: z.string().min(1).max(5_000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(5_000).nullable().optional(),
  /** Optional single image attachment. */
  media: quizQuestionMediaSchema.nullable().optional(),
})

export const createQuizBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2_000).nullable().optional(),
  category: z.string().max(120).default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  language: z.string().min(2).max(10).default('en'),
  orgId: z.string().min(1).nullable().optional(),
  /** Whether this quiz was produced by the AI Quiz Generator. Defaults to false. */
  isAiGenerated: z.boolean().default(false),
  /** Optional AI prompt/session identifier when `isAiGenerated` is true. */
  aiPromptId: z.string().min(1).nullable().optional(),
  questions: z.array(createQuizQuestionSchema).min(1).max(100),
})

export type CreateQuizBody = z.infer<typeof createQuizBodySchema>
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>

// ----------------------------------------------------------------------------
// POST /api/quiz/[id]/questions — add a single question to an existing quiz
// ----------------------------------------------------------------------------

export const addQuestionBodySchema = createQuizQuestionSchema

export type AddQuestionBody = z.infer<typeof addQuestionBodySchema>

// ----------------------------------------------------------------------------
// PATCH /api/quiz/[id]/questions/[questionId] — update a single question
// ----------------------------------------------------------------------------

export const updateQuestionBodySchema = z.object({
  question: z.string().min(1).max(5_000).optional(),
  options: z.array(z.string().min(1).max(500)).length(4).optional(),
  correctIndex: z.number().int().min(0).max(3).optional(),
  explanation: z.string().max(5_000).nullable().optional(),
  /** Optional single image attachment. Pass `null` to remove the image. */
  media: quizQuestionMediaSchema.nullable().optional(),
})

export type UpdateQuestionBody = z.infer<typeof updateQuestionBodySchema>

// ----------------------------------------------------------------------------
// POST /api/quiz/[id]/publish-to-discover — publish a (typically AI-generated)
// quiz to the Discover feed as FREE content. No moderation, no approval.
// ----------------------------------------------------------------------------

export const publishToDiscoverBodySchema = z.object({
  /**
   * Caller-declared AI origin flag. When true, the resulting Resource is
   * tagged with `metadata.isAiGenerated = true` so the Marketplace policy
   * can later block it from being sold.
   */
  isAiGenerated: z.boolean().default(false),
  /** Optional AI prompt/session identifier. */
  aiPromptId: z.string().min(1).nullable().optional(),
})

export type PublishToDiscoverBody = z.infer<typeof publishToDiscoverBodySchema>
