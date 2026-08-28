/**
 * AI Credit Lots Engine — Deterministic FIFO and Expiration-Aware Lot Management
 */

import { CreditLotDto, CreditLotSource, CreditLotStatus } from "./types";
import { economyStore, StoredCreditLot } from "./store";
import { ApiError } from "@/lib/errors";

export interface MintCreditLotParams {
  userId: string;
  source: CreditLotSource;
  units: number;
  orderId?: string;
  subscriptionPeriodId?: string;
  campaignId?: string;
  expiresAt?: Date;
}

/**
 * Mints a new discrete credit lot for a user with specific expiration and source rules.
 */
export async function mintCreditLot(params: MintCreditLotParams): Promise<CreditLotDto> {
  if (params.units <= 0) {
    throw new ApiError(400, `Cannot mint non-positive credit units: ${params.units}`, undefined, undefined, "INVALID_MINT_UNITS");
  }

  const lotId = `lot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const lot: StoredCreditLot = {
    id: lotId,
    userId: params.userId,
    source: params.source,
    originalUnits: params.units,
    remainingUnits: params.units,
    orderId: params.orderId,
    subscriptionPeriodId: params.subscriptionPeriodId,
    campaignId: params.campaignId,
    expiresAt: params.expiresAt,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  economyStore.creditLots.set(lotId, lot);

  return toLotDto(lot);
}

/**
 * Returns all active lots for a user, sorted deterministically for consumption:
 * 1. Overdue lots are filtered out (marked expired).
 * 2. Earliest expiring lots come first.
 * 3. PROMO and SUBSCRIPTION lots consume before PURCHASED lots.
 * 4. Ties broken by creation date (FIFO).
 */
export function getActiveLotsForUser(userId: string): StoredCreditLot[] {
  const now = new Date();
  const userLots: StoredCreditLot[] = [];

  for (const lot of economyStore.creditLots.values()) {
    if (lot.userId === userId && lot.status === "ACTIVE" && lot.remainingUnits > 0) {
      if (lot.expiresAt && lot.expiresAt < now) {
        lot.status = "EXPIRED";
        lot.updatedAt = now;
      } else {
        userLots.push(lot);
      }
    }
  }

  return userLots.sort((a, b) => {
    // 1. If one has an expiration and the other does not, expiring one comes first
    if (a.expiresAt && !b.expiresAt) return -1;
    if (!a.expiresAt && b.expiresAt) return 1;
    if (a.expiresAt && b.expiresAt) {
      const diff = a.expiresAt.getTime() - b.expiresAt.getTime();
      if (diff !== 0) return diff;
    }

    // 2. Source priority: PROMO (1) -> SUBSCRIPTION (2) -> GOODWILL (3) -> PURCHASED (4)
    const sourceRank: Record<CreditLotSource, number> = {
      PROMO: 1,
      SUBSCRIPTION: 2,
      GOODWILL: 3,
      PURCHASED: 4,
    };
    const rankDiff = sourceRank[a.source] - sourceRank[b.source];
    if (rankDiff !== 0) return rankDiff;

    // 3. Earliest created first
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Atomically consumes units across active lots following the deterministic policy.
 */
export function consumeLotsForUser(userId: string, unitsToConsume: number): {
  consumedTotal: number;
  consumedBreakdown: { lotId: string; source: CreditLotSource; units: number }[];
} {
  if (unitsToConsume <= 0) return { consumedTotal: 0, consumedBreakdown: [] };

  const lots = getActiveLotsForUser(userId);
  const totalAvailable = lots.reduce((sum, l) => sum + l.remainingUnits, 0);

  if (totalAvailable < unitsToConsume) {
    throw new ApiError(
      400,
      `Insufficient AI credit units. Required: ${unitsToConsume}, Available: ${totalAvailable}`,
      { required: unitsToConsume, available: totalAvailable },
      undefined,
      "INSUFFICIENT_CREDITS"
    );
  }

  let remainingToDeduct = unitsToConsume;
  const breakdown: { lotId: string; source: CreditLotSource; units: number }[] = [];
  const now = new Date();

  for (const lot of lots) {
    if (remainingToDeduct <= 0) break;

    const deductFromLot = Math.min(lot.remainingUnits, remainingToDeduct);
    lot.remainingUnits -= deductFromLot;
    remainingToDeduct -= deductFromLot;
    lot.updatedAt = now;

    if (lot.remainingUnits === 0) {
      lot.status = "EXHAUSTED";
    }

    breakdown.push({
      lotId: lot.id,
      source: lot.source,
      units: deductFromLot,
    });
  }

  return {
    consumedTotal: unitsToConsume,
    consumedBreakdown: breakdown,
  };
}

/**
 * Claws back or reverses remaining units in a specific lot (used during refunds).
 */
export function clawbackLotUnits(lotId: string, units: number): number {
  const lot = economyStore.creditLots.get(lotId);
  if (!lot) return 0;

  const actualClawback = Math.min(lot.remainingUnits, units);
  lot.remainingUnits -= actualClawback;
  lot.updatedAt = new Date();

  if (lot.remainingUnits === 0) {
    lot.status = "REFUNDED";
  }

  return actualClawback;
}

export function getUserLotsDto(userId: string): CreditLotDto[] {
  const lots = Array.from(economyStore.creditLots.values())
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return lots.map(toLotDto);
}

function toLotDto(lot: StoredCreditLot): CreditLotDto {
  return {
    id: lot.id,
    userId: lot.userId,
    source: lot.source,
    originalUnits: lot.originalUnits,
    remainingUnits: lot.remainingUnits,
    orderId: lot.orderId,
    subscriptionPeriodId: lot.subscriptionPeriodId,
    campaignId: lot.campaignId,
    expiresAt: lot.expiresAt?.toISOString(),
    status: lot.status,
    createdAt: lot.createdAt.toISOString(),
    updatedAt: lot.updatedAt.toISOString(),
  };
}
