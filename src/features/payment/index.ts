/**
 * EduBek — Payment feature barrel export.
 */
export { processPayment, listProviders } from "./service";
export { getPaymentRegistry, PaymentProviderRegistry } from "./registry";
export { MockPaymentProvider, StripeProvider } from "./payment-providers";
export type {
  PaymentProvider,
  PaymentProviderName,
  PaymentRequest,
  PaymentResult,
  ProviderInfo,
} from "./types";
