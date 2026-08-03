/** Systems 5, 10, 11, 12 — Collections, Personalization, Seasonal, Organization Identity. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeCollection, getCollection, getAllCollections,
  storeCollectionProgress, getCollectionProgress,
  storePersonalization, getPersonalization,
  storeSeasonalCosmetic, getSeasonalCosmetic, getAllSeasonalCosmetics,
  storeOrgIdentity, getOrgIdentity, getAllOrgIdentities,
  getItems,
} from "./repository";
import type {
  Collection, CollectionProgress,
  PersonalizationSettings,
  SeasonalCosmetic,
  OrganizationIdentity, OrganizationType,
} from "./types";

const log = getLogger("cosmetics.collections");

// ===== System 5 — Collections =====
export function createCollection(input: {
  name: string; description: string; cosmeticIds: string[];
  setBonusVisual?: string | null; seasonId?: string | null;
  organizationId?: string | null; limited?: boolean;
  type?: "standard" | "season" | "limited" | "organization";
}): Collection {
  const collection: Collection = {
    id: randomUUID(), name: input.name, description: input.description,
    cosmeticIds: input.cosmeticIds, setBonusVisual: input.setBonusVisual ?? null,
    seasonId: input.seasonId ?? null, organizationId: input.organizationId ?? null,
    limited: input.limited ?? false, type: input.type ?? "standard",
  };
  storeCollection(collection);
  return collection;
}

export function getCollectionById(id: string): Collection | null { return getCollection(id); }
export function listCollections(): Collection[] { return getAllCollections(); }

export function computeCollectionProgress(userId: string, collectionId: string): CollectionProgress | null {
  const collection = getCollection(collectionId);
  if (!collection) return null;
  const userItems = getItems(userId);
  const ownedCosmeticIds = new Set(userItems.filter(i => i.status === "owned" || i.status === "equipped").map(i => i.cosmeticId));
  const ownedCount = collection.cosmeticIds.filter(id => ownedCosmeticIds.has(id)).length;
  const totalCount = collection.cosmeticIds.length;
  const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;
  const completed = ownedCount === totalCount && totalCount > 0;
  const existing = getCollectionProgress(userId).find(p => p.collectionId === collectionId);
  const progress: CollectionProgress = {
    collectionId, userId, ownedCount, totalCount, completionPct,
    completed, completedAt: completed && !existing?.completed ? new Date().toISOString() : existing?.completedAt ?? null,
  };
  storeCollectionProgress(progress);
  return progress;
}

export function getUserCollections(userId: string): CollectionProgress[] {
  return getCollectionProgress(userId);
}

// ===== System 10 — Personalization Engine =====
export function initPersonalization(userId: string): PersonalizationSettings {
  const existing = getPersonalization(userId);
  if (existing) return existing;
  const settings: PersonalizationSettings = {
    userId, themeId: null, accessibilityTheme: null,
    animationPackId: null, soundPackId: null,
    uiScale: "medium", reducedMotion: false, highContrast: false,
    colorBlindMode: null, updatedAt: new Date().toISOString(),
  };
  storePersonalization(settings);
  return settings;
}

export function getPersonalizationForUser(userId: string): PersonalizationSettings | null { return getPersonalization(userId); }

export function updatePersonalization(userId: string, updates: Partial<PersonalizationSettings>): PersonalizationSettings | null {
  const settings = getPersonalization(userId) ?? initPersonalization(userId);
  Object.assign(settings, updates, { updatedAt: new Date().toISOString() });
  storePersonalization(settings);
  return settings;
}

export function setTheme(userId: string, themeId: string | null): PersonalizationSettings | null { return updatePersonalization(userId, { themeId }); }
export function setAccessibilityTheme(userId: string, theme: string | null): PersonalizationSettings | null { return updatePersonalization(userId, { accessibilityTheme: theme }); }
export function setAnimationPack(userId: string, packId: string | null): PersonalizationSettings | null { return updatePersonalization(userId, { animationPackId: packId }); }
export function setSoundPack(userId: string, packId: string | null): PersonalizationSettings | null { return updatePersonalization(userId, { soundPackId: packId }); }
export function setUIScale(userId: string, scale: "small" | "medium" | "large" | "extra_large"): PersonalizationSettings | null { return updatePersonalization(userId, { uiScale: scale }); }
export function setReducedMotion(userId: string, enabled: boolean): PersonalizationSettings | null { return updatePersonalization(userId, { reducedMotion: enabled }); }
export function setHighContrast(userId: string, enabled: boolean): PersonalizationSettings | null { return updatePersonalization(userId, { highContrast: enabled }); }
export function setColorBlindMode(userId: string, mode: string | null): PersonalizationSettings | null { return updatePersonalization(userId, { colorBlindMode: mode }); }

// ===== System 11 — Seasonal Cosmetics =====
export function registerSeasonalCosmetic(input: {
  cosmeticId: string; seasonId: string; availableFrom: string; availableUntil: string;
  legacyLabel?: string | null;
}): SeasonalCosmetic {
  const seasonal: SeasonalCosmetic = {
    cosmeticId: input.cosmeticId, seasonId: input.seasonId,
    availableFrom: input.availableFrom, availableUntil: input.availableUntil,
    retired: false, retiredAt: null, legacyLabel: input.legacyLabel ?? null,
  };
  storeSeasonalCosmetic(seasonal);
  return seasonal;
}

export function getSeasonalInfo(cosmeticId: string): SeasonalCosmetic | null { return getSeasonalCosmetic(cosmeticId); }
export function listSeasonalCosmetics(): SeasonalCosmetic[] { return getAllSeasonalCosmetics(); }

export function retireSeasonalCosmetic(cosmeticId: string): SeasonalCosmetic | null {
  const s = getSeasonalCosmetic(cosmeticId);
  if (!s) return null;
  s.retired = true;
  s.retiredAt = new Date().toISOString();
  return s;
}

export function isSeasonalAvailable(cosmeticId: string, timestamp: string): boolean {
  const s = getSeasonalCosmetic(cosmeticId);
  if (!s) return true; // Not seasonal = always available
  if (s.retired) return false;
  const ts = new Date(timestamp).getTime();
  return ts >= new Date(s.availableFrom).getTime() && ts <= new Date(s.availableUntil).getTime();
}

// ===== System 12 — Organization Identity =====
export function createOrgIdentity(input: {
  organizationId: string; organizationType: OrganizationType;
  themeCosmeticId?: string | null; bannerCosmeticId?: string | null;
  logoUrl?: string | null; brandingColor?: string | null; createdBy: string;
}): OrganizationIdentity {
  const now = new Date().toISOString();
  const identity: OrganizationIdentity = {
    id: randomUUID(), organizationId: input.organizationId,
    organizationType: input.organizationType,
    themeCosmeticId: input.themeCosmeticId ?? null,
    bannerCosmeticId: input.bannerCosmeticId ?? null,
    logoUrl: input.logoUrl ?? null, brandingColor: input.brandingColor ?? null,
    createdBy: input.createdBy, createdAt: now, updatedAt: now,
  };
  storeOrgIdentity(identity);
  log.info("org_identity.created", { orgId: input.organizationId, type: input.organizationType });
  return identity;
}

export function getOrgIdentityById(id: string): OrganizationIdentity | null { return getOrgIdentity(id); }
export function listOrgIdentities(): OrganizationIdentity[] { return getAllOrgIdentities(); }

export function updateOrgIdentity(id: string, updates: Partial<OrganizationIdentity>): OrganizationIdentity | null {
  const identity = getOrgIdentity(id);
  if (!identity) return null;
  Object.assign(identity, updates, { updatedAt: new Date().toISOString() });
  return identity;
}
