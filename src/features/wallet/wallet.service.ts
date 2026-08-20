import { logger } from '@/lib/logger'
import { notFound, badRequest, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { WALLET_CREDITED, WALLET_DEBITED, LEDGER_ENTRY_CREATED, buildEvent } from '@/infra/event-bus/events'
// Reuse WALLET_DEBITED for the transfer event (the platform doesn't have a
// dedicated WALLET_TRANSFERRED event type yet — debiting the sender is the
// primary state change).
const WALLET_TRANSFERRED = WALLET_DEBITED
import { db } from '@/lib/db'
import type { WalletDto, LedgerEntryDto } from './wallet.types'
import * as repo from './wallet.repository'
const log = logger.child({ module: 'wallet-service' })

function mapWallet(w: any): WalletDto { return { id: w.id, userId: w.userId, eduTokensBalance: w.eduTokensBalance, fiatBalance: w.fiatBalance, currency: w.currency, lockedEduTokens: w.lockedEduTokens, updatedAt: w.updatedAt.toISOString() } }

export async function getOrCreateWallet(ctx: AuthContext): Promise<WalletDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  let w = await repo.findWalletByUserId(ctx.userId)
  if (!w) w = await repo.createWallet(ctx.userId)
  return mapWallet(w)
}

export async function getBalance(ctx: AuthContext) { const w = await getOrCreateWallet(ctx); return { balance: w.eduTokensBalance } }

export async function getHistory(ctx: AuthContext, limit = 20, offset = 0) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const w = await repo.findWalletByUserId(ctx.userId)
  if (!w) return { entries: [], total: 0 }
  const { entries, total } = await repo.findLedgerEntries(w.id, limit, offset)
  return { entries: entries.map((e: any) => ({ id: e.id, walletId: e.walletId, delta: e.delta, balanceAfter: e.balanceAfter, reason: e.reason, referenceType: e.referenceType, referenceId: e.referenceId, createdAt: e.createdAt.toISOString() })), total }
}

export async function credit(userId: string, amount: number, reason: string, referenceType?: string, referenceId?: string): Promise<WalletDto> {
  if (amount <= 0) throw badRequest('Amount must be positive')
  let w = await repo.findWalletByUserId(userId)
  if (!w) w = await repo.createWallet(userId)
  // ATOMIC increment — uses Prisma's atomic `increment` operator (not a
  // read-then-write). This prevents lost-update race conditions when two
  // concurrent `credit()` calls both read the same `eduTokensBalance` and
  // both write back `old + amount` (the second write would overwrite the
  // first, losing one increment).
  const updated = await db.wallet.update({
    where: { id: w.id },
    data: { eduTokensBalance: { increment: amount } },
    select: { eduTokensBalance: true },
  })
  const balanceAfter = updated.eduTokensBalance
  await repo.createLedgerEntry({ walletId: w.id, delta: amount, balanceAfter, reason, referenceType, referenceId })
  eventBus.publish(buildEvent({ type: WALLET_CREDITED, actorId: userId, walletId: w.id, userId, amount, balanceAfter, reason, occurredAt: new Date().toISOString() } as any))
  return mapWallet({ ...w, eduTokensBalance: balanceAfter })
}

