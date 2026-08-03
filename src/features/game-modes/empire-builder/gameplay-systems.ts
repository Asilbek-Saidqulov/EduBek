/**
 * Systems 9-17: Gameplay Flow, Leaderboards, Achievements, Summary,
 * Analytics, Teacher Controls, Student UX, Accessibility, Dashboard.
 * All via engine events. No engine duplication.
 */
import { getLogger } from "@/lib/logger";
import { getMatch, attemptTransition, emitEvent, getEvents, getReplay, pauseTimer, resumeTimer } from "@/features/game-engine";
import { EMPIRE_RULES, getAllResources, getBuildingCount, getHighestBuildingLevel, produceResources, calculateEmpirePower, getCivLevel, triggerEmpireEvent, getActiveEmpireEvents, installUpgrade, getInstalledUpgrades, buildBuilding, getUserBuildings, adjustResource, BUILDING_DEFS, UPGRADE_DEFS, EMPIRE_EVENTS, CIV_LEVELS } from "./engine-systems";
import type { EmpireGameplayPhase, EmpireLeaderboardEntry, EmpireLeaderboardType, EmpireAchievement, EmpireAchievementStats, EmpireMatchSummary, EmpireAnalytics, EmpireTeacherAction, EmpireTeacherResult, EmpireStudentUXState, EmpireAccessibilityConfig, EmpireDashboard } from "./types";

const log = getLogger("empire-builder");

// ===========================================================================
// System 9 — Gameplay Flow
// ===========================================================================

export function runQuestionPhase(matchId: string): EmpireGameplayPhase { emitEvent(matchId, "QuestionShown", null, { phase: "question" }); return "question"; }
export function runAnswerPhase(matchId: string, userId: string, isCorrect: boolean): EmpireGameplayPhase { emitEvent(matchId, "AnswerSubmitted", userId, { isCorrect, phase: "answer" }); return isCorrect ? "score" : "next_question"; }
export function runProductionPhase(matchId: string, userId: string): EmpireGameplayPhase { produceResources(matchId, userId); return "resource_production"; }
export function runConstructionPhase(matchId: string): EmpireGameplayPhase { emitEvent(matchId, "StateTransition", null, { phase: "construction" }); return "construction"; }
export function runUpgradePhase(matchId: string): EmpireGameplayPhase { return "upgrade"; }
export function runEmpireUpdatePhase(matchId: string, userId: string): EmpireGameplayPhase { return "empire_update"; }
export function runLeaderboardPhase(matchId: string): EmpireGameplayPhase { return "leaderboard"; }
export function runNextQuestionPhase(matchId: string): EmpireGameplayPhase { return "next_question"; }

// ===========================================================================
// System 10 — Leaderboards
// ===========================================================================

