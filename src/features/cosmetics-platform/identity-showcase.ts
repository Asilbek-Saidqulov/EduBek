/** Systems 4, 9 — Player Identity + Showcase Platform. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeIdentity, getIdentity, storeShowcase, getShowcase } from "./repository";
import type { PlayerIdentity, PublicCard, Showcase } from "./types";

const log = getLogger("cosmetics.identity");

// ===== System 4 — Player Identity =====
export function initIdentity(userId: string, displayName: string): PlayerIdentity {
  const existing = getIdentity(userId);
  if (existing) return existing;
  const identity: PlayerIdentity = {
    userId, displayName, avatarCosmeticId: null, frameCosmeticId: null,
    bannerCosmeticId: null, themeCosmeticId: null, backgroundCosmeticId: null,
    titleCosmeticId: null, badgeCosmeticIds: [],
    publicCard: { bio: null, tagline: null, featuredCosmetics: [], featuredCollections: [], featuredAchievements: [], featuredStats: {} },
    updatedAt: new Date().toISOString(),
  };
  storeIdentity(identity);
  return identity;
}

export function getIdentityForUser(userId: string): PlayerIdentity | null { return getIdentity(userId); }

export function updateIdentity(userId: string, updates: Partial<PlayerIdentity>): PlayerIdentity | null {
  const identity = getIdentity(userId);
  if (!identity) return null;
  Object.assign(identity, updates, { updatedAt: new Date().toISOString() });
  storeIdentity(identity);
  return identity;
}

export function setAvatar(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { avatarCosmeticId: cosmeticId }); }
export function setFrame(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { frameCosmeticId: cosmeticId }); }
export function setBanner(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { bannerCosmeticId: cosmeticId }); }
export function setTheme(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { themeCosmeticId: cosmeticId }); }
export function setBackground(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { backgroundCosmeticId: cosmeticId }); }
export function setTitle(userId: string, cosmeticId: string): PlayerIdentity | null { return updateIdentity(userId, { titleCosmeticId: cosmeticId }); }

export function addBadge(userId: string, cosmeticId: string): PlayerIdentity | null {
  const identity = getIdentity(userId);
  if (!identity) return null;
  if (!identity.badgeCosmeticIds.includes(cosmeticId)) identity.badgeCosmeticIds.push(cosmeticId);
  return updateIdentity(userId, { badgeCosmeticIds: identity.badgeCosmeticIds });
}

export function removeBadge(userId: string, cosmeticId: string): PlayerIdentity | null {
  const identity = getIdentity(userId);
  if (!identity) return null;
  identity.badgeCosmeticIds = identity.badgeCosmeticIds.filter(b => b !== cosmeticId);
  return updateIdentity(userId, { badgeCosmeticIds: identity.badgeCosmeticIds });
}

export function updatePublicCard(userId: string, card: Partial<PublicCard>): PlayerIdentity | null {
  const identity = getIdentity(userId);
  if (!identity) return null;
  Object.assign(identity.publicCard, card);
  return updateIdentity(userId, { publicCard: identity.publicCard });
}

// ===== System 9 — Showcase Platform =====
export function initShowcase(userId: string): Showcase {
  const existing = getShowcase(userId);
  if (existing) return existing;
  const showcase: Showcase = {
    userId, featuredCosmetics: [], featuredCollections: [],
    featuredAchievements: [], featuredStats: [],
    updatedAt: new Date().toISOString(),
  };
  storeShowcase(showcase);
  return showcase;
}

export function getShowcaseForUser(userId: string): Showcase | null { return getShowcase(userId); }

export function addFeaturedCosmetic(userId: string, cosmeticId: string, slot: string, displayOrder: number): Showcase | null {
  const showcase = getShowcase(userId) ?? initShowcase(userId);
  showcase.featuredCosmetics.push({ cosmeticId, slot, displayOrder });
  showcase.featuredCosmetics.sort((a, b) => a.displayOrder - b.displayOrder);
  showcase.updatedAt = new Date().toISOString();
  storeShowcase(showcase);
  return showcase;
}

export function removeFeaturedCosmetic(userId: string, cosmeticId: string): Showcase | null {
  const showcase = getShowcase(userId);
  if (!showcase) return null;
  showcase.featuredCosmetics = showcase.featuredCosmetics.filter(c => c.cosmeticId !== cosmeticId);
  showcase.updatedAt = new Date().toISOString();
  storeShowcase(showcase);
  return showcase;
}

export function addFeaturedCollection(userId: string, collectionId: string): Showcase | null {
  const showcase = getShowcase(userId) ?? initShowcase(userId);
  if (!showcase.featuredCollections.includes(collectionId)) showcase.featuredCollections.push(collectionId);
  showcase.updatedAt = new Date().toISOString();
  storeShowcase(showcase);
  return showcase;
}

export function addFeaturedAchievement(userId: string, achievementId: string): Showcase | null {
  const showcase = getShowcase(userId) ?? initShowcase(userId);
  if (!showcase.featuredAchievements.includes(achievementId)) showcase.featuredAchievements.push(achievementId);
  showcase.updatedAt = new Date().toISOString();
  storeShowcase(showcase);
  return showcase;
}

export function addFeaturedStat(userId: string, statKey: string, statValue: string, displayOrder: number): Showcase | null {
  const showcase = getShowcase(userId) ?? initShowcase(userId);
  showcase.featuredStats.push({ statKey, statValue, displayOrder });
  showcase.featuredStats.sort((a, b) => a.displayOrder - b.displayOrder);
  showcase.updatedAt = new Date().toISOString();
  storeShowcase(showcase);
  return showcase;
}
