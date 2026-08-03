/** System 18 — Documentation Generator. Deterministic Markdown + JSON. No LLM. */
import type { CommerceDocumentation, CommerceEventType } from "./types";

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  {
    id: 1, name: "Commerce Catalog",
    description: "Single source of truth for products, bundles, passes, subscriptions, virtual currency packs, cosmetic packs, organization packages, and developer extensions.",
    endpoints: ["/api/commerce-platform/products", "/api/commerce-platform/bundles"],
    events: ["ProductPublished", "ProductDeprecated", "ProductRetired"],
  },
  {
    id: 2, name: "Product Definitions",
    description: "Defines products of types: physical, digital, subscription, license, bundle, currency, service, organization, extension.",
    endpoints: ["/api/commerce-platform/products"],
    events: ["ProductPublished", "ProductDeprecated", "ProductRetired"],
  },
  {
    id: 3, name: "Bundle Engine",
    description: "Configurable, nested, conditional, organization, limited, and starter bundles. No hardcoded bundles.",
    endpoints: ["/api/commerce-platform/bundles"],
    events: ["BundlePurchased"],
  },
  {
    id: 4, name: "Offer Engine",
    description: "Limited-time, seasonal, organization, regional, student, teacher, first-purchase, returning-user, campaign, coupon, manual offers. Never auto-activates; approval required.",
    endpoints: ["/api/commerce-platform/offers"],
    events: ["OfferActivated", "OfferExpired", "OfferRejected"],
  },
  {
    id: 5, name: "Discount Engine",
    description: "Percentage, fixed, tiered, volume, campaign, coupon, organization, and academic discounts. Validation only.",
    endpoints: ["/api/commerce-platform/discounts"],
    events: ["DiscountApplied", "CouponRedeemed"],
  },
  {
    id: 6, name: "Virtual Currency Platform",
    description: "Currency definitions, balances, transactions, exchange rates, expiration, and history. Never spends currency directly.",
    endpoints: ["/api/commerce-platform/currencies"],
    events: ["CurrencyGranted", "CurrencySpent", "CurrencyRefunded", "CurrencyExpired"],
  },
  {
    id: 7, name: "Subscription Platform",
    description: "Plans, renewals, expiration, grace periods, benefit references, family/organization/school/district/enterprise plans. Never grants rewards directly.",
    endpoints: ["/api/commerce-platform/subscriptions"],
    events: ["SubscriptionActivated", "SubscriptionExpired", "SubscriptionCanceled", "SubscriptionRenewed"],
  },
  {
    id: 8, name: "License Platform",
    description: "Ownership verification, activation, revocation, expiration. Organization, extension, marketplace, individual, and site licenses.",
    endpoints: ["/api/commerce-platform/licenses"],
    events: ["LicenseGranted", "LicenseRevoked", "LicenseExpired"],
  },
  {
    id: 9, name: "Purchase Processing",
    description: "Purchase lifecycle: pending, validated, approved, payment_pending, completed, failed, cancelled, refunded, expired. No payment provider logic.",
    endpoints: ["/api/commerce-platform/purchases"],
    events: ["PurchaseCompleted", "PurchaseFailed", "PurchaseRefunded"],
  },
  {
    id: 10, name: "Payment Provider Abstraction",
    description: "Interfaces only. No real payment SDK. Supports Click, Payme, Apple, Google, Bank, Invoice, Custom. Provider plugins.",
    endpoints: ["/api/commerce-platform/providers"],
    events: ["PaymentFailed", "PaymentCaptured"],
  },
  {
    id: 11, name: "Transaction Ledger",
    description: "Immutable, append-only ledger. Every operation recorded. Audit-compatible. No mutation.",
    endpoints: ["/api/commerce-platform/ledger"],
    events: ["LedgerEntryCreated"],
  },
  {
    id: 12, name: "Refund Platform",
    description: "Manual approval, policy validation, partial/full/organization/subscription-cancellation refunds. Never automatic.",
    endpoints: ["/api/commerce-platform/refunds"],
    events: ["RefundRequested", "RefundApproved", "RefundCompleted"],
  },
  {
    id: 13, name: "Commerce Analytics",
    description: "Revenue, conversion, subscriptions, retention, purchase funnel, refund rates, currency circulation, bundle popularity. No gameplay analytics.",
    endpoints: ["/api/commerce-platform/analytics"],
    events: [],
  },
  {
    id: 14, name: "Marketplace Integration",
    description: "Consumes Marketplace events. Supports creator sales, license verification, purchase history, ownership references. Never owns Marketplace.",
    endpoints: ["/api/commerce-platform/marketplace"],
    events: [],
  },
  {
    id: 15, name: "Event Bus Bridge",
    description: "Passive consumer + producer. Consumes Marketplace, LiveOps, Configuration, Organization, Identity events. Produces commerce events. Never calls modules directly.",
    endpoints: ["/api/commerce-platform/status"],
    events: [
      "PurchaseCompleted", "PurchaseRefunded", "PurchaseFailed",
      "SubscriptionActivated", "SubscriptionExpired", "SubscriptionCanceled", "SubscriptionRenewed",
      "CurrencyGranted", "CurrencySpent", "CurrencyRefunded", "CurrencyExpired",
      "BundlePurchased", "OfferActivated", "OfferExpired", "OfferRejected",
      "LicenseGranted", "LicenseRevoked", "LicenseExpired",
      "PaymentFailed", "PaymentCaptured",
      "ProductPublished", "ProductDeprecated", "ProductRetired",
      "RefundRequested", "RefundApproved", "RefundCompleted",
      "DiscountApplied", "CouponRedeemed",
      "LedgerEntryCreated",
    ],
  },
  {
    id: 16, name: "Developer Integration",
    description: "Read-only APIs, SDK metadata, extension hooks, developer documentation metadata.",
    endpoints: ["/api/commerce-platform/developer"],
    events: [],
  },
  {
    id: 17, name: "Administration Dashboard",
    description: "Products, offers, subscriptions, revenue, refunds, licenses, currencies, transactions, health.",
    endpoints: ["/api/commerce-platform/dashboard"],
    events: [],
  },
  {
    id: 18, name: "Documentation Generator",
    description: "Deterministic Markdown and JSON documentation. No LLM.",
    endpoints: [],
    events: [],
  },
];

