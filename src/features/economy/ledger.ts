/**
 * Immutable Double-Entry Ledger & Multi-Account Journal Engine
 * Enforces fundamental accounting invariants with integer minor units (BigInt).
 */

import { LedgerAccount, LedgerDirection, LedgerEntryDto, LedgerLineInput } from "./types";
import { persistJournalEntry } from "./persist";
import { economyStore, StoredLedgerEntry, StoredLedgerLine } from "./store";
import { ApiError } from "@/lib/errors";

export interface RecordJournalEntryParams {
  journalCode: string;
  description: string;
  lines: LedgerLineInput[];
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
}

/**
 * Validates that total debits equal total credits for every currency in the journal entry.
 */
function validateJournalBalance(lines: LedgerLineInput[]): void {
  if (!lines || lines.length < 2) {
    throw new ApiError(400, "Journal entry must contain at least two balancing lines", undefined, undefined, "INVALID_LEDGER_ENTRY");
  }

  const balances = new Map<string, { debits: bigint; credits: bigint }>();

  for (const line of lines) {
    if (line.amountMinor <= 0n) {
      throw new ApiError(400, `Ledger line amount must be strictly positive, received: ${line.amountMinor}`, undefined, undefined, "NEGATIVE_OR_ZERO_AMOUNT");
    }

    const cur = line.currency;
    if (!balances.has(cur)) {
      balances.set(cur, { debits: 0n, credits: 0n });
    }

    const acc = balances.get(cur)!;
    if (line.direction === "DEBIT") {
      acc.debits += line.amountMinor;
    } else if (line.direction === "CREDIT") {
      acc.credits += line.amountMinor;
    } else {
      throw new ApiError(400, `Invalid line direction: ${line.direction}`, undefined, undefined, "INVALID_DIRECTION");
    }
  }

  for (const [cur, acc] of balances.entries()) {
    if (acc.debits !== acc.credits) {
      throw new ApiError(
        400,
        `Unbalanced journal entry for currency ${cur}: total debits (${acc.debits}) !== total credits (${acc.credits})`,
        { currency: cur, debits: acc.debits.toString(), credits: acc.credits.toString() },
        undefined,
        "UNBALANCED_JOURNAL_ENTRY"
      );
    }
  }
}

/**
 * Appends an immutable, balanced double-entry journal record to the ledger.
 */
export async function recordJournalEntry(params: RecordJournalEntryParams): Promise<LedgerEntryDto> {
  validateJournalBalance(params.lines);

  const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const lines: StoredLedgerLine[] = params.lines.map((line, idx) => ({
    id: `line_${entryId}_${idx}`,
    entryId,
    account: line.account,
    subAccount: line.subAccount,
    currency: line.currency,
    direction: line.direction,
    amountMinor: line.amountMinor,
    createdAt: now,
  }));

  const entry: StoredLedgerEntry = {
    id: entryId,
    journalCode: params.journalCode,
    description: params.description,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    metadata: params.metadata,
    postedAt: now,
    lines,
  };

  economyStore.ledgerEntries.set(entryId, entry);
  void persistJournalEntry(entry);

  return {
    id: entry.id,
    journalCode: entry.journalCode,
    description: entry.description,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    metadata: entry.metadata,
    postedAt: entry.postedAt.toISOString(),
    lines: entry.lines.map((l) => ({
      id: l.id,
      account: l.account as LedgerAccount,
      subAccount: l.subAccount,
      currency: l.currency,
      direction: l.direction,
      amountMinor: l.amountMinor.toString(),
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

/**
 * Calculates current net balance for any accounting account or subaccount.
 */
export function getAccountBalance(
  account: LedgerAccount,
  currency: string = "UZS",
  subAccount?: string
): { debits: bigint; credits: bigint; netBalance: bigint } {
  let debits = 0n;
  let credits = 0n;

  for (const entry of economyStore.ledgerEntries.values()) {
    for (const line of entry.lines) {
      if (line.account === account && line.currency === currency) {
        if (!subAccount || line.subAccount === subAccount) {
          if (line.direction === "DEBIT") {
            debits += line.amountMinor;
          } else {
            credits += line.amountMinor;
          }
        }
      }
    }
  }

  // Normal balance orientation
  // Asset & Expense accounts: Normal Debit (Net = Debits - Credits)
  // Liability, Equity & Revenue accounts: Normal Credit (Net = Credits - Debits)
  const isAssetOrExpense =
    account === "PAYMENT_CLEARING" ||
    account === "PROMO_EXPENSE" ||
    account === "AI_COGS" ||
    account === "PAYMENT_FEE_EXPENSE";

  const netBalance = isAssetOrExpense ? debits - credits : credits - debits;

  return { debits, credits, netBalance };
}

/**
 * Retrieves the comprehensive trial balance sheet across all ledger accounts.
 */
export function getAllAccountBalances(currency: string = "UZS"): Record<LedgerAccount, { debits: string; credits: string; net: string }> {
  const accounts: LedgerAccount[] = [
    "PAYMENT_CLEARING",
    "UNEARNED_REVENUE",
    "AI_REVENUE",
    "MARKETPLACE_COMMISSION_REVENUE",
    "CREATOR_PAYABLE",
    "REFUND_RESERVE",
    "PROMO_EXPENSE",
    "AI_COGS",
    "PAYMENT_FEE_EXPENSE",
    "TAX_PAYABLE",
  ];

  const result: any = {};
  for (const acc of accounts) {
    const bal = getAccountBalance(acc, currency);
    result[acc] = {
      debits: bal.debits.toString(),
      credits: bal.credits.toString(),
      net: bal.netBalance.toString(),
    };
  }
  return result;
}

/**
 * Returns ledger entry history for audit trails or user queries.
 */
export function getLedgerHistory(limit: number = 50, offset: number = 0): { entries: LedgerEntryDto[]; total: number } {
  const all = Array.from(economyStore.ledgerEntries.values()).sort(
    (a, b) => b.postedAt.getTime() - a.postedAt.getTime()
  );

  const paginated = all.slice(offset, offset + limit);

  return {
    entries: paginated.map((entry) => ({
      id: entry.id,
      journalCode: entry.journalCode,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      metadata: entry.metadata,
      postedAt: entry.postedAt.toISOString(),
      lines: entry.lines.map((l) => ({
        id: l.id,
        account: l.account as LedgerAccount,
        subAccount: l.subAccount,
        currency: l.currency,
        direction: l.direction,
        amountMinor: l.amountMinor.toString(),
        createdAt: l.createdAt.toISOString(),
      })),
    })),
    total: all.length,
  };
}
