import { db } from '@/lib/db'
export async function findCreator(userId: string) { return db.creator.findUnique({ where: { userId } }) }
export async function findEarnings(creatorId: string, limit = 20, offset = 0) { const [e, t] = await Promise.all([db.creatorEarning.findMany({ where: { creatorId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), db.creatorEarning.count({ where: { creatorId } })]); return { entries: e, total: t } }
export async function findPayouts(creatorId: string) { return db.creatorPayout.findMany({ where: { creatorId }, orderBy: { requestedAt: 'desc' } }) }
export async function findTopResources(creatorId: string, limit = 5) { return db.mpListing.findMany({ where: { creatorId, status: 'published' }, select: { id: true, title: true, downloadCount: true, favoriteCount: true, viewCount: true }, orderBy: { downloadCount: 'desc' }, take: limit }) }
export async function findMonthlyEarnings(creatorId: string) { return db.creatorEarning.findMany({ where: { creatorId, createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } }, select: { amount: true, createdAt: true } }) }
export async function createPayout(data: { creatorId: string; amount: number; currency: string }) { return db.creatorPayout.create({ data }) }
export async function countSales(creatorId: string) { return db.mpPurchase.count({ where: { creatorId, status: 'completed' } }) }
export async function countDownloads(creatorId: string) { const r = await db.mpListing.aggregate({ where: { creatorId }, _sum: { downloadCount: true } }); return r._sum.downloadCount ?? 0 }
export async function countViews(creatorId: string) { const r = await db.mpListing.aggregate({ where: { creatorId }, _sum: { viewCount: true } }); return r._sum.viewCount ?? 0 }
export async function getAverageRating(creatorId: string) { const r = await db.mpListing.aggregate({ where: { creatorId, status: 'published' }, _avg: { ratingAverage: true } }); return r._avg.ratingAverage ?? 0 }
export async function sumWithdrawn(creatorId: string) { const r = await db.creatorPayout.aggregate({ where: { creatorId, status: 'completed' }, _sum: { amount: true } }); return r._sum.amount ?? 0 }
export async function sumPendingEarnings(creatorId: string) { const r = await db.creatorPayout.aggregate({ where: { creatorId, status: { in: ['requested', 'processing'] } }, _sum: { amount: true } }); return r._sum.amount ?? 0 }
