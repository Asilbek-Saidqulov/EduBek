/** Systems 14, 16, 17 — Marketplace Integration + Developer Integration + Admin Dashboard. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeMarketplaceSale, getMarketplaceSale, getAllMarketplaceSales,
  storeMarketplaceOwnership, getMarketplaceOwnership, getAllMarketplaceOwnership,
  getAllProducts, getAllBundles, getAllOffers,
  getAllSubscriptions, getAllLicenses, getAllPurchases,
  getAllCurrencies, getCurrencyTransactions, getAllProviders,
  getLedgerCount, getLastLedgerEntry, getAllRefunds,
} from "./repository";
import type {
  MarketplaceSaleReference, MarketplaceOwnershipReference,
  CommerceDeveloperIntegration, CommerceAdminDashboard, CommerceEventType,
} from "./types";
import { isCommerceSubscribed, getBridgeProcessedCount } from "./event-bus-bridge";

const log = getLogger("commerce.integration");

// ===== System 14 — Marketplace Integration =====

/**
 * Records a marketplace sale reference. Commerce does NOT own marketplace state —
 * it only keeps a reference for analytics, ledger correlation, and ownership verification.
 */
export function recordMarketplaceSale(input: {
  saleId: string; listingId: string; sellerId: string; buyerId: string;
  purchaseId?: string | null; licenseId?: string | null;
  amount: number; currency: string;
  commissionRate: number; correlationId?: string;
}): MarketplaceSaleReference {
  const commissionAmount = (input.amount * input.commissionRate) / 100;
  const ref: MarketplaceSaleReference = {
    saleId: input.saleId, listingId: input.listingId,
    sellerId: input.sellerId, buyerId: input.buyerId,
    purchaseId: input.purchaseId ?? null, licenseId: input.licenseId ?? null,
    amount: input.amount, currency: input.currency,
    commissionRate: input.commissionRate, commissionAmount,
    sellerNetAmount: input.amount - commissionAmount,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId ?? randomUUID(),
  };
  storeMarketplaceSale(ref);
  log.info("marketplace.sale.recorded", { saleId: ref.saleId });
  return ref;
}

export function getMarketplaceSaleById(id: string): MarketplaceSaleReference | null { return getMarketplaceSale(id); }
export function listMarketplaceSales(sellerId?: string, buyerId?: string): MarketplaceSaleReference[] {
  let all = getAllMarketplaceSales();
  if (sellerId) all = all.filter(s => s.sellerId === sellerId);
  if (buyerId) all = all.filter(s => s.buyerId === buyerId);
  return all;
}

export function recordMarketplaceOwnership(input: {
  userId: string; listingId: string; licenseId?: string | null;
  ownershipType: "purchase" | "subscription" | "grant";
  verified?: boolean;
}): MarketplaceOwnershipReference {
  const ref: MarketplaceOwnershipReference = {
    userId: input.userId, listingId: input.listingId,
    licenseId: input.licenseId ?? null,
    ownershipType: input.ownershipType,
    verified: input.verified ?? true,
    verifiedAt: new Date().toISOString(),
  };
  storeMarketplaceOwnership(ref);
  return ref;
}

export function verifyMarketplaceOwnership(userId: string, listingId: string): { owns: boolean; reference: MarketplaceOwnershipReference | null } {
  const ref = getMarketplaceOwnership(userId, listingId);
  return { owns: ref !== null && ref.verified, reference: ref };
}

export function listMarketplaceOwnership(userId?: string): MarketplaceOwnershipReference[] {
  const all = getAllMarketplaceOwnership();
  return userId ? all.filter(o => o.userId === userId) : all;
}

// ===== System 16 — Developer Integration =====

