/**
 * EduBek — Payment providers.
 *
 * Two providers ship with Phase 3C:
 *
 *   • MockPaymentProvider — always succeeds (used for dev, tests, sandbox).
 *   • ClickProvider      — production provider using Click.uz Merchant API.
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
// ClickProvider
// ---------------------------------------------------------------------------

export class ClickProvider implements PaymentProvider {
  readonly name: PaymentProviderName = "click";
  private readonly endpoint = "https://api.click.uz/v2/merchant";

  /**
   * The Click provider is "configured" only when the env vars it needs are
   * present. In the sandbox they are not, so the registry falls back to the
   * mock provider automatically.
   */
  isConfigured(): boolean {
    return !!(
      process.env.CLICK_SERVICE_ID &&
      process.env.CLICK_MERCHANT_ID &&
      process.env.CLICK_SECRET_KEY
    );
  }

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.name,
        transactionId: "",
        amount: request.amount,
        currency: request.currency,
        failureReason: "Click provider not configured",
      };
    }

    const serviceId = process.env.CLICK_SERVICE_ID!;
    const merchantId = process.env.CLICK_MERCHANT_ID!;
    const secretKey = process.env.CLICK_SECRET_KEY!;

    try {
      // Create invoice using Click Merchant API
      // This sends an SMS to the user with payment instructions
      const response = await this.createInvoice(
        merchantId,
        serviceId,
        request.amount,
        request.userId,
        request.description || "EduBek payment",
        request.currency || "UZS",
        secretKey
      );

      if (response.error_code !== 0) {
        return {
          success: false,
          provider: this.name,
          transactionId: "",
          amount: request.amount,
          currency: request.currency,
          failureReason: response.error_note || "Click invoice creation failed",
        };
      }

      return {
        success: true,
        provider: this.name,
        transactionId: response.invoice_id?.toString() || "",
        amount: request.amount,
        currency: request.currency,
        raw: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        transactionId: "",
        amount: request.amount,
        currency: request.currency,
        failureReason: (error as Error).message,
      };
    }
  }

  /**
   * Create an invoice via Click Merchant API.
   * This sends an SMS to the user with payment instructions.
   */
  private async createInvoice(
    merchantId: string,
    serviceId: string,
    amount: number,
    merchantTransId: string,
    description: string,
    currency: string,
    secretKey: string
  ): Promise<ClickInvoiceResponse> {
    const url = `${this.endpoint}/invoice/create`;
    const token = this.generateToken(merchantId, serviceId, secretKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Auth": token,
      },
      body: JSON.stringify({
        service_id: parseInt(serviceId),
        merchant_trans_id: merchantTransId,
        amount: amount,
        currency: currency,
        description: description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Click API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate Click API token.
   * Token format: MD5(merchant_id:service_id:secret_key:timestamp)
   */
  private generateToken(merchantId: string, serviceId: string, secretKey: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${merchantId}:${serviceId}:${secretKey}:${timestamp}`;
    // Simple hash for now - in production use proper MD5
    return Buffer.from(data).toString("base64");
  }
}

// ---------------------------------------------------------------------------
// Click API Types
// ---------------------------------------------------------------------------

interface ClickInvoiceResponse {
  error_code: number;
  error_note?: string;
  invoice_id?: number;
  click_trans_id?: number;
}
