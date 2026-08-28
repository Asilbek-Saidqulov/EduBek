/**
 * AI Credit Engine — Closed-loop Platform Units, Atomic Reservations & Billing
 */

import { AiCreditWalletDto, CreditLotDto } from "./types";
import { AI_SKUS } from "./constants";
import { economyStore, StoredAiUsage, StoredWallet } from "./store";
import { getActiveLotsForUser, consumeLotsForUser, getUserLotsDto, mintCreditLot } from "./lots";
import { recordJournalEntry } from "./ledger";
import { assertAiEnabled, assertWalletUnfrozen } from "./kill-switches";
import { ApiError } from "@/lib/errors";

/**
 * Gets or initializes the materialized AI Credit wallet for a user.
 * Reconciles available balance with active non-expired lots.
 */
export async function getUserAiCredits(userId: string): Promise<AiCreditWalletDto & { lots: CreditLotDto[] }> {
  assertWalletUnfrozen();

  let wallet = economyStore.wallets.get(userId);
  if (!wallet) {
    // New user initial wallet
    wallet = {
      id: `wallet_${userId}`,
      userId,
      availableUnits: 0,
      reservedUnits: 0,
      totalConsumed: 0,
      version: 1,
      updatedAt: new Date(),
    };
    economyStore.wallets.set(userId, wallet);
  }

  // Calculate active non-expired lots total
  const activeLots = getActiveLotsForUser(userId);
  const activeLotsTotal = activeLots.reduce((sum, l) => sum + l.remainingUnits, 0);

  // Sync available balance with lots (minus currently reserved units)
  wallet.availableUnits = Math.max(0, activeLotsTotal - wallet.reservedUnits);

  // Nearest expiration info
  let nearestExpiration: string | undefined = undefined;
  let expiringSoonUnits = 0;
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 86400000);

  for (const lot of activeLots) {
    if (lot.expiresAt) {
      if (!nearestExpiration || lot.expiresAt < new Date(nearestExpiration)) {
        nearestExpiration = lot.expiresAt.toISOString();
      }
      if (lot.expiresAt <= next7Days) {
        expiringSoonUnits += lot.remainingUnits;
      }
    }
  }

  const allLotsDto = getUserLotsDto(userId);

  return {
    id: wallet.id,
    userId: wallet.userId,
    availableUnits: wallet.availableUnits,
    reservedUnits: wallet.reservedUnits,
    totalConsumed: wallet.totalConsumed,
    version: wallet.version,
    updatedAt: wallet.updatedAt.toISOString(),
    expiringSoonUnits,
    nearestExpiration,
    lots: allLotsDto,
  };
}

export interface ReserveAiCreditsParams {
  userId: string;
  sku: string;
  estimatedUnits?: number;
  model?: string;
  metadata?: any;
}

/**
 * Atomically reserves AI credits before executing an AI generation task.
 * Prevents race conditions and double-spending across concurrent generation requests.
 */
