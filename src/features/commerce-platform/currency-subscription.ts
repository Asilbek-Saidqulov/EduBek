/** Systems 6, 7 — Virtual Currency Platform + Subscription Platform. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeCurrency, getCurrency, getCurrencyByCode, getAllCurrencies,
  storeBalance, getBalance, getAllBalances,
  storeCurrencyTransaction, getCurrencyTransactions,
  storeExchangeRate, getExchangeRate, getAllExchangeRates,
  storePlan, getPlan, getAllPlans,
  storeSubscription, getSubscription, getAllSubscriptions,
} from "./repository";
import type {
  VirtualCurrency, CurrencyType, CurrencyBalance, CurrencyTransaction, CurrencyTransactionType,
  CurrencyExchangeRate,
  SubscriptionPlan, SubscriptionPlanType, SubscriptionStatus, Subscription,
} from "./types";

const log = getLogger("commerce.currency");

// ===== System 6 — Virtual Currency Platform =====

export function createCurrency(input: {
  code: string; name: string; symbol: string; type: CurrencyType;
  exchangeRateToUsd?: number; expirationDays?: number | null;
  organizationId?: string | null; active?: boolean;
}): VirtualCurrency {
  if (getCurrencyByCode(input.code)) throw new Error(`Currency code already exists: ${input.code}`);
  if (input.exchangeRateToUsd !== undefined && input.exchangeRateToUsd < 0) {
    throw new Error("exchangeRateToUsd must be non-negative");
  }
  const now = new Date().toISOString();
  const currency: VirtualCurrency = {
    id: randomUUID(), code: input.code, name: input.name, symbol: input.symbol,
    type: input.type,
    exchangeRateToUsd: input.exchangeRateToUsd ?? 1,
    expirationDays: input.expirationDays ?? null,
    organizationId: input.organizationId ?? null,
    active: input.active ?? true,
    createdAt: now, updatedAt: now,
  };
  storeCurrency(currency);
  log.info("currency.created", { id: currency.id, code: currency.code });
  return currency;
}

export function getCurrencyById(id: string): VirtualCurrency | null { return getCurrency(id); }
export function getCurrencyByCodeName(code: string): VirtualCurrency | null { return getCurrencyByCode(code); }
export function listCurrencies(type?: CurrencyType, active?: boolean): VirtualCurrency[] {
  let all = getAllCurrencies();
  if (type) all = all.filter(c => c.type === type);
  if (active !== undefined) all = all.filter(c => c.active === active);
  return all;
}

export function deactivateCurrency(currencyId: string): VirtualCurrency | null {
  const c = getCurrency(currencyId);
  if (!c) return null;
  c.active = false; c.updatedAt = new Date().toISOString();
  storeCurrency(c);
  return c;
}

export function getOrCreateBalance(currencyId: string, userId: string): CurrencyBalance {
  let b = getBalance(currencyId, userId);
  if (!b) {
    const currency = getCurrency(currencyId);
    const now = new Date().toISOString();
    b = {
      currencyId, userId, amount: 0, pendingAmount: 0,
      lifetimeGranted: 0, lifetimeSpent: 0,
      expiresAt: currency?.expirationDays ? new Date(Date.now() + currency.expirationDays * 24 * 3600 * 1000).toISOString() : null,
      updatedAt: now,
    };
    storeBalance(b);
  }
  return b;
}

export function getBalanceForUser(currencyId: string, userId: string): CurrencyBalance | null {
  return getBalance(currencyId, userId);
}

export function listAllBalances(currencyId?: string): CurrencyBalance[] {
  const all = getAllBalances();
  return currencyId ? all.filter(b => b.currencyId === currencyId) : all;
}

/**
 * Records a currency transaction.
 * IMPORTANT: This is the ledger primitive. It NEVER grants XP, achievements, cosmetics, etc.
 * Consumers (Inventory/Progression/etc.) must subscribe to CurrencyGranted/CurrencySpent events.
 */
export function recordCurrencyTransaction(input: {
  currencyId: string; userId: string; type: CurrencyTransactionType;
  amount: number; reference?: string | null; correlationId?: string;
  reason: string; metadata?: Record<string, unknown>;
}): CurrencyTransaction {
  if (input.amount === 0) throw new Error("amount must be non-zero");
  const currency = getCurrency(input.currencyId);
  if (!currency) throw new Error(`Currency not found: ${input.currencyId}`);
  const balance = getOrCreateBalance(input.currencyId, input.userId);
  // For "adjust" we preserve the sign of the input amount (allows positive or negative adjustments).
  // For all other types, we coerce the sign based on direction.
  let signedAmount: number;
  if (input.type === "adjust") {
    signedAmount = input.amount;
  } else if (input.type === "spend" || input.type === "exchange_out" || input.type === "expire") {
    signedAmount = -Math.abs(input.amount);
  } else {
    signedAmount = Math.abs(input.amount);
  }
  const newAmount = balance.amount + signedAmount;
  if (newAmount < 0) throw new Error("Insufficient balance");
  balance.amount = newAmount;
  if (input.type === "grant" || input.type === "exchange_in") {
    balance.lifetimeGranted += signedAmount;
  } else if (input.type === "spend" || input.type === "exchange_out" || input.type === "expire") {
    balance.lifetimeSpent += -signedAmount;
  } else if (input.type === "refund") {
    balance.lifetimeGranted += Math.abs(signedAmount);
  } else if (input.type === "adjust") {
    if (signedAmount > 0) balance.lifetimeGranted += signedAmount;
    else balance.lifetimeSpent += -signedAmount;
  }
  balance.updatedAt = new Date().toISOString();
  storeBalance(balance);
  const tx: CurrencyTransaction = {
    id: randomUUID(), currencyId: input.currencyId, userId: input.userId,
    type: input.type, amount: signedAmount, balanceAfter: balance.amount,
    reference: input.reference ?? null,
    correlationId: input.correlationId ?? randomUUID(),
    reason: input.reason, metadata: input.metadata ?? {},
    createdAt: balance.updatedAt,
  };
  storeCurrencyTransaction(tx);
  log.info("currency.tx", { id: tx.id, type: tx.type, userId: input.userId, amount: signedAmount });
  return tx;
}

