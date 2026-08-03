/**
 * EduBek — Empire Builder Production Edition types.
 * Phase 6G.4: Strategic civilization game mode on top of Universal Game Engine.
 * Pure configuration/rules layer — zero engine duplication.
 */

// System 1 — Rules
export interface EmpireBuilderRules {
  gameMode: "empire_builder"; minPlayers: number; maxPlayers: number;
  allowSpectators: boolean; allowLateJoin: boolean; reconnectPolicy: "allow" | "deny" | "limited";
  roundCount: number; questionsPerRound: number; timePerQuestionMs: number;
  buildPhaseMs: number; hostControls: string[]; organizationRestricted: boolean;
  startingResources: Record<string, number>; storageCap: Record<string, number>;
  powerWeights: { population: number; resources: number; buildings: number; science: number; economy: number; achievements: number; };
}

// System 2 — Resources
export type ResourceType = "wood" | "stone" | "food" | "gold" | "population" | "science";
export interface ResourceConfig { type: ResourceType; displayName: string; initialValue: number; maxValue: number | null; minValue: number; }

// System 3 — Buildings
export type BuildingLevel = 1 | 2 | 3 | 4 | 5;
export interface BuildingDefinition {
  id: string; name: string; level: BuildingLevel; description: string;
  constructionCost: Record<string, number>; buildRequirements: string[];
  productionBonuses: Record<string, number>; populationBonus: number; economyBonus: number;
  upgradeTimeMs: number; visualLevel: number; metadata: Record<string, unknown>;
}
export interface BuildingInstance { id: string; buildingId: string; level: BuildingLevel; userId: string; matchId: string; builtAt: string; }

// System 4 — Production
export interface ProductionResult { userId: string; matchId: string; produced: Record<string, number>; bonuses: Record<string, number>; modifiers: Record<string, number>; }

// System 5 — Upgrades
export interface UpgradeDefinition {
  id: string; name: string; description: string; requirements: string[];
  costs: Record<string, number>; bonuses: Record<string, number>; unlocks: string[];
  dependencies: string[];
}

// System 6 — Civilization Progression
export type CivLevel = "settlement" | "village" | "town" | "city" | "kingdom" | "empire";
export interface CivLevelConfig { level: CivLevel; name: string; minPopulation: number; minBuildings: number; minPower: number; unlocks: string[]; }

// System 7 — Empire Power
export interface EmpirePowerInput { population: number; resources: Record<string, number>; buildings: number; science: number; economy: number; achievements: number; teacherModifiers: number; }
export interface EmpirePowerResult { total: number; breakdown: Record<string, number>; }

// System 8 — Special Events
export type EmpireEventKind = "earthquake" | "golden_age" | "trade_caravan" | "tax_bonus" | "harvest_festival" | "mine_collapse" | "scientific_breakthrough" | "merchant_visit" | "royal_gift" | "resource_discovery";
export interface EmpireEventDef { id: string; kind: EmpireEventKind; name: string; description: string; probability: number; durationMs: number; affectedResources: string[]; modifiers: Record<string, number>; }
export interface EmpireEventInstance { event: EmpireEventDef; targetUserId: string | null; triggeredAt: string; expiresAt: string | null; }

// System 9 — Gameplay Flow
export type EmpireGameplayPhase = "question" | "answer" | "validation" | "score" | "resource_production" | "construction" | "upgrade" | "empire_update" | "leaderboard" | "statistics" | "next_question";

// System 10 — Leaderboards
export type EmpireLeaderboardType = "power" | "population" | "wealth" | "science" | "buildings" | "production" | "efficiency" | "growth" | "teacher_view" | "final_ranking";
export interface EmpireLeaderboardEntry { rank: number; userId: string; displayName: string; power: number; population: number; wealth: number; science: number; buildingCount: number; productionRate: number; efficiency: number; growthRate: number; }

// System 11 — Achievements
export interface EmpireAchievement { id: string; name: string; description: string; condition: (stats: EmpireAchievementStats) => boolean; xpReward: number; }
export interface EmpireAchievementStats { buildingCount: number; upgradeCount: number; population: number; gold: number; food: number; science: number; power: number; civLevel: number; rank: number; perfectRounds: number; }

// System 12 — Match Summary
export interface EmpireMatchSummary {
  matchId: string; winner: EmpireLeaderboardEntry | null; top3: EmpireLeaderboardEntry[];
  empireTimeline: Array<{ timestamp: string; avgPower: number; avgPopulation: number }>;
  resourceSummary: Record<string, { total: number; avg: number; max: number }>;
  buildingSummary: { totalBuilt: number; totalUpgraded: number; mostBuilt: string | null };
  achievements: Array<{ userId: string; achievements: string[] }>;
  replayAvailable: boolean; exportAvailable: boolean;
  teacherSummary: { interventions: number; eventsInjected: number; pauses: number };
}

// System 13 — Analytics
export interface EmpireAnalytics {
  matchId: string;
  resourceProduction: Record<string, { total: number; avg: number }>;
  construction: { totalBuilt: number; totalUpgraded: number; buildFrequency: Record<string, number> };
  growth: { avgPowerGrowth: number; avgPopulationGrowth: number; avgScienceGrowth: number };
  questionPerformance: { avgAccuracy: number; avgTimeMs: number };
  civProgression: Record<string, number>; // civ level → count
  teacherInterventions: number; dropouts: number; reconnects: number; replayUsage: number;
  completionRate: number;
}

// System 14 — Teacher Controls
export type EmpireTeacherAction = "pause" | "resume" | "freeze_construction" | "freeze_resources" | "inject_event" | "bonus_resources" | "penalty" | "reveal_empire" | "hide_empire" | "skip_build_phase" | "end_match" | "emergency_stop";
export interface EmpireTeacherResult { action: EmpireTeacherAction; success: boolean; audited: boolean; eventId: string | null; message: string; }

// System 15 — Student UX
export type EmpireStudentUXState = "building" | "planning" | "producing" | "waiting" | "constructing" | "viewing_empire" | "choosing_upgrade" | "reviewing" | "summary" | "replay" | "disconnected" | "reconnecting";

// System 16 — Accessibility
export interface EmpireAccessibilityConfig { keyboardNavigation: boolean; screenReader: boolean; reducedMotion: boolean; colorBlindFriendly: boolean; largeUI: boolean; timerAccessibility: boolean; highContrast: boolean; }

// System 17 — Dashboard
export interface EmpireDashboard {
  matchId: string; currentEmpires: Array<{ userId: string; displayName: string; power: number; population: number; civLevel: string }>;
  totalPopulation: number; totalResources: Record<string, number>; totalBuildings: number;
  constructionQueues: number; activeEvents: EmpireEventInstance[];
  interventions: number; avgLatencyMs: number; matchHealth: "healthy" | "warning" | "critical";
  productionRate: number;
}
