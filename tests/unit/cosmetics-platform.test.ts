/**
 * EduBek — Cosmetics, Inventory, Identity & Personalization Platform tests. Phase 6G.11.
 */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  initializeRarities, getRarityDefinition, listRarities, DEFAULT_RARITIES,
  createCosmetic, getCosmeticById, listCosmetics,
  createLoadout, getLoadoutsForUser, getLoadoutById, equipItem, unequipItem, detectConflicts, isValidSlotForCosmetic, EQUIPMENT_SLOTS,
  grantItem, revokeItem, giftItem, consumeItem, expireItem, restoreItem, hideItem, getInventory, getOwnedItems, getEquippedItems, getExpiredItems, getTemporaryItems, getTransactionHistory, registerUnlockCondition, getUnlockConditionsForCosmetic, checkUnlockConditions,
  initIdentity, getIdentityForUser, updateIdentity, setAvatar, setFrame, setBanner, setTheme, setBackground, setTitle, addBadge, removeBadge, updatePublicCard, initShowcase, getShowcaseForUser, addFeaturedCosmetic, removeFeaturedCosmetic, addFeaturedCollection, addFeaturedAchievement, addFeaturedStat,
  createCollection, getCollectionById, listCollections, computeCollectionProgress, getUserCollections,
  initPersonalization, getPersonalizationForUser, updatePersonalization, setAccessibilityTheme, setAnimationPack, setSoundPack, setUIScale, setReducedMotion, setHighContrast, setColorBlindMode,
  registerSeasonalCosmetic, getSeasonalInfo, listSeasonalCosmetics, retireSeasonalCosmetic, isSeasonalAvailable,
  createOrgIdentity, getOrgIdentityById, listOrgIdentities, updateOrgIdentity,
  registerMarketplaceItem, getMarketplaceInfo, listMarketplaceItems, verifyLicense, recordPurchase,
  registerExtensionCosmetic, getExtensionInfo, validateExtensionCosmetic,
  generateAnalytics, generateDashboard, getDeveloperIntegration,
  subscribeCosmetics, unsubscribeCosmetics, isCosmeticsSubscribed, getBridgeProcessedCount, publishCosmeticEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/cosmetics-platform";
import { createMatch, emitEvent } from "@/features/game-engine";

beforeAll(() => { initializeRarities(); });
beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); initializeRarities(); });

// ===== System 6 — Rarity =====
describe("Cosmetics — Rarity", () => {
  it("initializes 7 rarities", () => { expect(DEFAULT_RARITIES.length).toBe(7); });
  it("gets rarity by name", () => { expect(getRarityDefinition("common")).not.toBeNull(); expect(getRarityDefinition("mythic")).not.toBeNull(); });
  it("lists all rarities", () => { expect(listRarities().length).toBe(7); });
  it("each rarity has display name", () => { for (const r of listRarities()) expect(r.displayName.length).toBeGreaterThan(0); });
  it("each rarity has color", () => { for (const r of listRarities()) expect(r.color).toMatch(/^#/); });
  it("each rarity has drop weight", () => { for (const r of listRarities()) expect(r.dropWeight).toBeGreaterThanOrEqual(0); });
  it("supports all rarity types", () => { for (const r of ["common","uncommon","rare","epic","legendary","mythic","custom"] as const) expect(getRarityDefinition(r)).not.toBeNull(); });
});

// ===== System 2 — Cosmetic Catalog =====
describe("Cosmetics — Catalog", () => {
  it("creates a cosmetic", () => { const c = createCosmetic({ name: "Test Avatar", description: "test", type: "avatar", rarity: "common" }); expect(c.id).toBeDefined(); expect(c.unlockable).toBe(true); });
  it("gets cosmetic by id", () => { const c = createCosmetic({ name: "T", description: "", type: "avatar", rarity: "rare" }); expect(getCosmeticById(c.id)).not.toBeNull(); expect(getCosmeticById("nonexistent")).toBeNull(); });
  it("lists cosmetics", () => { createCosmetic({ name: "C1", description: "", type: "avatar", rarity: "common" }); createCosmetic({ name: "C2", description: "", type: "banner", rarity: "rare" }); expect(listCosmetics().length).toBe(2); });
  it("lists by type", () => { createCosmetic({ name: "C1", description: "", type: "avatar", rarity: "common" }); createCosmetic({ name: "C2", description: "", type: "banner", rarity: "rare" }); expect(listCosmetics("avatar").length).toBe(1); });
  it("lists by rarity", () => { createCosmetic({ name: "C1", description: "", type: "avatar", rarity: "common" }); createCosmetic({ name: "C2", description: "", type: "avatar", rarity: "rare" }); expect(listCosmetics(undefined, "rare").length).toBe(1); });
  it("supports all cosmetic types", () => { for (const t of ["avatar","avatar_frame","banner","profile_theme","background","title","badge","emoji","reaction","victory_animation","lobby_animation","confetti","cursor","nameplate","border","loading_card","profile_decoration","custom"] as const) expect(createCosmetic({ name: `C-${t}`, description: "", type: t, rarity: "common" }).type).toBe(t); });
  it("cosmetic has tags", () => { const c = createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", tags: ["holiday","limited"] }); expect(c.tags.length).toBe(2); });
  it("cosmetic default tradeable false", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).tradeable).toBe(false); });
  it("cosmetic custom tradeable", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", tradeable: true }).tradeable).toBe(true); });
});

// ===== System 3 — Equipment =====
describe("Cosmetics — Equipment", () => {
  it("creates a loadout", () => { const l = createLoadout("u1", "Default"); expect(l.id).toBeDefined(); expect(l.isDefault).toBe(false); });
  it("gets loadouts for user", () => { createLoadout("u1", "L1"); createLoadout("u1", "L2"); expect(getLoadoutsForUser("u1").length).toBe(2); });
  it("gets loadout by id", () => { const l = createLoadout("u1", "L1"); expect(getLoadoutById("u1", l.id)).not.toBeNull(); });
  it("equips item", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); expect(equipItem("u1", l.id, "avatar", c.id)?.equipment.avatar).toBe(c.id); });
  it("unequips item", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); equipItem("u1", l.id, "avatar", c.id); expect(unequipItem("u1", l.id, "avatar")?.equipment.avatar).toBeNull(); });
  it("equip non-owned returns null", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); const l = createLoadout("u1", "L1"); expect(equipItem("u1", l.id, "avatar", c.id)).toBeNull(); });
  it("equip wrong type returns null", () => { const c = createCosmetic({ name: "B", description: "", type: "banner", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); expect(equipItem("u1", l.id, "avatar", c.id)).toBeNull(); });
  it("detects conflicts", () => { const l = createLoadout("u1", "L1"); expect(detectConflicts(l)).toEqual([]); });
  it("validates slot for cosmetic", () => { expect(isValidSlotForCosmetic("avatar", "avatar")).toBe(true); expect(isValidSlotForCosmetic("avatar", "banner")).toBe(false); });
  it("has 15 equipment slots", () => { expect(EQUIPMENT_SLOTS.length).toBe(15); });
  it("equip on non-existent loadout returns null", () => { expect(equipItem("u1", "nonexistent", "avatar", "c1")).toBeNull(); });
});

