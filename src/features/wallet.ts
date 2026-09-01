import { db } from "@/lib/db";

export async function ensureWallet(userId: string) {
  const existing = await db.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.wallet.create({
    data: { userId, eduTokensBalance: 250, currency: "UZS", fiatBalance: 0 },
  });
}

export async function applyEduDelta(params: {
  userId: string;
  delta: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: string;
}) {
  const { userId, delta, reason, referenceType, referenceId, metadata } = params;
  return db.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId, eduTokensBalance: 250, currency: "UZS" },
      });
    }
    const next = wallet.eduTokensBalance + delta;
    if (next < 0) {
      throw new Error("INSUFFICIENT_EDU");
    }
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { eduTokensBalance: next },
    });
    const entry = await tx.eduTokenLedger.create({
      data: {
        walletId: wallet.id,
        delta,
        balanceAfter: next,
        reason,
        referenceType,
        referenceId,
        metadata,
      },
    });
    return { wallet: updated, entry };
  });
}

export async function getWalletBalance(userId: string) {
  const wallet = await ensureWallet(userId);
  const history = await db.eduTokenLedger.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { wallet, history };
}
