/** EduBek — Empire Builder tests. Phase 6G.4: 17 systems. */
import { describe, it, expect, beforeEach } from "vitest";
import { EMPIRE_RULES, getRules, RESOURCE_CONFIGS, initEmpireResources, getResource, getAllResources, adjustResource, BUILDING_DEFS, buildBuilding, getUserBuildings, getBuildingCount, getHighestBuildingLevel, produceResources, UPGRADE_DEFS, installUpgrade, getInstalledUpgrades, CIV_LEVELS, getCivLevel, calculateEmpirePower, EMPIRE_EVENTS, triggerEmpireEvent, getActiveEmpireEvents } from "@/features/game-modes/empire-builder/engine-systems";
import { buildEmpireLeaderboard, EMPIRE_ACHIEVEMENTS, checkEmpireAchievements, generateEmpireMatchSummary, generateEmpireAnalytics, executeEmpireTeacherAction, getEmpireStudentUXState, EMPIRE_ACCESSIBILITY, generateEmpireDashboard, getEmpireStatus, runQuestionPhase, runAnswerPhase, runProductionPhase } from "@/features/game-modes/empire-builder/gameplay-systems";
import { createMatch, emitEvent, getEvents } from "@/features/game-engine";

let testMatchId: string;

beforeEach(() => {
  const m = createMatch({ hostId: "teacher-1", gameMode: "empire_builder", settings: EMPIRE_RULES });
  testMatchId = m.id;
  initEmpireResources(testMatchId, "p1");
  initEmpireResources(testMatchId, "p2");
});

// ===== System 1 — Rules =====
describe("Empire Builder — Rules", () => {
  it("has correct game mode", () => { expect(EMPIRE_RULES.gameMode).toBe("empire_builder"); });
  it("has 6 starting resources", () => { expect(Object.keys(EMPIRE_RULES.startingResources).length).toBe(6); });
  it("has configurable power weights", () => { expect(EMPIRE_RULES.powerWeights.population).toBeGreaterThan(0); });
  it("getRules returns copy", () => { expect(getRules()).not.toBe(EMPIRE_RULES); });
});

// ===== System 2 — Resources =====
describe("Empire Builder — Resources", () => {
  it("initializes all 6 resources", () => {
    expect(getResource(testMatchId, "p1", "wood")).toBe(100);
    expect(getResource(testMatchId, "p1", "stone")).toBe(50);
    expect(getResource(testMatchId, "p1", "food")).toBe(100);
    expect(getResource(testMatchId, "p1", "gold")).toBe(50);
    expect(getResource(testMatchId, "p1", "population")).toBe(10);
    expect(getResource(testMatchId, "p1", "science")).toBe(0);
  });
  it("adjusts resources", () => {
    adjustResource(testMatchId, "p1", "wood", 50, "test");
    expect(getResource(testMatchId, "p1", "wood")).toBe(150);
  });
  it("gets all resources", () => {
    const res = getAllResources(testMatchId, "p1");
    expect(res.wood).toBe(100); expect(res.population).toBe(10);
  });
  it("resources don't go below 0", () => {
    adjustResource(testMatchId, "p1", "wood", -500, "overspend");
    expect(getResource(testMatchId, "p1", "wood")).toBeGreaterThanOrEqual(0);
  });
});

