/**
 * Order Lifecycle & Fulfillment Engine
 * Freezes economic snapshot at creation and idempotently delivers digital entitlements upon payment.
 */

import { OrderType, PaymentOrderDto } from "./types";
import { COMMISSION_RATE_BPS, CREATOR_SHARE_BPS, PURCHASED_CREDIT_EXPIRATION_DAYS, SUBSCRIPTION_CREDIT_EXPIRATION_DAYS } from "./constants";
import { economyStore, StoredEntitlement, StoredOrder, StoredUserSubscription } from "./store";
import { mintCreditLot } from "./lots";
import { recordJournalEntry } from "./ledger";
import { assertCreditMintingEnabled, assertMarketplacePurchasesEnabled } from "./kill-switches";
import { ApiError } from "@/lib/errors";

export interface CreateOrderParams {
  userId: string;
  type: OrderType;
  quotedAmountMinor: bigint;
  currency?: "UZS" | "USD";
  pricingPolicyCode: string;
  pricingPolicyVersion: number;
  items: any;
  metadata?: any;
}

/**
 * Creates an immutable Payment Order record.
 */
export async function createOrder(params: CreateOrderParams): Promise<PaymentOrderDto> {
  if (params.type === "AI_CREDIT_PACK") {
    assertCreditMintingEnabled();
  } else if (params.type === "MARKETPLACE_PRODUCT") {
    assertMarketplacePurchasesEnabled();
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const order: StoredOrder = {
    id: orderId,
    userId: params.userId,
    type: params.type,
    quotedAmountMinor: params.quotedAmountMinor,
    currency: params.currency || "UZS",
    pricingPolicyCode: params.pricingPolicyCode,
    pricingPolicyVersion: params.pricingPolicyVersion,
    status: "CREATED",
    items: params.items,
    metadata: params.metadata,
    createdAt: now,
    updatedAt: now,
  };

  economyStore.orders.set(orderId, order);

  return toOrderDto(order);
}

export function getOrder(orderId: string): StoredOrder | undefined {
  return economyStore.orders.get(orderId);
}

export function getOrderDto(orderId: string): PaymentOrderDto {
  const order = getOrder(orderId);
  if (!order) {
    throw new ApiError(404, `Order not found: ${orderId}`, undefined, undefined, "ORDER_NOT_FOUND");
  }
  return toOrderDto(order);
}

/**
 * Idempotently fulfills an order once marked PAID.
 */
export async function fulfillOrder(orderId: string): Promise<{ fulfilled: boolean; message: string }> {
  const order = economyStore.orders.get(orderId);
  if (!order) {
    throw new ApiError(404, `Order not found: ${orderId}`, undefined, undefined, "ORDER_NOT_FOUND");
  }

  // Idempotency check: If already fulfilled, return cleanly without duplicate delivery
  if (order.status === "FULFILLED") {
    return { fulfilled: true, message: "Order was already fulfilled" };
  }

  if (order.status !== "PAID") {
    throw new ApiError(400, `Cannot fulfill unpaid order in status: ${order.status}`, undefined, undefined, "ORDER_NOT_PAID");
  }

  const now = new Date();

  if (order.type === "AI_CREDIT_PACK") {
    // 1. Deliver AI Credit Pack
    const units = order.items?.units || order.metadata?.units || 100;
    const expiresAt = new Date(now.getTime() + PURCHASED_CREDIT_EXPIRATION_DAYS * 86400000);

    const lot = await mintCreditLot({
      userId: order.userId,
      source: "PURCHASED",
      units,
      orderId: order.id,
      expiresAt,
    });

    // Record double-entry ledger line: PAYMENT_CLEARING -> UNEARNED_REVENUE
    await recordJournalEntry({
      journalCode: "AI_PACK_PURCHASE",
      description: `Purchased AI Credit Pack: ${units} units (${order.quotedAmountMinor} UZS)`,
      referenceType: "ORDER",
      referenceId: order.id,
      lines: [
        {
          account: "PAYMENT_CLEARING",
          subAccount: "CLICK",
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: order.quotedAmountMinor,
        },
        {
          account: "UNEARNED_REVENUE",
          subAccount: order.userId,
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: order.quotedAmountMinor,
        },
      ],
    });
  } else if (order.type === "MARKETPLACE_PRODUCT") {
    // 2. Deliver Marketplace Entitlement & Credit Creator Pending Balance
    const listingId = order.items?.listingId || order.metadata?.listingId;
    const sellerId = order.items?.sellerId || order.metadata?.sellerId;

    if (!listingId || !sellerId) {
      throw new ApiError(400, "Missing listingId or sellerId for marketplace fulfillment", undefined, undefined, "INVALID_MARKETPLACE_ORDER");
    }

    // Anti-fraud: Buyer cannot be the seller
    if (order.userId === sellerId) {
      throw new ApiError(400, "Self-purchases are strictly prohibited", undefined, undefined, "SELF_PURCHASE_PROHIBITED");
    }

    // Create or reactivate entitlement
    const entitlementKey = `${order.userId}:${listingId}`;
    const entitlement: StoredEntitlement = {
      id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: order.userId,
      listingId,
      orderId: order.id,
      version: 1,
      status: "ACTIVE",
      grantedAt: now,
    };
    economyStore.entitlements.set(entitlementKey, entitlement);

    // Calculate split (70% Creator / 30% Platform) with exact integer arithmetic
    const grossMinor = order.quotedAmountMinor;
    const creatorAmountMinor = (grossMinor * BigInt(CREATOR_SHARE_BPS)) / 10000n;
    const platformCommissionMinor = grossMinor - creatorAmountMinor;

    // Credit creator's pending UZS balance
    let creatorAcc = economyStore.creatorAccounts.get(sellerId);
    if (!creatorAcc) {
      creatorAcc = {
        id: `creator_${sellerId}`,
        creatorId: sellerId,
        pendingUzs: 0n,
        eligibleUzs: 0n,
        availableUzs: 0n,
        payoutLockedUzs: 0n,
        paidUzs: 0n,
        version: 1,
        updatedAt: now,
      };
      economyStore.creatorAccounts.set(sellerId, creatorAcc);
    }

    creatorAcc.pendingUzs += creatorAmountMinor;
    creatorAcc.version += 1;
    creatorAcc.updatedAt = now;

    // Record double-entry ledger lines:
    // DEBIT: PAYMENT_CLEARING (gross)
    // CREDIT: CREATOR_PAYABLE (seller share)
    // CREDIT: MARKETPLACE_COMMISSION_REVENUE (platform fee)
    await recordJournalEntry({
      journalCode: "MARKETPLACE_ORDER",
      description: `Marketplace Purchase: Listing ${listingId} (Buyer: ${order.userId}, Seller: ${sellerId})`,
      referenceType: "ORDER",
      referenceId: order.id,
      lines: [
        {
          account: "PAYMENT_CLEARING",
          subAccount: "CLICK",
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: grossMinor,
        },
        {
          account: "CREATOR_PAYABLE",
          subAccount: sellerId,
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: creatorAmountMinor,
        },
        {
          account: "MARKETPLACE_COMMISSION_REVENUE",
          subAccount: "PLATFORM",
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: platformCommissionMinor,
        },
      ],
    });
  } else if (order.type === "SUBSCRIPTION") {
    // 3. Deliver Subscription Plan & Monthly AI Credit Quota
    const tier = order.items?.tier || order.metadata?.tier || "PRO";
    const quota = order.items?.monthlyQuota || order.metadata?.monthlyQuota || 400;

    const periodStart = now;
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_CREDIT_EXPIRATION_DAYS * 86400000);

    const sub: StoredUserSubscription = {
      id: `sub_${order.userId}`,
      userId: order.userId,
      tier,
      status: "ACTIVE",
      startedAt: now,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
      orderId: order.id,
      updatedAt: now,
    };
    economyStore.subscriptions.set(order.userId, sub);

    // Mint subscription quota lot bound to billing period
    await mintCreditLot({
      userId: order.userId,
      source: "SUBSCRIPTION",
      units: quota,
      orderId: order.id,
      subscriptionPeriodId: sub.id,
      expiresAt: periodEnd,
    });

    // Record subscription ledger entries
    await recordJournalEntry({
      journalCode: "SUBSCRIPTION_BILLING",
      description: `Subscription Activated: Tier ${tier} for user ${order.userId}`,
      referenceType: "ORDER",
      referenceId: order.id,
      lines: [
        {
          account: "PAYMENT_CLEARING",
          subAccount: "CLICK",
          currency: "UZS",
          direction: "DEBIT",
          amountMinor: order.quotedAmountMinor,
        },
        {
          account: "UNEARNED_REVENUE",
          subAccount: order.userId,
          currency: "UZS",
          direction: "CREDIT",
          amountMinor: order.quotedAmountMinor,
        },
      ],
    });
  }

  order.status = "FULFILLED";
  order.updatedAt = now;

  return { fulfilled: true, message: "Order fulfilled successfully" };
}

function toOrderDto(order: StoredOrder): PaymentOrderDto {
  return {
    id: order.id,
    userId: order.userId,
    type: order.type,
    quotedAmountMinor: order.quotedAmountMinor.toString(),
    currency: order.currency,
    pricingPolicyCode: order.pricingPolicyCode,
    pricingPolicyVersion: order.pricingPolicyVersion,
    status: order.status,
    items: order.items,
    metadata: order.metadata,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
