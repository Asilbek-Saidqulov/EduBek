import { logger } from '@/lib/logger'
import { notFound, badRequest, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { CREATOR_PAYOUT_REQUESTED, buildEvent } from '@/infra/event-bus/events'
import { db } from '@/lib/db'
import type { CreatorDashboardDto, CreatorEarningDto, CreatorPayoutDto } from './creator-economy.types'
const log = logger.child({ module: 'creator-economy-service' })

export async function getDashboard(ctx: AuthContext): Promise<CreatorDashboardDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const creator = await db.creator.findUnique({ where: { userId: ctx.userId } })
  const [sales, downloads, views, avgRating, withdrawn, pending, topRes, monthlyRaw] = await Promise.all([
    db.mpPurchase.count({ where: { creatorId: ctx.userId, status: 'completed' } }),
    db.mpListing.aggregate({ where: { creatorId: ctx.userId }, _sum: { downloadCount: true } }).then(r => r._sum.downloadCount ?? 0),
    db.mpListing.aggregate({ where: { creatorId: ctx.userId }, _sum: { viewCount: true } }).then(r => r._sum.viewCount ?? 0),
    db.mpListing.aggregate({ where: { creatorId: ctx.userId, status: 'published' }, _avg: { ratingAverage: true } }).then(r => r._avg.ratingAverage ?? 0),
    db.creatorPayout.aggregate({ where: { creatorId: ctx.userId, status: 'completed' }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0),
    db.creatorPayout.aggregate({ where: { creatorId: ctx.userId, status: { in: ['requested', 'processing'] } }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0),
    db.mpListing.findMany({ where: { creatorId: ctx.userId, status: 'published' }, select: { id: true, title: true, downloadCount: true }, orderBy: { downloadCount: 'desc' }, take: 5 }),
    db.creatorEarning.findMany({ where: { creatorId: ctx.userId, createdAt: { gte: new Date(Date.now() - 365 * 86400000) } }, select: { amount: true, createdAt: true } }),
  ])
  const monthly = monthlyRaw.reduce((acc: Record<string, number>, e) => { const m = e.createdAt.toISOString().slice(0, 7); acc[m] = (acc[m] ?? 0) + e.amount; return acc }, {})
  return { totalEarnings: creator?.totalEarnings ?? 0, pendingEarnings: pending, withdrawn, sales, downloads, views, conversionRate: views > 0 ? (sales / views) * 100 : 0, averageRating: avgRating, topResources: topRes.map(r => ({ id: r.id, title: r.title, earnings: 0, sales: r.downloadCount })), monthlyEarnings: Object.entries(monthly).map(([month, amount]) => ({ month, amount })) }
}

export async function getEarnings(ctx: AuthContext, limit = 20, offset = 0) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { entries, total } = { entries: await db.creatorEarning.findMany({ where: { creatorId: ctx.userId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), total: await db.creatorEarning.count({ where: { creatorId: ctx.userId } }) }
  return { entries: entries.map(e => ({ id: e.id, creatorId: e.creatorId, source: e.source, amount: e.amount, currency: e.currency, eduTokens: e.eduTokens, referenceId: e.referenceId, createdAt: e.createdAt.toISOString() })), total }
}

export async function getPayouts(ctx: AuthContext) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const payouts = await db.creatorPayout.findMany({ where: { creatorId: ctx.userId }, orderBy: { requestedAt: 'desc' } })
  return payouts.map(p => ({ id: p.id, creatorId: p.creatorId, amount: p.amount, currency: p.currency, status: p.status, requestedAt: p.requestedAt.toISOString(), processedAt: p.processedAt?.toISOString() ?? null, failureReason: p.failureReason }))
}

export async function requestPayout(ctx: AuthContext, amount: number) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const creator = await db.creator.findUnique({ where: { userId: ctx.userId } })
  if (!creator) throw notFound('Creator profile not found')
  const available = creator.totalEarnings - (await db.creatorPayout.aggregate({ where: { creatorId: ctx.userId, status: { in: ['requested', 'processing'] } }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0)) - (await db.creatorPayout.aggregate({ where: { creatorId: ctx.userId, status: 'completed' }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0))
  if (amount > available) throw badRequest('Insufficient available earnings')
  const payout = await db.creatorPayout.create({ data: { creatorId: ctx.userId, amount, currency: 'EDU' } })
  eventBus.publish(buildEvent({ type: CREATOR_PAYOUT_REQUESTED, actorId: ctx.userId, payoutId: payout.id, creatorId: ctx.userId, amount, occurredAt: new Date().toISOString() } as any))
  return { id: payout.id, creatorId: payout.creatorId, amount: payout.amount, currency: payout.currency, status: payout.status, requestedAt: payout.requestedAt.toISOString(), processedAt: null, failureReason: null }
}
