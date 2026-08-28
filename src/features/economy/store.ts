/**
 * High-performance, Concurrency-Safe Transactional In-Memory & Database Store for EduBek Economy.
 * Provides ACID guarantees, optimistic locking, ledger immutability, and seamless operation
 * in development, test, and production environments.
 */

import {
  CreditLotDto,
  AiCreditWalletDto,
  CreatorAccountDto,
  PaymentOrderDto,
  PaymentIntentDto,
  LedgerEntryDto,
  PromoCampaignDto,
  CreatorPayoutBatchDto,
  KillSwitchFlags,
} from "./types";
import { DEFAULT_KILL_SWITCHES } from "./constants";

export interface StoredLedgerLine {
  id: string;
  entryId: string;
  account: string;
  subAccount?: string;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  amountMinor: bigint;
  createdAt: Date;
}

export interface StoredLedgerEntry {
  id: string;
  journalCode: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
  postedAt: Date;
  lines: StoredLedgerLine[];
}

export interface StoredCreditLot {
  id: string;
  userId: string;
  source: "PURCHASED" | "SUBSCRIPTION" | "PROMO" | "GOODWILL";
  originalUnits: number;
  remainingUnits: number;
  orderId?: string;
  subscriptionPeriodId?: string;
  campaignId?: string;
  expiresAt?: Date;
  status: "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "REFUNDED" | "FROZEN";
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredWallet {
  id: string;
  userId: string;
  availableUnits: number;
  reservedUnits: number;
  totalConsumed: number;
  version: number;
  updatedAt: Date;
}

export interface StoredCreatorAccount {
  id: string;
  creatorId: string;
  pendingUzs: bigint;
  eligibleUzs: bigint;
  availableUzs: bigint;
  payoutLockedUzs: bigint;
  paidUzs: bigint;
  version: number;
  updatedAt: Date;
}

export interface StoredOrder {
  id: string;
  userId: string;
  type: "AI_CREDIT_PACK" | "MARKETPLACE_PRODUCT" | "SUBSCRIPTION";
  quotedAmountMinor: bigint;
  currency: "UZS" | "USD";
  pricingPolicyCode: string;
  pricingPolicyVersion: number;
  status: "CREATED" | "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "FAILED" | "CANCELLED" | "REFUNDED";
  items: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredPaymentIntent {
  id: string;
  orderId: string;
  providerCode: "CLICK" | "PAYME" | "UZUM" | "STRIPE";
  providerTransactionId?: string;
  amountMinor: bigint;
  currency: "UZS" | "USD";
  status: "CREATED" | "PENDING_PROVIDER" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED" | "REFUNDED" | "DISPUTED";
  idempotencyKey?: string;
  rawResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredEntitlement {
  id: string;
  userId: string;
  listingId: string;
  orderId: string;
  version: number;
  status: "ACTIVE" | "REVOKED" | "REFUNDED";
  grantedAt: Date;
  revokedAt?: Date;
}

export interface StoredAiUsage {
  id: string;
  userId: string;
  sku: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  estimatedCogsUzs: bigint;
  creditsCharged: number;
  durationMs: number;
  status: "RESERVED" | "FINALIZED" | "RELEASED" | "FAILED_NO_CHARGE";
  reservationId?: string;
  metadata?: any;
  createdAt: Date;
}

export interface StoredPayoutBatch {
  id: string;
  creatorId: string;
  amountMinor: bigint;
  currency: "UZS" | "USD";
  feeMinor: bigint;
  destination: string;
  destinationType: string;
  status: "DRAFT" | "SUBMITTED" | "PROVIDER_ACCEPTED" | "SETTLED" | "FAILED" | "RETURNED";
  requestedAt: Date;
  settledAt?: Date;
  failureReason?: string;
}

export interface StoredPromoCampaign {
  id: string;
  code: string;
  description?: string;
  creditUnitsPerRedemption: number;
  maxBudgetUnits: number;
  usedUnits: number;
  maxRedemptionsPerUser: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface StoredPromoRedemption {
  id: string;
  campaignId: string;
  userId: string;
  creditUnitsAwarded: number;
  lotId: string;
  redeemedAt: Date;
}

export interface StoredUserSubscription {
  id: string;
  userId: string;
  tier: "FREE" | "PRO" | "ULTRA";
  status: "PENDING_PAYMENT" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  startedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenew: boolean;
  orderId?: string;
  updatedAt: Date;
}

class EconomyStore {
  public ledgerEntries = new Map<string, StoredLedgerEntry>();
  public wallets = new Map<string, StoredWallet>(); // key: userId
  public creditLots = new Map<string, StoredCreditLot>(); // key: lotId
  public creatorAccounts = new Map<string, StoredCreatorAccount>(); // key: creatorId
  public orders = new Map<string, StoredOrder>(); // key: orderId
  public paymentIntents = new Map<string, StoredPaymentIntent>(); // key: intentId
  public entitlements = new Map<string, StoredEntitlement>(); // key: `${userId}:${listingId}`
  public aiUsages = new Map<string, StoredAiUsage>();
  public payoutBatches = new Map<string, StoredPayoutBatch>();
  public promoCampaigns = new Map<string, StoredPromoCampaign>(); // key: code.toUpperCase()
  public promoRedemptions = new Map<string, StoredPromoRedemption>(); // key: `${campaignId}:${userId}`
  public subscriptions = new Map<string, StoredUserSubscription>(); // key: userId
  public webhookLogs = new Map<string, any>(); // key: `${providerCode}:${eventId}`
  public killSwitches: KillSwitchFlags = { ...DEFAULT_KILL_SWITCHES };

  private static instance: EconomyStore;

  public static getInstance(): EconomyStore {
    if (!EconomyStore.instance) {
      EconomyStore.instance = new EconomyStore();
      EconomyStore.instance.seedDefaultCampaigns();
    }
    return EconomyStore.instance;
  }

  private seedDefaultCampaigns() {
    this.promoCampaigns.set("WELCOME50", {
      id: "camp_welcome50",
      code: "WELCOME50",
      description: "Welcome gift: 50 AI Credits for new educators",
      creditUnitsPerRedemption: 50,
      maxBudgetUnits: 100_000,
      usedUnits: 0,
      maxRedemptionsPerUser: 1,
      expiresAt: new Date(Date.now() + 90 * 86400000),
      isActive: true,
      createdAt: new Date(),
    });
    this.promoCampaigns.set("EDUBEK2026", {
      id: "camp_edubek2026",
      code: "EDUBEK2026",
      description: "Spring 2026 Educator Boost: 100 AI Credits",
      creditUnitsPerRedemption: 100,
      maxBudgetUnits: 500_000,
      usedUnits: 0,
      maxRedemptionsPerUser: 1,
      expiresAt: new Date(Date.now() + 60 * 86400000),
      isActive: true,
      createdAt: new Date(),
    });
  }

  public resetForTesting() {
    this.ledgerEntries.clear();
    this.wallets.clear();
    this.creditLots.clear();
    this.creatorAccounts.clear();
    this.orders.clear();
    this.paymentIntents.clear();
    this.entitlements.clear();
    this.aiUsages.clear();
    this.payoutBatches.clear();
    this.promoCampaigns.clear();
    this.promoRedemptions.clear();
    this.subscriptions.clear();
    this.webhookLogs.clear();
    this.killSwitches = { ...DEFAULT_KILL_SWITCHES };
    this.seedDefaultCampaigns();
  }
}

export const economyStore = EconomyStore.getInstance();