const EVENT_PAYLOADS: Record<CommerceEventType, string[]> = {
  PurchaseCompleted: ["purchaseId", "total", "currency", "correlationId"],
  PurchaseRefunded: ["refundId", "purchaseId", "amount", "correlationId"],
  PurchaseFailed: ["purchaseId", "reason", "correlationId"],
  SubscriptionActivated: ["subscriptionId", "planId", "userId", "correlationId"],
  SubscriptionExpired: ["subscriptionId", "userId", "correlationId"],
  SubscriptionCanceled: ["subscriptionId", "userId", "reason", "correlationId"],
  SubscriptionRenewed: ["subscriptionId", "newEndDate", "correlationId"],
  CurrencyGranted: ["currencyId", "userId", "amount", "correlationId"],
  CurrencySpent: ["currencyId", "userId", "amount", "correlationId"],
  CurrencyRefunded: ["currencyId", "userId", "amount", "correlationId"],
  CurrencyExpired: ["currencyId", "userId", "amount", "correlationId"],
  BundlePurchased: ["bundleId", "purchaseId", "quantity", "correlationId"],
  OfferActivated: ["offerId", "actorId"],
  OfferExpired: ["offerId"],
  OfferRejected: ["offerId", "reviewerId", "reason"],
  LicenseGranted: ["licenseId", "licenseType", "ownerId", "correlationId"],
  LicenseRevoked: ["licenseId", "reason", "correlationId"],
  LicenseExpired: ["licenseId", "correlationId"],
  PaymentFailed: ["intentId", "purchaseId", "reason"],
  PaymentCaptured: ["intentId", "purchaseId", "amount", "currency"],
  ProductPublished: ["productId", "sku"],
  ProductDeprecated: ["productId", "sku"],
  ProductRetired: ["productId", "sku"],
  RefundRequested: ["refundId", "purchaseId", "amount", "correlationId"],
  RefundApproved: ["refundId", "correlationId"],
  RefundCompleted: ["refundId", "purchaseId", "amount", "correlationId"],
  DiscountApplied: ["discountId", "amount", "correlationId"],
  CouponRedeemed: ["couponCode", "discountId", "correlationId"],
  LedgerEntryCreated: ["ledgerEntryId", "sequence", "type", "reference", "amount", "correlationId"],
};

