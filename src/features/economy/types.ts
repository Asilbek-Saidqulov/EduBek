export type Currency = "UZS" | "USD";

export type LedgerAccount =
  | "PAYMENT_CLEARING"
  | "UNEARNED_REVENUE"
  | "AI_REVENUE"
  | "MARKETPLACE_COMMISSION_REVENUE"
  | "CREATOR_PAYABLE"
  | "REFUND_RESERVE"
  | "PROMO_EXPENSE"
  | "AI_COGS"
  | "PAYMENT_FEE_EXPENSE"
  | "TAX_PAYABLE";

export type LedgerDirection = "DEBIT" | "CREDIT";

export type CreditLotSource = "PURCHASED" | "SUBSCRIPTION" | "PROMO" | "GOODWILL";

export type CreditLotStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "REFUNDED" | "FROZEN";

export type OrderType = "AI_CREDIT_PACK" | "MARKETPLACE_PRODUCT" | "SUBSCRIPTION";

export type OrderStatus =
  | "CREATED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "FULFILLED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "CREATED"
  | "PENDING_PROVIDER"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELED"
  | "REFUNDED"
  | "DISPUTED";

export type ProviderCode = "CLICK" | "PAYME" | "UZUM" | "STRIPE";

export type CreatorPayoutStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PROVIDER_ACCEPTED"
  | "SETTLED"
  | "FAILED"
  | "RETURNED";

export type SubscriptionStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";

export type SubscriptionTier = "FREE" | "PRO" | "ULTRA";

export interface LedgerLineInput {
  account: LedgerAccount;
  subAccount?: string;
  currency: Currency | "CREDIT";
  direction: LedgerDirection;
  amountMinor: bigint;
}

export interface LedgerEntryDto {
  id: string;
  journalCode: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
  postedAt: string;
  lines: {
    id: string;
    account: LedgerAccount;
    subAccount?: string;
    currency: string;
    direction: LedgerDirection;
    amountMinor: string;
    createdAt: string;
  }[];
}

export interface CreditLotDto {
  id: string;
  userId: string;
  source: CreditLotSource;
  originalUnits: number;
  remainingUnits: number;
  orderId?: string;
  subscriptionPeriodId?: string;
  campaignId?: string;
  expiresAt?: string;
  status: CreditLotStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiCreditWalletDto {
  id: string;
  userId: string;
  availableUnits: number;
  reservedUnits: number;
  totalConsumed: number;
  version: number;
  updatedAt: string;
  expiringSoonUnits?: number;
  nearestExpiration?: string;
}

export interface AiSkuDefinition {
  sku: string;
  title: string;
  description: string;
  baseCredits: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  modelAllowlist: string[];
  timeoutMs: number;
  retryLimit: number;
}

export interface PaymentOrderDto {
  id: string;
  userId: string;
  type: OrderType;
  quotedAmountMinor: string;
  currency: Currency;
  pricingPolicyCode: string;
  pricingPolicyVersion: number;
  status: OrderStatus;
  items: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntentDto {
  id: string;
  orderId: string;
  providerCode: ProviderCode;
  providerTransactionId?: string;
  amountMinor: string;
  currency: Currency;
  status: PaymentStatus;
  idempotencyKey?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorAccountDto {
  id: string;
  creatorId: string;
  pendingUzs: string;
  eligibleUzs: string;
  availableUzs: string;
  payoutLockedUzs: string;
  paidUzs: string;
  version: number;
  updatedAt: string;
}

export interface CreatorPayoutBatchDto {
  id: string;
  creatorId: string;
  amountMinor: string;
  currency: Currency;
  feeMinor: string;
  destination: string;
  destinationType: string;
  status: CreatorPayoutStatus;
  requestedAt: string;
  settledAt?: string;
  failureReason?: string;
}

export interface PromoCampaignDto {
  id: string;
  code: string;
  description?: string;
  creditUnitsPerRedemption: number;
  maxBudgetUnits: number;
  usedUnits: number;
  maxRedemptionsPerUser: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionPlanConfig {
  tier: SubscriptionTier;
  name: string;
  priceMonthlyUzs: bigint;
  priceYearlyUzs: bigint;
  aiCreditsMonthly: number;
  features: string[];
}

export interface ReconciliationDiscrepancy {
  checkCode: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  expected: string;
  actual: string;
  entityId?: string;
}

export interface KillSwitchFlags {
  AI_GLOBAL_OFF?: boolean;
  CREDIT_MINT_OFF?: boolean;
  PROMO_MINT_OFF?: boolean;
  MARKETPLACE_PURCHASE_OFF?: boolean;
  CREATOR_PAYOUT_OFF?: boolean;
  PROVIDER_CLICK_OFF?: boolean;
  ECONOMY_READ_ONLY?: boolean;
  WALLET_FREEZE?: boolean;
  AI_PER_USER_DAILY_COGS_LIMIT?: number; // In UZS minor units
  AI_PER_ACTION_MAX_CREDITS?: number;
}
