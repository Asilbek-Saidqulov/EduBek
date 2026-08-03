/**
 * Marketplace feature — data access layer (repository).
 *
 * The ONLY module that touches Prisma for marketplace queries.
 *
 * Note: The `Quiz` model doesn't have a direct relation to `MarketplaceListing`
 * (the listing points to the quiz via `contentId`, a polymorphic FK). The
 * repository handles this two-step fetch internally so the service doesn't
 * have to know about the schema shape.
 */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'marketplace-repository' })

/** Raw quiz row with the relations needed for marketplace display. */
export type RawMarketplaceQuiz = Awaited<ReturnType<typeof findPublishedQuizzes>>[number]

/**
 * Find published quizzes, optionally filtered by category and/or search text.
 * Returns quizzes with their teacher (creator) and question count.
 *
 * Marketplace listing data (price, tier) is fetched separately via
 * `findActiveListingsForQuizzes` because Quiz↔MarketplaceListing is a
 * polymorphic relationship (no direct Prisma relation).
 */
export async function findPublishedQuizzes(opts: {
  category?: string
  q?: string
  limit: number
}) {
  log.debug('findPublishedQuizzes', opts)

  const where: Record<string, unknown> = { isPublished: true }
  if (opts.category && opts.category !== 'all') {
    where.category = opts.category
  }
  if (opts.q && opts.q.trim().length > 0) {
    where.OR = [
      { title: { contains: opts.q.trim() } },
      { description: { contains: opts.q.trim() } },
    ]
  }

  return db.quiz.findMany({
    where,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          username: true,
          creatorProfile: {
            select: { displayName: true, verificationStatus: true },
          },
        },
      },
      questions: { select: { id: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    take: opts.limit,
  })
}

/**
 * Find active marketplace listings for a set of quiz IDs.
 * Returns a map from contentId (quiz.id) → listing data.
 */
export async function findActiveListingsForQuizzes(quizIds: string[]) {
  if (quizIds.length === 0) return new Map<string, { priceEduTokens: number; priceFiat: number; tier: string }>()

  log.debug('findActiveListingsForQuizzes', { count: quizIds.length })
  const listings = await db.marketplaceListing.findMany({
    where: {
      contentType: 'quiz',
      contentId: { in: quizIds },
      status: 'active',
    },
    select: { contentId: true, priceEduTokens: true, priceFiat: true, tier: true },
  })
  return new Map(listings.map((l) => [l.contentId, l]))
}
