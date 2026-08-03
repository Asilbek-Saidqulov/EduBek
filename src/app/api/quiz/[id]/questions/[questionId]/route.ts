/**
 * PATCH /api/quiz/[id]/questions/[questionId] — patch a single question.
 *
 * MVP scope (Phase MVP-Quiz-Image):
 *   - Supports updating the optional single image (`media.imageUrl`).
 *   - Pass `media: null` to remove the image.
 *
 * Route responsibilities (thin):
 *   1. Parse + validate the path params + request body (Zod).
 *   2. Call the quiz service.
 *   3. Return the updated question DTO.
 */
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import {
  patchQuestion,
  updateQuestionBodySchema,
  getQuizByIdParamsSchema,
} from '@/features/quiz'
import { z } from 'zod'

const pathParamsSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
})

type RouteContext = { params: Promise<{ id: string; questionId: string }> }

export const PATCH = withErrorHandler<{ id: string; questionId: string }>(
  async (req, ctx: RouteContext) => {
    const authCtx = await getAuthContext()
    const { id, questionId } = await ctx.params
    pathParamsSchema.parse({ id, questionId })
    getQuizByIdParamsSchema.parse({ id })
    const body = updateQuestionBodySchema.parse(await req.json())
    const question = await patchQuestion(authCtx, id, questionId, body)
    return NextResponse.json(question)
  },
)
