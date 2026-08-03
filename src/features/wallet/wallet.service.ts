import { logger } from '@/lib/logger'
import { notFound, badRequest, unauthorized } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { WALLET_CREDITED, WALLET_DEBITED, LEDGER_ENTRY_CREATED, buildEvent } from '@/infra/event-bus/events'
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

export async function transfer(ctx: AuthContext, input: { toUserId: string; amount: number; reason?: string }) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  if (ctx.userId === input.toUserId) throw badRequest('Cannot transfer to yourself')
  await debit(ctx.userId, input.amount, input.reason ?? 'Transfer', 'transfer', input.toUserId)
  await credit(input.toUserId, input.amount, input.reason ?? 'Transfer received', 'transfer', ctx.userId)
  return { success: true }
}

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
  const balanceAfter = w.eduTokensBalance + amount
  await db.wallet.update({ where: { id: w.id }, data: { eduTokensBalance: balanceAfter } })
  await repo.createLedgerEntry({ walletId: w.id, delta: amount, balanceAfter, reason, referenceType, referenceId })
  eventBus.publish(buildEvent({ type: WALLET_CREDITED, actorId: userId, walletId: w.id, userId, amount, balanceAfter, reason, occurredAt: new Date().toISOString() } as any))
  return mapWallet({ ...w, eduTokensBalance: balanceAfter })
}

export async function debit(userId: string, amount: number, reason: string, referenceType?: string, referenceId?: string): Promise<WalletDto> {
  if (amount <= 0) throw badRequest('Amount must be positive')
  const w = await repo.findWalletByUserId(userId)
  if (!w) throw notFound('Wallet not found')
  if (w.eduTokensBalance < amount) throw badRequest('Insufficient balance')
  const balanceAfter = w.eduTokensBalance - amount
  await db.wallet.update({ where: { id: w.id }, data: { eduTokensBalance: balanceAfter } })
  await repo.createLedgerEntry({ walletId: w.id, delta: -amount, balanceAfter, reason, referenceType, referenceId })
  eventBus.publish(buildEvent({ type: WALLET_DEBITED, actorId: userId, walletId: w.id, userId, amount, balanceAfter, reason, occurredAt: new Date().toISOString() } as any))
  return mapWallet({ ...w, eduTokensBalance: balanceAfter })
}

export async function hasBalance(userId: string, amount: number): Promise<boolean> { const w = await repo.findWalletByUserId(userId); return w ? w.eduTokensBalance >= amount : false }