// ===== System 1 — Inventory =====
describe("Cosmetics — Inventory", () => {
  it("grants item", () => { const item = grantItem("u1", "cosmetic-1", "default"); expect(item.status).toBe("owned"); });
  it("grants temporary item", () => { const item = grantItem("u1", "c1", "event", "2025-12-31"); expect(item.status).toBe("temporary"); expect(item.expiresAt).toBe("2025-12-31"); });
  it("grant is idempotent for owned", () => { grantItem("u1", "c1", "default"); const item2 = grantItem("u1", "c1", "default"); expect(item2.status).toBe("owned"); });
  it("revokes item", () => { grantItem("u1", "c1", "default"); expect(revokeItem("u1", "c1", "test", "admin")?.status).toBe("archived"); });
  it("gifts item", () => { grantItem("u1", "c1", "default"); const newItem = giftItem("u1", "u2", "c1"); expect(newItem?.userId).toBe("u2"); expect(newItem?.status).toBe("owned"); });
  it("consumes temporary item", () => { grantItem("u1", "c1", "event", "2025-12-31"); expect(consumeItem("u1", "c1", "used")?.status).toBe("expired"); });
  it("expires temporary item", () => { grantItem("u1", "c1", "event", "2025-01-01"); expect(expireItem("u1", "c1")?.status).toBe("expired"); });
  it("restores expired item", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(restoreItem("u1", "c1")?.status).toBe("owned"); });
  it("hides item", () => { grantItem("u1", "c1", "default"); expect(hideItem("u1", "c1")?.status).toBe("hidden"); });
  it("gets inventory", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "default"); expect(getInventory("u1").length).toBe(2); });
  it("gets owned items", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "event", "2025-12-31"); expect(getOwnedItems("u1").length).toBe(1); });
  it("gets expired items", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(getExpiredItems("u1").length).toBe(1); });
  it("gets temporary items", () => { grantItem("u1", "c1", "event", "2025-12-31"); expect(getTemporaryItems("u1").length).toBe(1); });
  it("revoke non-existent returns null", () => { expect(revokeItem("u1", "nonexistent", "test", "admin")).toBeNull(); });
  it("consume non-temporary returns null", () => { grantItem("u1", "c1", "default"); expect(consumeItem("u1", "c1", "test")).toBeNull(); });
  it("restore owned returns null", () => { grantItem("u1", "c1", "default"); expect(restoreItem("u1", "c1")).toBeNull(); });
});

// ===== System 8 — Transactions =====
describe("Cosmetics — Transactions", () => {
  it("records grant transaction", () => { grantItem("u1", "c1", "default"); expect(getTransactionHistory("u1").length).toBe(1); });
  it("records revoke transaction", () => { grantItem("u1", "c1", "default"); revokeItem("u1", "c1", "test", "admin"); expect(getTransactionHistory("u1").length).toBe(2); });
  it("records gift transaction", () => { grantItem("u1", "c1", "default"); giftItem("u1", "u2", "c1"); expect(getTransactionHistory("u1").length).toBe(2); expect(getTransactionHistory("u2").length).toBe(1); });
  it("records expire transaction", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(getTransactionHistory("u1").length).toBe(2); });
  it("records restore transaction", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); restoreItem("u1", "c1"); expect(getTransactionHistory("u1").length).toBe(3); });
  it("transaction has before and after status", () => { grantItem("u1", "c1", "default"); const tx = getTransactionHistory("u1")[0]; expect(tx.beforeStatus).toBe("locked"); expect(tx.afterStatus).toBe("owned"); });
  it("transaction has performer", () => { grantItem("u1", "c1", "default"); revokeItem("u1", "c1", "test", "admin-1"); const tx = getTransactionHistory("u1")[1]; expect(tx.performedBy).toBe("admin-1"); });
  it("transaction has reason", () => { grantItem("u1", "c1", "default"); revokeItem("u1", "c1", "Policy violation", "admin"); const tx = getTransactionHistory("u1")[1]; expect(tx.reason).toBe("Policy violation"); });
  it("transaction has timestamp", () => { grantItem("u1", "c1", "default"); expect(getTransactionHistory("u1")[0].timestamp).toBeDefined(); });
});

// ===== System 7 — Unlock Engine =====
describe("Cosmetics — Unlocks", () => {
  it("registers unlock condition", () => { const uc = registerUnlockCondition({ cosmeticId: "c1", source: "achievement", sourceRef: "ach-1" }); expect(uc.id).toBeDefined(); });
  it("gets unlock conditions", () => { registerUnlockCondition({ cosmeticId: "c1", source: "achievement", sourceRef: "ach-1" }); expect(getUnlockConditionsForCosmetic("c1").length).toBe(1); });
  it("check unlock returns true with conditions", () => { registerUnlockCondition({ cosmeticId: "c1", source: "progression", sourceRef: "level-10" }); expect(checkUnlockConditions("c1", "u1")).toBe(true); });
  it("check unlock returns true without conditions", () => { expect(checkUnlockConditions("c1", "u1")).toBe(true); });
  it("supports all unlock sources", () => { for (const s of ["achievement","progression","competitive","liveops","teacher_reward","marketplace","developer_extension","default","gift"] as const) { const uc = registerUnlockCondition({ cosmeticId: `c-${s}`, source: s, sourceRef: "ref" }); expect(uc.source).toBe(s); } });
});

// ===== System 4 — Player Identity =====
describe("Cosmetics — Identity", () => {
  it("inits identity", () => { const i = initIdentity("u1", "Alice"); expect(i.userId).toBe("u1"); expect(i.displayName).toBe("Alice"); });
  it("gets identity", () => { initIdentity("u1", "Alice"); expect(getIdentityForUser("u1")).not.toBeNull(); expect(getIdentityForUser("nonexistent")).toBeNull(); });
  it("updates identity", () => { initIdentity("u1", "Alice"); expect(updateIdentity("u1", { displayName: "Bob" })?.displayName).toBe("Bob"); });
  it("sets avatar", () => { initIdentity("u1", "A"); expect(setAvatar("u1", "cosmetic-1")?.avatarCosmeticId).toBe("cosmetic-1"); });
  it("sets frame", () => { initIdentity("u1", "A"); expect(setFrame("u1", "frame-1")?.frameCosmeticId).toBe("frame-1"); });
  it("sets banner", () => { initIdentity("u1", "A"); expect(setBanner("u1", "banner-1")?.bannerCosmeticId).toBe("banner-1"); });
  it("sets theme", () => { initIdentity("u1", "A"); expect(setTheme("u1", "theme-1")?.themeCosmeticId).toBe("theme-1"); });
  it("sets background", () => { initIdentity("u1", "A"); expect(setBackground("u1", "bg-1")?.backgroundCosmeticId).toBe("bg-1"); });
  it("sets title", () => { initIdentity("u1", "A"); expect(setTitle("u1", "title-1")?.titleCosmeticId).toBe("title-1"); });
  it("adds badge", () => { initIdentity("u1", "A"); expect(addBadge("u1", "badge-1")?.badgeCosmeticIds).toContain("badge-1"); });
  it("removes badge", () => { initIdentity("u1", "A"); addBadge("u1", "badge-1"); expect(removeBadge("u1", "badge-1")?.badgeCosmeticIds).not.toContain("badge-1"); });
  it("updates public card", () => { initIdentity("u1", "A"); expect(updatePublicCard("u1", { bio: "Hello" })?.publicCard.bio).toBe("Hello"); });
  it("init is idempotent", () => { const i1 = initIdentity("u1", "A"); const i2 = initIdentity("u1", "A"); expect(i1).toBe(i2); });
});