// ===== System 3 — Buildings =====
describe("Empire Builder — Buildings", () => {
  it("has 5 building levels", () => { expect(BUILDING_DEFS.length).toBe(5); });
  it("builds a hut", () => {
    const r = buildBuilding(testMatchId, "p1", "hut");
    expect(r.success).toBe(true); expect(r.instance).not.toBeNull();
  });
  it("requires prerequisites for village", () => {
    const r = buildBuilding(testMatchId, "p1", "village");
    expect(r.success).toBe(false); expect(r.message).toContain("Requires");
  });
  it("builds village after hut", () => {
    buildBuilding(testMatchId, "p1", "hut");
    const r = buildBuilding(testMatchId, "p1", "village");
    expect(r.success).toBe(true);
  });
  it("deducts construction cost", () => {
    const before = getResource(testMatchId, "p1", "wood");
    buildBuilding(testMatchId, "p1", "hut");
    expect(getResource(testMatchId, "p1", "wood")).toBe(before - 20);
  });
  it("grants population bonus", () => {
    buildBuilding(testMatchId, "p1", "hut");
    expect(getResource(testMatchId, "p1", "population")).toBe(12); // 10 + 2
  });
  it("tracks building count", () => {
    buildBuilding(testMatchId, "p1", "hut");
    expect(getBuildingCount(testMatchId, "p1")).toBe(1);
  });
  it("tracks highest level", () => {
    buildBuilding(testMatchId, "p1", "hut");
    buildBuilding(testMatchId, "p1", "village");
    expect(getHighestBuildingLevel(testMatchId, "p1")).toBe(2);
  });
  it("fails without enough resources", () => {
    adjustResource(testMatchId, "p1", "wood", -100, "deplete");
    const r = buildBuilding(testMatchId, "p1", "hut");
    expect(r.success).toBe(false);
  });
});

// ===== System 4 — Production =====
describe("Empire Builder — Production", () => {
  it("produces resources based on buildings", () => {
    buildBuilding(testMatchId, "p1", "hut");
    const before = getResource(testMatchId, "p1", "food");
    produceResources(testMatchId, "p1");
    expect(getResource(testMatchId, "p1", "food")).toBe(before + 2); // hut gives +2 food
  });
  it("production increases with more buildings", () => {
    buildBuilding(testMatchId, "p1", "hut");
    buildBuilding(testMatchId, "p1", "village");
    const before = getResource(testMatchId, "p1", "food");
    produceResources(testMatchId, "p1");
    expect(getResource(testMatchId, "p1", "food")).toBe(before + 7); // hut +2, village +5
  });
});

// ===== System 5 — Upgrades =====
describe("Empire Builder — Upgrades", () => {
  it("has 8 upgrades", () => { expect(UPGRADE_DEFS.length).toBe(8); });
  it("installs farm after hut", () => {
    buildBuilding(testMatchId, "p1", "hut");
    const r = installUpgrade(testMatchId, "p1", "farm");
    expect(r.success).toBe(true);
  });
  it("requires building for upgrade", () => {
    const r = installUpgrade(testMatchId, "p1", "library");
    expect(r.success).toBe(false);
  });
  it("checks dependencies", () => {
    buildBuilding(testMatchId, "p1", "hut");
    buildBuilding(testMatchId, "p1", "village");
    buildBuilding(testMatchId, "p1", "town");
    buildBuilding(testMatchId, "p1", "city");
    const r = installUpgrade(testMatchId, "p1", "university");
    expect(r.success).toBe(false); // requires library first
  });
  it("deducts upgrade cost", () => {
    buildBuilding(testMatchId, "p1", "hut");
    const before = getResource(testMatchId, "p1", "wood");
    installUpgrade(testMatchId, "p1", "farm");
    expect(getResource(testMatchId, "p1", "wood")).toBe(before - 30);
  });
  it("tracks installed upgrades", () => {
    buildBuilding(testMatchId, "p1", "hut");
    installUpgrade(testMatchId, "p1", "farm");
    expect(getInstalledUpgrades(testMatchId, "p1")).toContain("farm");
  });
});

// ===== System 6 — Civilization Progression =====
describe("Empire Builder — Civilization", () => {
  it("has 6 civ levels", () => { expect(CIV_LEVELS.length).toBe(6); });
  it("starts as settlement", () => {
    expect(getCivLevel(testMatchId, "p1", 0)).toBe("settlement");
  });
  it("progresses to village with enough pop and buildings", () => {
    buildBuilding(testMatchId, "p1", "hut");
    buildBuilding(testMatchId, "p1", "village");
    adjustResource(testMatchId, "p1", "population", 10, "test"); // 12+10=22
    const civ = getCivLevel(testMatchId, "p1", 150);
    expect(civ).toBe("village");
  });
});

