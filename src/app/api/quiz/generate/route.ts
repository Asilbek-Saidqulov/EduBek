/**
 * POST /api/quiz/generate
 *
 * Generates a quiz from a topic using AI.
 *
 * Route responsibilities (thin):
 *   1. Parse + validate the request body (Zod).
 *   2. Call the AI service.
 *   3. Return the result.
 *
 * All business logic lives in `features/ai/ai.service.ts`.
 * All error handling is centralized in `lib/errors.ts` (withErrorHandler).
 */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { generateQuiz, generateQuizBodySchema } from '@/features/ai'

export const POST = withErrorHandler(async (req) => {
  const body = await req.json()
  const input = generateQuizBodySchema.parse(body)
  const result = await generateQuiz(input)
  return NextResponse.json(result)
})
