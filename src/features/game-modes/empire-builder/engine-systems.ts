/**
 * Systems 1-8: Rules, Resources, Buildings, Production, Upgrades,
 * Civilization Progression, Empire Power, Special Events.
 * Reuses Game Engine Resource Pipeline + Event Bus. No engine duplication.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { registerResource, processResourceAction, getResourceBalance, emitEvent } from "@/features/game-engine";
import type { EmpireBuilderRules, ResourceConfig, ResourceType, BuildingDefinition, BuildingInstance, BuildingLevel, ProductionResult, UpgradeDefinition, CivLevel, CivLevelConfig, EmpirePowerInput, EmpirePowerResult, EmpireEventDef, EmpireEventKind, EmpireEventInstance } from "./types";

const log = getLogger("empire-builder");

// ===========================================================================
// System 1 — Rules
// ===========================================================================

export const EMPIRE_RULES: EmpireBuilderRules = {
  gameMode: "empire_builder", minPlayers: 2, maxPlayers: 200,
  allowSpectators: true, allowLateJoin: true, reconnectPolicy: "allow",
  roundCount: 3, questionsPerRound: 5, timePerQuestionMs: 30_000, buildPhaseMs: 20_000,
  hostControls: ["pause", "resume", "freeze_construction", "freeze_resources", "inject_event", "bonus_resources", "penalty", "reveal_empire", "hide_empire", "skip_build_phase", "end_match", "emergency_stop"],
  organizationRestricted: false,
  startingResources: { wood: 100, stone: 50, food: 100, gold: 50, population: 10, science: 0 },
  storageCap: { wood: 9999, stone: 9999, food: 9999, gold: 9999, population: 999, science: 9999 },
  powerWeights: { population: 0.2, resources: 0.2, buildings: 0.2, science: 0.15, economy: 0.15, achievements: 0.1 },
};

export function getRules(): EmpireBuilderRules { return { ...EMPIRE_RULES }; }

// ===========================================================================
// System 2 — Resources
// ===========================================================================

// All 6 Empire Builder resources (wood, stone, food, gold, population, science)
// are ECONOMY RESOURCES — registered with `category: "economy"`.
// Internally they still flow through the generic engine Resource Pipeline.
// The category is metadata-only — see engine types.ts ResourceCategory.
export const RESOURCE_CONFIGS: Record<ResourceType, ResourceConfig> = {
  wood: { type: "wood", displayName: "Wood", initialValue: 100, maxValue: 9999, minValue: 0 },
  stone: { type: "stone", displayName: "Stone", initialValue: 50, maxValue: 9999, minValue: 0 },
  food: { type: "food", displayName: "Food", initialValue: 100, maxValue: 9999, minValue: 0 },
  gold: { type: "gold", displayName: "Gold", initialValue: 50, maxValue: 9999, minValue: 0 },
  population: { type: "population", displayName: "Population", initialValue: 10, maxValue: 999, minValue: 0 },
  science: { type: "science", displayName: "Science", initialValue: 0, maxValue: 9999, minValue: 0 },
};

const initializedUsers = new Set<string>();
export function initEmpireResources(matchId: string, userId: string): void {
  const key = `${matchId}:${userId}`;
  if (initializedUsers.has(key)) return;
  initializedUsers.add(key);
  for (const [type, config] of Object.entries(RESOURCE_CONFIGS)) {
    registerResource({ resourceType: type, displayName: config.displayName, initialValue: 0, maxValue: config.maxValue, minValue: config.minValue, category: "economy" });
    processResourceAction({ matchId, userId, resourceType: type, action: "earned", amount: EMPIRE_RULES.startingResources[type as ResourceType] ?? config.initialValue });
  }
}

export function getResource(matchId: string, userId: string, type: ResourceType): number {
  return getResourceBalance(matchId, userId, type);
}

export function getAllResources(matchId: string, userId: string): Record<ResourceType, number> {
  const result = {} as Record<ResourceType, number>;
  for (const type of Object.keys(RESOURCE_CONFIGS) as ResourceType[]) result[type] = getResource(matchId, userId, type);
  return result;
}

export function adjustResource(matchId: string, userId: string, type: ResourceType, amount: number, reason: string): void {
  const action = amount >= 0 ? "earned" : "spent";
  processResourceAction({ matchId, userId, resourceType: type, action, amount: Math.abs(amount) });
  emitEvent(matchId, "ResourceChanged", userId, { resourceType: type, action, amount: Math.abs(amount), reason, balance: getResource(matchId, userId, type) });
}

// ===========================================================================
// System 3 — Buildings
// ===========================================================================

export const BUILDING_DEFS: BuildingDefinition[] = [
  { id: "hut", name: "Hut", level: 1, description: "Basic shelter", constructionCost: { wood: 20, stone: 5 }, buildRequirements: [], productionBonuses: { food: 2 }, populationBonus: 2, economyBonus: 0, upgradeTimeMs: 5_000, visualLevel: 1, metadata: {} },
  { id: "village", name: "Village", level: 2, description: "Growing settlement", constructionCost: { wood: 50, stone: 20, food: 20 }, buildRequirements: ["hut"], productionBonuses: { food: 5, wood: 3 }, populationBonus: 5, economyBonus: 5, upgradeTimeMs: 10_000, visualLevel: 2, metadata: {} },
  { id: "town", name: "Town", level: 3, description: "Bustling town", constructionCost: { wood: 100, stone: 50, food: 50, gold: 20 }, buildRequirements: ["village"], productionBonuses: { food: 10, wood: 5, stone: 3, gold: 2 }, populationBonus: 10, economyBonus: 15, upgradeTimeMs: 15_000, visualLevel: 3, metadata: {} },
  { id: "city", name: "City", level: 4, description: "Thriving city", constructionCost: { wood: 200, stone: 100, food: 100, gold: 50 }, buildRequirements: ["town"], productionBonuses: { food: 20, wood: 10, stone: 5, gold: 5, science: 2 }, populationBonus: 20, economyBonus: 30, upgradeTimeMs: 20_000, visualLevel: 4, metadata: {} },
  { id: "empire", name: "Empire", level: 5, description: "Magnificent empire", constructionCost: { wood: 500, stone: 200, food: 200, gold: 100, science: 20 }, buildRequirements: ["city"], productionBonuses: { food: 50, wood: 20, stone: 10, gold: 10, science: 5 }, populationBonus: 50, economyBonus: 50, upgradeTimeMs: 30_000, visualLevel: 5, metadata: {} },
];

const buildingInstances = new Map<string, BuildingInstance[]>();

export function buildBuilding(matchId: string, userId: string, buildingId: string): { success: boolean; instance: BuildingInstance | null; message: string } {
  const def = BUILDING_DEFS.find(b => b.id === buildingId);
  if (!def) return { success: false, instance: null, message: "Unknown building" };
  // Check requirements
  const userBuildings = (buildingInstances.get(`${matchId}:${userId}`) ?? []).map(b => b.buildingId);
  for (const req of def.buildRequirements) {
    if (!userBuildings.includes(req)) return { success: false, instance: null, message: `Requires ${req}` };
  }
  // Check resources
  for (const [res, cost] of Object.entries(def.constructionCost)) {
    if (getResource(matchId, userId, res as ResourceType) < cost) return { success: false, instance: null, message: `Not enough ${res}` };
  }
  // Deduct resources
  for (const [res, cost] of Object.entries(def.constructionCost)) {
    adjustResource(matchId, userId, res as ResourceType, -cost, `build:${buildingId}`);
  }
  const instance: BuildingInstance = { id: randomUUID(), buildingId, level: def.level, userId, matchId, builtAt: new Date().toISOString() };
  const key = `${matchId}:${userId}`;
  const list = buildingInstances.get(key) ?? [];
  list.push(instance);
  buildingInstances.set(key, list);
  // Apply population bonus
  if (def.populationBonus > 0) adjustResource(matchId, userId, "population", def.populationBonus, `building_pop:${buildingId}`);
  emitEvent(matchId, "ResourceChanged", userId, { action: "build", buildingId, level: def.level });
  log.info("building.built", { matchId, userId, buildingId });
  return { success: true, instance, message: `${def.name} built` };
}

export function getUserBuildings(matchId: string, userId: string): BuildingInstance[] {
  return buildingInstances.get(`${matchId}:${userId}`) ?? [];
}

export function getBuildingCount(matchId: string, userId: string): number {
  return getUserBuildings(matchId, userId).length;
}

export function getHighestBuildingLevel(matchId: string, userId: string): BuildingLevel {
  const buildings = getUserBuildings(matchId, userId);
  if (buildings.length === 0) return 0 as BuildingLevel;
  return Math.max(...buildings.map(b => b.level)) as BuildingLevel;
}

// ===========================================================================
// System 4 — Production Engine
// ===========================================================================

export function produceResources(matchId: string, userId: string): ProductionResult {
  const buildings = getUserBuildings(matchId, userId);
  const produced: Record<string, number> = {};
  const bonuses: Record<string, number> = {};
  // Base production from buildings
  for (const inst of buildings) {
    const def = BUILDING_DEFS.find(b => b.id === inst.buildingId);
    if (!def) continue;
    for (const [res, amount] of Object.entries(def.productionBonuses)) {
      produced[res] = (produced[res] ?? 0) + amount;
    }
  }
  // Apply production to resources
  for (const [res, amount] of Object.entries(produced)) {
    adjustResource(matchId, userId, res as ResourceType, amount, `production`);
  }
  emitEvent(matchId, "ResourceChanged", userId, { action: "production", produced });
  return { userId, matchId, produced, bonuses, modifiers: {} };
}

// ===========================================================================
// System 5 — Upgrades
// ===========================================================================

export const UPGRADE_DEFS: UpgradeDefinition[] = [
  { id: "farm", name: "Farm", description: "Increases food production", requirements: ["hut"], costs: { wood: 30, stone: 10 }, bonuses: { food: 5 }, unlocks: [], dependencies: [] },
  { id: "mine", name: "Mine", description: "Increases stone production", requirements: ["hut"], costs: { wood: 20, stone: 5 }, bonuses: { stone: 3 }, unlocks: [], dependencies: [] },
  { id: "library", name: "Library", description: "Increases science production", requirements: ["village"], costs: { wood: 40, gold: 10 }, bonuses: { science: 2 }, unlocks: [], dependencies: [] },
  { id: "market", name: "Market", description: "Increases gold production", requirements: ["village"], costs: { wood: 30, stone: 20 }, bonuses: { gold: 3 }, unlocks: [], dependencies: [] },
  { id: "castle", name: "Castle", description: "Increases power and population cap", requirements: ["town"], costs: { stone: 100, gold: 50 }, bonuses: { population: 20 }, unlocks: ["empire"], dependencies: [] },
  { id: "walls", name: "Walls", description: "Defensive structure", requirements: ["town"], costs: { stone: 80, wood: 20 }, bonuses: {}, unlocks: [], dependencies: [] },
  { id: "university", name: "University", description: "Greatly increases science", requirements: ["city"], costs: { wood: 100, gold: 50, stone: 50 }, bonuses: { science: 5 }, unlocks: [], dependencies: ["library"] },
  { id: "workshop", name: "Workshop", description: "Increases wood production", requirements: ["hut"], costs: { wood: 15, stone: 10 }, bonuses: { wood: 3 }, unlocks: [], dependencies: [] },
];

const installedUpgrades = new Map<string, string[]>();

export function installUpgrade(matchId: string, userId: string, upgradeId: string): { success: boolean; message: string } {
  const def = UPGRADE_DEFS.find(u => u.id === upgradeId);
  if (!def) return { success: false, message: "Unknown upgrade" };
  const key = `${matchId}:${userId}`;
  const installed = installedUpgrades.get(key) ?? [];
  if (installed.includes(upgradeId)) return { success: false, message: "Already installed" };
  // Check dependencies
  for (const dep of def.dependencies) {
    if (!installed.includes(dep)) return { success: false, message: `Requires ${dep}` };
  }
  // Check building requirements
  const userBuildings = getUserBuildings(matchId, userId).map(b => b.buildingId);
  for (const req of def.requirements) {
    if (!userBuildings.includes(req)) return { success: false, message: `Requires building: ${req}` };
  }
  // Check resources
  for (const [res, cost] of Object.entries(def.costs)) {
    if (getResource(matchId, userId, res as ResourceType) < cost) return { success: false, message: `Not enough ${res}` };
  }
  // Deduct resources
  for (const [res, cost] of Object.entries(def.costs)) {
    adjustResource(matchId, userId, res as ResourceType, -cost, `upgrade:${upgradeId}`);
  }
  installed.push(upgradeId);
  installedUpgrades.set(key, installed);
  emitEvent(matchId, "ResourceChanged", userId, { action: "upgrade", upgradeId });
  log.info("upgrade.installed", { matchId, userId, upgradeId });
  return { success: true, message: `${def.name} installed` };
}

export function getInstalledUpgrades(matchId: string, userId: string): string[] {
  return installedUpgrades.get(`${matchId}:${userId}`) ?? [];
}

// ===========================================================================
// System 6 — Civilization Progression
// ===========================================================================

export const CIV_LEVELS: CivLevelConfig[] = [
  { level: "settlement", name: "Settlement", minPopulation: 0, minBuildings: 0, minPower: 0, unlocks: ["hut"] },
  { level: "village", name: "Village", minPopulation: 15, minBuildings: 2, minPower: 100, unlocks: ["village", "farm", "mine", "workshop"] },
  { level: "town", name: "Town", minPopulation: 30, minBuildings: 5, minPower: 300, unlocks: ["town", "library", "market"] },
  { level: "city", name: "City", minPopulation: 60, minBuildings: 10, minPower: 600, unlocks: ["city", "castle", "walls"] },
  { level: "kingdom", name: "Kingdom", minPopulation: 100, minBuildings: 15, minPower: 1000, unlocks: ["university"] },
  { level: "empire", name: "Empire", minPopulation: 150, minBuildings: 20, minPower: 1500, unlocks: ["empire"] },
];

export function getCivLevel(matchId: string, userId: string, power: number): CivLevel {
  const pop = getResource(matchId, userId, "population");
  const buildings = getBuildingCount(matchId, userId);
  let current: CivLevel = "settlement";
  for (const c of CIV_LEVELS) {
    if (pop >= c.minPopulation && buildings >= c.minBuildings && power >= c.minPower) current = c.level;
  }
  return current;
}

// ===========================================================================
// System 7 — Empire Power Calculation
// ===========================================================================

export function calculateEmpirePower(input: EmpirePowerInput): EmpirePowerResult {
  const w = EMPIRE_RULES.powerWeights;
  const totalResources = Object.values(input.resources).reduce((s, v) => s + v, 0);
  const breakdown = {
    population: Math.round(input.population * w.population * 10),
    resources: Math.round(totalResources * w.resources),
    buildings: Math.round(input.buildings * w.buildings * 50),
    science: Math.round(input.science * w.science * 20),
    economy: Math.round(input.economy * w.economy * 10),
    achievements: Math.round(input.achievements * w.achievements * 30),
    teacher: input.teacherModifiers,
  };
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  return { total, breakdown };
}

// ===========================================================================
// System 8 — Special Events
// ===========================================================================

export const EMPIRE_EVENTS: EmpireEventDef[] = [
  { id: "earthquake", kind: "earthquake", name: "Earthquake", description: "Destroys some buildings and resources", probability: 0.05, durationMs: 0, affectedResources: ["wood", "stone", "food"], modifiers: { resourceLoss: 0.1 } },
  { id: "golden_age", kind: "golden_age", name: "Golden Age", description: "Doubles production for a period", probability: 0.1, durationMs: 30_000, affectedResources: ["wood", "stone", "food", "gold"], modifiers: { productionMultiplier: 2 } },
  { id: "trade_caravan", kind: "trade_caravan", name: "Trade Caravan", description: "Bonus gold from trade", probability: 0.15, durationMs: 0, affectedResources: ["gold"], modifiers: { goldBonus: 30 } },
  { id: "tax_bonus", kind: "tax_bonus", name: "Tax Bonus", description: "Collect extra taxes", probability: 0.1, durationMs: 0, affectedResources: ["gold"], modifiers: { goldBonus: 20 } },
  { id: "harvest_festival", kind: "harvest_festival", name: "Harvest Festival", description: "Abundant food production", probability: 0.15, durationMs: 0, affectedResources: ["food"], modifiers: { foodBonus: 50 } },
  { id: "mine_collapse", kind: "mine_collapse", name: "Mine Collapse", description: "Lose stone resources", probability: 0.05, durationMs: 0, affectedResources: ["stone"], modifiers: { resourceLoss: 20 } },
  { id: "scientific_breakthrough", kind: "scientific_breakthrough", name: "Scientific Breakthrough", description: "Massive science boost", probability: 0.08, durationMs: 0, affectedResources: ["science"], modifiers: { scienceBonus: 15 } },
  { id: "merchant_visit", kind: "merchant_visit", name: "Merchant Visit", description: "Trade resources for gold", probability: 0.12, durationMs: 0, affectedResources: ["gold", "wood"], modifiers: { goldBonus: 15, woodLoss: 10 } },
  { id: "royal_gift", kind: "royal_gift", name: "Royal Gift", description: "The king gifts resources", probability: 0.1, durationMs: 0, affectedResources: ["gold", "food"], modifiers: { goldBonus: 25, foodBonus: 25 } },
  { id: "resource_discovery", kind: "resource_discovery", name: "Resource Discovery", description: "New resource vein found", probability: 0.1, durationMs: 0, affectedResources: ["wood", "stone"], modifiers: { woodBonus: 30, stoneBonus: 30 } },
];

const activeEmpireEvents = new Map<string, EmpireEventInstance[]>();

export function triggerEmpireEvent(matchId: string, kind: EmpireEventKind, targetUserId: string | null = null): EmpireEventInstance {
  const def = EMPIRE_EVENTS.find(e => e.kind === kind)!;
  const instance: EmpireEventInstance = {
    event: def, targetUserId,
    triggeredAt: new Date().toISOString(),
    expiresAt: def.durationMs > 0 ? new Date(Date.now() + def.durationMs).toISOString() : null,
  };
  const list = activeEmpireEvents.get(matchId) ?? [];
  list.push(instance);
  activeEmpireEvents.set(matchId, list);
  // Apply immediate effects
  if (targetUserId) {
    if (def.modifiers.goldBonus) adjustResource(matchId, targetUserId, "gold", def.modifiers.goldBonus as number, `event:${kind}`);
    if (def.modifiers.foodBonus) adjustResource(matchId, targetUserId, "food", def.modifiers.foodBonus as number, `event:${kind}`);
    if (def.modifiers.scienceBonus) adjustResource(matchId, targetUserId, "science", def.modifiers.scienceBonus as number, `event:${kind}`);
    if (def.modifiers.woodBonus) adjustResource(matchId, targetUserId, "wood", def.modifiers.woodBonus as number, `event:${kind}`);
    if (def.modifiers.stoneBonus) adjustResource(matchId, targetUserId, "stone", def.modifiers.stoneBonus as number, `event:${kind}`);
    if (def.modifiers.resourceLoss) {
      const loss = def.modifiers.resourceLoss as number;
      for (const res of def.affectedResources) adjustResource(matchId, targetUserId, res as ResourceType, -loss, `event:${kind}`);
    }
    if (def.modifiers.woodLoss) adjustResource(matchId, targetUserId, "wood", -(def.modifiers.woodLoss as number), `event:${kind}`);
  }
  emitEvent(matchId, "ResourceChanged", targetUserId, { event: kind, name: def.name, effects: def.modifiers });
  log.info("event.triggered", { kind, matchId, target: targetUserId });
  return instance;
}

export function getActiveEmpireEvents(matchId: string): EmpireEventInstance[] {
  const list = activeEmpireEvents.get(matchId) ?? [];
  const now = new Date();
  return list.filter(e => !e.expiresAt || new Date(e.expiresAt) > now);
}
