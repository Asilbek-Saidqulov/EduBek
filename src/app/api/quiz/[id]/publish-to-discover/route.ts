/**
 * POST /api/quiz/[id]/publish-to-discover — publish a quiz to Discover.
 *
 * MVP scope (Phase MVP-Discover-Policy):
 *   - AI-generated quizzes MAY be published to Discover for free.
 *   - The caller decides whether to publish (simple toggle, no moderation,
 *     no approval workflow, no ranking changes).
 *   - Once published the quiz becomes searchable in Discover and remains
 *     FREE — nobody can sell it. The Marketplace policy (separate) blocks
 *     AI-generated content from being listed for sale.
 *
 * Route responsibilities (thin):
 *   1. Parse + validate the path param + request body (Zod).
 *   2. Call the quiz service.
 *   3. Return the publication summary.
 */
import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import {
  publishQuizToDiscover,
  publishToDiscoverBodySchema,
  getQuizByIdParamsSchema,
} from '@/features/quiz'

type RouteContext = { params: Promise<{ id: string }> }

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext) => {
    const authCtx = await getAuthContext()
    const { id } = await ctx.params
    getQuizByIdParamsSchema.parse({ id })
    const body = publishToDiscoverBodySchema.parse(await req.json())
    const result = await publishQuizToDiscover(authCtx, id, body)
    return NextResponse.json(result, { status: 201 })
  },
)