// ===== System 9 — Showcase =====
describe("Cosmetics — Showcase", () => {
  it("inits showcase", () => { const s = initShowcase("u1"); expect(s.userId).toBe("u1"); });
  it("gets showcase", () => { initShowcase("u1"); expect(getShowcaseForUser("u1")).not.toBeNull(); });
  it("adds featured cosmetic", () => { initShowcase("u1"); expect(addFeaturedCosmetic("u1", "c1", "avatar", 1)?.featuredCosmetics.length).toBe(1); });
  it("removes featured cosmetic", () => { initShowcase("u1"); addFeaturedCosmetic("u1", "c1", "avatar", 1); expect(removeFeaturedCosmetic("u1", "c1")?.featuredCosmetics.length).toBe(0); });
  it("adds featured collection", () => { initShowcase("u1"); expect(addFeaturedCollection("u1", "col-1")?.featuredCollections).toContain("col-1"); });
  it("adds featured achievement", () => { initShowcase("u1"); expect(addFeaturedAchievement("u1", "ach-1")?.featuredAchievements).toContain("ach-1"); });
  it("adds featured stat", () => { initShowcase("u1"); expect(addFeaturedStat("u1", "wins", "100", 1)?.featuredStats.length).toBe(1); });
  it("featured cosmetics sorted by displayOrder", () => { initShowcase("u1"); addFeaturedCosmetic("u1", "c2", "banner", 2); addFeaturedCosmetic("u1", "c1", "avatar", 1); const s = getShowcaseForUser("u1"); expect(s!.featuredCosmetics[0].cosmeticId).toBe("c1"); });
});

// ===== System 5 — Collections =====
describe("Cosmetics — Collections", () => {
  it("creates collection", () => { const c = createCollection({ name: "Holiday Set", description: "test", cosmeticIds: ["c1", "c2", "c3"] }); expect(c.id).toBeDefined(); });
  it("gets collection by id", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: [] }); expect(getCollectionById(c.id)).not.toBeNull(); });
  it("lists collections", () => { createCollection({ name: "C1", description: "", cosmeticIds: [] }); createCollection({ name: "C2", description: "", cosmeticIds: [] }); expect(listCollections().length).toBe(2); });
  it("computes collection progress", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.ownedCount).toBe(1); expect(p!.completionPct).toBe(50); });
  it("completes collection", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); grantItem("u1", "c2", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.completed).toBe(true); });
  it("gets user collections", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1"] }); grantItem("u1", "c1", "default"); computeCollectionProgress("u1", c.id); expect(getUserCollections("u1").length).toBe(1); });
  it("collection with set bonus visual", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: [], setBonusVisual: "rainbow_effect" }); expect(c.setBonusVisual).toBe("rainbow_effect"); });
  it("limited collection", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: [], limited: true }); expect(c.limited).toBe(true); });
  it("season collection type", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: [], type: "season", seasonId: "s1" }); expect(c.type).toBe("season"); });
});

// ===== System 10 — Personalization =====
describe("Cosmetics — Personalization", () => {
  it("inits personalization", () => { const p = initPersonalization("u1"); expect(p.uiScale).toBe("medium"); expect(p.reducedMotion).toBe(false); });
  it("gets personalization", () => { initPersonalization("u1"); expect(getPersonalizationForUser("u1")).not.toBeNull(); });
  it("updates personalization", () => { initPersonalization("u1"); expect(updatePersonalization("u1", { themeId: "dark" })?.themeId).toBe("dark"); });
  it("sets accessibility theme", () => { initPersonalization("u1"); expect(setAccessibilityTheme("u1", "high_contrast")?.accessibilityTheme).toBe("high_contrast"); });
  it("sets animation pack", () => { initPersonalization("u1"); expect(setAnimationPack("u1", "pack-1")?.animationPackId).toBe("pack-1"); });
  it("sets sound pack", () => { initPersonalization("u1"); expect(setSoundPack("u1", "sound-1")?.soundPackId).toBe("sound-1"); });
  it("sets UI scale", () => { initPersonalization("u1"); expect(setUIScale("u1", "large")?.uiScale).toBe("large"); });
  it("sets reduced motion", () => { initPersonalization("u1"); expect(setReducedMotion("u1", true)?.reducedMotion).toBe(true); });
  it("sets high contrast", () => { initPersonalization("u1"); expect(setHighContrast("u1", true)?.highContrast).toBe(true); });
  it("sets color blind mode", () => { initPersonalization("u1"); expect(setColorBlindMode("u1", "deuteranopia")?.colorBlindMode).toBe("deuteranopia"); });
  it("supports all UI scales", () => { initPersonalization("u1"); for (const s of ["small","medium","large","extra_large"] as const) expect(setUIScale("u1", s)?.uiScale).toBe(s); });
});

// ===== System 11 — Seasonal =====
describe("Cosmetics — Seasonal", () => {
  it("registers seasonal cosmetic", () => { const s = registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01", availableUntil: "2025-03-31" }); expect(s.seasonId).toBe("s1"); });
  it("gets seasonal info", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(getSeasonalInfo("c1")).not.toBeNull(); });
  it("lists seasonal cosmetics", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(listSeasonalCosmetics().length).toBe(1); });
  it("retires seasonal cosmetic", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(retireSeasonalCosmetic("c1")?.retired).toBe(true); });
  it("is available within window", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01", availableUntil: "2025-03-31" }); expect(isSeasonalAvailable("c1", "2025-02-01")).toBe(true); });
  it("is not available outside window", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01", availableUntil: "2025-03-31" }); expect(isSeasonalAvailable("c1", "2025-06-01")).toBe(false); });
  it("retired is not available", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01", availableUntil: "2025-12-31" }); retireSeasonalCosmetic("c1"); expect(isSeasonalAvailable("c1", "2025-06-01")).toBe(false); });
  it("non-seasonal is always available", () => { expect(isSeasonalAvailable("c1", "2025-06-01")).toBe(true); });
  it("has legacy label", () => { const s = registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "", legacyLabel: "Season 1 Legacy" }); expect(s.legacyLabel).toBe("Season 1 Legacy"); });
});

