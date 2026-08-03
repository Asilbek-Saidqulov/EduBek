import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { REVIEW_CREATED, REVIEW_UPDATED, REVIEW_DELETED, WISHLIST_ADDED, WISHLIST_REMOVED, buildEvent } from '@/infra/event-bus/events'
import { db } from '@/lib/db'
import type { ReviewDto, WishlistDto, RecommendationDto } from './commerce.types'
import type { CreateReviewBody, UpdateReviewBody } from './commerce.schema'
const log = logger.child({ module: 'commerce-service' })

export async function createReview(ctx: AuthContext, input: CreateReviewBody): Promise<ReviewDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { findPurchaseById } = await import('@/features/purchase/purchase.repository')
  const purchase = await findPurchaseById(input.purchaseId)
  if (!purchase) throw notFound('Purchase not found')
  if (purchase.buyerId !== ctx.userId) throw forbidden('Can only review own purchases')
  if (purchase.status !== 'completed') throw badRequest('Can only review completed purchases')
  const existing = await db.mpReview.findUnique({ where: { purchaseId: input.purchaseId } })
  if (existing) throw badRequest('Already reviewed')
  const review = await db.mpReview.create({ data: { listingId: purchase.listingId, buyerId: ctx.userId, purchaseId: input.purchaseId, rating: input.rating, title: input.title, body: input.body } })
  const r = await db.mpReview.aggregate({ where: { listingId: purchase.listingId }, _avg: { rating: true }, _count: { rating: true } })
  await db.mpListing.update({ where: { id: purchase.listingId }, data: { ratingAverage: r._avg.rating ?? 0, ratingCount: r._count.rating } })
  eventBus.publish(buildEvent({ type: REVIEW_CREATED, actorId: ctx.userId, reviewId: review.id, listingId: purchase.listingId, buyerId: ctx.userId, rating: input.rating, occurredAt: new Date().toISOString() } as any))
  return { id: review.id, listingId: review.listingId, buyerId: review.buyerId, purchaseId: review.purchaseId, rating: review.rating, title: review.title, body: review.body, createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString() }
}

export async function getReviews(listingId: string, limit = 20, offset = 0) {
  const [reviews, total] = await Promise.all([db.mpReview.findMany({ where: { listingId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), db.mpReview.count({ where: { listingId } })])
  return { reviews: reviews.map(r => ({ id: r.id, listingId: r.listingId, buyerId: r.buyerId, purchaseId: r.purchaseId, rating: r.rating, title: r.title, body: r.body, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })), total }
}

export async function addToWishlist(ctx: AuthContext, listingId: string) { if (!ctx.userId) throw unauthorized('Authentication required'); await db.mpWishlist.create({ data: { userId: ctx.userId, listingId } }).catch(() => {}); eventBus.publish(buildEvent({ type: WISHLIST_ADDED, actorId: ctx.userId, listingId, userId: ctx.userId, occurredAt: new Date().toISOString() } as any)) }
export async function removeFromWishlist(ctx: AuthContext, listingId: string) { if (!ctx.userId) throw unauthorized('Authentication required'); await db.mpWishlist.deleteMany({ where: { userId: ctx.userId, listingId } }); eventBus.publish(buildEvent({ type: WISHLIST_REMOVED, actorId: ctx.userId, listingId, userId: ctx.userId, occurredAt: new Date().toISOString() } as any)) }
export async function getWishlist(ctx: AuthContext) { if (!ctx.userId) throw unauthorized('Authentication required'); const items = await db.mpWishlist.findMany({ where: { userId: ctx.userId }, orderBy: { createdAt: 'desc' } }); return items.map(i => ({ id: i.id, userId: i.userId, listingId: i.listingId, createdAt: i.createdAt.toISOString() })) }

export async function getRecommendations(ctx: AuthContext, limit = 10): Promise<RecommendationDto[]> {
  if (!ctx.userId) return []
  const purchases = await db.mpPurchase.findMany({ where: { buyerId: ctx.userId }, include: { listing: { include: { resource: { select: { resourceType: true, subject: true } } } } }, take: 20 })
  const purchasedIds = purchases.map(p => p.listingId)
  const types = [...new Set(purchases.map(p => p.listing?.resource?.resourceType).filter(Boolean))] as string[]
  const where: Record<string, unknown> = { status: 'published', id: { notIn: purchasedIds } }
  if (types.length > 0) where.resource = { resourceType: { in: types } }
  const listings = await db.mpListing.findMany({ where, include: { resource: { select: { resourceType: true, subject: true } } }, orderBy: [{ viewCount: 'desc' }, { favoriteCount: 'desc' }], take: limit })
  return listings.map(l => ({ listingId: l.id, title: l.title, reason: `Similar to your purchases`, score: l.viewCount }))
}
