/**
 * In-memory repository for Commerce Platform. Phase 6G.16.
 * Append-only ledger; everything else is mutable but timestamped.
 */
import type {
  ProductDefinition, Bundle, Offer, Discount,
  VirtualCurrency, CurrencyBalance, CurrencyTransaction, CurrencyExchangeRate,
  SubscriptionPlan, Subscription,
  License, Purchase, PaymentProviderConfig, PaymentIntent,
  LedgerEntry, Refund, RefundPolicy,
  MarketplaceSaleReference, MarketplaceOwnershipReference,
} from "./types";

const products = new Map<string, ProductDefinition>();
const bundles = new Map<string, Bundle>();
const offers = new Map<string, Offer>();
const discounts = new Map<string, Discount>();

const currencies = new Map<string, VirtualCurrency>();
const currencyBalances = new Map<string, CurrencyBalance>(); // key: `${currencyId}:${userId}`
const currencyTransactions = new Map<string, CurrencyTransaction[]>();
const exchangeRates = new Map<string, CurrencyExchangeRate>();

const subscriptionPlans = new Map<string, SubscriptionPlan>();
const subscriptions = new Map<string, Subscription>();

const licenses = new Map<string, License>();

const purchases = new Map<string, Purchase>();

const providers = new Map<string, PaymentProviderConfig>();
const paymentIntents = new Map<string, PaymentIntent>();

const ledger: LedgerEntry[] = [];
const ledgerSequence = { value: 0 };

const refunds = new Map<string, Refund>();
const refundPolicies = new Map<string, RefundPolicy>();

const marketplaceSales = new Map<string, MarketplaceSaleReference>();
const marketplaceOwnership = new Map<string, MarketplaceOwnershipReference>();

// === Product Definitions ===
export const storeProduct = (p: ProductDefinition) => products.set(p.id, p);
export const getProduct = (id: string) => products.get(id) ?? null;
export const getProductBySku = (sku: string) => Array.from(products.values()).find(p => p.sku === sku) ?? null;
export const getAllProducts = () => Array.from(products.values());

// === Bundles ===
export const storeBundle = (b: Bundle) => bundles.set(b.id, b);
export const getBundle = (id: string) => bundles.get(id) ?? null;
export const getAllBundles = () => Array.from(bundles.values());

// === Offers ===
export const storeOffer = (o: Offer) => offers.set(o.id, o);
export const getOffer = (id: string) => offers.get(id) ?? null;
export const getAllOffers = () => Array.from(offers.values());

// === Discounts ===
export const storeDiscount = (d: Discount) => discounts.set(d.id, d);
export const getDiscount = (id: string) => discounts.get(id) ?? null;
export const getAllDiscounts = () => Array.from(discounts.values());

// === Virtual Currency ===
export const storeCurrency = (c: VirtualCurrency) => currencies.set(c.id, c);
export const getCurrency = (id: string) => currencies.get(id) ?? null;
export const getCurrencyByCode = (code: string) => Array.from(currencies.values()).find(c => c.code === code) ?? null;
export const getAllCurrencies = () => Array.from(currencies.values());

const balanceKey = (currencyId: string, userId: string) => `${currencyId}:${userId}`;
export const storeBalance = (b: CurrencyBalance) => currencyBalances.set(balanceKey(b.currencyId, b.userId), b);
export const getBalance = (currencyId: string, userId: string) => currencyBalances.get(balanceKey(currencyId, userId)) ?? null;
export const getAllBalances = () => Array.from(currencyBalances.values());

export const storeCurrencyTransaction = (t: CurrencyTransaction) => {
  const list = currencyTransactions.get(t.currencyId) ?? [];
  list.push(t);
  currencyTransactions.set(t.currencyId, list);
};
export const getCurrencyTransactions = (currencyId: string, userId?: string) => {
  const list = currencyTransactions.get(currencyId) ?? [];
  return userId ? list.filter(t => t.userId === userId) : list;
};

export const storeExchangeRate = (r: CurrencyExchangeRate) => exchangeRates.set(`${r.fromCurrencyId}:${r.toCurrencyId}`, r);
export const getExchangeRate = (from: string, to: string) => exchangeRates.get(`${from}:${to}`) ?? null;
export const getAllExchangeRates = () => Array.from(exchangeRates.values());