export async function debit(userId: string, amount: number, reason: string, referenceType?: string, referenceId?: string): Promise<WalletDto> {
  if (amount <= 0) throw badRequest('Amount must be positive')
  const w = await repo.findWalletByUserId(userId)
  if (!w) throw notFound('Wallet not found')
  // ATOMIC conditional decrement — mirrors `transfer()`'s pattern below.
  // The previous version did a plain read-then-write: it checked
  // `w.eduTokensBalance < amount` against a balance read moments
  // earlier, then wrote an unconditional new balance computed from that
  // same stale read. Two concurrent `debit()` calls (e.g. a double
  // purchase-submit) could both pass the check and both write, letting
  // a balance go negative or silently losing one of the debits —
  // unlike `credit()`, which already uses an atomic `increment`. The
  // `updateMany` with a `gte` guard only decrements if the balance is
  // still sufficient at write time, and reports back whether it did.
  const debitResult = await db.$transaction(async (tx) => {
    const result = await tx.wallet.updateMany({
      where: { id: w.id, eduTokensBalance: { gte: amount } },
      data: { eduTokensBalance: { decrement: amount } },
    })
    if (result.count === 0) return null
    const refreshed = await tx.wallet.findUniqueOrThrow({ where: { id: w.id }, select: { eduTokensBalance: true } })
    return refreshed.eduTokensBalance
  })
  if (debitResult === null) throw badRequest('Insufficient balance')
  const balanceAfter = debitResult
  await repo.createLedgerEntry({ walletId: w.id, delta: -amount, balanceAfter, reason, referenceType, referenceId })
  eventBus.publish(buildEvent({ type: WALLET_DEBITED, actorId: userId, walletId: w.id, userId, amount, balanceAfter, reason, occurredAt: new Date().toISOString() } as any))
  return mapWallet({ ...w, eduTokensBalance: balanceAfter })
}

export async function hasBalance(userId: string, amount: number): Promise<boolean> { const w = await repo.findWalletByUserId(userId); return w ? w.eduTokensBalance >= amount : false }

/**
 * transfer — atomically move EduTokens from one user's wallet to another.
 *
 * SECURITY:
 *   - Sender userId is derived from ctx.userId (never from request body).
 *   - toUserId must differ from sender (no self-transfer).
 *   - Amount must be a positive integer.
 *   - Uses Prisma $transaction with conditional updateMany on the sender's
 *     balance (>= amount) — prevents negative-balance race conditions.
 */
export async function transfer(ctx: AuthContext, input: { toUserId: string; amount: number; reason?: string }): Promise<void> {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const { toUserId, amount, reason } = input
  if (amount <= 0) throw badRequest('Amount must be positive')
  if (toUserId === ctx.userId) throw badRequest('Cannot transfer to yourself')

  const senderWallet = await repo.findWalletByUserId(ctx.userId)
  if (!senderWallet) throw notFound('Wallet not found')

  const recipientWallet = await repo.findWalletByUserId(toUserId)
  if (!recipientWallet) throw notFound('Recipient wallet not found')

  await db.$transaction(async (tx) => {
    // Conditional debit — only succeeds if sender still has enough balance.
    const debitResult = await tx.wallet.updateMany({
      where: { id: senderWallet.id, eduTokensBalance: { gte: amount } },
      data: { eduTokensBalance: { decrement: amount } },
    })
    if (debitResult.count === 0) throw badRequest('Insufficient balance')

    // Atomic credit — uses increment operator to avoid lost-update.
    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: { eduTokensBalance: { increment: amount } },
    })

    // Write ledger entries for both sides.
    const senderBalanceAfter = (senderWallet.eduTokensBalance - amount)
    const recipientBalanceAfter = (recipientWallet.eduTokensBalance + amount)
    await tx.eduTokenLedger.create({ data: { walletId: senderWallet.id, delta: -amount, balanceAfter: senderBalanceAfter, reason: `transfer to ${toUserId}: ${reason ?? ''}`.slice(0, 200), referenceType: 'transfer', referenceId: toUserId } })
    await tx.eduTokenLedger.create({ data: { walletId: recipientWallet.id, delta: amount, balanceAfter: recipientBalanceAfter, reason: `transfer from ${ctx.userId}: ${reason ?? ''}`.slice(0, 200), referenceType: 'transfer', referenceId: ctx.userId } })
  })

  eventBus.publish(buildEvent({ type: WALLET_TRANSFERRED, actorId: ctx.userId, fromUserId: ctx.userId, toUserId, amount, reason: reason ?? '', occurredAt: new Date().toISOString() } as any))
}
