/**
 * POST /api/quiz/generate
 *
 * Generates a quiz from a topic using AI.
 *
 * SECURITY:
 *   - Authentication required — anonymous access would let attackers run
 *     unlimited LLM calls at the platform's expense (cost DoS).
 *   - Per-user rate limit: 10 generations per minute.
 *
 * Route responsibilities (thin):
 *   1. Authenticate the caller (getAuthContext + requireAuth).
 *   2. Rate-limit per user.
 *   3. Parse + validate the request body (Zod).
 *   4. Call the AI service.
 *   5. Return the result.
 */

import { NextResponse } from 'next/server'
import { withErrorHandler, tooManyRequests } from '@/lib/errors'
import { generateQuiz, generateQuizBodySchema } from '@/features/ai'
import { getAuthContext, requireAuth } from '@/features/auth'
import { createRateLimiter } from '@/infra/rate-limiter'

// 10 AI quiz generations per user per minute.
const aiGenerateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  prefix: 'ai-quiz-generate',
})

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext()
  requireAuth(ctx)

  // Per-user rate limit (keyed on userId, not IP — authenticated only).
  const rl = aiGenerateLimiter.check(ctx.userId!)
  if (!rl.allowed) {
    throw tooManyRequests('AI generation rate limit exceeded. Please slow down.')
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    )
  }
  const input = generateQuizBodySchema.parse(body)
  const result = await generateQuiz(input)
  return NextResponse.json(result)
})