export function requestCurrencyGrant(input: {
  currencyId: string; userId: string; amount: number;
  reference?: string | null; correlationId?: string; reason: string;
}): CurrencyTransaction {
  return recordCurrencyTransaction({ ...input, type: "grant" });
}

export function requestCurrencySpend(input: {
  currencyId: string; userId: string; amount: number;
  reference?: string | null; correlationId?: string; reason: string;
}): CurrencyTransaction {
  return recordCurrencyTransaction({ ...input, type: "spend" });
}

export function refundCurrencyTransaction(input: {
  currencyId: string; userId: string; amount: number;
  reference?: string | null; correlationId?: string; reason: string;
}): CurrencyTransaction {
  return recordCurrencyTransaction({ ...input, type: "refund" });
}

export function listCurrencyTransactions(currencyId: string, userId?: string): CurrencyTransaction[] {
  return getCurrencyTransactions(currencyId, userId);
}

export function setExchangeRate(fromCurrencyId: string, toCurrencyId: string, rate: number): CurrencyExchangeRate {
  if (rate <= 0) throw new Error("rate must be positive");
  const r: CurrencyExchangeRate = {
    fromCurrencyId, toCurrencyId, rate, active: true,
    updatedAt: new Date().toISOString(),
  };
  storeExchangeRate(r);
  return r;
}

export function getExchangeRateForPair(from: string, to: string): CurrencyExchangeRate | null {
  return getExchangeRate(from, to);
}

export function listExchangeRates(): CurrencyExchangeRate[] { return getAllExchangeRates(); }

export function convertCurrency(amount: number, fromCurrencyId: string, toCurrencyId: string): { converted: number; rate: number } | null {
  if (fromCurrencyId === toCurrencyId) return { converted: amount, rate: 1 };
  const r = getExchangeRate(fromCurrencyId, toCurrencyId);
  if (!r || !r.active) return null;
  return { converted: amount * r.rate, rate: r.rate };
}

export function supportsAllCurrencyTypes(): CurrencyType[] {
  return ["soft", "hard", "premium", "organization"];
}
export function supportsAllCurrencyTransactionTypes(): CurrencyTransactionType[] {
  return ["grant", "spend", "refund", "exchange_in", "exchange_out", "expire", "adjust"];
}

// ===== System 7 — Subscription Platform =====

export function createSubscriptionPlan(input: {
  name: string; description: string;
  type: SubscriptionPlanType;
  price: number; currency: string;
  billingCycle: "monthly" | "quarterly" | "annual" | "lifetime";
  trialDays?: number; gracePeriodDays?: number;
  benefitRefs?: string[]; maxSeats?: number | null;
  organizationId?: string | null; active?: boolean;
  metadata?: Record<string, unknown>;
}): SubscriptionPlan {
  if (input.price < 0) throw new Error("price must be non-negative");
  if (input.trialDays !== undefined && input.trialDays < 0) throw new Error("trialDays must be non-negative");
  if (input.gracePeriodDays !== undefined && input.gracePeriodDays < 0) throw new Error("gracePeriodDays must be non-negative");
  const now = new Date().toISOString();
  const plan: SubscriptionPlan = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, price: input.price, currency: input.currency,
    billingCycle: input.billingCycle,
    trialDays: input.trialDays ?? 0, gracePeriodDays: input.gracePeriodDays ?? 7,
    benefitRefs: input.benefitRefs ?? [], maxSeats: input.maxSeats ?? null,
    organizationId: input.organizationId ?? null, active: input.active ?? true,
    createdAt: now, updatedAt: now, metadata: input.metadata ?? {},
  };
  storePlan(plan);
  log.info("plan.created", { id: plan.id, type: plan.type });
  return plan;
}

export function getPlanById(id: string): SubscriptionPlan | null { return getPlan(id); }
export function listPlans(type?: SubscriptionPlanType, active?: boolean): SubscriptionPlan[] {
  let all = getAllPlans();
  if (type) all = all.filter(p => p.type === type);
  if (active !== undefined) all = all.filter(p => p.active === active);
  return all;
}