const EVENT_DESCRIPTIONS: Record<CommerceEventType, string> = {
  PurchaseCompleted: "Emitted when a purchase reaches the completed state.",
  PurchaseRefunded: "Emitted when a refund for a purchase is fully processed.",
  PurchaseFailed: "Emitted when a purchase fails (payment, validation, or system).",
  SubscriptionActivated: "Emitted when a subscription becomes active (after trial or directly).",
  SubscriptionExpired: "Emitted when a subscription expires.",
  SubscriptionCanceled: "Emitted when a subscription is canceled by user or admin.",
  SubscriptionRenewed: "Emitted when a subscription is renewed for a new billing cycle.",
  CurrencyGranted: "Emitted when virtual currency is granted to a user (purchase, reward, refund).",
  CurrencySpent: "Emitted when a user spends virtual currency.",
  CurrencyRefunded: "Emitted when a currency transaction is refunded.",
  CurrencyExpired: "Emitted when virtual currency expires.",
  BundlePurchased: "Emitted when a bundle is purchased.",
  OfferActivated: "Emitted when an offer transitions to active.",
  OfferExpired: "Emitted when an offer reaches its end date.",
  OfferRejected: "Emitted when an offer is rejected by an approver.",
  LicenseGranted: "Emitted when a license is issued to an owner.",
  LicenseRevoked: "Emitted when a license is revoked.",
  LicenseExpired: "Emitted when a license expires.",
  PaymentFailed: "Emitted when a payment intent fails.",
  PaymentCaptured: "Emitted when a payment intent is captured.",
  ProductPublished: "Emitted when a product transitions to active status.",
  ProductDeprecated: "Emitted when a product is deprecated.",
  ProductRetired: "Emitted when a product is retired.",
  RefundRequested: "Emitted when a refund is requested.",
  RefundApproved: "Emitted when a refund is approved.",
  RefundCompleted: "Emitted when a refund is completed.",
  DiscountApplied: "Emitted when a discount is successfully applied to a cart.",
  CouponRedeemed: "Emitted when a coupon is redeemed.",
  LedgerEntryCreated: "Emitted when an entry is appended to the immutable ledger.",
};

export function generateCommerceDocumentation(): CommerceDocumentation {
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({
      type: type as CommerceEventType,
      payload: EVENT_PAYLOADS[type as CommerceEventType],
      description: EVENT_DESCRIPTIONS[type as CommerceEventType],
    })),
    ownership: {
      owns: [
        "Commerce Catalog",
        "Product Definitions",
        "Bundles",
        "Offers",
        "Discounts (validation only)",
        "Virtual Currency definitions, balances, transactions, exchange rates, expiration",
        "Subscription plans, subscriptions, renewals, grace periods",
        "Licenses (issuance, activation, revocation, verification)",
        "Purchase lifecycle",
        "Payment provider abstraction",
        "Transaction ledger (immutable, append-only)",
        "Refunds (manual approval)",
        "Commerce analytics",
        "Marketplace references (not state)",
        "Developer integration metadata",
        "Administration dashboard",
        "Documentation generator",
      ],
      doesNotOwn: [
        "Gameplay",
        "Game rules",
        "Scoring",
        "Matchmaking",
        "Progression",
        "XP",
        "Achievements",
        "Inventory state",
        "Cosmetics",
        "Rewards",
        "Tournaments",
        "Gameplay analytics",
        "Player profiles",
        "Marketplace state (only references)",
        "Payment provider SDKs (only abstraction)",
      ],
    },
  };
}

export function generateMarkdownDocumentation(): string {
  const doc = generateCommerceDocumentation();
  let md = `# EduBek — Commerce, Economy, Marketplace & Monetization Platform\n\n`;
  md += `**Version:** ${doc.version}  \n`;
  md += `**Generated:** ${doc.generatedAt}  \n`;
  md += `**Phase:** 6G.16\n\n`;
  md += `## Overview\n\n`;
  md += `This platform is the SINGLE SOURCE OF TRUTH for every commercial operation across EduBek. `;
  md += `It coordinates commercial operations through the existing Event Bus. It is a passive consumer + producer. `;
  md += `It NEVER directly modifies another module.\n\n`;
  md += `## Systems\n\n`;
  for (const s of doc.systems) {
    md += `### System ${s.id} — ${s.name}\n\n`;
    md += `${s.description}\n\n`;
    if (s.endpoints.length > 0) {
      md += `**Endpoints:**\n`;
      for (const e of s.endpoints) md += `- \`${e}\`\n`;
      md += `\n`;
    }
    if (s.events.length > 0) {
      md += `**Events:**\n`;
      for (const e of s.events) md += `- \`${e}\`\n`;
      md += `\n`;
    }
  }
  md += `## Events\n\n`;
  for (const e of doc.events) {
    md += `### \`${e.type}\`\n\n${e.description}\n\n`;
    md += `**Payload:**\n`;
    for (const p of e.payload) md += `- \`${p}\`\n`;
    md += `\n`;
  }
  md += `## Ownership\n\n`;
  md += `### Owns\n\n`;
  for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n\n`;
  for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  md += `\n`;
  return md;
}

export function getCommerceVersion(): string { return "1.0.0"; }