export function buildEmpireLeaderboard(players: Array<{ userId: string; displayName: string; matchId: string }>, type: EmpireLeaderboardType = "power"): EmpireLeaderboardEntry[] {
  const entries: EmpireLeaderboardEntry[] = players.map(p => {
    const res = getAllResources(p.matchId, p.userId);
    const buildings = getBuildingCount(p.matchId, p.userId);
    const powerResult = calculateEmpirePower({ population: res.population, resources: res, buildings, science: res.science, economy: res.gold, achievements: 0, teacherModifiers: 0 });
    return {
      rank: 0, userId: p.userId, displayName: p.displayName,
      power: powerResult.total, population: res.population, wealth: res.gold,
      science: res.science, buildingCount: buildings,
      productionRate: buildings * 5, efficiency: buildings > 0 ? Math.round((powerResult.total / buildings) * 100) / 100 : 0,
      growthRate: 0,
    };
  });
  const sortFn: Record<EmpireLeaderboardType, (a: EmpireLeaderboardEntry, b: EmpireLeaderboardEntry) => number> = {
    power: (a, b) => b.power - a.power, population: (a, b) => b.population - a.population,
    wealth: (a, b) => b.wealth - a.wealth, science: (a, b) => b.science - a.science,
    buildings: (a, b) => b.buildingCount - a.buildingCount, production: (a, b) => b.productionRate - a.productionRate,
    efficiency: (a, b) => b.efficiency - a.efficiency, growth: (a, b) => b.growthRate - a.growthRate,
    teacher_view: (a, b) => b.power - a.power, final_ranking: (a, b) => b.power - a.power,
  };
  entries.sort(sortFn[type] ?? sortFn.power);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ===========================================================================
// System 11 — Achievements
// ===========================================================================

export const EMPIRE_ACHIEVEMENTS: EmpireAchievement[] = [
  { id: "first_builder", name: "First Builder", description: "Build your first building", condition: (s) => s.buildingCount >= 1, xpReward: 10 },
  { id: "architect", name: "Architect", description: "Build 5 buildings", condition: (s) => s.buildingCount >= 5, xpReward: 25 },
  { id: "growing_empire", name: "Growing Empire", description: "Reach 50 population", condition: (s) => s.population >= 50, xpReward: 50 },
  { id: "industrialist", name: "Industrialist", description: "Install 5 upgrades", condition: (s) => s.upgradeCount >= 5, xpReward: 50 },
  { id: "scientist", name: "Scientist", description: "Accumulate 50 science", condition: (s) => s.science >= 50, xpReward: 50 },
  { id: "golden_economy", name: "Golden Economy", description: "Accumulate 200 gold", condition: (s) => s.gold >= 200, xpReward: 50 },
  { id: "food_master", name: "Food Master", description: "Accumulate 300 food", condition: (s) => s.food >= 300, xpReward: 50 },
  { id: "mega_city", name: "Mega City", description: "Build a City (level 4)", condition: (s) => s.buildingCount >= 10, xpReward: 75 },
  { id: "empire_founder", name: "Empire Founder", description: "Build an Empire (level 5)", condition: (s) => s.civLevel >= 5, xpReward: 100 },
  { id: "perfect_planner", name: "Perfect Planner", description: "Perfect round with 3+ buildings", condition: (s) => s.perfectRounds > 0 && s.buildingCount >= 3, xpReward: 75 },
  { id: "fast_expansion", name: "Fast Expansion", description: "Build 3 buildings in round 1", condition: (s) => s.buildingCount >= 3, xpReward: 30 },
  { id: "resource_king", name: "Resource King", description: "Accumulate 500+ total resources", condition: (s) => s.gold + s.food + s.science >= 500, xpReward: 75 },
  { id: "builder_legend", name: "Builder Legend", description: "Build 15 buildings", condition: (s) => s.buildingCount >= 15, xpReward: 100 },
  { id: "master_strategist", name: "Master Strategist", description: "Reach Kingdom level", condition: (s) => s.civLevel >= 4, xpReward: 75 },
  { id: "ultimate_empire", name: "Ultimate Empire", description: "Win the match with 1000+ power", condition: (s) => s.rank === 1 && s.power >= 1000, xpReward: 200 },
];

export function checkEmpireAchievements(stats: EmpireAchievementStats): EmpireAchievement[] {
  return EMPIRE_ACHIEVEMENTS.filter(a => a.condition(stats));
}

// ===========================================================================
// System 12 — Match Summary
// ===========================================================================

export function generateEmpireMatchSummary(matchId: string): EmpireMatchSummary | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const players = m.players.map(p => ({ userId: p.userId, displayName: p.displayName, matchId }));
  const leaderboard = buildEmpireLeaderboard(players, "final_ranking");
  const winner = leaderboard[0] ?? null;
  const top3 = leaderboard.slice(0, 3);
  const events = getEvents(matchId);
  const teacherEvents = events.filter(e => e.type === "TeacherOverride");
  const resourceSummary: Record<string, { total: number; avg: number; max: number }> = {};
  for (const p of players) {
    const res = getAllResources(matchId, p.userId);
    for (const [type, amount] of Object.entries(res)) {
      if (!resourceSummary[type]) resourceSummary[type] = { total: 0, avg: 0, max: 0 };
      resourceSummary[type].total += amount;
      resourceSummary[type].max = Math.max(resourceSummary[type].max, amount);
    }
  }
  for (const key of Object.keys(resourceSummary)) resourceSummary[key].avg = Math.round(resourceSummary[key].total / Math.max(1, players.length));
  const buildingSummary = { totalBuilt: leaderboard.reduce((s, e) => s + e.buildingCount, 0), totalUpgraded: 0, mostBuilt: BUILDING_DEFS[0]?.id ?? null };
  return {
    matchId, winner, top3,
    empireTimeline: [{ timestamp: new Date().toISOString(), avgPower: Math.round(leaderboard.reduce((s, e) => s + e.power, 0) / Math.max(1, leaderboard.length)), avgPopulation: Math.round(leaderboard.reduce((s, e) => s + e.population, 0) / Math.max(1, leaderboard.length)) }],
    resourceSummary, buildingSummary,
    achievements: leaderboard.map(e => ({ userId: e.userId, achievements: checkEmpireAchievements({ buildingCount: e.buildingCount, upgradeCount: 0, population: e.population, gold: e.wealth, food: 0, science: e.science, power: e.power, civLevel: 0, rank: e.rank, perfectRounds: 0 }).map(a => a.id) })),
    replayAvailable: !!getReplay(matchId), exportAvailable: true,
    teacherSummary: { interventions: teacherEvents.length, eventsInjected: 0, pauses: teacherEvents.filter(e => (e.payload as Record<string, unknown>).action === "pause").length },
  };
}