export function deactivatePlan(planId: string): SubscriptionPlan | null {
  const p = getPlan(planId);
  if (!p) return null;
  p.active = false; p.updatedAt = new Date().toISOString();
  storePlan(p);
  return p;
}

export function createSubscription(input: {
  planId: string; userId: string; organizationId?: string | null;
  seatCount?: number; autoRenew?: boolean;
  correlationId?: string; metadata?: Record<string, unknown>;
}): Subscription {
  const plan = getPlan(input.planId);
  if (!plan) throw new Error(`Plan not found: ${input.planId}`);
  if (!plan.active) throw new Error("Plan is not active");
  if (plan.maxSeats !== null && (input.seatCount ?? 1) > plan.maxSeats) {
    throw new Error("Exceeds max seats");
  }
  const now = new Date();
  const nowIso = now.toISOString();
  let endDate: string | null;
  if (plan.billingCycle === "lifetime") {
    endDate = null;
  } else {
    const months = plan.billingCycle === "monthly" ? 1 : plan.billingCycle === "quarterly" ? 3 : 12;
    endDate = new Date(now.getTime() + months * 30 * 24 * 3600 * 1000).toISOString();
  }
  const trialEndsAt = plan.trialDays > 0
    ? new Date(now.getTime() + plan.trialDays * 24 * 3600 * 1000).toISOString()
    : null;
  const gracePeriodEndsAt = endDate
    ? new Date(new Date(endDate).getTime() + plan.gracePeriodDays * 24 * 3600 * 1000).toISOString()
    : null;
  const sub: Subscription = {
    id: randomUUID(), planId: input.planId, userId: input.userId,
    status: trialEndsAt ? "trial" : "active",
    startDate: nowIso, endDate,
    trialEndsAt, gracePeriodEndsAt,
    canceledAt: null, expiredAt: null,
    seatCount: input.seatCount ?? 1, organizationId: input.organizationId ?? null,
    autoRenew: input.autoRenew ?? true,
    benefitRefs: plan.benefitRefs,
    correlationId: input.correlationId ?? randomUUID(),
    createdAt: nowIso, updatedAt: nowIso,
    metadata: input.metadata ?? {},
  };
  storeSubscription(sub);
  log.info("subscription.created", { id: sub.id, planId: input.planId, status: sub.status });
  return sub;
}

export function getSubscriptionById(id: string): Subscription | null { return getSubscription(id); }
export function listSubscriptions(status?: SubscriptionStatus, userId?: string): Subscription[] {
  let all = getAllSubscriptions();
  if (status) all = all.filter(s => s.status === status);
  if (userId) all = all.filter(s => s.userId === userId);
  return all;
}

const VALID_SUB_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  trial: ["active", "canceled", "expired"],
  active: ["past_due", "grace_period", "canceled", "paused"],
  past_due: ["grace_period", "active", "canceled", "expired"],
  grace_period: ["active", "canceled", "expired"],
  canceled: ["expired"],
  expired: [],
  paused: ["active", "canceled"],
};

export function canTransitionSubscription(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return VALID_SUB_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionSubscription(id: string, to: SubscriptionStatus, reason?: string): Subscription | null {
  const s = getSubscription(id);
  if (!s) return null;
  if (!canTransitionSubscription(s.status, to)) return null;
  const now = new Date().toISOString();
  s.status = to; s.updatedAt = now;
  if (to === "canceled") s.canceledAt = now;
  if (to === "expired") s.expiredAt = now;
  if (reason) s.metadata.transitionReason = reason;
  storeSubscription(s);
  return s;
}

export function renewSubscription(id: string): Subscription | null {
  const s = getSubscription(id);
  if (!s) return null;
  const plan = getPlan(s.planId);
  if (!plan) return null;
  if (plan.billingCycle === "lifetime") return s;
  const now = new Date();
  const months = plan.billingCycle === "monthly" ? 1 : plan.billingCycle === "quarterly" ? 3 : 12;
  s.endDate = new Date(now.getTime() + months * 30 * 24 * 3600 * 1000).toISOString();
  s.gracePeriodEndsAt = new Date(new Date(s.endDate).getTime() + plan.gracePeriodDays * 24 * 3600 * 1000).toISOString();
  s.status = "active"; s.updatedAt = now.toISOString();
  storeSubscription(s);
  return s;
}

export function cancelSubscription(id: string, reason?: string): Subscription | null {
  return transitionSubscription(id, "canceled", reason);
}

export function expireSubscription(id: string): Subscription | null {
  return transitionSubscription(id, "expired");
}

export function pauseSubscription(id: string): Subscription | null {
  return transitionSubscription(id, "paused");
}

export function resumeSubscription(id: string): Subscription | null {
  return transitionSubscription(id, "active");
}

export function supportsAllSubscriptionPlanTypes(): SubscriptionPlanType[] {
  return ["individual", "family", "organization", "school", "district", "enterprise"];
}
export function supportsAllSubscriptionStatuses(): SubscriptionStatus[] {
  return ["trial", "active", "past_due", "grace_period", "canceled", "expired", "paused"];
}