// ===== System 7 — Empire Power =====
describe("Empire Builder — Empire Power", () => {
  it("calculates power with weighted formula", () => {
    const r = calculateEmpirePower({ population: 100, resources: { wood: 100, stone: 50, food: 100, gold: 50, population: 100, science: 20 }, buildings: 5, science: 20, economy: 50, achievements: 2, teacherModifiers: 0 });
    expect(r.total).toBeGreaterThan(0); expect(r.breakdown.population).toBeGreaterThan(0);
  });
  it("power is deterministic", () => {
    const input = { population: 50, resources: { wood: 50, stone: 50, food: 50, gold: 50, population: 50, science: 10 }, buildings: 3, science: 10, economy: 30, achievements: 1, teacherModifiers: 0 };
    const r1 = calculateEmpirePower(input); const r2 = calculateEmpirePower(input);
    expect(r1.total).toBe(r2.total);
  });
  it("teacher modifiers affect power", () => {
    const base = calculateEmpirePower({ population: 50, resources: {}, buildings: 3, science: 10, economy: 30, achievements: 1, teacherModifiers: 0 });
    const boosted = calculateEmpirePower({ population: 50, resources: {}, buildings: 3, science: 10, economy: 30, achievements: 1, teacherModifiers: 100 });
    expect(boosted.total).toBeGreaterThan(base.total);
  });
});

// ===== System 8 — Events =====
describe("Empire Builder — Events", () => {
  it("has 10 events", () => { expect(EMPIRE_EVENTS.length).toBe(10); });
  it("triggers golden age", () => {
    const inst = triggerEmpireEvent(testMatchId, "golden_age", "p1");
    expect(inst.event.kind).toBe("golden_age");
  });
  it("applies gold bonus from trade caravan", () => {
    const before = getResource(testMatchId, "p1", "gold");
    triggerEmpireEvent(testMatchId, "trade_caravan", "p1");
    expect(getResource(testMatchId, "p1", "gold")).toBe(before + 30);
  });
  it("applies food bonus from harvest festival", () => {
    const before = getResource(testMatchId, "p1", "food");
    triggerEmpireEvent(testMatchId, "harvest_festival", "p1");
    expect(getResource(testMatchId, "p1", "food")).toBe(before + 50);
  });
  it("applies science from breakthrough", () => {
    const before = getResource(testMatchId, "p1", "science");
    triggerEmpireEvent(testMatchId, "scientific_breakthrough", "p1");
    expect(getResource(testMatchId, "p1", "science")).toBe(before + 15);
  });
  it("lists active events", () => {
    triggerEmpireEvent(testMatchId, "golden_age", "p1");
    expect(getActiveEmpireEvents(testMatchId).length).toBeGreaterThan(0);
  });
});

// ===== System 9 — Gameplay Flow =====
describe("Empire Builder — Gameplay", () => {
  it("runs question phase", () => { expect(runQuestionPhase(testMatchId)).toBe("question"); });
  it("runs answer phase (correct)", () => { expect(runAnswerPhase(testMatchId, "p1", true)).toBe("score"); });
  it("runs production phase", () => { expect(runProductionPhase(testMatchId, "p1")).toBe("resource_production"); });
});

// ===== System 10 — Leaderboards =====
describe("Empire Builder — Leaderboards", () => {
  it("builds leaderboard sorted by power", () => {
    const lb = buildEmpireLeaderboard([{ userId: "p1", displayName: "Alice", matchId: testMatchId }, { userId: "p2", displayName: "Bob", matchId: testMatchId }]);
    expect(lb.length).toBe(2); expect(lb[0].rank).toBe(1);
  });
});

