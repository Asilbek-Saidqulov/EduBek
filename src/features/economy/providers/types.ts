import { PaymentIntentDto, PaymentOrderDto, ProviderCode } from "../types";

export interface PaymentCreationResult {
  providerTransactionId?: string;
  checkoutUrl: string;
  rawResponse?: any;
}

export interface WebhookProcessingResult {
  handled: boolean;
  orderId: string;
  intentId?: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "IGNORED";
  responsePayload: any;
  error?: string;
}

export interface PaymentProvider {
  readonly providerCode: ProviderCode;

  createPayment(
    order: PaymentOrderDto,
    intent: PaymentIntentDto,
    returnUrl?: string
  ): Promise<PaymentCreationResult>;

  verifyWebhookSignature(payload: any, signature?: string): boolean;

  processWebhook(payload: any, signature?: string): Promise<WebhookProcessingResult>;

  checkStatus(providerTransactionId: string): Promise<{
    status: "PAID" | "PENDING" | "FAILED" | "CANCELED";
    raw: any;
  }>;

  refund(
    providerTransactionId: string,
    amountMinor: bigint,
    reason?: string
  ): Promise<{ success: boolean; providerRefundId?: string }>;
}