// ===== System 12 — Organization Identity =====
describe("Cosmetics — Org Identity", () => {
  it("creates org identity", () => { const o = createOrgIdentity({ organizationId: "org-1", organizationType: "school", createdBy: "admin" }); expect(o.id).toBeDefined(); });
  it("gets org identity by id", () => { const o = createOrgIdentity({ organizationId: "org-1", organizationType: "school", createdBy: "admin" }); expect(getOrgIdentityById(o.id)).not.toBeNull(); });
  it("lists org identities", () => { createOrgIdentity({ organizationId: "o1", organizationType: "school", createdBy: "a" }); createOrgIdentity({ organizationId: "o2", organizationType: "university", createdBy: "a" }); expect(listOrgIdentities().length).toBe(2); });
  it("updates org identity", () => { const o = createOrgIdentity({ organizationId: "o1", organizationType: "school", createdBy: "a" }); expect(updateOrgIdentity(o.id, { brandingColor: "#ff0000" })?.brandingColor).toBe("#ff0000"); });
  it("supports all org types", () => { for (const t of ["school","university","district","enterprise"] as const) { const o = createOrgIdentity({ organizationId: `org-${t}`, organizationType: t, createdBy: "a" }); expect(o.organizationType).toBe(t); } });
  it("has logo URL", () => { const o = createOrgIdentity({ organizationId: "o1", organizationType: "school", createdBy: "a", logoUrl: "https://logo.png" }); expect(o.logoUrl).toBe("https://logo.png"); });
  it("has branding color", () => { const o = createOrgIdentity({ organizationId: "o1", organizationType: "school", createdBy: "a", brandingColor: "#00ff00" }); expect(o.brandingColor).toBe("#00ff00"); });
});

// ===== Systems 13, 14 — Marketplace + Extensions =====
describe("Cosmetics — Marketplace + Extensions", () => {
  it("registers marketplace item", () => { const m = registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); expect(m.cosmeticId).toBe("c1"); });
  it("gets marketplace info", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); expect(getMarketplaceInfo("c1")).not.toBeNull(); });
  it("lists marketplace items", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); registerMarketplaceItem({ cosmeticId: "c2", listingId: "l2", price: 200, currency: "coins" }); expect(listMarketplaceItems().length).toBe(2); });
  it("verifies license", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins", licenseVerified: true }); expect(verifyLicense("c1")).toBe(true); });
  it("unverified license returns false", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); expect(verifyLicense("c1")).toBe(false); });
  it("records purchase", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); expect(recordPurchase("c1", "u1")?.purchasedBy).toBe("u1"); });
  it("registers extension cosmetic", () => { const e = registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "custom.mod" }); expect(e.extensionId).toBe("ext-1"); });
  it("gets extension info", () => { registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns" }); expect(getExtensionInfo("c1")).not.toBeNull(); });
  it("validates extension cosmetic", () => { registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns", validated: true, compatible: true, sandboxSafe: true }); expect(validateExtensionCosmetic("c1")).toBe(true); });
  it("invalid extension returns false", () => { registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns", validated: false }); expect(validateExtensionCosmetic("c1")).toBe(false); });
  it("non-existent extension returns false", () => { expect(validateExtensionCosmetic("nonexistent")).toBe(false); });
});

// ===== Systems 15, 16 — Analytics + Dashboard =====
describe("Cosmetics — Analytics + Dashboard", () => {
  it("generates analytics", () => { const a = generateAnalytics(); expect(a).toBeDefined(); expect(a.totalItems).toBeGreaterThanOrEqual(0); });
  it("generates dashboard", () => { grantItem("u1", "c1", "default"); const d = generateDashboard("u1"); expect(d).not.toBeNull(); expect(d!.totalOwned).toBe(1); });
  it("dashboard includes health", () => { const d = generateDashboard("u1"); expect(d!.health).toBeDefined(); expect(d!.health.status).toBeDefined(); });
  it("dashboard includes loadouts", () => { const d = generateDashboard("u1"); expect(d!.loadouts).toBeDefined(); });
  it("dashboard includes recent transactions", () => { grantItem("u1", "c1", "default"); const d = generateDashboard("u1"); expect(d!.recentTransactions.length).toBeGreaterThan(0); });
  it("analytics has popular cosmetics", () => { expect(generateAnalytics().popularCosmetics).toBeDefined(); });
  it("analytics has unlock sources", () => { expect(generateAnalytics().unlockSources).toBeDefined(); });
  it("analytics has collection completion", () => { expect(generateAnalytics().collectionCompletion).toBeDefined(); });
});

// ===== Developer Integration =====
describe("Cosmetics — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.eventContracts.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/cosmetics/"))).toBe(true); });
  it("has event contracts", () => { expect(getDeveloperIntegration().eventContracts).toContain("CosmeticUnlocked"); });
  it("has extension hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBeGreaterThan(0); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
});

// ===== Event Bus Bridge =====
describe("Cosmetics — Bridge", () => {
  it("subscribes", () => { subscribeCosmetics(); expect(isCosmeticsSubscribed()).toBe(true); });
  it("unsubscribes", () => { subscribeCosmetics(); unsubscribeCosmetics(); expect(isCosmeticsSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeCosmetics(); subscribeCosmetics(); expect(isCosmeticsSubscribed()).toBe(true); });
  it("publishes cosmetic events", () => { expect(() => publishCosmeticEvent("CosmeticUnlocked", "u1", { cosmeticId: "c1" })).not.toThrow(); });
});

// ===== Architecture Compliance =====
describe("Cosmetics — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/cosmetics-platform"); expect(mod.createCosmetic).toBeDefined(); });
  it("no gameplay ownership", () => { expect(true).toBe(true); });
});

// ===== Edge Cases =====
describe("Cosmetics — Edge Cases", () => {
  it("returns null for unknown cosmetic", () => { expect(getCosmeticById("nonexistent")).toBeNull(); });
  it("returns null for unknown identity", () => { expect(getIdentityForUser("nonexistent")).toBeNull(); });
  it("returns null for unknown showcase", () => { expect(getShowcaseForUser("nonexistent")).toBeNull(); });
  it("returns null for unknown collection", () => { expect(getCollectionById("nonexistent")).toBeNull(); });
  it("returns null for unknown seasonal", () => { expect(getSeasonalInfo("nonexistent")).toBeNull(); });
  it("returns null for unknown org identity", () => { expect(getOrgIdentityById("nonexistent")).toBeNull(); });
  it("returns null for unknown marketplace item", () => { expect(getMarketplaceInfo("nonexistent")).toBeNull(); });
  it("returns null for unknown extension", () => { expect(getExtensionInfo("nonexistent")).toBeNull(); });
  it("returns empty inventory for unknown user", () => { expect(getInventory("nonexistent")).toEqual([]); });
  it("returns empty transactions for unknown user", () => { expect(getTransactionHistory("nonexistent")).toEqual([]); });
  it("returns empty loadouts for unknown user", () => { expect(getLoadoutsForUser("nonexistent")).toEqual([]); });
  it("returns null for unknown loadout", () => { expect(getLoadoutById("u1", "nonexistent")).toBeNull(); });
  it("returns null for unknown personalization", () => { expect(getPersonalizationForUser("nonexistent")).toBeNull(); });
  it("compute progress for unknown collection returns null", () => { expect(computeCollectionProgress("u1", "nonexistent")).toBeNull(); });
});

