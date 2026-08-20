/** Systems 8, 9, 10 — License Platform + Purchase Processing + Payment Provider Abstraction. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeLicense, getLicense, getLicenseByKey, getAllLicenses,
  storePurchase, getPurchase, getAllPurchases,
  storeProvider, getProvider, getAllProviders,
  storePaymentIntent, getPaymentIntent, getAllPaymentIntents,
  getProduct, getBundle, getOffer,
} from "./repository";
import type {
  License, LicenseType, LicenseStatus, LicenseVerificationResult,
  Purchase, PurchaseStatus, PurchaseItem,
  PaymentProviderId, PaymentProviderConfig, PaymentProviderStatus, PaymentIntent,
} from "./types";
import { canTransitionPurchase } from "./types";
import { publishCommerceEvent } from "./event-bus-bridge";

const log = getLogger("commerce.license-purchase");

// ===== System 8 — License Platform =====

export function issueLicense(input: {
  type: LicenseType;
  productId?: string | null; extensionId?: string | null; listingId?: string | null;
  ownerId: string; organizationId?: string | null;
  maxActivations?: number; expiresAt?: string | null;
  correlationId?: string; metadata?: Record<string, unknown>;
}): License {
  const now = new Date().toISOString();
  const license: License = {
    id: randomUUID(), type: input.type,
    productId: input.productId ?? null, extensionId: input.extensionId ?? null, listingId: input.listingId ?? null,
    ownerId: input.ownerId, organizationId: input.organizationId ?? null,
    status: "pending",
    key: generateLicenseKey(),
    activationCount: 0, maxActivations: input.maxActivations ?? 1,
    issuedAt: now, activatedAt: null,
    expiresAt: input.expiresAt ?? null, revokedAt: null,
    revocationReason: null,
    correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeLicense(license);
  log.info("license.issued", { id: license.id, type: license.type });
  publishCommerceEvent("LicenseGranted", license.ownerId, {
    licenseId: license.id, licenseType: license.type, ownerId: license.ownerId,
    correlationId: license.correlationId,
  });
  return license;
}

function generateLicenseKey(): string {
  // Deterministic format — no randomness beyond crypto.uuid
  const parts = [
    randomUUID().slice(0, 8).toUpperCase(),
    randomUUID().slice(0, 4).toUpperCase(),
    randomUUID().slice(0, 4).toUpperCase(),
    randomUUID().slice(0, 12).toUpperCase(),
  ];
  return parts.join("-");
}

export function getLicenseById(id: string): License | null { return getLicense(id); }
export function getLicenseByKeyString(key: string): License | null { return getLicenseByKey(key); }
export function listLicenses(status?: LicenseStatus, type?: LicenseType): License[] {
  let all = getAllLicenses();
  if (status) all = all.filter(l => l.status === status);
  if (type) all = all.filter(l => l.type === type);
  return all;
}

export function activateLicense(licenseId: string, ownerId: string): License | null {
  const l = getLicense(licenseId);
  if (!l) return null;
  if (l.ownerId !== ownerId) return null;
  if (l.status === "revoked" || l.status === "expired") return null;
  if (l.activationCount >= l.maxActivations) return null;
  if (l.expiresAt && new Date(l.expiresAt).getTime() < Date.now()) {
    l.status = "expired";
    storeLicense(l);
    return null;
  }
  l.activationCount += 1;
  if (l.status === "pending") {
    l.status = "active";
    l.activatedAt = new Date().toISOString();
  }
  storeLicense(l);
  return l;
}

export function verifyLicense(licenseId: string, ownerId: string): LicenseVerificationResult {
  const l = getLicense(licenseId);
  const verifiedAt = new Date().toISOString();
  if (!l) {
    return { valid: false, licenseId, status: "pending", ownerId, reason: "not_found", verifiedAt };
  }
  if (l.ownerId !== ownerId) {
    return { valid: false, licenseId: l.id, status: l.status, ownerId, reason: "owner_mismatch", verifiedAt };
  }
  if (l.status === "revoked") {
    return { valid: false, licenseId: l.id, status: l.status, ownerId, reason: "revoked", verifiedAt };
  }
  if (l.status === "expired" || (l.expiresAt && new Date(l.expiresAt).getTime() < Date.now())) {
    l.status = "expired";
    storeLicense(l);
    return { valid: false, licenseId: l.id, status: "expired", ownerId, reason: "expired", verifiedAt };
  }
  if (l.status === "pending") {
    return { valid: false, licenseId: l.id, status: "pending", ownerId, reason: "not_activated", verifiedAt };
  }
  if (l.status === "suspended") {
    return { valid: false, licenseId: l.id, status: "suspended", ownerId, reason: "suspended", verifiedAt };
  }
  return { valid: true, licenseId: l.id, status: l.status, ownerId, reason: null, verifiedAt };
}

export function revokeLicense(licenseId: string, reason: string, revokedBy: string): License | null {
  const l = getLicense(licenseId);
  if (!l) return null;
  if (l.status === "revoked") return null;
  l.status = "revoked";
  l.revokedAt = new Date().toISOString();
  l.revocationReason = reason;
  l.metadata.revokedBy = revokedBy;
  storeLicense(l);
  publishCommerceEvent("LicenseRevoked", l.ownerId, {
    licenseId: l.id, reason, correlationId: l.correlationId,
  });
  return l;
}

export function suspendLicense(licenseId: string, reason: string): License | null {
  const l = getLicense(licenseId);
  if (!l) return null;
  if (l.status !== "active") return null;
  l.status = "suspended";
  l.metadata.suspensionReason = reason;
  storeLicense(l);
  return l;
}

export function reactivateLicense(licenseId: string): License | null {
  const l = getLicense(licenseId);
  if (!l) return null;
  if (l.status !== "suspended") return null;
  l.status = "active";
  storeLicense(l);
  return l;
}

export function expireLicense(licenseId: string): License | null {
  const l = getLicense(licenseId);
  if (!l) return null;
  if (l.status === "expired" || l.status === "revoked") return null;
  l.status = "expired";
  storeLicense(l);
  publishCommerceEvent("LicenseExpired", l.ownerId, {
    licenseId: l.id, correlationId: l.correlationId,
  });
  return l;
}

export function supportsAllLicenseTypes(): LicenseType[] {
  return ["organization", "extension", "marketplace", "individual", "site"];
}
export function supportsAllLicenseStatuses(): LicenseStatus[] {
  return ["active", "revoked", "expired", "pending", "suspended"];
}

// ===== System 10 — Payment Provider Abstraction =====

export function registerProvider(input: {
  id: PaymentProviderId; name: string; status?: PaymentProviderStatus;
  supportedCurrencies?: string[]; supportedMethods?: string[];
  minAmount?: number; maxAmount?: number | null;
  webhookUrl?: string | null; sandboxMode?: boolean;
  metadata?: Record<string, unknown>;
}): PaymentProviderConfig {
  const provider: PaymentProviderConfig = {
    id: input.id, name: input.name,
    status: input.status ?? "active",
    supportedCurrencies: input.supportedCurrencies ?? [],
    supportedMethods: input.supportedMethods ?? [],
    minAmount: input.minAmount ?? 0, maxAmount: input.maxAmount ?? null,
    webhookUrl: input.webhookUrl ?? null,
    sandboxMode: input.sandboxMode ?? true,
    metadata: input.metadata ?? {},
  };
  storeProvider(provider);
  log.info("provider.registered", { id: provider.id });
  return provider;
}

export function getProviderById(id: PaymentProviderId): PaymentProviderConfig | null { return getProvider(id); }
export function listProviders(status?: PaymentProviderStatus): PaymentProviderConfig[] {
  const all = getAllProviders();
  return status ? all.filter(p => p.status === status) : all;
}

export function isProviderAvailable(providerId: PaymentProviderId, amount: number, currency: string): boolean {
  const p = getProvider(providerId);
  if (!p) return false;
  if (p.status !== "active") return false;
  if (p.supportedCurrencies.length > 0 && !p.supportedCurrencies.includes(currency)) return false;
  if (amount < p.minAmount) return false;
  if (p.maxAmount !== null && amount > p.maxAmount) return false;
  return true;
}

export function createPaymentIntent(input: {
  providerId: PaymentProviderId; purchaseId: string;
  amount: number; currency: string;
  metadata?: Record<string, unknown>;
}): PaymentIntent {
  if (!isProviderAvailable(input.providerId, input.amount, input.currency)) {
    throw new Error(`Provider ${input.providerId} not available for ${input.amount} ${input.currency}`);
  }
  const intent: PaymentIntent = {
    id: randomUUID(), providerId: input.providerId, purchaseId: input.purchaseId,
    amount: input.amount, currency: input.currency,
    status: "initiated", providerReference: null,
    initiatedAt: new Date().toISOString(), capturedAt: null,
    failureReason: null, metadata: input.metadata ?? {},
  };
  storePaymentIntent(intent);
  log.info("payment_intent.created", { id: intent.id, provider: input.providerId });
  return intent;
}

export function getPaymentIntentById(id: string): PaymentIntent | null { return getPaymentIntent(id); }
export function listPaymentIntents(providerId?: PaymentProviderId): PaymentIntent[] {
  const all = getAllPaymentIntents();
  return providerId ? all.filter(i => i.providerId === providerId) : all;
}

export function authorizePaymentIntent(intentId: string, providerReference: string): PaymentIntent | null {
  const i = getPaymentIntent(intentId);
  if (!i) return null;
  if (i.status !== "initiated") return null;
  i.status = "authorized"; i.providerReference = providerReference;
  storePaymentIntent(i);
  return i;
}

export function capturePaymentIntent(intentId: string): PaymentIntent | null {
  const i = getPaymentIntent(intentId);
  if (!i) return null;
  if (i.status !== "authorized") return null;
  i.status = "captured"; i.capturedAt = new Date().toISOString();
  storePaymentIntent(i);
  publishCommerceEvent("PaymentCaptured", null, {
    intentId: i.id, purchaseId: i.purchaseId, amount: i.amount, currency: i.currency,
  });
  return i;
}

export function failPaymentIntent(intentId: string, reason: string): PaymentIntent | null {
  const i = getPaymentIntent(intentId);
  if (!i) return null;
  if (i.status === "captured" || i.status === "refunded") return null;
  i.status = "failed"; i.failureReason = reason;
  storePaymentIntent(i);
  publishCommerceEvent("PaymentFailed", null, {
    intentId: i.id, purchaseId: i.purchaseId, reason,
  });
  return i;
}

export function voidPaymentIntent(intentId: string): PaymentIntent | null {
  const i = getPaymentIntent(intentId);
  if (!i) return null;
  if (i.status !== "initiated" && i.status !== "authorized") return null;
  i.status = "voided";
  storePaymentIntent(i);
  return i;
}

export function supportsAllPaymentProviders(): PaymentProviderId[] {
  return ["stripe", "payme", "click", "apple", "google", "bank", "invoice", "custom"];
}
export function supportsAllProviderStatuses(): PaymentProviderStatus[] {
  return ["active", "inactive", "maintenance", "deprecated"];
}

// ===== System 9 — Purchase Processing =====

export function createPurchase(input: {
  buyerId: string; organizationId?: string | null;
  items: Array<{ productId?: string | null; bundleId?: string | null; quantity: number }>;
  currency: string;
  offerId?: string | null; couponCode?: string | null;
  notes?: string | null;
  correlationId?: string; metadata?: Record<string, unknown>;
}): Purchase {
  if (input.items.length === 0) throw new Error("Purchase must have at least one item");
  const now = new Date().toISOString();
  const items: PurchaseItem[] = [];
  let subtotal = 0;
  let discountTotal = 0;
  for (const it of input.items) {
    let unitPrice = 0;
    if (it.productId) {
      const p = getProduct(it.productId);
      if (!p) throw new Error(`Product not found: ${it.productId}`);
      unitPrice = p.basePrice;
    } else if (it.bundleId) {
      const b = getBundle(it.bundleId);
      if (!b) throw new Error(`Bundle not found: ${it.bundleId}`);
      unitPrice = b.basePrice;
    }
    const lineTotal = unitPrice * it.quantity;
    let lineDiscount = 0;
    if (input.offerId) {
      const offer = getOffer(input.offerId);
      if (offer && offer.status === "active") {
        if (offer.discountType === "percentage") {
          lineDiscount = (lineTotal * Math.min(offer.discountValue, 100)) / 100;
        } else if (offer.discountType === "fixed") {
          lineDiscount = Math.min(offer.discountValue, lineTotal);
        }
      }
    }
    items.push({
      productId: it.productId ?? null, bundleId: it.bundleId ?? null,
      quantity: it.quantity, unitPrice,
      discountAmount: lineDiscount,
      total: lineTotal - lineDiscount,
    });
    subtotal += lineTotal;
    discountTotal += lineDiscount;
  }
  const taxTotal = Math.round(((subtotal - discountTotal) * 0.1) * 100) / 100; // 10% flat tax (deterministic)
  const total = subtotal - discountTotal + taxTotal;
  const purchase: Purchase = {
    id: randomUUID(), buyerId: input.buyerId, organizationId: input.organizationId ?? null,
    status: "pending", items,
    subtotal, discountTotal, taxTotal, total,
    currency: input.currency,
    offerId: input.offerId ?? null, couponCode: input.couponCode ?? null,
    paymentProviderId: null, paymentReference: null,
    correlationId: input.correlationId ?? randomUUID(),
    notes: input.notes ?? null,
    createdAt: now, updatedAt: now,
    completedAt: null, cancelledAt: null, failedAt: null,
    failureReason: null,
    metadata: input.metadata ?? {},
  };
  storePurchase(purchase);
  log.info("purchase.created", { id: purchase.id, total });
  return purchase;
}

export function getPurchaseById(id: string): Purchase | null { return getPurchase(id); }
export function listPurchases(status?: PurchaseStatus, buyerId?: string): Purchase[] {
  let all = getAllPurchases();
  if (status) all = all.filter(p => p.status === status);
  if (buyerId) all = all.filter(p => p.buyerId === buyerId);
  return all;
}

export function transitionPurchase(purchaseId: string, to: PurchaseStatus, actor?: string, reason?: string): Purchase | null {
  const p = getPurchase(purchaseId);
  if (!p) return null;
  if (!canTransitionPurchase(p.status, to)) return null;
  const now = new Date().toISOString();
  p.status = to; p.updatedAt = now;
  if (to === "completed") p.completedAt = now;
  if (to === "cancelled") { p.cancelledAt = now; if (reason) p.notes = reason; }
  if (to === "failed") { p.failedAt = now; p.failureReason = reason ?? null; }
  storePurchase(p);
  if (to === "completed") {
    publishCommerceEvent("PurchaseCompleted", p.buyerId, {
      purchaseId: p.id, total: p.total, currency: p.currency, correlationId: p.correlationId,
    });
  }
  if (to === "failed") {
    publishCommerceEvent("PurchaseFailed", p.buyerId, {
      purchaseId: p.id, reason: reason ?? "unknown", correlationId: p.correlationId,
    });
  }
  log.info("purchase.transition", { id: purchaseId, to, actor });
  return p;
}

export function validatePurchase(purchaseId: string): Purchase | null {
  return transitionPurchase(purchaseId, "validated", "system", "items validated");
}

export function approvePurchase(purchaseId: string, approver: string): Purchase | null {
  return transitionPurchase(purchaseId, "approved", approver, "approved");
}

export function setPaymentPending(purchaseId: string, providerId: PaymentProviderId, paymentRef: string): Purchase | null {
  const p = getPurchase(purchaseId);
  if (!p) return null;
  if (!canTransitionPurchase(p.status, "payment_pending")) return null;
  p.status = "payment_pending"; p.paymentProviderId = providerId; p.paymentReference = paymentRef;
  p.updatedAt = new Date().toISOString();
  storePurchase(p);
  return p;
}

export function completePurchase(purchaseId: string): Purchase | null {
  return transitionPurchase(purchaseId, "completed");
}

export function failPurchase(purchaseId: string, reason: string): Purchase | null {
  return transitionPurchase(purchaseId, "failed", undefined, reason);
}

export function cancelPurchase(purchaseId: string, reason?: string): Purchase | null {
  return transitionPurchase(purchaseId, "cancelled", undefined, reason);
}

export function supportsAllPurchaseStatuses(): PurchaseStatus[] {
  return ["pending", "validated", "approved", "payment_pending", "completed", "failed", "cancelled", "refunded", "expired"];
}
