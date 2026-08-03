import { logger } from '@/lib/logger'
import { badRequest, notFound, forbidden, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { PURCHASE_STARTED, PURCHASE_COMPLETED, PURCHASE_FAILED, PURCHASE_REFUNDED, CREATOR_EARNING_CREATED, buildEvent } from '@/infra/event-bus/events'
import { PLATFORM_CONFIG } from '@/config/platform'
import { calculatePriceBreakdown, calculateRefund } from '@/features/billing'
import { credit as walletCredit, debit as walletDebit, hasBalance } from '@/features/wallet'
import { db } from '@/lib/db'
import type { PurchaseDto, PurchaseResultDto } from './purchase.types'
import * as repo from './purchase.repository'
const log = logger.child({ module: 'purchase-service' })

function mapPurchase(p: any): PurchaseDto { return { id: p.id, buyerId: p.buyerId, listingId: p.listingId, creatorId: p.creatorId, resourceId: p.resourceId, pricePaid: p.pricePaid, platformFee: p.platformFee, creatorEarning: p.creatorEarning, status: p.status, refundableUntil: p.refundableUntil?.toISOString() ?? null, refundedAt: p.refundedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() } }

export async function purchase(ctx: AuthContext, listingId: string): Promise<PurchaseResultDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { findListingById } = await import('@/features/marketplace/mp.repository')
  const listing = await findListingById(listingId)
  if (!listing) throw notFound('Listing not found')
  if (listing.status !== 'published') throw badRequest('Not available')
  if (listing.creatorId === ctx.userId) throw badRequest('Cannot purchase own listing')
  const existing = await repo.findPurchaseByBuyerAndListing(ctx.userId, listingId)
  if (existing && !PLATFORM_CONFIG.ALLOW_DUPLICATE_PURCHASES) { const full = await repo.findPurchaseById(existing.id); return { ...mapPurchase(full), resourceTitle: full?.resource?.title ?? '', resourceType: full?.resource?.resourceType ?? '', message: 'You already own this resource.' } }
  const price = listing.price
  const breakdown = calculatePriceBreakdown(price)
  eventBus.publish(buildEvent({ type: PURCHASE_STARTED, actorId: ctx.userId, listingId, buyerId: ctx.userId, price, occurredAt: new Date().toISOString() } as any))
  if (price > 0 && !(await hasBalance(ctx.userId, price))) { eventBus.publish(buildEvent({ type: PURCHASE_FAILED, actorId: ctx.userId, listingId, buyerId: ctx.userId, error: 'Insufficient balance', occurredAt: new Date().toISOString() } as any)); throw badRequest('Insufficient balance') }
  const { duplicateResource } = await import('@/features/resource/resource.service')
  const duplicated = await duplicateResource(ctx, listing.resourceId, {})
  try {
    if (price > 0) await walletDebit(ctx.userId, price, 'marketplace_purchase', 'mp_listing', listingId)
    if (breakdown.creatorEarning > 0) await walletCredit(listing.creatorId, breakdown.creatorEarning, 'marketplace_sale', 'mp_listing', listingId)
    if (breakdown.platformFee > 0) await walletCredit(PLATFORM_CONFIG.PLATFORM_WALLET_USER_ID, breakdown.platformFee, 'platform_fee', 'mp_listing', listingId)
    const refundableUntil = new Date(Date.now() + PLATFORM_CONFIG.REFUND_WINDOW_DAYS * 86400000)
    const purchaseRec = await repo.createPurchase({ buyerId: ctx.userId, listingId, creatorId: listing.creatorId, resourceId: duplicated.id, pricePaid: price, platformFee: breakdown.platformFee, creatorEarning: breakdown.creatorEarning, refundableUntil })
    await db.creatorEarning.create({ data: { creatorId: listing.creatorId, source: 'sale', amount: breakdown.creatorEarning, currency: 'EDU', eduTokens: breakdown.creatorEarning, referenceId: purchaseRec.id } }).catch(() => {})
    await repo.incrementListingDownloadCount(listingId)
    await db.creator.update({ where: { userId: listing.creatorId }, data: { totalEarnings: { increment: breakdown.creatorEarning } } }).catch(() => {})
    eventBus.publish(buildEvent({ type: PURCHASE_COMPLETED, actorId: ctx.userId, purchaseId: purchaseRec.id, listingId, buyerId: ctx.userId, creatorId: listing.creatorId, resourceId: duplicated.id, pricePaid: price, platformFee: breakdown.platformFee, creatorEarning: breakdown.creatorEarning, occurredAt: new Date().toISOString() } as any))
    eventBus.publish(buildEvent({ type: CREATOR_EARNING_CREATED, actorId: ctx.userId, earningId: purchaseRec.id, creatorId: listing.creatorId, amount: breakdown.creatorEarning, source: 'sale', occurredAt: new Date().toISOString() } as any))
    return { ...mapPurchase(purchaseRec), resourceTitle: duplicated.title, resourceType: duplicated.resourceType, message: `Purchase successful! "${duplicated.title}" added to your library.` }
  } catch (err) { eventBus.publish(buildEvent({ type: PURCHASE_FAILED, actorId: ctx.userId, listingId, buyerId: ctx.userId, error: (err as Error).message, occurredAt: new Date().toISOString() } as any)); throw err }
}

export async function hasPurchased(ctx: AuthContext, listingId: string) { if (!ctx.userId) return { purchased: false }; const p = await repo.findPurchaseByBuyerAndListing(ctx.userId, listingId); return { purchased: !!p, purchaseId: p?.id } }
export async function listPurchases(ctx: AuthContext, limit = 20, offset = 0) { if (!ctx.userId) throw unauthorized('Authentication required'); const { purchases, total } = await repo.findPurchasesByBuyer(ctx.userId, limit, offset); return { purchases: purchases.map(mapPurchase), total } }
export async function getPurchase(ctx: AuthContext, id: string) { if (!ctx.userId) throw unauthorized('Authentication required'); const p = await repo.findPurchaseById(id); if (!p) throw notFound('Purchase not found'); if (p.buyerId !== ctx.userId && !ctx.isSuperadmin) throw forbidden('Can only view own purchases'); return mapPurchase(p) }

export async function refundPurchase(ctx: AuthContext, purchaseId: string): Promise<PurchaseDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const p = await repo.findPurchaseById(purchaseId); if (!p) throw notFound('Purchase not found')
  if (p.buyerId !== ctx.userId && !ctx.isSuperadmin) throw forbidden('Can only refund own purchases')
  if (p.status === 'refunded') throw badRequest('Already refunded')
  const refundAmount = calculateRefund(p.pricePaid)
  if (refundAmount > 0) { await walletCredit(ctx.userId, refundAmount, 'refund', 'mp_purchase', purchaseId); if (p.creatorEarning > 0) await walletDebit(p.creatorId, p.creatorEarning, 'refund', 'mp_purchase', purchaseId); if (p.platformFee > 0) await walletDebit(PLATFORM_CONFIG.PLATFORM_WALLET_USER_ID, p.platformFee, 'refund', 'mp_purchase', purchaseId) }
  await repo.updatePurchaseStatus(purchaseId, 'refunded', new Date())
  await db.creator.update({ where: { userId: p.creatorId }, data: { totalEarnings: { decrement: p.creatorEarning } } }).catch(() => {})
  eventBus.publish(buildEvent({ type: PURCHASE_REFUNDED, actorId: ctx.userId, purchaseId, listingId: p.listingId, buyerId: ctx.userId, amount: refundAmount, occurredAt: new Date().toISOString() } as any))
  return mapPurchase({ ...p, status: 'refunded', refundedAt: new Date() })
}