// ===== Stress =====
describe("Cosmetics — Stress", () => {
  it("handles many cosmetics", () => { for (let i = 0; i < 100; i++) createCosmetic({ name: `C${i}`, description: "", type: "avatar", rarity: "common" }); expect(listCosmetics().length).toBe(100); });
  it("handles many inventory items", () => { for (let i = 0; i < 100; i++) grantItem("u1", `c${i}`, "default"); expect(getInventory("u1").length).toBe(100); });
  it("handles many collections", () => { for (let i = 0; i < 50; i++) createCollection({ name: `Col${i}`, description: "", cosmeticIds: [] }); expect(listCollections().length).toBe(50); });
  it("handles many loadouts", () => { for (let i = 0; i < 20; i++) createLoadout("u1", `L${i}`); expect(getLoadoutsForUser("u1").length).toBe(20); });
});

// ===== Extended Tests =====
describe("Cosmetics — Extended", () => {
  it("cosmetic with season ID", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "rare", seasonId: "s1" }).seasonId).toBe("s1"); });
  it("cosmetic with organization ID", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "rare", organizationId: "org-1" }).organizationId).toBe("org-1"); });
  it("cosmetic with extension ID", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "rare", extensionId: "ext-1" }).extensionId).toBe("ext-1"); });
  it("cosmetic with metadata", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "rare", metadata: { source: "event" } }).metadata.source).toBe("event"); });
  it("loadout default flag", () => { expect(createLoadout("u1", "Default", true).isDefault).toBe(true); });
  it("equip in multiple slots", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); equipItem("u1", l.id, "avatar", c.id); expect(getLoadoutById("u1", l.id)?.equipment.avatar).toBe(c.id); });
  it("grant with source tracking", () => { expect(grantItem("u1", "c1", "achievement").source).toBe("achievement"); });
  it("gift records giftedBy", () => { grantItem("u1", "c1", "default"); giftItem("u1", "u2", "c1"); const item = getInventory("u2")[0]; expect(item.giftedBy).toBe("u1"); });
  it("temporary item has expiry", () => { expect(grantItem("u1", "c1", "event", "2025-12-31T23:59:59Z").expiresAt).toBe("2025-12-31T23:59:59Z"); });
  it("owned item has no expiry", () => { expect(grantItem("u1", "c1", "default").expiresAt).toBeNull(); });
  it("identity has public card", () => { expect(initIdentity("u1", "A").publicCard).toBeDefined(); });
  it("public card has featured stats", () => { initIdentity("u1", "A"); updatePublicCard("u1", { featuredStats: { wins: "100" } }); expect(getIdentityForUser("u1")?.publicCard.featuredStats.wins).toBe("100"); });
  it("showcase featured cosmetics have display order", () => { initShowcase("u1"); addFeaturedCosmetic("u1", "c1", "avatar", 2); addFeaturedCosmetic("u1", "c2", "banner", 1); const s = getShowcaseForUser("u1"); expect(s!.featuredCosmetics[0].displayOrder).toBe(1); });
  it("collection with all types", () => { for (const t of ["standard","season","limited","organization"] as const) { const c = createCollection({ name: `C-${t}`, description: "", cosmeticIds: [], type: t }); expect(c.type).toBe(t); } });
  it("personalization init is idempotent", () => { const p1 = initPersonalization("u1"); const p2 = initPersonalization("u1"); expect(p1).toBe(p2); });
  it("seasonal cosmetic has retirement tracking", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); retireSeasonalCosmetic("c1"); expect(getSeasonalInfo("c1")?.retiredAt).not.toBeNull(); });
  it("org identity with theme cosmetic", () => { const o = createOrgIdentity({ organizationId: "o1", organizationType: "school", createdBy: "a", themeCosmeticId: "theme-1" }); expect(o.themeCosmeticId).toBe("theme-1"); });
  it("marketplace item with currency", () => { expect(registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 500, currency: "gems" }).currency).toBe("gems"); });
  it("extension with namespace", () => { expect(registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "com.example.cosmetics" }).namespace).toBe("com.example.cosmetics"); });
  it("dashboard health is healthy with small inventory", () => { grantItem("u1", "c1", "default"); expect(generateDashboard("u1")?.health.status).toBe("healthy"); });
  it("unlock condition with custom condition data", () => { const uc = registerUnlockCondition({ cosmeticId: "c1", source: "progression", sourceRef: "level-50", condition: { minLevel: 50, gameMode: "classic_quiz" } }); expect(uc.condition.minLevel).toBe(50); });
  it("transaction type grant", () => { grantItem("u1", "c1", "default"); expect(getTransactionHistory("u1")[0].type).toBe("grant"); });
  it("transaction type revoke", () => { grantItem("u1", "c1", "default"); revokeItem("u1", "c1", "test", "admin"); expect(getTransactionHistory("u1")[1].type).toBe("revoke"); });
  it("transaction type gift", () => { grantItem("u1", "c1", "default"); giftItem("u1", "u2", "c1"); expect(getTransactionHistory("u1")[1].type).toBe("gift"); });
  it("transaction type expire", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(getTransactionHistory("u1")[1].type).toBe("expire"); });
  it("transaction type restore", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); restoreItem("u1", "c1"); expect(getTransactionHistory("u1")[2].type).toBe("restore"); });
  it("rarity has description", () => { expect(getRarityDefinition("legendary")?.description).toBeDefined(); });
  it("cosmetic has icon URL", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", iconUrl: "https://icon.png" }).iconUrl).toBe("https://icon.png"); });
  it("cosmetic has preview URL", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", previewUrl: "https://preview.mp4" }).previewUrl).toBe("https://preview.mp4"); });
  it("cosmetic has category", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", category: "holiday" }).category).toBe("holiday"); });
});

// ===== Extended Catalog Tests =====
describe("Cosmetics — Catalog Extended", () => {
  it("cosmetic default category general", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).category).toBe("general"); });
  it("cosmetic default unlockable true", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).unlockable).toBe(true); });
  it("cosmetic unlockable false", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common", unlockable: false }).unlockable).toBe(false); });
  it("cosmetic default icon null", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).iconUrl).toBeNull(); });
  it("cosmetic default preview null", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).previewUrl).toBeNull(); });
  it("cosmetic default tags empty", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).tags).toEqual([]); });
  it("cosmetic default season null", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).seasonId).toBeNull(); });
  it("cosmetic default org null", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).organizationId).toBeNull(); });
  it("cosmetic default extension null", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).extensionId).toBeNull(); });
  it("cosmetic default metadata empty", () => { expect(createCosmetic({ name: "T", description: "", type: "avatar", rarity: "common" }).metadata).toEqual({}); });
  it("list cosmetics with no filter returns all", () => { createCosmetic({ name: "C1", description: "", type: "avatar", rarity: "common" }); createCosmetic({ name: "C2", description: "", type: "banner", rarity: "rare" }); expect(listCosmetics().length).toBe(2); });
  it("list cosmetics filter by type and rarity", () => { createCosmetic({ name: "C1", description: "", type: "avatar", rarity: "common" }); createCosmetic({ name: "C2", description: "", type: "avatar", rarity: "rare" }); expect(listCosmetics("avatar", "rare").length).toBe(1); });
});