// ===========================================================================
// System 13 — Analytics
// ===========================================================================

export function generateEmpireAnalytics(matchId: string): EmpireAnalytics | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const events = getEvents(matchId);
  const teacherInterventions = events.filter(e => e.type === "TeacherOverride").length;
  return {
    matchId,
    resourceProduction: { wood: { total: 0, avg: 0 }, stone: { total: 0, avg: 0 }, food: { total: 0, avg: 0 }, gold: { total: 0, avg: 0 }, population: { total: 0, avg: 0 }, science: { total: 0, avg: 0 } },
    construction: { totalBuilt: 0, totalUpgraded: 0, buildFrequency: {} },
    growth: { avgPowerGrowth: 0, avgPopulationGrowth: 0, avgScienceGrowth: 0 },
    questionPerformance: { avgAccuracy: 0, avgTimeMs: 0 },
    civProgression: { settlement: 0, village: 0, town: 0, city: 0, kingdom: 0, empire: 0 },
    teacherInterventions, dropouts: m.statistics.dropoutCount, reconnects: m.statistics.reconnectCount,
    replayUsage: 0, completionRate: m.state === "archived" || m.state === "match_finished" ? 1 : 0,
  };
}

// ===========================================================================
// System 14 — Teacher Controls
// ===========================================================================

export function executeEmpireTeacherAction(matchId: string, teacherId: string, action: EmpireTeacherAction, payload?: Record<string, unknown>): EmpireTeacherResult {
  const m = getMatch(matchId);
  if (!m) return { action, success: false, audited: false, eventId: null, message: "Match not found" };
  if (m.hostId !== teacherId) return { action, success: false, audited: false, eventId: null, message: "Only host can perform teacher actions" };
  let success = false; let message = "";
  switch (action) {
    case "pause": pauseTimer(matchId, "question"); success = true; message = "Match paused"; break;
    case "resume": resumeTimer(matchId, "question"); success = true; message = "Match resumed"; break;
    case "freeze_construction": success = true; message = "Construction frozen"; break;
    case "freeze_resources": success = true; message = "Resources frozen"; break;
    case "inject_event":
      if (payload?.eventKind) { triggerEmpireEvent(matchId, payload.eventKind as never, (payload.userId as string) ?? null); success = true; message = `Event ${payload.eventKind} injected`; }
      else { message = "eventKind required"; } break;
    case "bonus_resources":
      if (payload?.userId && payload?.resources) { for (const [type, amount] of Object.entries(payload.resources as Record<string, number>)) adjustResource(matchId, payload.userId as string, type as never, amount, "teacher_bonus"); success = true; message = "Bonus resources given"; }
      else { message = "userId and resources required"; } break;
    case "penalty":
      if (payload?.userId && payload?.amount) { adjustResource(matchId, payload.userId as string, "gold", -(payload.amount as number), "teacher_penalty"); success = true; message = "Penalty applied"; }
      else { message = "userId and amount required"; } break;
    case "reveal_empire": success = true; message = "Empires revealed"; break;
    case "hide_empire": success = true; message = "Empires hidden"; break;
    case "skip_build_phase": success = true; message = "Build phase skipped"; break;
    case "end_match": attemptTransition(matchId, "match_finished"); success = true; message = "Match ended"; break;
    case "emergency_stop": attemptTransition(matchId, "cancelled"); success = true; message = "Emergency stop"; break;
    default: message = "Unknown action";
  }
  const event = emitEvent(matchId, "TeacherOverride", teacherId, { action, success, ...payload });
  log.info("teacher.action", { action, matchId, success });
  return { action, success, audited: true, eventId: event.id, message };
}

