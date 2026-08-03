/**
 * EduBek — Payment service.
 *
 * A single entry point (`processPayment`) that the rest of the platform uses
 * to charge users. The service routes the request to the appropriate provider
 * via the registry, publishes the canonical payment events, and returns a
 * uniform `PaymentResult`.
 *
 * Events published:
 *   • PAYMENT_PROVIDER_SELECTED — always, before the charge
 *   • PAYMENT_SUCCEEDED         — on success
 *   • PAYMENT_FAILED            — on failure (caught exception or success=false)
 */
import { logger } from "@/lib/logger";
import { badRequest, unauthorized } from "@/lib/errors";
import { can, PersonalPermission, type AuthContext } from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  PAYMENT_FAILED,
  PAYMENT_PROVIDER_SELECTED,
  PAYMENT_SUCCEEDED,
  type PaymentEvent,
} from "@/infra/event-bus/events";
import { getPaymentRegistry } from "./registry";
import type { PaymentRequest, PaymentResult, ProviderInfo } from "./types";

const log = logger.child({ module: "payment-service" });

export async function processPayment(
  ctx: AuthContext,
  request: PaymentRequest,
): Promise<PaymentResult> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.MARKETPLACE_PURCHASE)) {
    throw badRequest("No permission to make payments");
  }
  if (request.amount <= 0) throw badRequest("Amount must be positive");
  if (request.userId !== ctx.userId && !ctx.isSuperadmin) {
    throw badRequest("Cannot charge a different user");
  }

  const registry = getPaymentRegistry();
  const provider = registry.resolve(request.provider);

  eventBus.publish(
    buildEvent<PaymentEvent>({
      type: PAYMENT_PROVIDER_SELECTED,
      actorId: ctx.userId,
      userId: ctx.userId,
      provider: provider.name,
      amount: request.amount,
      currency: request.currency,
      occurredAt: new Date(),
    }),
  );

  let result: PaymentResult;
  try {
    result = await provider.charge(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    eventBus.publish(
      buildEvent<PaymentEvent>({
        type: PAYMENT_FAILED,
        actorId: ctx.userId,
        userId: ctx.userId,
        provider: provider.name,
        amount: request.amount,
        currency: request.currency,
        failureReason: message,
        occurredAt: new Date(),
      }),
    );
    log.warn("payment.failed", {
      provider: provider.name,
      userId: ctx.userId,
      error: message,
    });
    throw err;
  }

  if (result.success) {
    eventBus.publish(
      buildEvent<PaymentEvent>({
        type: PAYMENT_SUCCEEDED,
        actorId: ctx.userId,
        userId: ctx.userId,
        provider: result.provider,
        transactionId: result.transactionId,
        amount: result.amount,
        currency: result.currency,
        occurredAt: new Date(),
      }),
    );
    log.info("payment.succeeded", {
      provider: result.provider,
      transactionId: result.transactionId,
      amount: result.amount,
    });
  } else {
    eventBus.publish(
      buildEvent<PaymentEvent>({
        type: PAYMENT_FAILED,
        actorId: ctx.userId,
        userId: ctx.userId,
        provider: result.provider,
        amount: result.amount,
        currency: result.currency,
        failureReason: result.failureReason,
        occurredAt: new Date(),
      }),
    );
    log.warn("payment.failed", {
      provider: result.provider,
      failureReason: result.failureReason,
    });
  }
  return result;
}

export function listProviders(): ProviderInfo[] {
  return getPaymentRegistry().info();
}
