/**
 * EduBek — Enterprise Operations repository.
 * Thin Prisma layer. Reuses existing models (Organization, OrganizationBilling,
 * SubscriptionPlan, UserSubscription, Invoice, Transaction, Wallet, EduTokenLedger,
 * MarketplacePurchase, CreatorEarning, CloudJob, CostSnapshot).
 */
import { db } from "@/lib/db";

// ===========================================================================
// Organizations (reuse existing)
// ===========================================================================

export async function fetchOrganizations(limit = 200) {
  return db.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, slug: true, type: true, ownerId: true, country: true, plan: true, seats: true, createdAt: true, updatedAt: true },
  }).catch(() => []);
}

export async function fetchOrganization(id: string) {
  return db.organization.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, type: true, ownerId: true, billingEmail: true, country: true, plan: true, seats: true, createdAt: true, updatedAt: true },
  }).catch(() => null);
}

export async function countOrganizations() {
  return db.organization.count().catch(() => 0);
}

export async function countOrganizationsSince(since: Date) {
  return db.organization.count({ where: { createdAt: { gte: since } } }).catch(() => 0);
}

// ===========================================================================
// Organization billing (reuse existing)
// ===========================================================================

export async function fetchOrgBilling(orgId: string) {
  return db.organizationBilling.findUnique({ where: { orgId } }).catch(() => null);
}

export async function fetchAllBilling(limit = 200) {
  return db.organizationBilling.findMany({ take: limit, select: { id: true, orgId: true, plan: true, seats: true, renewalAt: true, balance: true } }).catch(() => []);
}

// ===========================================================================
// Subscriptions (reuse existing)
// ===========================================================================

export async function fetchSubscriptionPlans() {
  return db.subscriptionPlan.findMany({
    where: { isActive: true },
    select: { id: true, name: true, tier: true, priceMonthly: true, priceYearly: true, currency: true, aiCreditsMonthly: true, features: true },
  }).catch(() => []);
}

export async function fetchUserSubscriptions(limit = 500) {
  return db.userSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, userId: true, planId: true, status: true, startDate: true, endDate: true, createdAt: true, updatedAt: true },
  }).catch(() => []);
}

export async function countActiveSubscriptions() {
  return db.userSubscription.count({ where: { status: "active" } }).catch(() => 0);
}

// ===========================================================================
// Invoices (reuse existing)
// ===========================================================================

export async function fetchInvoices(limit = 200) {
  return db.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: limit,
    select: { id: true, userId: true, number: true, amount: true, currency: true, tax: true, status: true, issuedAt: true, dueAt: true, pdfUrl: true },
  }).catch(() => []);
}

export async function fetchInvoiceAggregate() {
  return db.invoice.aggregate({
    _sum: { amount: true, tax: true },
    _count: true,
  }).catch(() => ({ _sum: { amount: 0, tax: 0 }, _count: 0 }));
}

// ===========================================================================
// Transactions (reuse existing)
// ===========================================================================

export async function fetchTransactions(limit = 500) {
  return db.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, userId: true, amount: true, currency: true, status: true, paymentProvider: true, createdAt: true },
  }).catch(() => []);
}

export async function aggregateTransactionRevenue(since?: Date) {
  const where: Record<string, unknown> = { status: "completed" };
  if (since) where.createdAt = { gte: since };
  return db.transaction.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));
}

// ===========================================================================
// Refunds (reuse existing)
// ===========================================================================

export async function fetchRefunds(limit = 100) {
  return db.transactionRefund.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, transactionId: true, amount: true, currency: true, status: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Wallet / Credits (reuse existing)
// ===========================================================================

export async function fetchWallets(limit = 200) {
  return db.wallet.findMany({
    take: limit,
    select: { id: true, userId: true, balance: true, currency: true, createdAt: true, updatedAt: true },
  }).catch(() => []);
}

export async function fetchEduTokenLedger(limit = 500) {
  return db.eduTokenLedger.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, userId: true, amount: true, type: true, description: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Marketplace (reuse existing)
// ===========================================================================

export async function fetchMarketplacePurchases(limit = 500) {
  return db.marketplacePurchase.findMany({
    orderBy: { purchasedAt: "desc" },
    take: limit,
    select: { id: true, buyerId: true, listingId: true, amountPaid: true, currency: true, licenseType: true, purchasedAt: true },
  }).catch(() => []);
}

export async function aggregateMarketplaceRevenue(since?: Date) {
  const where: Record<string, unknown> = {};
  if (since) where.purchasedAt = { gte: since };
  return db.marketplacePurchase.aggregate({
    where,
    _sum: { amountPaid: true },
    _count: true,
  }).catch(() => ({ _sum: { amountPaid: 0 }, _count: 0 }));
}

// ===========================================================================
// Creator earnings (reuse existing)
// ===========================================================================

export async function fetchCreatorEarnings(limit = 200) {
  return db.creatorEarning.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, creatorId: true, amount: true, currency: true, type: true, status: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Cloud cost snapshots (reuse existing)
// ===========================================================================

export async function fetchCostSnapshots(limit = 100) {
  return db.costSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, day: true, organizationId: true, totalCredits: true, estimatedUsd: true, byService: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// Cloud jobs (reuse existing — for deployment tracking)
// ===========================================================================

export async function fetchCloudWorkers() {
  return db.cloudWorker.findMany({
    select: { id: true, status: true, lastHeartbeatAt: true, createdAt: true },
  }).catch(() => []);
}

// ===========================================================================
// AI invocations (reuse existing — for AI cost tracking)
// ===========================================================================

export async function fetchAIInvocationCost(since?: Date) {
  const where: Record<string, unknown> = {};
  if (since) where.createdAt = { gte: since };
  return db.orchestratorAIInvocation.aggregate({
    where,
    _sum: { costUsd: true },
    _count: true,
  }).catch(() => ({ _sum: { costUsd: 0 }, _count: 0 }));
}

// ===========================================================================
// Users (reuse existing — for user counts)
// ===========================================================================

export async function countUsers() {
  return db.user.count().catch(() => 0);
}

export async function countUsersSince(since: Date) {
  return db.user.count({ where: { createdAt: { gte: since } } }).catch(() => 0);
}

export async function countActiveUsersSince(since: Date) {
  return db.user.count({ where: { updatedAt: { gte: since } } }).catch(() => 0);
}

// ===========================================================================
// Helpers
// ===========================================================================

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
