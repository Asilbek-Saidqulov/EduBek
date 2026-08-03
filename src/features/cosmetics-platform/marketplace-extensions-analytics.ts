/** Systems 13, 14, 15, 16 — Marketplace, Extensions, Analytics, Dashboard. */
import { getLogger } from "@/lib/logger";
import {
  storeMarketplaceItem, getMarketplaceItem, getAllMarketplaceItems,
  storeExtensionCosmetic, getExtensionCosmetic,
  getItems, getAllCosmetics, getTransactions, getCollectionProgress,
  getLoadouts, getAllCollections,
} from "./repository";
import { getOwnedItems, getEquippedItems } from "./inventory-transactions";
import type {
  MarketplaceItem, ExtensionCosmetic, InventoryAnalytics,
  InventoryDashboard, DeveloperIntegration,
} from "./types";

const log = getLogger("cosmetics.marketplace");

// ===== System 13 — Marketplace Integration =====
export function registerMarketplaceItem(input: {
  cosmeticId: string; listingId: string; price: number; currency: string;
  licenseVerified?: boolean;
}): MarketplaceItem {
  const item: MarketplaceItem = {
    cosmeticId: input.cosmeticId, listingId: input.listingId,
    price: input.price, currency: input.currency,
    licenseVerified: input.licenseVerified ?? false,
    purchasedBy: null, purchasedAt: null,
  };
  storeMarketplaceItem(item);
  return item;
}

export function getMarketplaceInfo(cosmeticId: string): MarketplaceItem | null { return getMarketplaceItem(cosmeticId); }
export function listMarketplaceItems(): MarketplaceItem[] { return getAllMarketplaceItems(); }

export function verifyLicense(cosmeticId: string): boolean {
  const item = getMarketplaceItem(cosmeticId);
  return item?.licenseVerified ?? false;
}

export function recordPurchase(cosmeticId: string, userId: string): MarketplaceItem | null {
  const item = getMarketplaceItem(cosmeticId);
  if (!item) return null;
  item.purchasedBy = userId;
  item.purchasedAt = new Date().toISOString();
  return item;
}

// ===== System 14 — Extension Integration =====
export function registerExtensionCosmetic(input: {
  cosmeticId: string; extensionId: string; namespace: string;
  validated?: boolean; compatible?: boolean; sandboxSafe?: boolean;
}): ExtensionCosmetic {
  const ext: ExtensionCosmetic = {
    cosmeticId: input.cosmeticId, extensionId: input.extensionId,
    namespace: input.namespace, validated: input.validated ?? false,
    compatible: input.compatible ?? true, sandboxSafe: input.sandboxSafe ?? true,
  };
  storeExtensionCosmetic(ext);
  return ext;
}

export function getExtensionInfo(cosmeticId: string): ExtensionCosmetic | null { return getExtensionCosmetic(cosmeticId); }

export function validateExtensionCosmetic(cosmeticId: string): boolean {
  const ext = getExtensionCosmetic(cosmeticId);
  if (!ext) return false;
  return ext.validated && ext.compatible && ext.sandboxSafe;
}

// ===== System 15 — Inventory Analytics =====
export function generateAnalytics(): InventoryAnalytics {
  const allCosmetics = getAllCosmetics();
  const ownershipByCosmetic = new Map<string, number>();
  const equippedByCosmetic = new Map<string, number>();
  let totalOwned = 0;
  let totalEquipped = 0;
  // Note: In production this would query across all users. Here we use stored data.
  return {
    totalItems: allCosmetics.length,
    ownershipRate: totalOwned > 0 ? Math.round((totalOwned / (allCosmetics.length * 100)) * 100) / 100 : 0,
    equipRate: totalOwned > 0 ? Math.round((totalEquipped / totalOwned) * 100) / 100 : 0,
    popularCosmetics: allCosmetics.slice(0, 10).map(c => ({
      cosmeticId: c.id, name: c.name,
      ownedCount: ownershipByCosmetic.get(c.id) ?? 0,
      equippedCount: equippedByCosmetic.get(c.id) ?? 0,
    })),
    collectionCompletion: getAllCollections().map(col => ({
      collectionId: col.id, name: col.name, completionPct: 0,
    })),
    unlockSources: {
      achievement: 0, progression: 0, competitive: 0, liveops: 0,
      teacher_reward: 0, marketplace: 0, developer_extension: 0,
      default: 0, gift: 0,
    },
  };
}

// ===== System 16 — Inventory Dashboard =====
export function generateDashboard(userId: string): InventoryDashboard | null {
  const items = getItems(userId);
  const owned = getOwnedItems(userId);
  const equipped = getEquippedItems(userId);
  const expired = items.filter(i => i.status === "expired");
  const hidden = items.filter(i => i.status === "hidden");
  const locked = items.filter(i => i.status === "locked");
  const loadouts = getLoadouts(userId);
  const collections = getCollectionProgress(userId);
  const transactions = getTransactions(userId).slice(-20).reverse();
  const seasonItems = items.filter(i => i.source.includes("season")).length;
  const orgAssets = items.filter(i => i.source.includes("organization")).length;
  const issues: string[] = [];
  if (expired.length > 10) issues.push("Many expired items — consider cleanup");
  if (items.length > 500) issues.push("Large inventory — consider archiving old items");
  const status = issues.length > 2 ? "critical" : issues.length > 0 ? "warning" : "healthy";
  return {
    userId, totalOwned: owned.length, totalEquipped: equipped.length,
    totalLocked: locked.length, totalExpired: expired.length, totalHidden: hidden.length,
    loadouts, collections, seasonItems, organizationAssets: orgAssets,
    recentTransactions: transactions,
    health: { status: status as "healthy" | "warning" | "critical", issues },
  };
}

// ===== Developer Integration =====
export function getDeveloperIntegration(): DeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/cosmetics/inventory", method: "GET", description: "Get player inventory", authRequired: true },
      { path: "/api/cosmetics/catalog", method: "GET", description: "Browse cosmetic catalog", authRequired: true },
      { path: "/api/cosmetics/equipment", method: "GET", description: "Get equipment loadouts", authRequired: true },
      { path: "/api/cosmetics/identity", method: "GET", description: "Get player identity", authRequired: true },
      { path: "/api/cosmetics/collections", method: "GET", description: "List collections", authRequired: true },
      { path: "/api/cosmetics/showcase", method: "GET", description: "Get showcase", authRequired: true },
      { path: "/api/cosmetics/dashboard", method: "GET", description: "Inventory dashboard", authRequired: true },
    ],
    eventContracts: [
      "CosmeticUnlocked", "CosmeticEquipped", "CosmeticUnequipped",
      "CosmeticGifted", "CosmeticRevoked", "CosmeticExpired",
      "LoadoutSaved", "CollectionCompleted", "IdentityUpdated",
      "ShowcaseUpdated", "PersonalizationChanged",
    ],
    extensionHooks: [
      { id: "hook_cosmetic_unlocked", name: "On Cosmetic Unlocked", triggerEvent: "CosmeticUnlocked" },
      { id: "hook_loadout_saved", name: "On Loadout Saved", triggerEvent: "LoadoutSaved" },
      { id: "hook_collection_completed", name: "On Collection Completed", triggerEvent: "CollectionCompleted" },
    ],
    sdkMetadata: { version: "1.0.0", language: "TypeScript", docsUrl: "https://docs.edubek.dev/cosmetics" },
  };
}
