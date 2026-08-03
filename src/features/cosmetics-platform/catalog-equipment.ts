/** Systems 2, 3, 6 — Cosmetic Catalog, Equipment System, Rarity System. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeCosmetic, getCosmetic, getAllCosmetics, storeLoadout, getLoadouts, getLoadout, storeRarity, getRarity, getAllRarities, getItems } from "./repository";
import type { CosmeticDefinition, CosmeticType, Loadout, EquipmentSlot, EquipmentConflict, Rarity, RarityDefinition } from "./types";

const log = getLogger("cosmetics.catalog");

// ===== System 6 — Rarity System =====
export const DEFAULT_RARITIES: RarityDefinition[] = [
  { rarity: "common", displayName: "Common", color: "#9ca3af", dropWeight: 100, description: "Standard items available to everyone" },
  { rarity: "uncommon", displayName: "Uncommon", color: "#4ade80", dropWeight: 60, description: "Slightly rarer than common" },
  { rarity: "rare", displayName: "Rare", color: "#60a5fa", dropWeight: 30, description: "Notable cosmetic items" },
  { rarity: "epic", displayName: "Epic", color: "#c084fc", dropWeight: 10, description: "Highly sought-after items" },
  { rarity: "legendary", displayName: "Legendary", color: "#fbbf24", dropWeight: 3, description: "Exceptional rarity" },
  { rarity: "mythic", displayName: "Mythic", color: "#f87171", dropWeight: 1, description: "The rarest of all cosmetics" },
  { rarity: "custom", displayName: "Custom", color: "#ffffff", dropWeight: 0, description: "Special or unique items" },
];

export function initializeRarities(): void { for (const r of DEFAULT_RARITIES) storeRarity(r); }
export function getRarityDefinition(rarity: Rarity): RarityDefinition | null { return getRarity(rarity); }
export function listRarities(): RarityDefinition[] { return getAllRarities(); }

// ===== System 2 — Cosmetic Catalog =====
export function createCosmetic(input: {
  name: string; description: string; type: CosmeticType; rarity: Rarity;
  iconUrl?: string | null; previewUrl?: string | null; category?: string;
  tags?: string[]; unlockable?: boolean; tradeable?: boolean;
  seasonId?: string | null; organizationId?: string | null; extensionId?: string | null;
  metadata?: Record<string, unknown>;
}): CosmeticDefinition {
  const cosmetic: CosmeticDefinition = {
    id: randomUUID(), name: input.name, description: input.description,
    type: input.type, rarity: input.rarity, iconUrl: input.iconUrl ?? null,
    previewUrl: input.previewUrl ?? null, category: input.category ?? "general",
    tags: input.tags ?? [], unlockable: input.unlockable ?? true,
    tradeable: input.tradeable ?? false, seasonId: input.seasonId ?? null,
    organizationId: input.organizationId ?? null, extensionId: input.extensionId ?? null,
    metadata: input.metadata ?? {},
  };
  storeCosmetic(cosmetic);
  log.info("cosmetic.created", { id: cosmetic.id, name: input.name, type: input.type });
  return cosmetic;
}

export function getCosmeticById(id: string): CosmeticDefinition | null { return getCosmetic(id); }
export function listCosmetics(type?: CosmeticType, rarity?: Rarity): CosmeticDefinition[] {
  let all = getAllCosmetics();
  if (type) all = all.filter(c => c.type === type);
  if (rarity) all = all.filter(c => c.rarity === rarity);
  return all;
}

// ===== System 3 — Equipment System =====
export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "avatar", "frame", "banner", "theme", "background", "title",
  "badge", "nameplate", "border", "loading_card", "victory_animation",
  "lobby_animation", "cursor", "confetti", "reaction",
];

export function createLoadout(userId: string, name: string, isDefault = false): Loadout {
  const now = new Date().toISOString();
  const equipment = {} as Record<EquipmentSlot, string | null>;
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;
  const loadout: Loadout = { id: randomUUID(), userId, name, isDefault, equipment, createdAt: now, updatedAt: now };
  storeLoadout(loadout);
  return loadout;
}

export function getLoadoutsForUser(userId: string): Loadout[] { return getLoadouts(userId); }
export function getLoadoutById(userId: string, loadoutId: string): Loadout | null { return getLoadout(userId, loadoutId); }

export function equipItem(userId: string, loadoutId: string, slot: EquipmentSlot, cosmeticId: string): Loadout | null {
  const loadout = getLoadout(userId, loadoutId);
  if (!loadout) return null;
  // Verify the user owns the cosmetic
  const item = getItems(userId).find(i => i.cosmeticId === cosmeticId);
  if (!item || (item.status !== "owned" && item.status !== "equipped")) return null;
  // Verify the cosmetic type matches the slot
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic) return null;
  if (!isValidSlotForCosmetic(slot, cosmetic.type)) return null;
  loadout.equipment[slot] = cosmeticId;
  loadout.updatedAt = new Date().toISOString();
  storeLoadout(loadout);
  return loadout;
}

export function unequipItem(userId: string, loadoutId: string, slot: EquipmentSlot): Loadout | null {
  const loadout = getLoadout(userId, loadoutId);
  if (!loadout) return null;
  loadout.equipment[slot] = null;
  loadout.updatedAt = new Date().toISOString();
  storeLoadout(loadout);
  return loadout;
}

export function detectConflicts(loadout: Loadout): EquipmentConflict[] {
  const conflicts: EquipmentConflict[] = [];
  // Check for same cosmetic in multiple slots
  const seen = new Map<string, EquipmentSlot>();
  for (const slot of EQUIPMENT_SLOTS) {
    const id = loadout.equipment[slot];
    if (id) {
      if (seen.has(id)) {
        conflicts.push({ slot, itemId: id, conflictWith: seen.get(id)!, reason: "Same cosmetic equipped in multiple slots" });
      } else {
        seen.set(id, slot);
      }
    }
  }
  return conflicts;
}

export function isValidSlotForCosmetic(slot: EquipmentSlot, cosmeticType: CosmeticType): boolean {
  const slotToType: Record<EquipmentSlot, CosmeticType[]> = {
    avatar: ["avatar"], frame: ["avatar_frame"], banner: ["banner"],
    theme: ["profile_theme"], background: ["background"], title: ["title"],
    badge: ["badge"], nameplate: ["nameplate"], border: ["border"],
    loading_card: ["loading_card"], victory_animation: ["victory_animation"],
    lobby_animation: ["lobby_animation"], cursor: ["cursor"],
    confetti: ["confetti"], reaction: ["reaction"],
  };
  return slotToType[slot]?.includes(cosmeticType) ?? false;
}
