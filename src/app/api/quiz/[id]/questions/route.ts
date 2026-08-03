/**
 * POST /api/quiz/[id]/questions — append a single question to a quiz.
 *
 * MVP scope (Phase MVP-Quiz-Image):
 *   - The question may carry an optional single image (`media.imageUrl`).
 *
 * Route responsibilities (thin):
 *   1. Parse + validate the path param + request body (Zod).
 *   2. Call the quiz service.
 *   3. Return the created question DTO (201).
 */
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { addQuestion, addQuestionBodySchema, getQuizByIdParamsSchema } from '@/features/quiz'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext) => {
    const authCtx = await getAuthContext()
    const { id } = await ctx.params
    getQuizByIdParamsSchema.parse({ id })
    const body = addQuestionBodySchema.parse(await req.json())
    const question = await addQuestion(authCtx, id, body)
    return NextResponse.json(question, { status: 201 })
  },
)