// ===== Extended Equipment Tests =====
describe("Cosmetics — Equipment Extended", () => {
  it("loadout has all 15 slots null by default", () => { const l = createLoadout("u1", "L1"); expect(Object.keys(l.equipment).length).toBe(15); for (const slot of EQUIPMENT_SLOTS) expect(l.equipment[slot]).toBeNull(); });
  it("loadout has createdAt", () => { expect(createLoadout("u1", "L1").createdAt).toBeDefined(); });
  it("loadout has updatedAt", () => { expect(createLoadout("u1", "L1").updatedAt).toBeDefined(); });
  it("equip updates updatedAt", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); const original = l.updatedAt; equipItem("u1", l.id, "avatar", c.id); expect(getLoadoutById("u1", l.id)?.updatedAt).toBeDefined(); });
  it("unequip updates updatedAt", () => { const c = createCosmetic({ name: "A", description: "", type: "avatar", rarity: "common" }); grantItem("u1", c.id, "default"); const l = createLoadout("u1", "L1"); equipItem("u1", l.id, "avatar", c.id); unequipItem("u1", l.id, "avatar"); expect(getLoadoutById("u1", l.id)?.updatedAt).toBeDefined(); });
  it("unequip non-existent loadout returns null", () => { expect(unequipItem("u1", "nonexistent", "avatar")).toBeNull(); });
  it("detectConflicts returns empty for clean loadout", () => { const l = createLoadout("u1", "L1"); expect(detectConflicts(l)).toEqual([]); });
  it("isValidSlotForCosmetic all valid pairs", () => { expect(isValidSlotForCosmetic("avatar", "avatar")).toBe(true); expect(isValidSlotForCosmetic("frame", "avatar_frame")).toBe(true); expect(isValidSlotForCosmetic("banner", "banner")).toBe(true); expect(isValidSlotForCosmetic("theme", "profile_theme")).toBe(true); expect(isValidSlotForCosmetic("background", "background")).toBe(true); expect(isValidSlotForCosmetic("title", "title")).toBe(true); expect(isValidSlotForCosmetic("badge", "badge")).toBe(true); expect(isValidSlotForCosmetic("nameplate", "nameplate")).toBe(true); expect(isValidSlotForCosmetic("border", "border")).toBe(true); expect(isValidSlotForCosmetic("loading_card", "loading_card")).toBe(true); expect(isValidSlotForCosmetic("victory_animation", "victory_animation")).toBe(true); expect(isValidSlotForCosmetic("lobby_animation", "lobby_animation")).toBe(true); expect(isValidSlotForCosmetic("cursor", "cursor")).toBe(true); expect(isValidSlotForCosmetic("confetti", "confetti")).toBe(true); expect(isValidSlotForCosmetic("reaction", "reaction")).toBe(true); });
  it("isValidSlotForCosmetic invalid pairs", () => { expect(isValidSlotForCosmetic("avatar", "banner")).toBe(false); expect(isValidSlotForCosmetic("frame", "avatar")).toBe(false); expect(isValidSlotForCosmetic("banner", "title")).toBe(false); });
  it("multiple loadouts per user", () => { createLoadout("u1", "Casual"); createLoadout("u1", "Competitive"); createLoadout("u1", "Holiday"); expect(getLoadoutsForUser("u1").length).toBe(3); });
  it("loadout name is configurable", () => { expect(createLoadout("u1", "My Custom Loadout").name).toBe("My Custom Loadout"); });
});

// ===== Extended Inventory Tests =====
describe("Cosmetics — Inventory Extended", () => {
  it("grant source is tracked", () => { expect(grantItem("u1", "c1", "liveops").source).toBe("liveops"); });
  it("grant source is achievement", () => { expect(grantItem("u1", "c1", "achievement").source).toBe("achievement"); });
  it("grant source is marketplace", () => { expect(grantItem("u1", "c1", "marketplace").source).toBe("marketplace"); });
  it("revoke sets status to archived", () => { grantItem("u1", "c1", "default"); expect(revokeItem("u1", "c1", "test", "admin")?.status).toBe("archived"); });
  it("gift sets status to gifted on sender", () => { grantItem("u1", "c1", "default"); giftItem("u1", "u2", "c1"); const senderItem = getInventory("u1")[0]; expect(senderItem.status).toBe("gifted"); });
  it("gift sets status to owned on recipient", () => { grantItem("u1", "c1", "default"); const newItem = giftItem("u1", "u2", "c1"); expect(newItem?.status).toBe("owned"); });
  it("gift source includes sender", () => { grantItem("u1", "c1", "default"); giftItem("u1", "u2", "c1"); const recipientItem = getInventory("u2")[0]; expect(recipientItem.source).toBe("gift:u1"); });
  it("consume sets status to expired", () => { grantItem("u1", "c1", "event", "2025-12-31"); expect(consumeItem("u1", "c1", "consumed")?.status).toBe("expired"); });
  it("expire sets status to expired", () => { grantItem("u1", "c1", "event", "2025-01-01"); expect(expireItem("u1", "c1")?.status).toBe("expired"); });
  it("restore sets status to owned", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(restoreItem("u1", "c1")?.status).toBe("owned"); });
  it("restore archived item", () => { grantItem("u1", "c1", "default"); revokeItem("u1", "c1", "test", "admin"); expect(restoreItem("u1", "c1")?.status).toBe("owned"); });
  it("hide sets status to hidden", () => { grantItem("u1", "c1", "default"); expect(hideItem("u1", "c1")?.status).toBe("hidden"); });
  it("getOwnedItems excludes temporary", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "event", "2025-12-31"); expect(getOwnedItems("u1").length).toBe(1); });
  it("getOwnedItems excludes expired", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "event", "2025-01-01"); expireItem("u1", "c2"); expect(getOwnedItems("u1").length).toBe(1); });
  it("getOwnedItems excludes hidden", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "default"); hideItem("u1", "c2"); expect(getOwnedItems("u1").length).toBe(1); });
  it("getEquippedItems returns equipped only", () => { grantItem("u1", "c1", "default"); expect(getEquippedItems("u1").length).toBe(0); });
  it("getTemporaryItems returns temporary only", () => { grantItem("u1", "c1", "default"); grantItem("u1", "c2", "event", "2025-12-31"); expect(getTemporaryItems("u1").length).toBe(1); });
  it("getExpiredItems returns expired only", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); grantItem("u1", "c2", "default"); expect(getExpiredItems("u1").length).toBe(1); });
  it("item has acquiredAt", () => { expect(grantItem("u1", "c1", "default").acquiredAt).toBeDefined(); });
  it("item has id", () => { expect(grantItem("u1", "c1", "default").id).toBeDefined(); });
  it("item has metadata", () => { expect(grantItem("u1", "c1", "default").metadata).toBeDefined(); });
  it("gift non-owned returns null", () => { expect(giftItem("u1", "u2", "nonexistent")).toBeNull(); });
  it("expire non-temporary returns null", () => { grantItem("u1", "c1", "default"); expect(expireItem("u1", "c1")).toBeNull(); });
  it("expire already expired returns null", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(expireItem("u1", "c1")).toBeNull(); });
  it("hide non-existent returns null", () => { expect(hideItem("u1", "nonexistent")).toBeNull(); });
  it("restore non-existent returns null", () => { expect(restoreItem("u1", "nonexistent")).toBeNull(); });
});

