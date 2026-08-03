/**
 * GET /api/quiz/[id]
 *
 * Fetches a single quiz with all its questions.
 *
 * Route responsibilities (thin):
 *   1. Await + parse the path param (Next.js 16 params are async).
 *   2. Call the quiz service.
 *   3. Return the result.
 *
 * All business logic lives in `features/quiz/quiz.service.ts`.
 * All error handling is centralized in `lib/errors.ts` (withErrorHandler).
 *
 * NOTE: This is a public preview endpoint — `correctIndex` is included so
 * the client can grade answers. In the full platform, answer keys for paid
 * quizzes would be gated behind a purchase check.
 */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getQuizById, getQuizByIdParamsSchema } from '@/features/quiz'

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = getQuizByIdParamsSchema.parse(await ctx.params)
  const quiz = await getQuizById(id)
  return NextResponse.json(quiz)
})
