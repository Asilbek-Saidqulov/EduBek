import { db } from '@/lib/db'
export async function findWalletByUserId(userId: string) { return db.wallet.findUnique({ where: { userId } }) }
export async function createWallet(userId: string) { return db.wallet.create({ data: { userId } }) }
export async function findLedgerEntries(walletId: string, limit = 20, offset = 0) { const [e, t] = await Promise.all([db.eduTokenLedger.findMany({ where: { walletId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }), db.eduTokenLedger.count({ where: { walletId } })]); return { entries: e, total: t } }
export async function createLedgerEntry(data: { walletId: string; delta: number; balanceAfter: number; reason: string; referenceType?: string; referenceId?: string; metadata?: string }) { return db.eduTokenLedger.create({ data }) }
