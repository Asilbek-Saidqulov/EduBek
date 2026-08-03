/**
 * Marketplace feature — business logic layer (service).
 *
 * The public API of the marketplace feature. API routes and Server
 * Components call these functions; they never touch the repository or
 * Prisma directly.
 */

import { avatarInitials } from '@/lib/utils'
import { logger } from '@/lib/logger'
import type { QuizCreatorDto } from '@/features/quiz/quiz.types'
import type {
  MarketplaceQuizDto,
  MarketplaceListResult,
} from './marketplace.types'
import type { ListMarketplaceQuizzesInput } from './marketplace.schema'
import {
  findPublishedQuizzes,
  findActiveListingsForQuizzes,
} from './marketplace.repository'

const log = logger.child({ module: 'marketplace-service' })

// ----------------------------------------------------------------------------
// Mapper: Prisma model + listing → DTO
// ----------------------------------------------------------------------------

function mapCreator(
  teacher: {
    id: string
    name: string | null
    username: string | null
    creatorProfile: { displayName: string | null; verificationStatus: string } | null
  },
): QuizCreatorDto {
  const displayName = teacher.creatorProfile?.displayName || teacher.name || '?'
  return {
    id: teacher.id,
    name: displayName,
    username: teacher.username,
    verificationStatus: teacher.creatorProfile?.verificationStatus || 'unverified',
    avatarInitials: avatarInitials(displayName),
  }
}

function mapQuiz(
  quiz: {
    id: string
    title: string
    description: string | null
    category: string
    difficulty: string
    language: string
    isFeatured: boolean
    publishedAt: Date | null
    teacher: {
      id: string
      name: string | null
      username: string | null
      creatorProfile: { displayName: string | null; verificationStatus: string } | null
    }
    questions: { id: string }[]
  },
  listing: { priceEduTokens: number; priceFiat: number; tier: string } | undefined,
): MarketplaceQuizDto {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    language: quiz.language,
    questionCount: quiz.questions.length,
    isFeatured: quiz.isFeatured,
    publishedAt: quiz.publishedAt?.toISOString() ?? null,
    priceEduTokens: listing?.priceEduTokens ?? 0,
    priceFiat: listing?.priceFiat ?? 0,
    tier: listing?.tier ?? 'free',
    creator: mapCreator(quiz.teacher),
  }
}

// ----------------------------------------------------------------------------
// Public service functions
// ----------------------------------------------------------------------------

/**
 * List published marketplace quizzes, optionally filtered by category and
 * search text. Used by:
 *   - GET /api/marketplace/quizzes (API route)
 *   - page.tsx (Server Component SSR — same data, no self-fetch round-trip)
 *
 * This is the single source of truth for marketplace quiz listings —
 * previously the same Prisma query + mapping logic was duplicated between
 * the API route and page.tsx.
 */
export async function listQuizzes(
  input: ListMarketplaceQuizzesInput,
): Promise<MarketplaceListResult> {
  log.info('listQuizzes', {
    category: input.category,
    hasQuery: !!input.q,
    limit: input.limit,
  })

  const quizzes = await findPublishedQuizzes(input)
  const quizIds = quizzes.map((q) => q.id)
  const listingByContentId = await findActiveListingsForQuizzes(quizIds)

  const dtos = quizzes.map((quiz) =>
    mapQuiz(quiz, listingByContentId.get(quiz.id)),
  )

  return { quizzes: dtos, total: dtos.length }
}
