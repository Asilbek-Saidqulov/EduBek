import { persistPaymentEvent } from "./persist";
import { getOrderDto, fulfillOrder } from "./orders";

export type ConfirmResult =
  | { status: "IGNORED"; reason: string }
  | { status: "FULFILLED"; orderId: string }
  | { status: "DISPUTED"; orderId: string; reason: string };

/**
 * Webhook is a claim. Frozen order quote is the amount.
 * FAILED after PAID → DISPUTED, do not un-mint.
 */
export async function confirmOnSource(params: {
  provider: string;
  eventId: string;
  orderId: string;
  claimedAmountUzs?: bigint | number | string;
  providerStatus: "PAID" | "FAILED" | "PENDING";
  payload: unknown;
}): Promise<ConfirmResult> {
  const seen = await persistPaymentEvent(params.provider, params.eventId, params.payload);
  if (seen.duplicate) return { status: "IGNORED", reason: "duplicate_event" };

  const order = getOrderDto(params.orderId);
  if (!order) return { status: "IGNORED", reason: "unknown_order" };

  if (params.providerStatus === "FAILED") {
    if (String(order.status).toUpperCase() === "PAID") {
      return { status: "DISPUTED", orderId: order.id, reason: "failed_after_paid" };
    }
    return { status: "IGNORED", reason: "failed_unpaid" };
  }

  if (params.providerStatus !== "PAID") {
    return { status: "IGNORED", reason: "not_paid" };
  }

  const frozen = BigInt(order.amountUzs || order.amountMinor || 0);
  const claimed = BigInt(params.claimedAmountUzs ?? frozen);
  if (claimed !== frozen) {
    return { status: "DISPUTED", orderId: order.id, reason: "amount_mismatch" };
  }

  await fulfillOrder(order.id);
  return { status: "FULFILLED", orderId: order.id };
}