// === Subscriptions ===
export const storePlan = (p: SubscriptionPlan) => subscriptionPlans.set(p.id, p);
export const getPlan = (id: string) => subscriptionPlans.get(id) ?? null;
export const getAllPlans = () => Array.from(subscriptionPlans.values());
export const storeSubscription = (s: Subscription) => subscriptions.set(s.id, s);
export const getSubscription = (id: string) => subscriptions.get(id) ?? null;
export const getAllSubscriptions = () => Array.from(subscriptions.values());

// === Licenses ===
export const storeLicense = (l: License) => licenses.set(l.id, l);
export const getLicense = (id: string) => licenses.get(id) ?? null;
export const getLicenseByKey = (key: string) => Array.from(licenses.values()).find(l => l.key === key) ?? null;
export const getAllLicenses = () => Array.from(licenses.values());

// === Purchases ===
export const storePurchase = (p: Purchase) => purchases.set(p.id, p);
export const getPurchase = (id: string) => purchases.get(id) ?? null;
export const getAllPurchases = () => Array.from(purchases.values());

// === Payment Providers ===
export const storeProvider = (p: PaymentProviderConfig) => providers.set(p.id, p);
export const getProvider = (id: string) => providers.get(id) ?? null;
export const getAllProviders = () => Array.from(providers.values());
export const storePaymentIntent = (i: PaymentIntent) => paymentIntents.set(i.id, i);
export const getPaymentIntent = (id: string) => paymentIntents.get(id) ?? null;
export const getAllPaymentIntents = () => Array.from(paymentIntents.values());

// === Ledger (append-only) ===
export const appendLedger = (e: LedgerEntry) => { ledger.push(e); };
export const getLedgerEntries = () => ledger.slice();
export const getLedgerByReference = (ref: string) => ledger.filter(e => e.reference === ref);
export const nextLedgerSequence = () => { ledgerSequence.value += 1; return ledgerSequence.value; };
export const getLedgerCount = () => ledger.length;
export const getLastLedgerEntry = () => (ledger.length > 0 ? ledger[ledger.length - 1] : null);

// === Refunds ===
export const storeRefund = (r: Refund) => refunds.set(r.id, r);
export const getRefund = (id: string) => refunds.get(id) ?? null;
export const getAllRefunds = () => Array.from(refunds.values());
export const storeRefundPolicy = (p: RefundPolicy) => refundPolicies.set(p.id, p);
export const getRefundPolicy = (id: string) => refundPolicies.get(id) ?? null;
export const getAllRefundPolicies = () => Array.from(refundPolicies.values());
export const getActiveRefundPolicy = () => Array.from(refundPolicies.values()).find(p => p.active) ?? null;

// === Marketplace references ===
export const storeMarketplaceSale = (s: MarketplaceSaleReference) => marketplaceSales.set(s.saleId, s);
export const getMarketplaceSale = (id: string) => marketplaceSales.get(id) ?? null;
export const getAllMarketplaceSales = () => Array.from(marketplaceSales.values());
export const storeMarketplaceOwnership = (o: MarketplaceOwnershipReference) => marketplaceOwnership.set(`${o.userId}:${o.listingId}`, o);
export const getMarketplaceOwnership = (userId: string, listingId: string) => marketplaceOwnership.get(`${userId}:${listingId}`) ?? null;
export const getAllMarketplaceOwnership = () => Array.from(marketplaceOwnership.values());

// === Reset ===
export function _resetRepositoryForTesting() {
  products.clear(); bundles.clear(); offers.clear(); discounts.clear();
  currencies.clear(); currencyBalances.clear(); currencyTransactions.clear(); exchangeRates.clear();
  subscriptionPlans.clear(); subscriptions.clear();
  licenses.clear(); purchases.clear();
  providers.clear(); paymentIntents.clear();
  ledger.length = 0; ledgerSequence.value = 0;
  refunds.clear(); refundPolicies.clear();
  marketplaceSales.clear(); marketplaceOwnership.clear();
}