export function getDeveloperIntegration(): CommerceDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/commerce-platform/products", method: "GET", description: "List products", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/products", method: "POST", description: "Create product", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/bundles", method: "GET", description: "List bundles", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/bundles", method: "POST", description: "Create bundle", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/offers", method: "GET", description: "List offers", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/offers", method: "POST", description: "Create offer", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/discounts", method: "GET", description: "List discounts", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/discounts", method: "POST", description: "Create discount", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/currencies", method: "GET", description: "List currencies", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/currencies", method: "POST", description: "Create currency", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/subscriptions", method: "GET", description: "List subscriptions", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/subscriptions", method: "POST", description: "Create subscription", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/licenses", method: "GET", description: "List licenses", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/licenses", method: "POST", description: "Issue license", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/purchases", method: "GET", description: "List purchases", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/purchases", method: "POST", description: "Create purchase", authRequired: true, scope: "user" },
      { path: "/api/commerce-platform/providers", method: "GET", description: "List providers", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/ledger", method: "GET", description: "List ledger entries", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/refunds", method: "GET", description: "List refunds", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/analytics", method: "GET", description: "Commerce analytics", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/marketplace", method: "GET", description: "Marketplace references", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/dashboard", method: "GET", description: "Admin dashboard", authRequired: true, scope: "admin" },
      { path: "/api/commerce-platform/developer", method: "GET", description: "Developer integration metadata", authRequired: false, scope: "read" },
      { path: "/api/commerce-platform/status", method: "GET", description: "Platform status", authRequired: false, scope: "read" },
    ],
    extensionHooks: [
      { id: "hook_purchase_completed", name: "On Purchase Completed", triggerEvent: "PurchaseCompleted", description: "Triggered when a purchase reaches completed status" },
      { id: "hook_purchase_refunded", name: "On Purchase Refunded", triggerEvent: "PurchaseRefunded", description: "Triggered when a refund is completed" },
      { id: "hook_subscription_activated", name: "On Subscription Activated", triggerEvent: "SubscriptionActivated", description: "Triggered when a subscription becomes active" },
      { id: "hook_currency_granted", name: "On Currency Granted", triggerEvent: "CurrencyGranted", description: "Triggered when currency is granted to a user" },
      { id: "hook_license_granted", name: "On License Granted", triggerEvent: "LicenseGranted", description: "Triggered when a license is issued" },
      { id: "hook_offer_activated", name: "On Offer Activated", triggerEvent: "OfferActivated", description: "Triggered when an offer goes active" },
      { id: "hook_payment_captured", name: "On Payment Captured", triggerEvent: "PaymentCaptured", description: "Triggered when a payment is captured" },
      { id: "hook_payment_failed", name: "On Payment Failed", triggerEvent: "PaymentFailed", description: "Triggered when a payment fails" },
    ],
    sdkMetadata: {
      version: "1.0.0", language: "typescript",
      docsUrl: "/docs/commerce-platform",
      capabilities: ["products", "bundles", "offers", "discounts", "currencies", "subscriptions", "licenses", "purchases", "payments", "ledger", "refunds", "analytics", "marketplace"],
    },
    webhooks: [
      { id: "wh_purchase_completed", event: "PurchaseCompleted", description: "Fired when a purchase is completed" },
      { id: "wh_purchase_refunded", event: "PurchaseRefunded", description: "Fired when a refund is processed" },
      { id: "wh_subscription_activated", event: "SubscriptionActivated", description: "Fired when a subscription activates" },
      { id: "wh_subscription_expired", event: "SubscriptionExpired", description: "Fired when a subscription expires" },
      { id: "wh_currency_granted", event: "CurrencyGranted", description: "Fired when currency is granted" },
      { id: "wh_currency_spent", event: "CurrencySpent", description: "Fired when currency is spent" },
      { id: "wh_license_granted", event: "LicenseGranted", description: "Fired when a license is granted" },
      { id: "wh_license_revoked", event: "LicenseRevoked", description: "Fired when a license is revoked" },
    ],
  };
}

// ===== System 17 — Administration Dashboard =====