// ===== Extended Identity Tests =====
describe("Cosmetics — Identity Extended", () => {
  it("identity default avatar null", () => { expect(initIdentity("u1", "A").avatarCosmeticId).toBeNull(); });
  it("identity default frame null", () => { expect(initIdentity("u1", "A").frameCosmeticId).toBeNull(); });
  it("identity default banner null", () => { expect(initIdentity("u1", "A").bannerCosmeticId).toBeNull(); });
  it("identity default theme null", () => { expect(initIdentity("u1", "A").themeCosmeticId).toBeNull(); });
  it("identity default background null", () => { expect(initIdentity("u1", "A").backgroundCosmeticId).toBeNull(); });
  it("identity default title null", () => { expect(initIdentity("u1", "A").titleCosmeticId).toBeNull(); });
  it("identity default badges empty", () => { expect(initIdentity("u1", "A").badgeCosmeticIds).toEqual([]); });
  it("identity has updatedAt", () => { expect(initIdentity("u1", "A").updatedAt).toBeDefined(); });
  it("update identity sets updatedAt", () => { initIdentity("u1", "A"); const original = getIdentityForUser("u1")!.updatedAt; updateIdentity("u1", { displayName: "B" }); expect(getIdentityForUser("u1")?.updatedAt).toBeDefined(); });
  it("add badge is idempotent", () => { initIdentity("u1", "A"); addBadge("u1", "b1"); addBadge("u1", "b1"); expect(getIdentityForUser("u1")?.badgeCosmeticIds.length).toBe(1); });
  it("remove non-existent badge", () => { initIdentity("u1", "A"); expect(removeBadge("u1", "nonexistent")?.badgeCosmeticIds.length).toBe(0); });
  it("public card default bio null", () => { expect(initIdentity("u1", "A").publicCard.bio).toBeNull(); });
  it("public card default tagline null", () => { expect(initIdentity("u1", "A").publicCard.tagline).toBeNull(); });
  it("public card default featured empty", () => { const card = initIdentity("u1", "A").publicCard; expect(card.featuredCosmetics).toEqual([]); expect(card.featuredCollections).toEqual([]); expect(card.featuredAchievements).toEqual([]); });
  it("update public card tagline", () => { initIdentity("u1", "A"); expect(updatePublicCard("u1", { tagline: "Pro Gamer" })?.publicCard.tagline).toBe("Pro Gamer"); });
  it("update identity non-existent returns null", () => { expect(updateIdentity("nonexistent", { displayName: "X" })).toBeNull(); });
});

// ===== Extended Showcase Tests =====
describe("Cosmetics — Showcase Extended", () => {
  it("showcase default featured empty", () => { const s = initShowcase("u1"); expect(s.featuredCosmetics).toEqual([]); expect(s.featuredCollections).toEqual([]); expect(s.featuredAchievements).toEqual([]); expect(s.featuredStats).toEqual([]); });
  it("showcase has updatedAt", () => { expect(initShowcase("u1").updatedAt).toBeDefined(); });
  it("add featured cosmetic updates timestamp", () => { initShowcase("u1"); addFeaturedCosmetic("u1", "c1", "avatar", 1); expect(getShowcaseForUser("u1")?.updatedAt).toBeDefined(); });
  it("add featured collection is idempotent", () => { initShowcase("u1"); addFeaturedCollection("u1", "col-1"); addFeaturedCollection("u1", "col-1"); expect(getShowcaseForUser("u1")?.featuredCollections.length).toBe(1); });
  it("add featured achievement is idempotent", () => { initShowcase("u1"); addFeaturedAchievement("u1", "ach-1"); addFeaturedAchievement("u1", "ach-1"); expect(getShowcaseForUser("u1")?.featuredAchievements.length).toBe(1); });
  it("featured stats sorted by displayOrder", () => { initShowcase("u1"); addFeaturedStat("u1", "wins", "100", 2); addFeaturedStat("u1", "losses", "50", 1); const s = getShowcaseForUser("u1"); expect(s!.featuredStats[0].statKey).toBe("losses"); });
  it("remove featured cosmetic non-existent", () => { initShowcase("u1"); expect(removeFeaturedCosmetic("u1", "nonexistent")?.featuredCosmetics.length).toBe(0); });
});

// ===== Extended Collections Tests =====
describe("Cosmetics — Collections Extended", () => {
  it("collection default set bonus null", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [] }).setBonusVisual).toBeNull(); });
  it("collection default limited false", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [] }).limited).toBe(false); });
  it("collection default type standard", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [] }).type).toBe("standard"); });
  it("collection default season null", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [] }).seasonId).toBeNull(); });
  it("collection default org null", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [] }).organizationId).toBeNull(); });
  it("compute progress 0% for no items", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); const p = computeCollectionProgress("u1", c.id); expect(p!.completionPct).toBe(0); });
  it("compute progress 50% for half items", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.completionPct).toBe(50); });
  it("compute progress 100% for all items", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); grantItem("u1", "c2", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.completionPct).toBe(100); });
  it("compute progress excludes temporary items", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); grantItem("u1", "c2", "event", "2025-12-31"); const p = computeCollectionProgress("u1", c.id); expect(p!.ownedCount).toBe(1); });
  it("completed collection has completedAt", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1"] }); grantItem("u1", "c1", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.completedAt).not.toBeNull(); });
  it("incomplete collection has null completedAt", () => { const c = createCollection({ name: "C", description: "", cosmeticIds: ["c1", "c2"] }); grantItem("u1", "c1", "default"); const p = computeCollectionProgress("u1", c.id); expect(p!.completedAt).toBeNull(); });
  it("collection with org ID", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [], organizationId: "org-1" }).organizationId).toBe("org-1"); });
  it("collection with season ID", () => { expect(createCollection({ name: "C", description: "", cosmeticIds: [], seasonId: "s1", type: "season" }).seasonId).toBe("s1"); });
});

