/**
 * GET /api/marketplace/quizzes
 *
 * Lists published quizzes from the database.
 *
 * Route responsibilities (thin):
 *   1. Parse + validate query params (Zod).
 *   2. Call the marketplace service.
 *   3. Return the result.
 *
 * All business logic lives in `features/marketplace/marketplace.service.ts`.
 * All error handling is centralized in `lib/errors.ts` (withErrorHandler).
 *
 * Query params:
 *   ?category=mathematics  (optional — filters by category; 'all' = no filter)
 *   ?q=photosynthesis      (optional — search in title/description)
 *   ?limit=20              (optional — default 20, max 50)
 */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { listQuizzes, listMarketplaceQuizzesQuerySchema } from '@/features/marketplace'

export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url)
  const query = listMarketplaceQuizzesQuerySchema.parse({
    category: searchParams.get('category') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  const result = await listQuizzes({
    category: query.category,
    q: query.q,
    limit: query.limit,
  })

  return NextResponse.json(result)
})