export function generateAdminDashboard(): CommerceAdminDashboard {
  const products = getAllProducts();
  const offers = getAllOffers();
  const subs = getAllSubscriptions();
  const purchases = getAllPurchases();
  const refunds = getAllRefunds();
  const licenses = getAllLicenses();
  const currencies = getAllCurrencies();
  const providers = getAllProviders();
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const completedPurchases30d = purchases.filter(p => p.completedAt && now - new Date(p.completedAt).getTime() < 30 * day);
  const completedRefunds30d = refunds.filter(r => r.status === "completed" && r.completedAt && now - new Date(r.completedAt).getTime() < 30 * day);
  const canceledSubs30d = subs.filter(s => s.canceledAt && now - new Date(s.canceledAt).getTime() < 30 * day);
  const revokedLicenses30d = licenses.filter(l => l.revokedAt && now - new Date(l.revokedAt).getTime() < 30 * day);
  const expiredLicenses30d = licenses.filter(l => l.expiresAt && now - new Date(l.expiresAt).getTime() < 30 * day);
  const currencyTxs30d = currencies.reduce((s, c) => {
    return s + getCurrencyTransactions(c.id).filter(t => now - new Date(t.createdAt).getTime() < 30 * day).length;
  }, 0);
  const outstandingVolume = currencies.reduce((s, c) => {
    return s + getCurrencyTransactions(c.id).filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  }, 0);
  const revenueToday = purchases.filter(p => p.completedAt && now - new Date(p.completedAt).getTime() < day).reduce((s, p) => s + p.total, 0);
  const revenue7d = purchases.filter(p => p.completedAt && now - new Date(p.completedAt).getTime() < 7 * day).reduce((s, p) => s + p.total, 0);
  const revenue30d = completedPurchases30d.reduce((s, p) => s + p.total, 0);
  const lastEntry = getLastLedgerEntry();
  return {
    products: {
      total: products.length,
      active: products.filter(p => p.status === "active").length,
      draft: products.filter(p => p.status === "draft").length,
      deprecated: products.filter(p => p.status === "deprecated").length,
    },
    offers: {
      total: offers.length,
      active: offers.filter(o => o.status === "active").length,
      pendingApproval: offers.filter(o => o.status === "pending_approval").length,
      expired: offers.filter(o => o.status === "expired").length,
    },
    subscriptions: {
      active: subs.filter(s => s.status === "active").length,
      trial: subs.filter(s => s.status === "trial").length,
      canceled30d: canceledSubs30d.length,
      mrr: subs.filter(s => s.status === "active").length * 10,
    },
    revenue: { today: revenueToday, last7d: revenue7d, last30d: revenue30d, currency: "USD" },
    refunds: {
      pending: refunds.filter(r => r.status === "requested" || r.status === "approved" || r.status === "processing").length,
      completed30d: completedRefunds30d.length,
      totalAmount30d: completedRefunds30d.reduce((s, r) => s + r.amount, 0),
    },
    licenses: {
      active: licenses.filter(l => l.status === "active").length,
      revoked30d: revokedLicenses30d.length,
      expired30d: expiredLicenses30d.length,
    },
    currencies: {
      active: currencies.filter(c => c.active).length,
      totalTransactions30d: currencyTxs30d,
      outstandingVolume,
    },
    transactions: {
      total30d: completedPurchases30d.length,
      ledgerEntries: getLedgerCount(),
      avgValue: completedPurchases30d.length > 0 ? revenue30d / completedPurchases30d.length : 0,
    },
    health: {
      providers: providers.map(p => ({ provider: p.id, status: p.status })),
      bridge: { subscribed: isCommerceSubscribed(), processedCount: getBridgeProcessedCount() },
      ledger: { entries: getLedgerCount(), lastEntryAt: lastEntry?.createdAt ?? null },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function getCommerceStatus(): { operational: boolean; systems: number; bridgeSubscribed: boolean; ledgerEntries: number; updatedAt: string } {
  return {
    operational: true, systems: 18,
    bridgeSubscribed: isCommerceSubscribed(),
    ledgerEntries: getLedgerCount(),
    updatedAt: new Date().toISOString(),
  };
}
