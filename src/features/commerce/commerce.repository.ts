import { db } from '@/lib/db'
export async function createReview(data: { listingId: string; buyerId: string; purchaseId: string; rating: number; title?: string; body?: string }) { return db.mpReview.create({ data }) }
export async function findReviewById(id: string) { return db.mpReview.findUnique({ where: { id } }) }
export async function findReviewByPurchase(purchaseId: string) { return db.mpReview.findUnique({ where: { purchaseId } }) }
export async function findReviewsByListing(listingId: string, limit = 20, offset = 0) { const [r, t] = await Promise.all([db.mpReview.findMany({ where: { listingId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), db.mpReview.count({ where: { listingId } })]); return { reviews: r, total: t } }
export async function updateReview(id: string, data: { rating?: number; title?: string | null; body?: string | null }) { return db.mpReview.update({ where: { id }, data }) }
export async function deleteReview(id: string) { return db.mpReview.delete({ where: { id } }) }
export async function recalculateListingRating(listingId: string) { const r = await db.mpReview.aggregate({ where: { listingId }, _avg: { rating: true }, _count: { rating: true } }); await db.mpListing.update({ where: { id: listingId }, data: { ratingAverage: r._avg.rating ?? 0, ratingCount: r._count.rating } }) }
export async function createWishlistItem(userId: string, listingId: string) { return db.mpWishlist.create({ data: { userId, listingId } }).catch(() => null) }
export async function deleteWishlistItem(userId: string, listingId: string) { return db.mpWishlist.deleteMany({ where: { userId, listingId } }) }
export async function findWishlistByUser(userId: string) { return db.mpWishlist.findMany({ where: { userId }, include: { listing: { select: { id: true, title: true, price: true, thumbnailUrl: true } } }, orderBy: { createdAt: 'desc' } }) }
