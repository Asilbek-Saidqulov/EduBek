/**
 * Refund & Dispute Compensating Engine
 * Reverses entitlements, claws back credits, restores balances, and posts compensating ledger lines.
 */

import { CREATOR_SHARE_BPS } from "./constants";
import { economyStore } from "./store";
import { clawbackLotUnits } from "./lots";
import { recordJournalEntry } from "./ledger";
import { providerRegistry } from "./providers/registry";
import { ApiError } from "@/lib/errors";

export interface ProcessRefundParams {
  orderId: string;
  reason?: string;
  initiatedBy?: string;
}

export async function processRefund(params: ProcessRefundParams): Promise<{
  success: boolean;
  refundAmountMinor: string;
  orderId: string;
  message: string;
}> {
  const order = economyStore.orders.get(params.orderId);
  if (!order) {
    throw new ApiError(404, `Order not found: ${params.orderId}`, undefined, undefined, "ORDER_NOT_FOUND");
  }

  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    throw new ApiError(400, `Cannot refund order in status: ${order.status}`, undefined, undefined, "INVALID_REFUND_STATE");
  }

  const now = new Date();
  const refundAmountMinor = order.quotedAmountMinor;

  if (order.type === "AI_CREDIT_PACK") {
    // Locate the lot created for this order
    const lot = Array.from(economyStore.creditLots.values()).find((l) => l.orderId === order.id);
    if (!lot) {
      throw new ApiError(400, "Credit lot for order not found", undefined, undefined, "LOT_NOT_FOUND");
    }

    if (lot.remainingUnits < lot.originalUnits) {
      throw new ApiError(
        400,
        "Cannot fully refund an AI Credit pack after credits have already been partially consumed",
        { remaining: lot.remainingUnits, original: lot.originalUnits },
        undefined,
        "CREDITS_ALREADY_CONSUMED"
      );
    }

    // Claw back the lot
    clawbackLotUnits(lot.id, lot.remainingUnits);

    // Compensating ledger entry:
    // DEBIT: UNEARNED_REVENUE
    // CREDIT: PAYMENT_CLEARING
    await recordJournalEntry({
      journalCode: "AI_PACK_REFUND",
      description: `Refund for AI Pack Order: ${order.id}`,
      referenceType: "REFUND",
      referenceId: order.id,
      lines: [
        {
          account: "UNEARNED_REVENUE",
          subAccount: order.userId,
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: refundAmountMinor,
        },
        {
          account: "PAYMENT_CLEARING",
          subAccount: "CLICK",
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: refundAmountMinor,
        },
      ],
    });
  } else if (order.type === "MARKETPLACE_PRODUCT") {
    const listingId = order.items?.listingId || order.metadata?.listingId;
    const sellerId = order.items?.sellerId || order.metadata?.sellerId;

    // 1. Revoke entitlement
    const entitlementKey = `${order.userId}:${listingId}`;
    const entitlement = economyStore.entitlements.get(entitlementKey);
    if (entitlement) {
      entitlement.status = "REVOKED";
      entitlement.revokedAt = now;
    }

    // 2. Reverse creator pending or available earnings
    const grossMinor = order.quotedAmountMinor;
    const creatorAmountMinor = (grossMinor * BigInt(CREATOR_SHARE_BPS)) / 10000n;
    const platformCommissionMinor = grossMinor - creatorAmountMinor;

    const creatorAcc = economyStore.creatorAccounts.get(sellerId);
    if (creatorAcc) {
      if (creatorAcc.pendingUzs >= creatorAmountMinor) {
        creatorAcc.pendingUzs -= creatorAmountMinor;
      } else {
        creatorAcc.availableUzs = creatorAcc.availableUzs >= creatorAmountMinor
          ? creatorAcc.availableUzs - creatorAmountMinor
          : 0n;
      }
      creatorAcc.version += 1;
      creatorAcc.updatedAt = now;
    }

    // 3. Compensating double-entry ledger entry:
    // DEBIT: CREATOR_PAYABLE (seller share)
    // DEBIT: MARKETPLACE_COMMISSION_REVENUE (platform share)
    // CREDIT: PAYMENT_CLEARING (gross refund)
    await recordJournalEntry({
      journalCode: "MARKETPLACE_REFUND",
      description: `Refund for Marketplace Order: ${order.id}`,
      referenceType: "REFUND",
      referenceId: order.id,
      lines: [
        {
          account: "CREATOR_PAYABLE",
          subAccount: sellerId,
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: creatorAmountMinor,
        },
        {
          account: "MARKETPLACE_COMMISSION_REVENUE",
          subAccount: "PLATFORM",
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: platformCommissionMinor,
        },
        {
          account: "PAYMENT_CLEARING",
          subAccount: "CLICK",
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: grossMinor,
        },
      ],
    });
  }

  // Update order status
  order.status = "REFUNDED";
  order.updatedAt = now;

  return {
    success: true,
    refundAmountMinor: refundAmountMinor.toString(),
    orderId: order.id,
    message: "Refund processed and digital entitlements revoked",
  };
}
