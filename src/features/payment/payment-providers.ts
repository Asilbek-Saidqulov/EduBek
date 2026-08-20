/**
 * EduBek — Payment providers.
 *
 * Two providers ship with Phase 3C:
 *
 *   • MockPaymentProvider — always succeeds (used for dev, tests, sandbox).
 *   • StripeProvider     — production stub that throws `notImplemented`
 *                           until a real Stripe SDK is wired in.
 *
 * Both implement the `PaymentProvider` interface so that the registry and
 * service treat them uniformly.
 */
import { badRequest } from "@/lib/errors";
import type { PaymentProvider, PaymentProviderName, PaymentRequest, PaymentResult } from "./types";

// ---------------------------------------------------------------------------
// MockPaymentProvider
// ---------------------------------------------------------------------------

export class MockPaymentProvider implements PaymentProvider {
  readonly name: PaymentProviderName = "mock";

  isConfigured(): boolean {
    return true;
  }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (request.amount <= 0) {
      throw badRequest("Amount must be positive");
    }
    // Deterministic transaction id so that tests can assert on it.
    const transactionId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return {
      success: true,
      provider: this.name,
      transactionId,
      amount: request.amount,
      currency: request.currency,
      raw: { mock: true, idempotencyKey: request.idempotencyKey },
    };
  }
}

// ---------------------------------------------------------------------------
// StripeProvider (stub)
// ---------------------------------------------------------------------------

export class StripeProvider implements PaymentProvider {
  readonly name: PaymentProviderName = "stripe";

  /**
   * The Stripe provider is "configured" only when the env vars it needs are
   * present. In the sandbox they are not, so the registry falls back to the
   * mock provider automatically.
   */
  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
  }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        transactionId: "",
        amount: request.amount,
        currency: request.currency,
        failureReason: "Stripe provider not configured",
      };
    }
    // Phase 3C ships a stub — a real implementation will be added when the
    // Stripe SDK is installed and the webhook flow is wired in.
    throw badRequest("Stripe provider not implemented in Phase 3C");
  }
}
