/** In-memory repository for Cosmetics Platform. */
import type {
  InventoryItem, CosmeticDefinition, Loadout, PlayerIdentity,
  Collection, CollectionProgress, RarityDefinition, UnlockCondition,
  InventoryTransaction, Showcase, PersonalizationSettings,
  SeasonalCosmetic, OrganizationIdentity, MarketplaceItem, ExtensionCosmetic,
} from "./types";

const items = new Map<string, InventoryItem[]>();
const cosmetics = new Map<string, CosmeticDefinition>();
const loadouts = new Map<string, Loadout[]>();
const identities = new Map<string, PlayerIdentity>();
const collections = new Map<string, Collection>();
const collectionProgress = new Map<string, CollectionProgress[]>();
const rarities = new Map<string, RarityDefinition>();
const unlockConditions = new Map<string, UnlockCondition[]>();
const transactions = new Map<string, InventoryTransaction[]>();
const showcases = new Map<string, Showcase>();
const personalization = new Map<string, PersonalizationSettings>();
const seasonalCosmetics = new Map<string, SeasonalCosmetic>();
const orgIdentities = new Map<string, OrganizationIdentity>();
const marketplaceItems = new Map<string, MarketplaceItem>();
const extensionCosmetics = new Map<string, ExtensionCosmetic>();

export const storeItem = (i: InventoryItem) => { const l = items.get(i.userId) ?? []; const idx = l.findIndex(x => x.cosmeticId === i.cosmeticId); if (idx >= 0) l[idx] = i; else l.push(i); items.set(i.userId, l); };
export const getItems = (userId: string) => items.get(userId) ?? [];
export const getItem = (userId: string, cosmeticId: string) => (items.get(userId) ?? []).find(i => i.cosmeticId === cosmeticId) ?? null;
export const storeCosmetic = (c: CosmeticDefinition) => cosmetics.set(c.id, c);
export const getCosmetic = (id: string) => cosmetics.get(id) ?? null;
export const getAllCosmetics = () => Array.from(cosmetics.values());
export const storeLoadout = (l: Loadout) => { const list = loadouts.get(l.userId) ?? []; const idx = list.findIndex(x => x.id === l.id); if (idx >= 0) list[idx] = l; else list.push(l); loadouts.set(l.userId, list); };
export const getLoadouts = (userId: string) => loadouts.get(userId) ?? [];
export const getLoadout = (userId: string, loadoutId: string) => (loadouts.get(userId) ?? []).find(l => l.id === loadoutId) ?? null;
export const storeIdentity = (i: PlayerIdentity) => identities.set(i.userId, i);
export const getIdentity = (userId: string) => identities.get(userId) ?? null;
export const storeCollection = (c: Collection) => collections.set(c.id, c);
export const getCollection = (id: string) => collections.get(id) ?? null;
export const getAllCollections = () => Array.from(collections.values());
export const storeCollectionProgress = (p: CollectionProgress) => { const l = collectionProgress.get(p.userId) ?? []; const idx = l.findIndex(x => x.collectionId === p.collectionId); if (idx >= 0) l[idx] = p; else l.push(p); collectionProgress.set(p.userId, l); };
export const getCollectionProgress = (userId: string) => collectionProgress.get(userId) ?? [];
export const storeRarity = (r: RarityDefinition) => rarities.set(r.rarity, r);
export const getRarity = (rarity: string) => rarities.get(rarity) ?? null;
export const getAllRarities = () => Array.from(rarities.values());
export const storeUnlockCondition = (u: UnlockCondition) => { const l = unlockConditions.get(u.cosmeticId) ?? []; l.push(u); unlockConditions.set(u.cosmeticId, l); };
export const getUnlockConditions = (cosmeticId: string) => unlockConditions.get(cosmeticId) ?? [];
export const storeTransaction = (t: InventoryTransaction) => { const l = transactions.get(t.userId) ?? []; l.push(t); transactions.set(t.userId, l); };
export const getTransactions = (userId: string) => transactions.get(userId) ?? [];
export const storeShowcase = (s: Showcase) => showcases.set(s.userId, s);
export const getShowcase = (userId: string) => showcases.get(userId) ?? null;
export const storePersonalization = (p: PersonalizationSettings) => personalization.set(p.userId, p);
export const getPersonalization = (userId: string) => personalization.get(userId) ?? null;
export const storeSeasonalCosmetic = (s: SeasonalCosmetic) => seasonalCosmetics.set(s.cosmeticId, s);
export const getSeasonalCosmetic = (cosmeticId: string) => seasonalCosmetics.get(cosmeticId) ?? null;
export const getAllSeasonalCosmetics = () => Array.from(seasonalCosmetics.values());
export const storeOrgIdentity = (o: OrganizationIdentity) => orgIdentities.set(o.id, o);
export const getOrgIdentity = (id: string) => orgIdentities.get(id) ?? null;
export const getAllOrgIdentities = () => Array.from(orgIdentities.values());
export const storeMarketplaceItem = (m: MarketplaceItem) => marketplaceItems.set(m.cosmeticId, m);
export const getMarketplaceItem = (cosmeticId: string) => marketplaceItems.get(cosmeticId) ?? null;
export const getAllMarketplaceItems = () => Array.from(marketplaceItems.values());
export const storeExtensionCosmetic = (e: ExtensionCosmetic) => extensionCosmetics.set(e.cosmeticId, e);
export const getExtensionCosmetic = (cosmeticId: string) => extensionCosmetics.get(cosmeticId) ?? null;

export function _resetRepositoryForTesting() {
  items.clear(); cosmetics.clear(); loadouts.clear(); identities.clear();
  collections.clear(); collectionProgress.clear(); rarities.clear();
  unlockConditions.clear(); transactions.clear(); showcases.clear();
  personalization.clear(); seasonalCosmetics.clear(); orgIdentities.clear();
  marketplaceItems.clear(); extensionCosmetics.clear();
}