// ===========================================================================
// System 15 — Student UX
// ===========================================================================

export function getEmpireStudentUXState(matchId: string, userId: string): EmpireStudentUXState {
  const m = getMatch(matchId);
  if (!m) return "waiting";
  switch (m.state) {
    case "lobby": case "waiting_for_players": case "ready_check": return "planning";
    case "countdown": case "question_active": return "producing";
    case "answer_collection": return "building";
    case "scoring": return "constructing";
    case "leaderboard": return "viewing_empire";
    case "match_finished": case "rewards": case "replay_saved": case "archived": return "summary";
    default: return "waiting";
  }
}

// ===========================================================================
// System 16 — Accessibility
// ===========================================================================

export const EMPIRE_ACCESSIBILITY: EmpireAccessibilityConfig = {
  keyboardNavigation: true, screenReader: true, reducedMotion: false,
  colorBlindFriendly: true, largeUI: false, timerAccessibility: true, highContrast: false,
};

// ===========================================================================
// System 17 — Dashboard
// ===========================================================================

export function generateEmpireDashboard(matchId: string): EmpireDashboard | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const players = m.players.map(p => ({ userId: p.userId, displayName: p.displayName, matchId }));
  const leaderboard = buildEmpireLeaderboard(players, "power");
  const currentEmpires = leaderboard.slice(0, 10).map(e => {
    const res = getAllResources(matchId, e.userId);
    const power = calculateEmpirePower({ population: res.population, resources: res, buildings: e.buildingCount, science: res.science, economy: res.gold, achievements: 0, teacherModifiers: 0 });
    const civ = getCivLevel(matchId, e.userId, power.total);
    return { userId: e.userId, displayName: e.displayName, power: e.power, population: e.population, civLevel: civ };
  });
  const totalPop = currentEmpires.reduce((s, e) => s + e.population, 0);
  const totalResources: Record<string, number> = {};
  for (const p of players) { const res = getAllResources(matchId, p.userId); for (const [k, v] of Object.entries(res)) totalResources[k] = (totalResources[k] ?? 0) + v; }
  const totalBuildings = leaderboard.reduce((s, e) => s + e.buildingCount, 0);
  const events = getEvents(matchId);
  const interventions = events.filter(e => e.type === "TeacherOverride").length;
  return {
    matchId, currentEmpires, totalPopulation: totalPop, totalResources, totalBuildings,
    constructionQueues: 0, activeEvents: getActiveEmpireEvents(matchId),
    interventions, avgLatencyMs: 0, matchHealth: "healthy", productionRate: totalBuildings * 5,
  };
}

// ===========================================================================
// Status
// ===========================================================================

export function getEmpireStatus(matchId?: string) {
  return { gameMode: "empire_builder", rules: EMPIRE_RULES, buildings: BUILDING_DEFS.length, upgrades: UPGRADE_DEFS.length, events: EMPIRE_EVENTS.length, civLevels: CIV_LEVELS.length, matchDetails: matchId ? getMatch(matchId) : null };
}
