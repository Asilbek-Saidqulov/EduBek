/**
 * EduBek — Cosmetics, Inventory, Identity & Personalization Platform types.
 * Phase 6G.11: Single source of truth for every cosmetic item, inventory
 * asset, collectible, profile customization, and player identity.
 *
 * Architecture: Passive Event Bus consumer + producer.
 * Never owns gameplay, XP, ratings, achievements, or rewards.
 * Only manages cosmetic ownership, inventory state, profile appearance.
 */

// ===== System 1 — Inventory Platform =====
export type ItemStatus = "owned" | "locked" | "equipped" | "temporary" | "expired" | "hidden" | "archived" | "gifted";

export interface InventoryItem {
  id: string; userId: string; cosmeticId: string; status: ItemStatus;
  acquiredAt: string; expiresAt: string | null; source: string;
  equippedAt: string | null; loadoutId: string | null;
  giftedBy: string | null; metadata: Record<string, unknown>;
}

// ===== System 2 — Cosmetic Catalog =====
export type CosmeticType =
  | "avatar" | "avatar_frame" | "banner" | "profile_theme" | "background"
  | "title" | "badge" | "emoji" | "reaction" | "victory_animation"
  | "lobby_animation" | "confetti" | "cursor" | "nameplate" | "border"
  | "loading_card" | "profile_decoration" | "custom";

export interface CosmeticDefinition {
  id: string; name: string; description: string; type: CosmeticType;
  rarity: Rarity; iconUrl: string | null; previewUrl: string | null;
  category: string; tags: string[]; unlockable: boolean; tradeable: boolean;
  seasonId: string | null; organizationId: string | null; extensionId: string | null;
  metadata: Record<string, unknown>;
}

// ===== System 3 — Equipment System =====
export type EquipmentSlot =
  | "avatar" | "frame" | "banner" | "theme" | "background"
  | "title" | "badge" | "nameplate" | "border" | "loading_card"
  | "victory_animation" | "lobby_animation" | "cursor" | "confetti" | "reaction";

export interface Loadout {
  id: string; userId: string; name: string; isDefault: boolean;
  equipment: Record<EquipmentSlot, string | null>;
  createdAt: string; updatedAt: string;
}

export interface EquipmentConflict {
  slot: EquipmentSlot; itemId: string; conflictWith: string; reason: string;
}

// ===== System 4 — Player Identity =====
export interface PlayerIdentity {
  userId: string; displayName: string; avatarCosmeticId: string | null;
  frameCosmeticId: string | null; bannerCosmeticId: string | null;
  themeCosmeticId: string | null; backgroundCosmeticId: string | null;
  titleCosmeticId: string | null; badgeCosmeticIds: string[];
  publicCard: PublicCard; updatedAt: string;
}

export interface PublicCard {
  bio: string | null; tagline: string | null;
  featuredCosmetics: string[]; featuredCollections: string[];
  featuredAchievements: string[]; featuredStats: Record<string, string>;
}

// ===== System 5 — Collections =====
export interface Collection {
  id: string; name: string; description: string; cosmeticIds: string[];
  setBonusVisual: string | null; seasonId: string | null;
  organizationId: string | null; limited: boolean; type: "standard" | "season" | "limited" | "organization";
}

export interface CollectionProgress {
  collectionId: string; userId: string; ownedCount: number; totalCount: number;
  completionPct: number; completed: boolean; completedAt: string | null;
}

// ===== System 6 — Rarity System =====
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "custom";

export interface RarityDefinition {
  rarity: Rarity; displayName: string; color: string; dropWeight: number;
  description: string;
}

// ===== System 7 — Cosmetic Unlock Engine =====
export type UnlockSource =
  | "achievement" | "progression" | "competitive" | "liveops"
  | "teacher_reward" | "marketplace" | "developer_extension" | "default" | "gift";

export interface UnlockCondition {
  id: string; cosmeticId: string; source: UnlockSource;
  sourceRef: string; condition: Record<string, unknown>;
}

// ===== System 8 — Inventory Transactions =====
export type TransactionType = "grant" | "revoke" | "gift" | "consume" | "expire" | "restore";

export interface InventoryTransaction {
  id: string; userId: string; cosmeticId: string; type: TransactionType;
  performedBy: string; reason: string; timestamp: string;
  beforeStatus: ItemStatus; afterStatus: ItemStatus; metadata: Record<string, unknown>;
}

// ===== System 9 — Showcase Platform =====
export interface Showcase {
  userId: string; featuredCosmetics: Array<{ cosmeticId: string; slot: string; displayOrder: number }>;
  featuredCollections: string[]; featuredAchievements: string[];
  featuredStats: Array<{ statKey: string; statValue: string; displayOrder: number }>;
  updatedAt: string;
}

// ===== System 10 — Personalization Engine =====
export interface PersonalizationSettings {
  userId: string; themeId: string | null; accessibilityTheme: string | null;
  animationPackId: string | null; soundPackId: string | null;
  uiScale: "small" | "medium" | "large" | "extra_large";
  reducedMotion: boolean; highContrast: boolean; colorBlindMode: string | null;
  updatedAt: string;
}

// ===== System 11 — Seasonal Cosmetics =====
export interface SeasonalCosmetic {
  cosmeticId: string; seasonId: string; availableFrom: string; availableUntil: string;
  retired: boolean; retiredAt: string | null; legacyLabel: string | null;
}

// ===== System 12 — Organization Identity =====
export type OrganizationType = "school" | "university" | "district" | "enterprise";

export interface OrganizationIdentity {
  id: string; organizationId: string; organizationType: OrganizationType;
  themeCosmeticId: string | null; bannerCosmeticId: string | null;
  logoUrl: string | null; brandingColor: string | null;
  createdBy: string; createdAt: string; updatedAt: string;
}

// ===== System 13 — Marketplace Integration =====
export interface MarketplaceItem {
  cosmeticId: string; listingId: string; price: number; currency: string;
  licenseVerified: boolean; purchasedBy: string | null; purchasedAt: string | null;
}

// ===== System 14 — Extension Integration =====
export interface ExtensionCosmetic {
  cosmeticId: string; extensionId: string; namespace: string;
  validated: boolean; compatible: boolean; sandboxSafe: boolean;
}

// ===== System 15 — Inventory Analytics =====
export interface InventoryAnalytics {
  totalItems: number; ownershipRate: number; equipRate: number;
  popularCosmetics: Array<{ cosmeticId: string; name: string; ownedCount: number; equippedCount: number }>;
  collectionCompletion: Array<{ collectionId: string; name: string; completionPct: number }>;
  unlockSources: Record<UnlockSource, number>;
}

// ===== System 16 — Inventory Dashboard =====
export interface InventoryDashboard {
  userId: string; totalOwned: number; totalEquipped: number; totalLocked: number;
  totalExpired: number; totalHidden: number; loadouts: Loadout[];
  collections: CollectionProgress[]; seasonItems: number;
  organizationAssets: number; recentTransactions: InventoryTransaction[];
  health: { status: "healthy" | "warning" | "critical"; issues: string[] };
}

// ===== Event Bus =====
export type CosmeticEventType =
  | "CosmeticUnlocked" | "CosmeticEquipped" | "CosmeticUnequipped"
  | "CosmeticGifted" | "CosmeticRevoked" | "CosmeticExpired"
  | "LoadoutSaved" | "CollectionCompleted" | "IdentityUpdated"
  | "ShowcaseUpdated" | "PersonalizationChanged";

export interface DeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>;
  eventContracts: string[]; extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string };
}
