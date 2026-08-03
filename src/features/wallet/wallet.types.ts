export interface WalletDto { id: string; userId: string; eduTokensBalance: number; fiatBalance: number; currency: string; lockedEduTokens: number; updatedAt: string }
export interface LedgerEntryDto { id: string; walletId: string; delta: number; balanceAfter: number; reason: string; referenceType: string | null; referenceId: string | null; createdAt: string }
