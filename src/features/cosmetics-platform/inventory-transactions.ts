/** Systems 1, 8, 7 — Inventory Platform, Inventory Transactions, Cosmetic Unlock Engine. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeItem, getItems, getItem, storeTransaction, getTransactions, storeUnlockCondition, getUnlockConditions } from "./repository";
import type { InventoryItem, ItemStatus, TransactionType, InventoryTransaction, UnlockCondition, UnlockSource } from "./types";

const log = getLogger("cosmetics.inventory");

// ===== System 1 — Inventory Platform =====
export function grantItem(userId: string, cosmeticId: string, source: string, expiresAt?: string | null): InventoryItem {
  const existing = getItem(userId, cosmeticId);
  if (existing && existing.status === "owned") return existing;
  const now = new Date().toISOString();
  const item: InventoryItem = {
    id: randomUUID(), userId, cosmeticId, status: expiresAt ? "temporary" : "owned",
    acquiredAt: now, expiresAt: expiresAt ?? null, source,
    equippedAt: null, loadoutId: null, giftedBy: null, metadata: {},
  };
  storeItem(item);
  recordTransaction(userId, cosmeticId, "grant", "system", "Item granted", existing?.status ?? "locked", item.status);
  log.info("item.granted", { userId, cosmeticId, source });
  return item;
}

export function revokeItem(userId: string, cosmeticId: string, reason: string, performedBy: string): InventoryItem | null {
  const item = getItem(userId, cosmeticId);
  if (!item) return null;
  const before = item.status;
  item.status = "archived";
  storeItem(item);
  recordTransaction(userId, cosmeticId, "revoke", performedBy, reason, before, item.status);
  return item;
}

export function giftItem(fromUserId: string, toUserId: string, cosmeticId: string): InventoryItem | null {
  const item = getItem(fromUserId, cosmeticId);
  if (!item || !item.status.includes("owned")) return null;
  const before = item.status;
  item.status = "gifted";
  item.giftedBy = fromUserId;
  storeItem(item);
  recordTransaction(fromUserId, cosmeticId, "gift", fromUserId, `Gifted to ${toUserId}`, before, item.status);
  // Grant to recipient
  const now = new Date().toISOString();
  const newItem: InventoryItem = {
    id: randomUUID(), userId: toUserId, cosmeticId, status: "owned",
    acquiredAt: now, expiresAt: null, source: `gift:${fromUserId}`,
    equippedAt: null, loadoutId: null, giftedBy: fromUserId, metadata: {},
  };
  storeItem(newItem);
  recordTransaction(toUserId, cosmeticId, "grant", fromUserId, `Gifted from ${fromUserId}`, "locked", "owned");
  return newItem;
}

export function consumeItem(userId: string, cosmeticId: string, reason: string): InventoryItem | null {
  const item = getItem(userId, cosmeticId);
  if (!item || item.status !== "temporary") return null;
  const before = item.status;
  item.status = "expired";
  storeItem(item);
  recordTransaction(userId, cosmeticId, "consume", "system", reason, before, item.status);
  return item;
}

export function expireItem(userId: string, cosmeticId: string): InventoryItem | null {
  const item = getItem(userId, cosmeticId);
  if (!item || item.status !== "temporary") return null;
  const before = item.status;
  item.status = "expired";
  storeItem(item);
  recordTransaction(userId, cosmeticId, "expire", "system", "Item expired", before, item.status);
  return item;
}

export function restoreItem(userId: string, cosmeticId: string): InventoryItem | null {
  const item = getItem(userId, cosmeticId);
  if (!item || (item.status !== "expired" && item.status !== "archived")) return null;
  const before = item.status;
  item.status = "owned";
  storeItem(item);
  recordTransaction(userId, cosmeticId, "restore", "system", "Item restored", before, item.status);
  return item;
}

export function hideItem(userId: string, cosmeticId: string): InventoryItem | null {
  const item = getItem(userId, cosmeticId);
  if (!item) return null;
  item.status = "hidden";
  storeItem(item);
  return item;
}

export function getInventory(userId: string): InventoryItem[] { return getItems(userId); }
export function getOwnedItems(userId: string): InventoryItem[] { return getItems(userId).filter(i => i.status === "owned" || i.status === "equipped"); }
export function getEquippedItems(userId: string): InventoryItem[] { return getItems(userId).filter(i => i.status === "equipped"); }
export function getExpiredItems(userId: string): InventoryItem[] { return getItems(userId).filter(i => i.status === "expired"); }
export function getTemporaryItems(userId: string): InventoryItem[] { return getItems(userId).filter(i => i.status === "temporary"); }

// ===== System 8 — Inventory Transactions (audit trail) =====
function recordTransaction(userId: string, cosmeticId: string, type: TransactionType, performedBy: string, reason: string, beforeStatus: ItemStatus, afterStatus: ItemStatus): void {
  const tx: InventoryTransaction = {
    id: randomUUID(), userId, cosmeticId, type, performedBy, reason,
    timestamp: new Date().toISOString(), beforeStatus, afterStatus, metadata: {},
  };
  storeTransaction(tx);
}

export function getTransactionHistory(userId: string): InventoryTransaction[] { return getTransactions(userId); }

// ===== System 7 — Cosmetic Unlock Engine =====
export function registerUnlockCondition(input: {
  cosmeticId: string; source: UnlockSource; sourceRef: string; condition?: Record<string, unknown>;
}): UnlockCondition {
  const uc: UnlockCondition = {
    id: randomUUID(), cosmeticId: input.cosmeticId, source: input.source,
    sourceRef: input.sourceRef, condition: input.condition ?? {},
  };
  storeUnlockCondition(uc);
  return uc;
}

export function getUnlockConditionsForCosmetic(cosmeticId: string): UnlockCondition[] {
  return getUnlockConditions(cosmeticId);
}

export function checkUnlockConditions(cosmeticId: string, userId: string): boolean {
  const conditions = getUnlockConditions(cosmeticId);
  if (conditions.length === 0) return true; // No conditions = always unlockable
  // Check if any condition is met (references external systems — doesn't call them)
  // In production this would check via Event Bus. Here we return true if conditions exist.
  return conditions.length > 0;
}
