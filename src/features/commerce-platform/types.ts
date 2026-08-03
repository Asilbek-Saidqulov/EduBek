/**
 * EduBek — Commerce, Economy, Marketplace & Monetization Platform types.
 * Phase 6G.16: Single source of truth for every commercial operation.
 *
 * Owns ONLY commerce: catalog, products, bundles, offers, discounts, virtual currency,
 * subscriptions, licenses, purchases, payments, ledger, refunds, analytics, marketplace integration,
 * developer integration, administration dashboard, documentation.
 *
 * NEVER owns: gameplay, scoring, matchmaking, progression, XP, achievements, inventory state,
 * cosmetics, rewards, tournaments, analytics, player profiles.
 *
 * All cross-module communication happens exclusively through the Event Bus.
 */

// ===========================================================================
// System 1 — Commerce Catalog
// ===========================================================================
export type CatalogItemStatus =
  | "active" | "draft" | "scheduled" | "deprecated" | "retired";

export type CatalogItemType =
  | "product" | "bundle" | "pass" | "subscription"
  | "currency_pack" | "cosmetic_pack" | "organization_package" | "extension";

export interface CatalogItemSummary {
  id: string; type: CatalogItemType; status: CatalogItemStatus;
  name: string; sku: string; basePrice: number; currency: string;
  publishedAt: string | null; deprecatedAt: string | null;
}

export interface CommerceCatalog {
  totalItems: number;
  byStatus: Record<CatalogItemStatus, number>;
  byType: Record<CatalogItemType, number>;
  recentlyPublished: CatalogItemSummary[];
  scheduledUpcoming: CatalogItemSummary[];
  deprecatedRecently: CatalogItemSummary[];
  updatedAt: string;
}

// ===========================================================================
// System 2 — Product Definitions
// ===========================================================================
export type ProductType =
  | "physical" | "digital" | "subscription" | "license"
  | "bundle" | "currency" | "service" | "organization" | "extension";

export type ProductStatus = CatalogItemStatus;

export interface ProductPrice {
  currency: string; amount: number; region: string | null;
  validFrom: string | null; validUntil: string | null;
}

export interface ProductDefinition {
  id: string; sku: string; name: string; description: string;
  type: ProductType; status: ProductStatus;
  basePrice: number; currency: string;
  prices: ProductPrice[];
  tags: string[]; category: string | null;
  organizationId: string | null; region: string | null;
  metadata: Record<string, unknown>;
  publishedAt: string | null; deprecatedAt: string | null;
  createdAt: string; updatedAt: string;
  version: number;
}

// ===========================================================================
// System 3 — Bundle Engine
// ===========================================================================
export type BundleType =
  | "standard" | "nested" | "conditional" | "organization"
  | "limited" | "starter";

export interface BundleItem {
  productId: string; quantity: number;
  required: boolean; conditionTag: string | null;
}

export interface Bundle {
  id: string; sku: string; name: string; description: string;
  type: BundleType; status: ProductStatus;
  items: BundleItem[];
  childBundleIds: string[];
  basePrice: number; currency: string;
  discountPercentage: number | null;
  startDate: string | null; endDate: string | null;
  maxQuantity: number | null; soldCount: number;
  organizationId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}

// ===========================================================================
// System 4 — Offer Engine
// ===========================================================================
export type OfferType =
  | "limited_time" | "seasonal" | "organization" | "regional"
  | "student" | "teacher" | "first_purchase" | "returning_user"
  | "campaign" | "coupon" | "manual";

export type OfferStatus = "draft" | "pending_approval" | "approved" | "active" | "expired" | "rejected" | "retired";

export interface OfferEligibility {
  organizationIds: string[] | null;
  regions: string[] | null;
  roleTypes: string[] | null;
  minPurchases: number | null;
  maxPurchases: number | null;
  firstPurchaseOnly: boolean;
  couponCode: string | null;
}

