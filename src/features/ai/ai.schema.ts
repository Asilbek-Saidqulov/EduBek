/**
 * AI feature — Zod validation schemas.
 */

import { z } from 'zod'

// ----------------------------------------------------------------------------
// POST /api/quiz/generate — request body
// ----------------------------------------------------------------------------

export const generateQuizBodySchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, 'Topic must be at least 3 characters')
    .max(200, 'Topic must be at most 200 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.coerce.number().int().min(3).max(10).default(5),
})

export type GenerateQuizBody = z.infer<typeof generateQuizBodySchema>

// ----------------------------------------------------------------------------
// Service input (framework-agnostic — same shape as the parsed body)
// ----------------------------------------------------------------------------

export interface GenerateQuizInput {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  count: number
}
