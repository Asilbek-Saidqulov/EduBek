/**
 * POST /api/quiz — create a quiz with optional per-question images.
 *
 * MVP scope (Phase MVP-Quiz-Image):
 *   - Each question may carry an optional single image (`media.imageUrl`).
 *   - The `isAiGenerated` flag is set from the request body so AI-origin
 *     quizzes can be tagged at creation (used later by the Marketplace
 *     policy to block AI content from being sold).
 *
 * Route responsibilities (thin):
 *   1. Parse + validate the request body (Zod).
 *   2. Call the quiz service.
 *   3. Return the created quiz DTO (201).
 */
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { createQuiz, createQuizBodySchema } from '@/features/quiz'

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext()
  const body = createQuizBodySchema.parse(await req.json())
  const quiz = await createQuiz(ctx, body)
  return NextResponse.json(quiz, { status: 201 })
})