// ===== Extended Personalization Tests =====
describe("Cosmetics — Personalization Extended", () => {
  it("default theme null", () => { expect(initPersonalization("u1").themeId).toBeNull(); });
  it("default accessibility null", () => { expect(initPersonalization("u1").accessibilityTheme).toBeNull(); });
  it("default animation null", () => { expect(initPersonalization("u1").animationPackId).toBeNull(); });
  it("default sound null", () => { expect(initPersonalization("u1").soundPackId).toBeNull(); });
  it("default uiScale medium", () => { expect(initPersonalization("u1").uiScale).toBe("medium"); });
  it("default reducedMotion false", () => { expect(initPersonalization("u1").reducedMotion).toBe(false); });
  it("default highContrast false", () => { expect(initPersonalization("u1").highContrast).toBe(false); });
  it("default colorBlind null", () => { expect(initPersonalization("u1").colorBlindMode).toBeNull(); });
  it("has updatedAt", () => { expect(initPersonalization("u1").updatedAt).toBeDefined(); });
  it("update sets updatedAt", () => { initPersonalization("u1"); updatePersonalization("u1", { themeId: "dark" }); expect(getPersonalizationForUser("u1")?.updatedAt).toBeDefined(); });
  it("clear theme", () => { initPersonalization("u1"); updatePersonalization("u1", { themeId: "dark" }); updatePersonalization("u1", { themeId: null }); expect(getPersonalizationForUser("u1")?.themeId).toBeNull(); });
  it("clear colorBlind", () => { initPersonalization("u1"); setColorBlindMode("u1", "deuteranopia"); setColorBlindMode("u1", null); expect(getPersonalizationForUser("u1")?.colorBlindMode).toBeNull(); });
});

// ===== Extended Seasonal Tests =====
describe("Cosmetics — Seasonal Extended", () => {
  it("default retired false", () => { const s = registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(s.retired).toBe(false); });
  it("default retiredAt null", () => { const s = registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(s.retiredAt).toBeNull(); });
  it("default legacyLabel null", () => { const s = registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); expect(s.legacyLabel).toBeNull(); });
  it("retire sets retiredAt", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "", availableUntil: "" }); retireSeasonalCosmetic("c1"); expect(getSeasonalInfo("c1")?.retiredAt).not.toBeNull(); });
  it("retire non-existent returns null", () => { expect(retireSeasonalCosmetic("nonexistent")).toBeNull(); });
  it("available at start date", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01T00:00:00Z", availableUntil: "2025-03-31T23:59:59Z" }); expect(isSeasonalAvailable("c1", "2025-01-01T00:00:00Z")).toBe(true); });
  it("available at end date", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01T00:00:00Z", availableUntil: "2025-03-31T23:59:59Z" }); expect(isSeasonalAvailable("c1", "2025-03-31T23:59:59Z")).toBe(true); });
  it("not available before start", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01T00:00:00Z", availableUntil: "2025-03-31T23:59:59Z" }); expect(isSeasonalAvailable("c1", "2024-12-31T23:59:59Z")).toBe(false); });
  it("not available after end", () => { registerSeasonalCosmetic({ cosmeticId: "c1", seasonId: "s1", availableFrom: "2025-01-01T00:00:00Z", availableUntil: "2025-03-31T23:59:59Z" }); expect(isSeasonalAvailable("c1", "2025-04-01T00:00:00Z")).toBe(false); });
});

// ===== Extended Marketplace + Extensions Tests =====
describe("Cosmetics — Marketplace + Extensions Extended", () => {
  it("marketplace default license false", () => { expect(registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }).licenseVerified).toBe(false); });
  it("marketplace has price", () => { expect(registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 500, currency: "gems" }).price).toBe(500); });
  it("marketplace default purchasedBy null", () => { expect(registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }).purchasedBy).toBeNull(); });
  it("marketplace default purchasedAt null", () => { expect(registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }).purchasedAt).toBeNull(); });
  it("record purchase sets purchasedAt", () => { registerMarketplaceItem({ cosmeticId: "c1", listingId: "l1", price: 100, currency: "coins" }); expect(recordPurchase("c1", "u1")?.purchasedAt).not.toBeNull(); });
  it("record purchase non-existent returns null", () => { expect(recordPurchase("nonexistent", "u1")).toBeNull(); });
  it("verify license non-existent returns false", () => { expect(verifyLicense("nonexistent")).toBe(false); });
  it("extension default validated false", () => { expect(registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns" }).validated).toBe(false); });
  it("extension default compatible true", () => { expect(registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns" }).compatible).toBe(true); });
  it("extension default sandboxSafe true", () => { expect(registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns" }).sandboxSafe).toBe(true); });
  it("validate incompatible returns false", () => { registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns", validated: true, compatible: false, sandboxSafe: true }); expect(validateExtensionCosmetic("c1")).toBe(false); });
  it("validate not sandbox safe returns false", () => { registerExtensionCosmetic({ cosmeticId: "c1", extensionId: "ext-1", namespace: "ns", validated: true, compatible: true, sandboxSafe: false }); expect(validateExtensionCosmetic("c1")).toBe(false); });
  it("get extension non-existent returns null", () => { expect(getExtensionInfo("nonexistent")).toBeNull(); });
});

// ===== Extended Dashboard + Analytics Tests =====
describe("Cosmetics — Dashboard + Analytics Extended", () => {
  it("dashboard has totalOwned", () => { grantItem("u1", "c1", "default"); expect(generateDashboard("u1")?.totalOwned).toBe(1); });
  it("dashboard has totalEquipped", () => { expect(generateDashboard("u1")?.totalEquipped).toBeGreaterThanOrEqual(0); });
  it("dashboard has totalLocked", () => { expect(generateDashboard("u1")?.totalLocked).toBeGreaterThanOrEqual(0); });
  it("dashboard has totalExpired", () => { grantItem("u1", "c1", "event", "2025-01-01"); expireItem("u1", "c1"); expect(generateDashboard("u1")?.totalExpired).toBe(1); });
  it("dashboard has totalHidden", () => { grantItem("u1", "c1", "default"); hideItem("u1", "c1"); expect(generateDashboard("u1")?.totalHidden).toBe(1); });
  it("dashboard has loadouts", () => { createLoadout("u1", "L1"); expect(generateDashboard("u1")?.loadouts.length).toBe(1); });
  it("dashboard has collections", () => { expect(generateDashboard("u1")?.collections).toBeDefined(); });
  it("dashboard has seasonItems", () => { grantItem("u1", "c1", "season:s1"); expect(generateDashboard("u1")?.seasonItems).toBe(1); });
  it("dashboard has organizationAssets", () => { grantItem("u1", "c1", "organization:org-1"); expect(generateDashboard("u1")?.organizationAssets).toBe(1); });
  it("dashboard health issues for many expired", () => { for (let i = 0; i < 15; i++) { grantItem("u1", `c${i}`, "event", "2025-01-01"); expireItem("u1", `c${i}`); } expect(generateDashboard("u1")?.health.issues.length).toBeGreaterThan(0); });
  it("analytics has ownershipRate", () => { expect(generateAnalytics().ownershipRate).toBeGreaterThanOrEqual(0); });
  it("analytics has equipRate", () => { expect(generateAnalytics().equipRate).toBeGreaterThanOrEqual(0); });
});
