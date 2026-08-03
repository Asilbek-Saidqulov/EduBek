import { auditLogger } from '@/infra/audit'
import { eventBus } from '@/infra/event-bus'
import { logger } from '@/lib/logger'
import { PURCHASE_STARTED, PURCHASE_COMPLETED, PURCHASE_FAILED, PURCHASE_REFUNDED, WALLET_CREDITED, WALLET_DEBITED, LEDGER_ENTRY_CREATED, CREATOR_EARNING_CREATED, CREATOR_PAYOUT_REQUESTED, REVIEW_CREATED, REVIEW_UPDATED, REVIEW_DELETED, WISHLIST_ADDED, WISHLIST_REMOVED } from '@/infra/event-bus/events'

const log = logger.child({ module: 'commerce-listeners' })

export function registerCommerceListeners(): void {
  log.info('registering commerce listeners')
  eventBus.subscribe(PURCHASE_STARTED, (e: any) => auditLogger.log({ action: 'commerce.purchase_started', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, metadata: { buyerId: e.buyerId, price: e.price } }))
  eventBus.subscribe(PURCHASE_COMPLETED, (e: any) => auditLogger.log({ action: 'commerce.purchase_completed', actorId: e.actorId, entityType: 'mp_purchase', entityId: e.purchaseId, metadata: { listingId: e.listingId, buyerId: e.buyerId, creatorId: e.creatorId, resourceId: e.resourceId, pricePaid: e.pricePaid, platformFee: e.platformFee, creatorEarning: e.creatorEarning } }))
  eventBus.subscribe(PURCHASE_FAILED, (e: any) => auditLogger.log({ action: 'commerce.purchase_failed', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId, status: 'failure', metadata: { error: e.error } }))
  eventBus.subscribe(PURCHASE_REFUNDED, (e: any) => auditLogger.log({ action: 'commerce.purchase_refunded', actorId: e.actorId, entityType: 'mp_purchase', entityId: e.purchaseId, metadata: { amount: e.amount } }))
  eventBus.subscribe(WALLET_CREDITED, (e: any) => auditLogger.log({ action: 'commerce.wallet_credited', actorId: e.actorId, entityType: 'wallet', entityId: e.walletId, metadata: { amount: e.amount, balanceAfter: e.balanceAfter, reason: e.reason } }))
  eventBus.subscribe(WALLET_DEBITED, (e: any) => auditLogger.log({ action: 'commerce.wallet_debited', actorId: e.actorId, entityType: 'wallet', entityId: e.walletId, metadata: { amount: e.amount, balanceAfter: e.balanceAfter, reason: e.reason } }))
  eventBus.subscribe(LEDGER_ENTRY_CREATED, (e: any) => auditLogger.log({ action: 'commerce.ledger_entry_created', actorId: e.actorId, entityType: 'edu_token_ledger', entityId: e.ledgerId, metadata: { delta: e.delta, balanceAfter: e.balanceAfter, reason: e.reason } }))
  eventBus.subscribe(CREATOR_EARNING_CREATED, (e: any) => auditLogger.log({ action: 'commerce.creator_earning_created', actorId: e.actorId, entityType: 'creator_earning', entityId: e.earningId, metadata: { creatorId: e.creatorId, amount: e.amount, source: e.source } }))
  eventBus.subscribe(CREATOR_PAYOUT_REQUESTED, (e: any) => auditLogger.log({ action: 'commerce.payout_requested', actorId: e.actorId, entityType: 'creator_payout', entityId: e.payoutId, metadata: { creatorId: e.creatorId, amount: e.amount } }))
  eventBus.subscribe(REVIEW_CREATED, (e: any) => auditLogger.log({ action: 'commerce.review_created', actorId: e.actorId, entityType: 'mp_review', entityId: e.reviewId, metadata: { listingId: e.listingId, rating: e.rating } }))
  eventBus.subscribe(REVIEW_UPDATED, (e: any) => auditLogger.log({ action: 'commerce.review_updated', actorId: e.actorId, entityType: 'mp_review', entityId: e.reviewId, metadata: { rating: e.rating } }))
  eventBus.subscribe(REVIEW_DELETED, (e: any) => auditLogger.log({ action: 'commerce.review_deleted', actorId: e.actorId, entityType: 'mp_review', entityId: e.reviewId }))
  eventBus.subscribe(WISHLIST_ADDED, (e: any) => auditLogger.log({ action: 'commerce.wishlist_added', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId }))
  eventBus.subscribe(WISHLIST_REMOVED, (e: any) => auditLogger.log({ action: 'commerce.wishlist_removed', actorId: e.actorId, entityType: 'mp_listing', entityId: e.listingId }))
}
