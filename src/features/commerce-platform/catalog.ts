/** Systems 1, 2, 3 — Commerce Catalog, Product Definitions, Bundle Engine. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeProduct, getProduct, getProductBySku, getAllProducts,
  storeBundle, getBundle, getAllBundles,
} from "./repository";
import type {
  CatalogItemStatus, CatalogItemType, CatalogItemSummary, CommerceCatalog,
  ProductDefinition, ProductType, ProductStatus, ProductPrice,
  Bundle, BundleType, BundleItem,
} from "./types";

const log = getLogger("commerce.catalog");

// ===== System 2 — Product Definitions =====

export function createProduct(input: {
  sku: string; name: string; description: string;
  type: ProductType; basePrice: number; currency: string;
  prices?: ProductPrice[]; tags?: string[]; category?: string | null;
  organizationId?: string | null; region?: string | null;
  metadata?: Record<string, unknown>;
}): ProductDefinition {
  if (input.basePrice < 0) throw new Error("basePrice must be non-negative");
  if (getProductBySku(input.sku)) throw new Error(`SKU already exists: ${input.sku}`);
  const now = new Date().toISOString();
  const product: ProductDefinition = {
    id: randomUUID(), sku: input.sku, name: input.name, description: input.description,
    type: input.type, status: "draft",
    basePrice: input.basePrice, currency: input.currency,
    prices: input.prices ?? [],
    tags: input.tags ?? [], category: input.category ?? null,
    organizationId: input.organizationId ?? null, region: input.region ?? null,
    metadata: input.metadata ?? {},
    publishedAt: null, deprecatedAt: null,
    createdAt: now, updatedAt: now, version: 1,
  };
  storeProduct(product);
  log.info("product.created", { id: product.id, sku: product.sku });
  return product;
}

export function getProductById(id: string): ProductDefinition | null { return getProduct(id); }
export function listProducts(status?: ProductStatus, type?: ProductType): ProductDefinition[] {
  let all = getAllProducts();
  if (status) all = all.filter(p => p.status === status);
  if (type) all = all.filter(p => p.type === type);
  return all;
}

const VALID_PRODUCT_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ["active", "scheduled", "retired"],
  scheduled: ["active", "draft", "retired"],
  active: ["deprecated", "retired"],
  deprecated: ["retired", "active"],
  retired: [],
};

export function canTransitionProduct(from: ProductStatus, to: ProductStatus): boolean {
  return VALID_PRODUCT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionProductStatus(productId: string, to: ProductStatus): ProductDefinition | null {
  const p = getProduct(productId);
  if (!p) return null;
  if (!canTransitionProduct(p.status, to)) return null;
  const now = new Date().toISOString();
  p.status = to; p.updatedAt = now; p.version += 1;
  if (to === "active" && !p.publishedAt) p.publishedAt = now;
  if (to === "deprecated" && !p.deprecatedAt) p.deprecatedAt = now;
  storeProduct(p);
  log.info("product.transition", { id: productId, to });
  return p;
}

export function publishProduct(productId: string): ProductDefinition | null {
  return transitionProductStatus(productId, "active");
}
export function deprecateProduct(productId: string): ProductDefinition | null {
  return transitionProductStatus(productId, "deprecated");
}
export function retireProduct(productId: string): ProductDefinition | null {
  return transitionProductStatus(productId, "retired");
}
export function scheduleProduct(productId: string): ProductDefinition | null {
  return transitionProductStatus(productId, "scheduled");
}

export function updateProductPrice(productId: string, currency: string, amount: number, region?: string | null): ProductDefinition | null {
  const p = getProduct(productId);
  if (!p) return null;
  if (amount < 0) return null;
  const now = new Date().toISOString();
  const existing = p.prices.find(pr => pr.currency === currency && (pr.region ?? null) === (region ?? null));
  if (existing) {
    existing.amount = amount;
  } else {
    p.prices.push({ currency, amount, region: region ?? null, validFrom: now, validUntil: null });
  }
  p.currency = currency; p.basePrice = amount;
  p.updatedAt = now; p.version += 1;
  storeProduct(p);
  return p;
}

export function supportsAllProductTypes(): ProductType[] {
  return ["physical", "digital", "subscription", "license", "bundle", "currency", "service", "organization", "extension"];
}
export function supportsAllProductStatuses(): ProductStatus[] {
  return ["active", "draft", "scheduled", "deprecated", "retired"];
}

// ===== System 3 — Bundle Engine =====

export function createBundle(input: {
  sku: string; name: string; description: string;
  type: BundleType; basePrice: number; currency: string;
  items?: BundleItem[]; childBundleIds?: string[];
  discountPercentage?: number | null;
  startDate?: string | null; endDate?: string | null;
  maxQuantity?: number | null; organizationId?: string | null;
  metadata?: Record<string, unknown>;
}): Bundle {
  if (input.basePrice < 0) throw new Error("basePrice must be non-negative");
  if (input.discountPercentage !== null && input.discountPercentage !== undefined && (input.discountPercentage < 0 || input.discountPercentage > 100)) {
    throw new Error("discountPercentage must be 0..100");
  }
  const now = new Date().toISOString();
  const bundle: Bundle = {
    id: randomUUID(), sku: input.sku, name: input.name, description: input.description,
    type: input.type, status: "draft",
    items: input.items ?? [], childBundleIds: input.childBundleIds ?? [],
    basePrice: input.basePrice, currency: input.currency,
    discountPercentage: input.discountPercentage ?? null,
    startDate: input.startDate ?? null, endDate: input.endDate ?? null,
    maxQuantity: input.maxQuantity ?? null, soldCount: 0,
    organizationId: input.organizationId ?? null,
    metadata: input.metadata ?? {},
    createdAt: now, updatedAt: now,
  };
  storeBundle(bundle);
  log.info("bundle.created", { id: bundle.id, type: bundle.type });
  return bundle;
}

export function getBundleById(id: string): Bundle | null { return getBundle(id); }
export function listBundles(type?: BundleType, status?: ProductStatus): Bundle[] {
  let all = getAllBundles();
  if (type) all = all.filter(b => b.type === type);
  if (status) all = all.filter(b => b.status === status);
  return all;
}

export function addBundleItem(bundleId: string, item: BundleItem): Bundle | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  if (b.status !== "draft") return null;
  b.items.push(item);
  b.updatedAt = new Date().toISOString();
  storeBundle(b);
  return b;
}

export function addChildBundle(bundleId: string, childBundleId: string): Bundle | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  if (b.id === childBundleId) return null; // no self-reference
  if (b.childBundleIds.includes(childBundleId)) return null;
  // prevent circular references (simple check)
  const child = getBundle(childBundleId);
  if (child && child.childBundleIds.includes(bundleId)) return null;
  b.childBundleIds.push(childBundleId);
  b.updatedAt = new Date().toISOString();
  storeBundle(b);
  return b;
}

export function publishBundle(bundleId: string): Bundle | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  if (b.status !== "draft") return null;
  b.status = "active"; b.updatedAt = new Date().toISOString();
  storeBundle(b);
  return b;
}

export function retireBundle(bundleId: string): Bundle | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  if (b.status === "retired") return null;
  b.status = "retired"; b.updatedAt = new Date().toISOString();
  storeBundle(b);
  return b;
}

export function incrementBundleSoldCount(bundleId: string, quantity: number): Bundle | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  if (b.maxQuantity !== null && b.soldCount + quantity > b.maxQuantity) return null;
  b.soldCount += quantity;
  b.updatedAt = new Date().toISOString();
  storeBundle(b);
  return b;
}

export function computeBundleEffectivePrice(bundleId: string): { total: number; currency: string; savings: number } | null {
  const b = getBundle(bundleId);
  if (!b) return null;
  let itemTotal = 0;
  for (const item of b.items) {
    const p = getProduct(item.productId);
    if (p) itemTotal += p.basePrice * item.quantity;
  }
  const discountPct = b.discountPercentage ?? 0;
  const savings = (itemTotal * discountPct) / 100;
  const effective = b.basePrice > 0 ? b.basePrice : Math.max(0, itemTotal - savings);
  return { total: effective, currency: b.currency, savings: itemTotal - effective };
}

export function supportsAllBundleTypes(): BundleType[] {
  return ["standard", "nested", "conditional", "organization", "limited", "starter"];
}

// ===== System 1 — Commerce Catalog =====

export function generateCommerceCatalog(): CommerceCatalog {
  const products = getAllProducts();
  const bundles = getAllBundles();
  const allItems: CatalogItemSummary[] = [
    ...products.map(p => ({
      id: p.id, type: mapProductTypeToCatalogType(p.type) as CatalogItemType,
      status: p.status, name: p.name, sku: p.sku,
      basePrice: p.basePrice, currency: p.currency,
      publishedAt: p.publishedAt, deprecatedAt: p.deprecatedAt,
    })),
    ...bundles.map(b => ({
      id: b.id, type: "bundle" as CatalogItemType, status: b.status,
      name: b.name, sku: b.sku, basePrice: b.basePrice, currency: b.currency,
      publishedAt: null, deprecatedAt: null,
    })),
  ];
  const byStatus: Record<CatalogItemStatus, number> = { active: 0, draft: 0, scheduled: 0, deprecated: 0, retired: 0 };
  const byType: Record<CatalogItemType, number> = {
    product: 0, bundle: 0, pass: 0, subscription: 0,
    currency_pack: 0, cosmetic_pack: 0, organization_package: 0, extension: 0,
  };
  for (const it of allItems) {
    byStatus[it.status] += 1;
    byType[it.type] += 1;
  }
  const now = Date.now();
  const recent = allItems
    .filter(i => i.publishedAt && now - new Date(i.publishedAt).getTime() < 30 * 24 * 3600 * 1000)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 10);
  const scheduled = allItems
    .filter(i => i.status === "scheduled")
    .slice(0, 10);
  const deprecated = allItems
    .filter(i => i.deprecatedAt && now - new Date(i.deprecatedAt).getTime() < 30 * 24 * 3600 * 1000)
    .sort((a, b) => (b.deprecatedAt ?? "").localeCompare(a.deprecatedAt ?? ""))
    .slice(0, 10);
  return {
    totalItems: allItems.length, byStatus, byType,
    recentlyPublished: recent, scheduledUpcoming: scheduled, deprecatedRecently: deprecated,
    updatedAt: new Date().toISOString(),
  };
}

function mapProductTypeToCatalogType(t: ProductType): CatalogItemType {
  switch (t) {
    case "subscription": return "subscription";
    case "currency": return "currency_pack";
    case "organization": return "organization_package";
    case "extension": return "extension";
    case "bundle": return "bundle";
    default: return "product";
  }
}

export function supportsAllCatalogStatuses(): CatalogItemStatus[] {
  return ["active", "draft", "scheduled", "deprecated", "retired"];
}
export function supportsAllCatalogTypes(): CatalogItemType[] {
  return ["product", "bundle", "pass", "subscription", "currency_pack", "cosmetic_pack", "organization_package", "extension"];
}