// ===== System 11 — Achievements =====
describe("Empire Builder — Achievements", () => {
  it("has 15 achievements", () => { expect(EMPIRE_ACHIEVEMENTS.length).toBe(15); });
  it("awards First Builder", () => {
    const achs = checkEmpireAchievements({ buildingCount: 1, upgradeCount: 0, population: 10, gold: 50, food: 100, science: 0, power: 50, civLevel: 0, rank: 1, perfectRounds: 0 });
    expect(achs.some(a => a.id === "first_builder")).toBe(true);
  });
  it("awards Empire Founder for civ level 5", () => {
    const achs = checkEmpireAchievements({ buildingCount: 20, upgradeCount: 5, population: 150, gold: 200, food: 300, science: 50, power: 1500, civLevel: 5, rank: 1, perfectRounds: 1 });
    expect(achs.some(a => a.id === "empire_founder")).toBe(true);
  });
  it("all achievements have XP", () => { for (const a of EMPIRE_ACHIEVEMENTS) expect(a.xpReward).toBeGreaterThan(0); });
});

// ===== System 12 — Match Summary =====
describe("Empire Builder — Summary", () => {
  it("generates match summary", () => {
    emitEvent(testMatchId, "MatchCreated", null, {});
    const s = generateEmpireMatchSummary(testMatchId);
    expect(s).not.toBeNull(); expect(s!.top3.length).toBeLessThanOrEqual(3);
  });
  it("has resource summary", () => {
    const s = generateEmpireMatchSummary(testMatchId);
    expect(s!.resourceSummary).toBeDefined();
  });
});

// ===== System 13 — Analytics =====
describe("Empire Builder — Analytics", () => {
  it("generates analytics", () => {
    const a = generateEmpireAnalytics(testMatchId);
    expect(a).not.toBeNull(); expect(a!.resourceProduction).toHaveProperty("wood");
  });
});

// ===== System 14 — Teacher Controls =====
describe("Empire Builder — Teacher", () => {
  it("gives bonus resources", () => {
    const before = getResource(testMatchId, "p1", "wood");
    const r = executeEmpireTeacherAction(testMatchId, "teacher-1", "bonus_resources", { userId: "p1", resources: { wood: 50 } });
    expect(r.success).toBe(true); expect(getResource(testMatchId, "p1", "wood")).toBe(before + 50);
  });
  it("injects event", () => {
    const r = executeEmpireTeacherAction(testMatchId, "teacher-1", "inject_event", { eventKind: "golden_age", userId: "p1" });
    expect(r.success).toBe(true);
  });
  it("rejects non-host", () => {
    const r = executeEmpireTeacherAction(testMatchId, "p1", "pause");
    expect(r.success).toBe(false);
  });
  it("emergency stop works", () => {
    const r = executeEmpireTeacherAction(testMatchId, "teacher-1", "emergency_stop");
    expect(r.success).toBe(true);
  });
  it("all actions emit events", () => {
    const before = getEvents(testMatchId).length;
    executeEmpireTeacherAction(testMatchId, "teacher-1", "freeze_construction");
    expect(getEvents(testMatchId).length).toBeGreaterThan(before);
  });
});

// ===== System 15 — Student UX =====
describe("Empire Builder — Student UX", () => {
  it("returns planning in lobby", () => { expect(getEmpireStudentUXState(testMatchId, "p1")).toBe("planning"); });
});

// ===== System 16 — Accessibility =====
describe("Empire Builder — Accessibility", () => {
  it("has all features", () => { expect(EMPIRE_ACCESSIBILITY.keyboardNavigation).toBe(true); expect(EMPIRE_ACCESSIBILITY.colorBlindFriendly).toBe(true); });
});

// ===== System 17 — Dashboard =====
describe("Empire Builder — Dashboard", () => {
  it("generates dashboard", () => {
    const d = generateEmpireDashboard(testMatchId);
    expect(d).not.toBeNull(); expect(d!.currentEmpires.length).toBeGreaterThan(0);
  });
});

