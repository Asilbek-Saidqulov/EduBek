/**
 * Unified Payment Orchestration & Webhook Handling Engine
 */

import { PaymentIntentDto, PaymentOrderDto, ProviderCode } from "./types";
import { economyStore, StoredPaymentIntent } from "./store";
import { createOrder, getOrderDto } from "./orders";
import { providerRegistry } from "./providers/registry";
import { quoteCreditPack, quoteMarketplaceListing, quoteSubscriptionPlan } from "./pricing";
import { assertProviderEnabled } from "./kill-switches";
import { ApiError } from "@/lib/errors";

export interface InitiateCheckoutParams {
  userId: string;
  itemType: "AI_CREDIT_PACK" | "MARKETPLACE_PRODUCT" | "SUBSCRIPTION";
  itemId: string; // packId, listingId, or subscription tier
  providerCode?: ProviderCode;
  returnUrl?: string;
  idempotencyKey?: string;
  customMetadata?: any;
}

export async function initiateCheckout(params: InitiateCheckoutParams): Promise<{
  order: PaymentOrderDto;
  intent: PaymentIntentDto;
  checkoutUrl: string;
}> {
  const providerCode = params.providerCode || "CLICK";
  assertProviderEnabled(providerCode);

  // Check idempotency if key provided
  if (params.idempotencyKey) {
    const existingIntent = Array.from(economyStore.paymentIntents.values()).find(
      (i) => i.idempotencyKey === params.idempotencyKey
    );
    if (existingIntent) {
      const order = getOrderDto(existingIntent.orderId);
      const provider = providerRegistry.getProvider(existingIntent.providerCode);
      const intentDto = toIntentDto(existingIntent);
      const checkout = await provider.createPayment(order, intentDto, params.returnUrl);
      return {
        order,
        intent: intentDto,
        checkoutUrl: checkout.checkoutUrl,
      };
    }
  }

  // 1. Resolve Server-Authoritative Quote
  let quote: any;
  if (params.itemType === "AI_CREDIT_PACK") {
    quote = quoteCreditPack(params.itemId);
  } else if (params.itemType === "SUBSCRIPTION") {
    quote = quoteSubscriptionPlan(params.itemId as any);
  } else if (params.itemType === "MARKETPLACE_PRODUCT") {
    const listing = params.customMetadata?.listing;
    if (!listing) {
      throw new ApiError(400, "Missing listing metadata for marketplace checkout", undefined, undefined, "MISSING_LISTING_METADATA");
    }
    quote = quoteMarketplaceListing(listing);
  } else {
    throw new ApiError(400, `Unknown item type: ${params.itemType}`, undefined, undefined, "UNKNOWN_ITEM_TYPE");
  }

  // 2. Create Payment Order
  const order = await createOrder({
    userId: params.userId,
    type: quote.type,
    quotedAmountMinor: quote.quotedAmountMinor,
    currency: quote.currency,
    pricingPolicyCode: quote.pricingPolicyCode,
    pricingPolicyVersion: quote.pricingPolicyVersion,
    items: quote.metadata,
    metadata: { ...params.customMetadata, itemSummary: quote.itemSummary },
  });

  // 3. Create Payment Intent
  const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  const intent: StoredPaymentIntent = {
    id: intentId,
    orderId: order.id,
    providerCode,
    amountMinor: quote.quotedAmountMinor,
    currency: quote.currency,
    status: "CREATED",
    idempotencyKey: params.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };

  economyStore.paymentIntents.set(intentId, intent);
  const intentDto = toIntentDto(intent);

  // 4. Generate Provider Checkout URL
  const provider = providerRegistry.getProvider(providerCode);
  const checkout = await provider.createPayment(order, intentDto, params.returnUrl);

  return {
    order,
    intent: intentDto,
    checkoutUrl: checkout.checkoutUrl,
  };
}

/**
 * Global Webhook Dispatcher
 */
export async function handleProviderWebhook(
  providerCode: ProviderCode,
  payload: any,
  signature?: string
): Promise<any> {
  const provider = providerRegistry.getProvider(providerCode);

  // Log incoming webhook event for immutable audit trail
  const eventId = String(payload?.click_trans_id || payload?.eventId || Date.now());
  const logKey = `${providerCode}:${eventId}`;

  economyStore.webhookLogs.set(logKey, {
    providerCode,
    eventId,
    payload,
    signature,
    receivedAt: new Date(),
  });

  const result = await provider.processWebhook(payload, signature);
  return result.responsePayload;
}

export function getPaymentIntentStatus(intentId: string): PaymentIntentDto {
  const intent = economyStore.paymentIntents.get(intentId);
  if (!intent) {
    throw new ApiError(404, `Payment Intent not found: ${intentId}`, undefined, undefined, "INTENT_NOT_FOUND");
  }
  return toIntentDto(intent);
}

function toIntentDto(intent: StoredPaymentIntent): PaymentIntentDto {
  return {
    id: intent.id,
    orderId: intent.orderId,
    providerCode: intent.providerCode,
    providerTransactionId: intent.providerTransactionId,
    amountMinor: intent.amountMinor.toString(),
    currency: intent.currency,
    status: intent.status,
    idempotencyKey: intent.idempotencyKey,
    createdAt: intent.createdAt.toISOString(),
    updatedAt: intent.updatedAt.toISOString(),
  };
}
