/**
 * EduBek — Payment feature types.
 *
 * The payment feature abstracts over multiple payment providers (Stripe,
 * mock, …) behind a uniform `PaymentProvider` interface. Higher layers
 * (subscriptions, marketplace purchases, wallet top-ups) call
 * `processPayment(request)` and never need to know which provider handled
 * the charge.
 */

export type PaymentProviderName = "mock" | "stripe";

export interface PaymentRequest {
  /** The user initiating the payment. */
  userId: string;
  /** Amount in the smallest currency unit (e.g. cents for USD). */
  amount: number;
  /** ISO 4217 currency code (e.g. "USD"). */
  currency: string;
  /** A short description shown on the customer's receipt. */
  description?: string;
  /** Optional idempotency key — providers should dedupe on it. */
  idempotencyKey?: string;
  /** Force a specific provider. When omitted the registry picks one. */
  provider?: PaymentProviderName;
  /** Optional metadata bag forwarded to the provider. */
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  /** Whether the charge succeeded. */
  success: boolean;
  /** Provider that handled the charge. */
  provider: PaymentProviderName;
  /** Provider-side transaction / charge id. */
  transactionId: string;
  /** Amount actually charged (may differ from request after FX). */
  amount: number;
  currency: string;
  /** Human-readable reason when `success` is false. */
  failureReason?: string;
  /** Provider-specific raw payload (for debugging / reconciliation). */
  raw?: Record<string, unknown>;
}

/**
 * Every payment provider implements this interface. The registry picks one
 * based on `PaymentRequest.provider` (or the default when none is set).
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;
  /** Whether the provider is configured and ready to accept charges. */
  isConfigured(): boolean;
  /** Attempt to charge the user. */
  charge(request: PaymentRequest): Promise<PaymentResult>;
}

export interface ProviderInfo {
  name: PaymentProviderName;
  configured: boolean;
  isDefault: boolean;
}