// ===== Extended =====
describe("Empire Builder — Extended", () => {
  it("status works", () => { const s = getEmpireStatus(); expect(s.gameMode).toBe("empire_builder"); });
  it("all resources registered through engine pipeline", () => {
    // If resources weren't registered, getResourceBalance would return 0
    expect(getResource(testMatchId, "p1", "wood")).toBe(100);
  });
  it("building definitions have costs", () => { for (const b of BUILDING_DEFS) expect(Object.keys(b.constructionCost).length).toBeGreaterThan(0); });
  it("upgrade definitions have costs", () => { for (const u of UPGRADE_DEFS) expect(Object.keys(u.costs).length).toBeGreaterThan(0); });
  it("civ levels are ordered", () => {
    for (let i = 1; i < CIV_LEVELS.length; i++) expect(CIV_LEVELS[i].minPopulation).toBeGreaterThanOrEqual(CIV_LEVELS[i - 1].minPopulation);
  });
  it("events have probabilities 0-1", () => { for (const e of EMPIRE_EVENTS) { expect(e.probability).toBeGreaterThan(0); expect(e.probability).toBeLessThanOrEqual(1); } });
  it("rules support 200 players", () => { expect(EMPIRE_RULES.maxPlayers).toBeGreaterThanOrEqual(200); });
  it("power weights sum to 1", () => {
    const w = EMPIRE_RULES.powerWeights; const sum = w.population + w.resources + w.buildings + w.science + w.economy + w.achievements;
    expect(Math.round(sum * 100) / 100).toBe(1);
  });
  it("all events have affected resources", () => { for (const e of EMPIRE_EVENTS) expect(e.affectedResources.length).toBeGreaterThan(0); });
  it("highest building level returns 0 for no buildings", () => { expect(getHighestBuildingLevel(testMatchId, "p2")).toBe(0); });
  it("production with no buildings produces nothing", () => {
    const before = getAllResources(testMatchId, "p2");
    produceResources(testMatchId, "p2");
    const after = getAllResources(testMatchId, "p2");
    expect(after.wood).toBe(before.wood);
  });
  it("building progression: hut→village→town→city→empire", () => {
    buildBuilding(testMatchId, "p2", "hut");
    // p2 needs enough resources for village
    adjustResource(testMatchId, "p2", "wood", 100, "test");
    adjustResource(testMatchId, "p2", "stone", 50, "test");
    adjustResource(testMatchId, "p2", "food", 50, "test");
    expect(buildBuilding(testMatchId, "p2", "village").success).toBe(true);
    // Town needs more
    adjustResource(testMatchId, "p2", "wood", 200, "test");
    adjustResource(testMatchId, "p2", "stone", 100, "test");
    adjustResource(testMatchId, "p2", "food", 100, "test");
    adjustResource(testMatchId, "p2", "gold", 50, "test");
    expect(buildBuilding(testMatchId, "p2", "town").success).toBe(true);
    // City needs more
    adjustResource(testMatchId, "p2", "wood", 500, "test");
    adjustResource(testMatchId, "p2", "stone", 200, "test");
    adjustResource(testMatchId, "p2", "food", 200, "test");
    adjustResource(testMatchId, "p2", "gold", 100, "test");
    expect(buildBuilding(testMatchId, "p2", "city").success).toBe(true);
    // Empire needs science
    adjustResource(testMatchId, "p2", "science", 50, "test");
    adjustResource(testMatchId, "p2", "wood", 1000, "test");
    adjustResource(testMatchId, "p2", "stone", 500, "test");
    adjustResource(testMatchId, "p2", "food", 500, "test");
    adjustResource(testMatchId, "p2", "gold", 200, "test");
    expect(buildBuilding(testMatchId, "p2", "empire").success).toBe(true);
  });
});
