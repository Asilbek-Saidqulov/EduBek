/** Empire Builder barrel export. Phase 6G.4. */
export { EMPIRE_RULES, getRules, RESOURCE_CONFIGS, initEmpireResources, getResource, getAllResources, adjustResource, BUILDING_DEFS, buildBuilding, getUserBuildings, getBuildingCount, getHighestBuildingLevel, produceResources, UPGRADE_DEFS, installUpgrade, getInstalledUpgrades, CIV_LEVELS, getCivLevel, calculateEmpirePower, EMPIRE_EVENTS, triggerEmpireEvent, getActiveEmpireEvents,
  runQuestionPhase, runAnswerPhase, runProductionPhase, runConstructionPhase, runUpgradePhase, runEmpireUpdatePhase, runLeaderboardPhase, runNextQuestionPhase, buildEmpireLeaderboard, EMPIRE_ACHIEVEMENTS, checkEmpireAchievements, generateEmpireMatchSummary, generateEmpireAnalytics, executeEmpireTeacherAction, getEmpireStudentUXState, EMPIRE_ACCESSIBILITY, generateEmpireDashboard, getEmpireStatus,
} from "./service";

export type {
  EmpireBuilderRules, ResourceType, ResourceConfig, BuildingDefinition, BuildingInstance, BuildingLevel, ProductionResult, UpgradeDefinition, CivLevel, CivLevelConfig, EmpirePowerInput, EmpirePowerResult, EmpireEventKind, EmpireEventDef, EmpireEventInstance, EmpireGameplayPhase, EmpireLeaderboardType, EmpireLeaderboardEntry, EmpireAchievement, EmpireAchievementStats, EmpireMatchSummary, EmpireAnalytics, EmpireTeacherAction, EmpireTeacherResult, EmpireStudentUXState, EmpireAccessibilityConfig, EmpireDashboard,
} from "./types";