export interface Offer {
  id: string; name: string; description: string;
  type: OfferType; status: OfferStatus;
  productIds: string[]; bundleIds: string[];
  discountType: "percentage" | "fixed" | "tiered";
  discountValue: number;
  startDate: string; endDate: string;
  eligibility: OfferEligibility;
  maxRedemptions: number | null; redemptionCount: number;
  requiresApproval: boolean;
  approvedBy: string | null; approvedAt: string | null;
  createdBy: string; createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 5 — Discount Engine
// ===========================================================================
export type DiscountType =
  | "percentage" | "fixed" | "tiered" | "volume"
  | "campaign" | "coupon" | "organization" | "academic";

export interface DiscountTier {
  minQuantity: number; maxQuantity: number | null;
  discountValue: number; discountType: DiscountType;
}

export interface Discount {
  id: string; name: string; type: DiscountType;
  value: number; currency: string | null;
  tiers: DiscountTier[];
  productIds: string[] | null;
  organizationIds: string[] | null;
  couponCode: string | null;
  startDate: string; endDate: string;
  active: boolean; stackable: boolean;
  maxRedemptions: number | null; redemptionCount: number;
  createdBy: string; createdAt: string;
  metadata: Record<string, unknown>;
}

export interface DiscountValidationResult {
  valid: boolean;
  appliedDiscounts: Array<{ discountId: string; name: string; amount: number }>;
  originalTotal: number;
  discountedTotal: number;
  totalSavings: number;
  errors: string[];
}

// ===========================================================================
// System 6 — Virtual Currency Platform
// ===========================================================================
export type CurrencyType = "soft" | "hard" | "premium" | "organization";
export type CurrencyTransactionType = "grant" | "spend" | "refund" | "exchange_in" | "exchange_out" | "expire" | "adjust";

export interface VirtualCurrency {
  id: string; code: string; name: string; symbol: string;
  type: CurrencyType;
  exchangeRateToUsd: number;
  expirationDays: number | null;
  organizationId: string | null;
  active: boolean;
  createdAt: string; updatedAt: string;
}

export interface CurrencyBalance {
  currencyId: string; userId: string;
  amount: number; pendingAmount: number;
  lifetimeGranted: number; lifetimeSpent: number;
  expiresAt: string | null;
  updatedAt: string;
}

export interface CurrencyTransaction {
  id: string; currencyId: string; userId: string;
  type: CurrencyTransactionType;
  amount: number; balanceAfter: number;
  reference: string | null; correlationId: string;
  reason: string; metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CurrencyExchangeRate {
  fromCurrencyId: string; toCurrencyId: string;
  rate: number; active: boolean; updatedAt: string;
}

// ===========================================================================
// System 7 — Subscription Platform
// ===========================================================================
export type SubscriptionPlanType =
  | "individual" | "family" | "organization" | "school" | "district" | "enterprise";

export type SubscriptionStatus =
  | "trial" | "active" | "past_due" | "grace_period"
  | "canceled" | "expired" | "paused";

export interface SubscriptionPlan {
  id: string; name: string; description: string;
  type: SubscriptionPlanType;
  price: number; currency: string;
  billingCycle: "monthly" | "quarterly" | "annual" | "lifetime";
  trialDays: number; gracePeriodDays: number;
  benefitRefs: string[];
  maxSeats: number | null;
  organizationId: string | null;
  active: boolean;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface Subscription {
  id: string; planId: string; userId: string;
  status: SubscriptionStatus;
  startDate: string; endDate: string | null;
  trialEndsAt: string | null; gracePeriodEndsAt: string | null;
  canceledAt: string | null; expiredAt: string | null;
  seatCount: number; organizationId: string | null;
  autoRenew: boolean;
  benefitRefs: string[];
  correlationId: string;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 8 — License Platform
// ===========================================================================
export type LicenseType =
  | "organization" | "extension" | "marketplace" | "individual" | "site";

export type LicenseStatus = "active" | "revoked" | "expired" | "pending" | "suspended";

export interface License {
  id: string; type: LicenseType;
  productId: string | null; extensionId: string | null; listingId: string | null;
  ownerId: string; organizationId: string | null;
  status: LicenseStatus;
  key: string; activationCount: number; maxActivations: number;
  issuedAt: string; activatedAt: string | null;
  expiresAt: string | null; revokedAt: string | null;
  revocationReason: string | null;
  correlationId: string;
  metadata: Record<string, unknown>;
}

export interface LicenseVerificationResult {
  valid: boolean; licenseId: string;
  status: LicenseStatus; ownerId: string;
  reason: string | null;
  verifiedAt: string;
}

// ===========================================================================
// System 9 — Purchase Processing
// ===========================================================================
export type PurchaseStatus =
  | "pending" | "validated" | "approved" | "payment_pending"
  | "completed" | "failed" | "cancelled" | "refunded" | "expired";

export interface PurchaseItem {
  productId: string | null; bundleId: string | null;
  quantity: number; unitPrice: number;
  discountAmount: number; total: number;
}

export interface Purchase {
  id: string; buyerId: string; organizationId: string | null;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number; discountTotal: number; taxTotal: number; total: number;
  currency: string;
  offerId: string | null; couponCode: string | null;
  paymentProviderId: string | null; paymentReference: string | null;
  correlationId: string;
  notes: string | null;
  createdAt: string; updatedAt: string;
  completedAt: string | null; cancelledAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
}

const VALID_PURCHASE_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  pending: ["validated", "cancelled", "expired", "failed"],
  validated: ["approved", "cancelled", "failed"],
  approved: ["payment_pending", "cancelled", "failed"],
  payment_pending: ["completed", "failed", "cancelled", "expired"],
  completed: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
  expired: [],
};

export function canTransitionPurchase(from: PurchaseStatus, to: PurchaseStatus): boolean {
  return VALID_PURCHASE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ===========================================================================
// System 10 — Payment Provider Abstraction
// ===========================================================================
export type PaymentProviderId =
  | "click" | "payme" | "apple" | "google"
  | "bank" | "invoice" | "custom";

export type PaymentProviderStatus = "active" | "inactive" | "maintenance" | "deprecated";

export interface PaymentProviderConfig {
  id: PaymentProviderId; name: string;
  status: PaymentProviderStatus;
  supportedCurrencies: string[];
  supportedMethods: string[];
  minAmount: number; maxAmount: number | null;
  webhookUrl: string | null;
  sandboxMode: boolean;
  metadata: Record<string, unknown>;
}

export interface PaymentIntent {
  id: string; providerId: PaymentProviderId;
  purchaseId: string; amount: number; currency: string;
  status: "initiated" | "authorized" | "captured" | "failed" | "voided" | "refunded";
  providerReference: string | null;
  initiatedAt: string; capturedAt: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 11 — Transaction Ledger
// ===========================================================================
export type LedgerEntryType =
  | "purchase" | "refund" | "subscription" | "currency_grant"
  | "currency_spend" | "currency_refund" | "payout" | "adjustment"
  | "fee" | "tax" | "discount" | "commission";

export interface LedgerEntry {
  id: string; sequenceNumber: number;
  type: LedgerEntryType;
  reference: string; referenceType: "purchase" | "subscription" | "license" | "currency" | "payout" | "manual";
  debitAccountId: string | null;
  creditAccountId: string | null;
  amount: number; currency: string;
  balanceAfter: number | null;
  correlationId: string;
  actorId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  // Immutable flag — once written, ledger entries cannot be mutated.
  immutable: true;
}

// ===========================================================================
// System 12 — Refund Platform
// ===========================================================================
export type RefundStatus = "requested" | "approved" | "rejected" | "processing" | "completed" | "failed";
export type RefundType = "full" | "partial" | "organization" | "subscription_cancellation";

export interface Refund {
  id: string; purchaseId: string; type: RefundType;
  status: RefundStatus;
  amount: number; currency: string;
  reason: string; policy: string;
  requestedBy: string; requestedAt: string;
  reviewedBy: string | null; reviewedAt: string | null;
  approvedBy: string | null; approvedAt: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
  correlationId: string;
  ledgerEntries: string[];
  metadata: Record<string, unknown>;
}

export interface RefundPolicy {
  id: string; name: string;
  refundWindowDays: number;
  fullRefundAllowed: boolean;
  partialRefundAllowed: boolean;
  subscriptionRefundAllowed: boolean;
  organizationRefundAllowed: boolean;
  requiresApproval: boolean;
  approverRoles: string[];
  active: boolean;
  createdAt: string; updatedAt: string;
}

// ===========================================================================
// System 13 — Commerce Analytics
// ===========================================================================
export interface CommerceAnalytics {
  revenue: {
    total: number; currency: string;
    last24h: number; last7d: number; last30d: number;
    byCurrency: Record<string, number>;
    byProductType: Record<ProductType, number>;
    byChannel: Record<string, number>;
  };
  conversion: {
    purchaseStarted: number; purchaseCompleted: number;
    conversionRate: number; abandonedCarts: number;
    avgOrderValue: number;
  };
  subscriptions: {
    active: number; new30d: number; canceled30d: number;
    netGrowth: number; churnRate: number;
    mrr: number; arr: number;
  };
  retention: {
    d1: number; d7: number; d30: number; d90: number;
    repeatPurchaseRate: number;
  };
  purchaseFunnel: {
    viewed: number; addedToCart: number; checkoutStarted: number;
    paymentInitiated: number; completed: number;
  };
  refunds: {
    total: number; totalAmount: number; refundRate: number;
    pendingApproval: number; avgProcessingTimeMs: number;
  };
  currencyCirculation: {
    totalGranted: Record<string, number>;
    totalSpent: Record<string, number>;
    outstanding: Record<string, number>;
  };
  bundlePopularity: Array<{ bundleId: string; soldCount: number; revenue: number }>;
  updatedAt: string;
}

// ===========================================================================
// System 14 — Marketplace Integration
// ===========================================================================
export interface MarketplaceSaleReference {
  saleId: string; listingId: string; sellerId: string; buyerId: string;
  purchaseId: string | null; licenseId: string | null;
  amount: number; currency: string;
  commissionRate: number; commissionAmount: number;
  sellerNetAmount: number;
  occurredAt: string; correlationId: string;
}

export interface MarketplaceOwnershipReference {
  userId: string; listingId: string;
  licenseId: string | null; ownershipType: "purchase" | "subscription" | "grant";
  verified: boolean; verifiedAt: string;
}

// ===========================================================================
// System 15 — Event Bus Bridge
// ===========================================================================
export type CommerceEventType =
  | "PurchaseCompleted" | "PurchaseRefunded" | "PurchaseFailed"
  | "SubscriptionActivated" | "SubscriptionExpired" | "SubscriptionCanceled"
  | "SubscriptionRenewed"
  | "CurrencyGranted" | "CurrencySpent" | "CurrencyRefunded" | "CurrencyExpired"
  | "BundlePurchased" | "OfferActivated" | "OfferExpired" | "OfferRejected"
  | "LicenseGranted" | "LicenseRevoked" | "LicenseExpired"
  | "PaymentFailed" | "PaymentCaptured"
  | "ProductPublished" | "ProductDeprecated" | "ProductRetired"
  | "RefundRequested" | "RefundApproved" | "RefundCompleted"
  | "DiscountApplied" | "CouponRedeemed"
  | "LedgerEntryCreated";

// ===========================================================================
// System 16 — Developer Integration
// ===========================================================================
export interface CommerceDeveloperIntegration {
  publicAPIs: Array<{
    path: string; method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description: string; authRequired: boolean; scope: string;
  }>;
  extensionHooks: Array<{
    id: string; name: string; triggerEvent: CommerceEventType;
    description: string;
  }>;
  sdkMetadata: {
    version: string; language: string; docsUrl: string;
    capabilities: string[];
  };
  webhooks: Array<{
    id: string; event: CommerceEventType; description: string;
  }>;
}

// ===========================================================================
// System 17 — Administration Dashboard
// ===========================================================================
export interface CommerceAdminDashboard {
  products: { total: number; active: number; draft: number; deprecated: number };
  offers: { total: number; active: number; pendingApproval: number; expired: number };
  subscriptions: { active: number; trial: number; canceled30d: number; mrr: number };
  revenue: { today: number; last7d: number; last30d: number; currency: string };
  refunds: { pending: number; completed30d: number; totalAmount30d: number };
  licenses: { active: number; revoked30d: number; expired30d: number };
  currencies: { active: number; totalTransactions30d: number; outstandingVolume: number };
  transactions: { total30d: number; ledgerEntries: number; avgValue: number };
  health: {
    providers: Array<{ provider: PaymentProviderId; status: PaymentProviderStatus }>;
    bridge: { subscribed: boolean; processedCount: number };
    ledger: { entries: number; lastEntryAt: string | null };
  };
  updatedAt: string;
}

// ===========================================================================
// System 18 — Documentation Generator
// ===========================================================================
export interface CommerceDocumentation {
  version: string; generatedAt: string;
  systems: Array<{
    id: number; name: string; description: string;
    endpoints: string[]; events: string[];
  }>;
  events: Array<{
    type: CommerceEventType; payload: string[]; description: string;
  }>;
  ownership: {
    owns: string[]; doesNotOwn: string[];
  };
}