export async function reserveAiCredits(params: ReserveAiCreditsParams): Promise<{
  reservationId: string;
  unitsReserved: number;
  remainingAvailable: number;
}> {
  assertAiEnabled();
  assertWalletUnfrozen();

  const skuDef = AI_SKUS[params.sku];
  const unitsToReserve = params.estimatedUnits ?? (skuDef ? skuDef.baseCredits : 10);

  if (unitsToReserve <= 0) {
    throw new ApiError(400, "Units to reserve must be strictly positive", undefined, undefined, "INVALID_RESERVE_UNITS");
  }

  const maxActionCap = economyStore.killSwitches.AI_PER_ACTION_MAX_CREDITS ?? 100;
  if (unitsToReserve > maxActionCap) {
    throw new ApiError(
      400,
      `Requested credits (${unitsToReserve}) exceeds single-action safety limit (${maxActionCap})`,
      { requested: unitsToReserve, limit: maxActionCap },
      undefined,
      "CREDIT_LIMIT_EXCEEDED"
    );
  }

  let wallet = economyStore.wallets.get(params.userId);
  if (!wallet) {
    wallet = {
      id: `wallet_${params.userId}`,
      userId: params.userId,
      availableUnits: 0,
      reservedUnits: 0,
      totalConsumed: 0,
      version: 1,
      updatedAt: new Date(),
    };
    economyStore.wallets.set(params.userId, wallet);
  }

  const activeLots = getActiveLotsForUser(params.userId);
  const activeLotsTotal = activeLots.reduce((sum, l) => sum + l.remainingUnits, 0);
  const trueAvailable = activeLotsTotal - wallet.reservedUnits;

  if (trueAvailable < unitsToReserve) {
    throw new ApiError(
      402,
      `Insufficient AI credits. Required: ${unitsToReserve}, Available: ${trueAvailable}`,
      { required: unitsToReserve, available: trueAvailable, sku: params.sku },
      undefined,
      "INSUFFICIENT_CREDITS"
    );
  }

  // Atomic reservation
  wallet.reservedUnits += unitsToReserve;
  wallet.availableUnits = Math.max(0, activeLotsTotal - wallet.reservedUnits);
  wallet.version += 1;
  wallet.updatedAt = new Date();

  const reservationId = `ai_res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const usageRecord: StoredAiUsage = {
    id: reservationId,
    userId: params.userId,
    sku: params.sku,
    model: params.model || (skuDef?.modelAllowlist[0] ?? "gemini-2.5-flash"),
    tokensIn: 0,
    tokensOut: 0,
    estimatedCogsUzs: 0n,
    creditsCharged: unitsToReserve,
    durationMs: 0,
    status: "RESERVED",
    reservationId,
    metadata: params.metadata,
    createdAt: new Date(),
  };

  economyStore.aiUsages.set(reservationId, usageRecord);

  return {
    reservationId,
    unitsReserved: unitsToReserve,
    remainingAvailable: wallet.availableUnits,
  };
}

export interface FinalizeAiReservationParams {
  reservationId: string;
  actualUnits?: number;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  durationMs?: number;
  estimatedCogsUzs?: bigint;
}

/**
 * Finalizes an AI credit reservation upon successful generation completion.
 * Consumes credit lots in FIFO order and posts revenue accounting entries.
 */
export async function finalizeAiReservation(params: FinalizeAiReservationParams): Promise<{
  success: boolean;
  creditsCharged: number;
  breakdown: { lotId: string; source: string; units: number }[];
}> {
  const usageRecord = economyStore.aiUsages.get(params.reservationId);
  if (!usageRecord) {
    throw new ApiError(404, `AI Reservation not found: ${params.reservationId}`, undefined, undefined, "RESERVATION_NOT_FOUND");
  }

  if (usageRecord.status !== "RESERVED") {
    throw new ApiError(400, `AI Reservation already settled with status: ${usageRecord.status}`, undefined, undefined, "RESERVATION_ALREADY_SETTLED");
  }

  const wallet = economyStore.wallets.get(usageRecord.userId);
  if (!wallet) {
    throw new ApiError(500, "Wallet not found during finalization", undefined, undefined, "WALLET_MISSING");
  }

  const reservedAmount = usageRecord.creditsCharged;
  const actualUnitsToCharge = params.actualUnits !== undefined ? params.actualUnits : reservedAmount;

  // Release the entire temporary reservation lock
  wallet.reservedUnits = Math.max(0, wallet.reservedUnits - reservedAmount);

  // Consume the actual units from lots
  const { consumedTotal, consumedBreakdown } = consumeLotsForUser(usageRecord.userId, actualUnitsToCharge);

  // Update wallet totals
  wallet.totalConsumed += consumedTotal;
  const activeLots = getActiveLotsForUser(usageRecord.userId);
  wallet.availableUnits = activeLots.reduce((sum, l) => sum + l.remainingUnits, 0) - wallet.reservedUnits;
  wallet.version += 1;
  wallet.updatedAt = new Date();

  // Update usage record
  usageRecord.status = "FINALIZED";
  usageRecord.creditsCharged = consumedTotal;
  usageRecord.tokensIn = params.tokensIn || usageRecord.tokensIn;
  usageRecord.tokensOut = params.tokensOut || usageRecord.tokensOut;
  usageRecord.model = params.model || usageRecord.model;
  usageRecord.durationMs = params.durationMs || usageRecord.durationMs;
  usageRecord.estimatedCogsUzs = params.estimatedCogsUzs || 0n;

  // Record accounting journal entry for revenue recognition
  // In closed loop, credit consumption recognizes revenue from Unearned Revenue
  await recordJournalEntry({
    journalCode: "AI_CREDIT_CONSUMPTION",
    description: `AI Service Execution: SKU ${usageRecord.sku} (${consumedTotal} Credits)`,
    referenceType: "AI_USAGE",
    referenceId: usageRecord.id,
    lines: [
      {
        account: "UNEARNED_REVENUE",
        subAccount: usageRecord.userId,
        currency: "CREDIT",
        direction: "DEBIT",
        amountMinor: BigInt(consumedTotal),
      },
      {
        account: "AI_REVENUE",
        subAccount: usageRecord.sku,
        currency: "CREDIT",
        direction: "CREDIT",
        amountMinor: BigInt(consumedTotal),
      },
    ],
  });

  return {
    success: true,
    creditsCharged: consumedTotal,
    breakdown: consumedBreakdown,
  };
}

/**
 * Releases an AI reservation when generation fails or is aborted (zero-cost guarantee).
 */
export async function releaseAiReservation(reservationId: string, failureReason?: string): Promise<{ released: boolean }> {
  const usageRecord = economyStore.aiUsages.get(reservationId);
  if (!usageRecord) {
    return { released: false };
  }

  if (usageRecord.status !== "RESERVED") {
    return { released: false };
  }

  const wallet = economyStore.wallets.get(usageRecord.userId);
  if (wallet) {
    wallet.reservedUnits = Math.max(0, wallet.reservedUnits - usageRecord.creditsCharged);
    const activeLots = getActiveLotsForUser(usageRecord.userId);
    wallet.availableUnits = activeLots.reduce((sum, l) => sum + l.remainingUnits, 0) - wallet.reservedUnits;
    wallet.version += 1;
    wallet.updatedAt = new Date();
  }

  usageRecord.status = "RELEASED";
  usageRecord.metadata = { ...(usageRecord.metadata || {}), failureReason };

  return { released: true };
}

/**
 * Atomically charges AI credits directly in a single step (convenience for instant operations).
 */
export async function chargeAiCreditsDirect(params: {
  userId: string;
  sku: string;
  units?: number;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  durationMs?: number;
  estimatedCogsUzs?: bigint;
}): Promise<{ success: boolean; creditsCharged: number }> {
  const reservation = await reserveAiCredits({
    userId: params.userId,
    sku: params.sku,
    estimatedUnits: params.units,
    model: params.model,
  });

  const final = await finalizeAiReservation({
    reservationId: reservation.reservationId,
    actualUnits: params.units,
    tokensIn: params.tokensIn,
    tokensOut: params.tokensOut,
    model: params.model,
    durationMs: params.durationMs,
    estimatedCogsUzs: params.estimatedCogsUzs,
  });

  return {
    success: true,
    creditsCharged: final.creditsCharged,
  };
}
