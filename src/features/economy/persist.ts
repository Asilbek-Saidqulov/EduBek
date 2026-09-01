import { db } from "@/lib/db";
import { economyStore, type StoredLedgerEntry } from "./store";

export async function persistJournalEntry(entry: StoredLedgerEntry) {
  economyStore.ledgerEntries.set(entry.id, entry);
  try {
    await db.economyJournalEntry.create({
      data: {
        id: entry.id,
        journalCode: entry.journalCode,
        description: entry.description,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        postedAt: entry.postedAt,
        lines: {
          create: entry.lines.map((l) => ({
            id: l.id,
            account: l.account,
            subAccount: l.subAccount,
            currency: l.currency,
            direction: l.direction,
            amountMinor: l.amountMinor,
          })),
        },
      },
    });
  } catch (err) {
    console.warn("[economy.persist] Prisma journal write skipped", err);
  }
}

export async function persistPaymentEvent(provider: string, eventId: string, payload: unknown) {
  try {
    await db.economyPaymentEvent.create({
      data: {
        provider,
        eventId,
        payload: JSON.stringify(payload),
      },
    });
    return { duplicate: false };
  } catch {
    return { duplicate: true };
  }
}
