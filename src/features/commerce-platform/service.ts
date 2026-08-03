/** Commerce Platform service — composes all 18 systems. Phase 6G.16. */
// Systems 1, 2, 3
export {
  createProduct, getProductById, listProducts,
  canTransitionProduct, transitionProductStatus,
  publishProduct, deprecateProduct, retireProduct, scheduleProduct,
  updateProductPrice, supportsAllProductTypes, supportsAllProductStatuses,
  createBundle, getBundleById, listBundles,
  addBundleItem, addChildBundle, publishBundle, retireBundle,
  incrementBundleSoldCount, computeBundleEffectivePrice, supportsAllBundleTypes,
  generateCommerceCatalog, supportsAllCatalogStatuses, supportsAllCatalogTypes,
} from "./catalog";

// Systems 4, 5
export {
  createOffer, getOfferById, listOffers,
  approveOffer, rejectOffer, activateOffer, expireOffer, retireOffer, redeemOffer,
  isOfferEligible, supportsAllOfferTypes, supportsAllOfferStatuses,
  createDiscount, getDiscountById, listDiscounts, deactivateDiscount,
  isDiscountValid, validateDiscounts, supportsAllDiscountTypes,
} from "./offers-discounts";

// Systems 6, 7
export {
  createCurrency, getCurrencyById, getCurrencyByCodeName, listCurrencies, deactivateCurrency,
  getOrCreateBalance, getBalanceForUser, listAllBalances,
  recordCurrencyTransaction, requestCurrencyGrant, requestCurrencySpend, refundCurrencyTransaction,
  listCurrencyTransactions,
  setExchangeRate, getExchangeRateForPair, listExchangeRates, convertCurrency,
  supportsAllCurrencyTypes, supportsAllCurrencyTransactionTypes,
  createSubscriptionPlan, getPlanById, listPlans, deactivatePlan,
  createSubscription, getSubscriptionById, listSubscriptions,
  canTransitionSubscription, transitionSubscription,
  renewSubscription, cancelSubscription, expireSubscription, pauseSubscription, resumeSubscription,
  supportsAllSubscriptionPlanTypes, supportsAllSubscriptionStatuses,
} from "./currency-subscription";

// Systems 8, 9, 10
export {
  issueLicense, getLicenseById, getLicenseByKeyString, listLicenses,
  activateLicense, verifyLicense, revokeLicense, suspendLicense, reactivateLicense, expireLicense,
  supportsAllLicenseTypes, supportsAllLicenseStatuses,
  registerProvider, getProviderById, listProviders, isProviderAvailable,
  createPaymentIntent, getPaymentIntentById, listPaymentIntents,
  authorizePaymentIntent, capturePaymentIntent, failPaymentIntent, voidPaymentIntent,
  supportsAllPaymentProviders, supportsAllProviderStatuses,
  createPurchase, getPurchaseById, listPurchases,
  transitionPurchase, validatePurchase, approvePurchase, setPaymentPending,
  completePurchase, failPurchase, cancelPurchase, supportsAllPurchaseStatuses,
} from "./license-purchase";

// Systems 11, 12, 13
export {
  appendLedgerEntry, listLedgerEntries, listLedgerByReference,
  getLedgerEntryCount, getLatestLedgerEntry, verifyLedgerIntegrity,
  createRefundPolicy, getRefundPolicyById, listRefundPolicies,
  requestRefund, getRefundById, listRefunds,
  canTransitionRefund, reviewRefund, processRefund, completeRefund, failRefund,
  validateRefundPolicy, supportsAllRefundStatuses, supportsAllRefundTypes,
  generateCommerceAnalytics, getProviderHealth,
} from "./ledger-refund-analytics";

// Systems 14, 16, 17
export {
  recordMarketplaceSale, getMarketplaceSaleById, listMarketplaceSales,
  recordMarketplaceOwnership, verifyMarketplaceOwnership, listMarketplaceOwnership,
  getDeveloperIntegration,
  generateAdminDashboard, getCommerceStatus,
} from "./marketplace-developer-admin";

// System 15
export {
  subscribeCommerce, unsubscribeCommerce, isCommerceSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishCommerceEvent, _resetBridgeForTesting,
} from "./event-bus-bridge";

// System 18
export {
  generateCommerceDocumentation, generateMarkdownDocumentation, getCommerceVersion,
} from "./documentation";

// Repository reset
export { _resetRepositoryForTesting } from "./repository";

// Type re-exports
export type {
  CatalogItemStatus, CatalogItemType, CatalogItemSummary, CommerceCatalog,
  ProductType, ProductStatus, ProductPrice, ProductDefinition,
  BundleType, BundleItem, Bundle,
  OfferType, OfferStatus, OfferEligibility, Offer,
  DiscountType, DiscountTier, Discount, DiscountValidationResult,
  CurrencyType, CurrencyTransactionType, VirtualCurrency, CurrencyBalance,
  CurrencyTransaction, CurrencyExchangeRate,
  SubscriptionPlanType, SubscriptionStatus, SubscriptionPlan, Subscription,
  LicenseType, LicenseStatus, License, LicenseVerificationResult,
  PurchaseStatus, PurchaseItem, Purchase,
  PaymentProviderId, PaymentProviderStatus, PaymentProviderConfig, PaymentIntent,
  LedgerEntryType, LedgerEntry,
  RefundStatus, RefundType, Refund, RefundPolicy,
  CommerceAnalytics,
  MarketplaceSaleReference, MarketplaceOwnershipReference,
  CommerceEventType,
  CommerceDeveloperIntegration, CommerceAdminDashboard, CommerceDocumentation,
} from "./types";
export { canTransitionPurchase } from "./types";
