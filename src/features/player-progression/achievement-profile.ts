/**
 * Systems 5-8, 12-15: Achievement Platform, Badge Engine, Player Titles,
 * Avatar & Identity, Daily Missions, Weekly Challenges, Monthly Challenges,
 * Event Challenges.
 *
 * All systems are configurable — no hardcoded gameplay values.
 * All updates are event-driven (consume engine events emitted by game modes).
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { awardXP, grantReward } from "./progression-engine";
import type {
  AchievementDefinition,
  AchievementCategory,
  AchievementRarity,
  AchievementCondition,
  PlayerAchievement,
  BadgeDefinition,
  BadgeSource,
  PlayerBadge,
  TitleDefinition,
  PlayerTitle,
  AvatarCustomization,
  CosmeticItem,
  MissionDefinition,
  MissionFrequency,
  PlayerMission,
  ChallengeDefinition,
  ChallengeScope,
  PlayerChallenge,
  MonthlyChallengeDefinition,
  EventChallenge,
  EventKind,
  GameModeId,
} from "./types";

const log = getLogger("player-progression");

// ===========================================================================
// In-memory state
// ===========================================================================

const achievementDefs = new Map<string, AchievementDefinition>();
const playerAchievements = new Map<string, PlayerAchievement[]>();
const badgeDefs = new Map<string, BadgeDefinition>();
const playerBadges = new Map<string, PlayerBadge[]>();
const titleDefs = new Map<string, TitleDefinition>();
const playerTitles = new Map<string, PlayerTitle[]>();
const avatarCustomizations = new Map<string, AvatarCustomization>();
const cosmeticItems = new Map<string, CosmeticItem>();
const missionDefs = new Map<string, MissionDefinition>();
const playerMissions = new Map<string, PlayerMission[]>();
const challengeDefs = new Map<string, ChallengeDefinition>();
const playerChallenges = new Map<string, PlayerChallenge[]>();
const eventChallenges = new Map<string, EventChallenge>();

// ===========================================================================
// System 5 — Achievement Platform (40+ achievements)
// ===========================================================================

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  // Classic Quiz (5)
  { id: "cq_first_win", name: "First Win", description: "Win your first Classic Quiz match", category: "classic_quiz", rarity: "common", xpReward: 50, badgeId: "badge_cq_first_win", titleId: null, condition: { metric: "classic_quiz_wins", operator: ">=", target: 1, gameMode: "classic_quiz" }, hidden: false, prerequisites: [] },
  { id: "cq_perfect_round", name: "Perfect Round", description: "Answer all questions correctly in a round", category: "classic_quiz", rarity: "rare", xpReward: 100, badgeId: "badge_cq_perfect", titleId: null, condition: { metric: "classic_quiz_perfect_rounds", operator: ">=", target: 1, gameMode: "classic_quiz" }, hidden: false, prerequisites: [] },
  { id: "cq_streak_10", name: "Streak Master", description: "Win 10 Classic Quiz matches in a row", category: "classic_quiz", rarity: "epic", xpReward: 250, badgeId: "badge_cq_streak_10", titleId: null, condition: { metric: "classic_quiz_win_streak", operator: ">=", target: 10, gameMode: "classic_quiz" }, hidden: false, prerequisites: [] },
  { id: "cq_scholar", name: "Quiz Scholar", description: "Answer 500 Classic Quiz questions correctly", category: "classic_quiz", rarity: "epic", xpReward: 400, badgeId: "badge_cq_scholar", titleId: "title_quiz_master", condition: { metric: "classic_quiz_correct", operator: ">=", target: 500, gameMode: "classic_quiz" }, hidden: false, prerequisites: [] },
  { id: "cq_speed_demon", name: "Speed Demon", description: "Answer in under 1 second", category: "classic_quiz", rarity: "legendary", xpReward: 300, badgeId: "badge_cq_speed", titleId: null, condition: { metric: "classic_quiz_fastest_ms", operator: "<=", target: 1000, gameMode: "classic_quiz" }, hidden: false, prerequisites: [] },

  // Treasure Heist (5)
  { id: "th_first_heist", name: "First Heist", description: "Complete your first Treasure Heist match", category: "treasure_heist", rarity: "common", xpReward: 50, badgeId: "badge_th_first", titleId: null, condition: { metric: "treasure_heist_matches", operator: ">=", target: 1, gameMode: "treasure_heist" }, hidden: false, prerequisites: [] },
  { id: "th_rich", name: "Gold Rush", description: "Accumulate 10,000 gold in a single match", category: "treasure_heist", rarity: "rare", xpReward: 150, badgeId: "badge_th_rich", titleId: null, condition: { metric: "treasure_heist_max_gold", operator: ">=", target: 10000, gameMode: "treasure_heist" }, hidden: false, prerequisites: [] },
  { id: "th_master_thief", name: "Master Thief", description: "Successfully steal 100 times", category: "treasure_heist", rarity: "epic", xpReward: 300, badgeId: "badge_th_thief", titleId: "title_treasure_hunter", condition: { metric: "treasure_heist_steals", operator: ">=", target: 100, gameMode: "treasure_heist" }, hidden: false, prerequisites: [] },
  { id: "th_invincible", name: "Invincible", description: "Win without losing any gold", category: "treasure_heist", rarity: "legendary", xpReward: 400, badgeId: "badge_th_invincible", titleId: null, condition: { metric: "treasure_heist_flawless_wins", operator: ">=", target: 1, gameMode: "treasure_heist" }, hidden: false, prerequisites: [] },
  { id: "th_magnate", name: "Magnate", description: "Win 50 Treasure Heist matches", category: "treasure_heist", rarity: "epic", xpReward: 350, badgeId: "badge_th_magnate", titleId: null, condition: { metric: "treasure_heist_wins", operator: ">=", target: 50, gameMode: "treasure_heist" }, hidden: false, prerequisites: [] },

  // Empire Builder (5)
  { id: "eb_first_empire", name: "First Empire", description: "Build your first empire", category: "empire_builder", rarity: "common", xpReward: 50, badgeId: "badge_eb_first", titleId: null, condition: { metric: "empire_builder_matches", operator: ">=", target: 1, gameMode: "empire_builder" }, hidden: false, prerequisites: [] },
  { id: "eb_city_builder", name: "City Builder", description: "Reach City level (4)", category: "empire_builder", rarity: "rare", xpReward: 150, badgeId: "badge_eb_city", titleId: null, condition: { metric: "empire_builder_max_level", operator: ">=", target: 4, gameMode: "empire_builder" }, hidden: false, prerequisites: [] },
  { id: "eb_emperor", name: "Emperor", description: "Reach Empire level (5)", category: "empire_builder", rarity: "legendary", xpReward: 500, badgeId: "badge_eb_emperor", titleId: "title_empire_founder", condition: { metric: "empire_builder_max_level", operator: ">=", target: 5, gameMode: "empire_builder" }, hidden: false, prerequisites: [] },
  { id: "eb_industrious", name: "Industrious", description: "Construct 100 buildings total", category: "empire_builder", rarity: "epic", xpReward: 300, badgeId: "badge_eb_industrious", titleId: null, condition: { metric: "empire_builder_total_buildings", operator: ">=", target: 100, gameMode: "empire_builder" }, hidden: false, prerequisites: [] },
  { id: "eb_powerhouse", name: "Powerhouse", description: "Achieve empire power 10,000+", category: "empire_builder", rarity: "epic", xpReward: 350, badgeId: "badge_eb_powerhouse", titleId: null, condition: { metric: "empire_builder_max_power", operator: ">=", target: 10000, gameMode: "empire_builder" }, hidden: false, prerequisites: [] },

  // Quiz Royale (5)
  { id: "qr_first_survival", name: "First Survival", description: "Survive your first Quiz Royale match", category: "quiz_royale", rarity: "common", xpReward: 50, badgeId: "badge_qr_first", titleId: null, condition: { metric: "quiz_royale_matches", operator: ">=", target: 1, gameMode: "quiz_royale" }, hidden: false, prerequisites: [] },
  { id: "qr_champion", name: "Royale Champion", description: "Win a Quiz Royale match", category: "quiz_royale", rarity: "epic", xpReward: 300, badgeId: "badge_qr_champion", titleId: "title_champion", condition: { metric: "quiz_royale_wins", operator: ">=", target: 1, gameMode: "quiz_royale" }, hidden: false, prerequisites: [] },
  { id: "qr_untouchable", name: "Untouchable", description: "Win without losing a life", category: "quiz_royale", rarity: "legendary", xpReward: 400, badgeId: "badge_qr_untouchable", titleId: null, condition: { metric: "quiz_royale_flawless_wins", operator: ">=", target: 1, gameMode: "quiz_royale" }, hidden: false, prerequisites: [] },
  { id: "qr_shield_master", name: "Shield Master", description: "Use 50 shields total", category: "quiz_royale", rarity: "rare", xpReward: 200, badgeId: "badge_qr_shield", titleId: null, condition: { metric: "quiz_royale_shields_used", operator: ">=", target: 50, gameMode: "quiz_royale" }, hidden: false, prerequisites: [] },
  { id: "qr_legend", name: "Royale Legend", description: "Win 10 Quiz Royale matches", category: "quiz_royale", rarity: "mythic", xpReward: 600, badgeId: "badge_qr_legend", titleId: "title_legend", condition: { metric: "quiz_royale_wins", operator: ">=", target: 10, gameMode: "quiz_royale" }, hidden: false, prerequisites: [] },

  // Battle Royale (5)
  { id: "br_first_duel", name: "First Duel", description: "Complete your first Battle Royale duel", category: "battle_royale", rarity: "common", xpReward: 50, badgeId: "badge_br_first", titleId: null, condition: { metric: "battle_royale_duels", operator: ">=", target: 1, gameMode: "battle_royale" }, hidden: false, prerequisites: [] },
  { id: "br_tournament_champion", name: "Tournament Champion", description: "Win a Battle Royale tournament", category: "battle_royale", rarity: "legendary", xpReward: 500, badgeId: "badge_br_champion", titleId: "title_grandmaster", condition: { metric: "battle_royale_tournament_wins", operator: ">=", target: 1, gameMode: "battle_royale" }, hidden: false, prerequisites: [] },
  { id: "br_perfect_duel", name: "Perfect Duel", description: "Win a duel without missing a question", category: "battle_royale", rarity: "epic", xpReward: 250, badgeId: "badge_br_perfect", titleId: null, condition: { metric: "battle_royale_perfect_duels", operator: ">=", target: 1, gameMode: "battle_royale" }, hidden: false, prerequisites: [] },
  { id: "br_underdog", name: "Underdog", description: "Win a tournament as seed 8+", category: "battle_royale", rarity: "legendary", xpReward: 400, badgeId: "badge_br_underdog", titleId: null, condition: { metric: "battle_royale_upset_wins", operator: ">=", target: 1, gameMode: "battle_royale" }, hidden: false, prerequisites: [] },
  { id: "br_iron_champion", name: "Iron Champion", description: "Win 5 tournaments", category: "battle_royale", rarity: "mythic", xpReward: 750, badgeId: "badge_br_iron", titleId: "title_grandmaster", condition: { metric: "battle_royale_tournament_wins", operator: ">=", target: 5, gameMode: "battle_royale" }, hidden: false, prerequisites: [] },

  // Cross-Mode (5)
  { id: "xm_all_round", name: "All-Rounder", description: "Play all 5 game modes", category: "cross_mode", rarity: "rare", xpReward: 200, badgeId: "badge_xm_all_round", titleId: "title_strategist", condition: { metric: "modes_played", operator: ">=", target: 5, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "xm_centurion", name: "Centurion", description: "Play 100 matches across all modes", category: "cross_mode", rarity: "epic", xpReward: 400, badgeId: "badge_xm_centurion", titleId: null, condition: { metric: "total_matches", operator: ">=", target: 100, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "xm_polymath", name: "Polymath", description: "Win in all 5 game modes", category: "cross_mode", rarity: "legendary", xpReward: 600, badgeId: "badge_xm_polymath", titleId: "title_legend", condition: { metric: "modes_won", operator: ">=", target: 5, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "xm_xp_master", name: "XP Master", description: "Accumulate 100,000 total XP", category: "cross_mode", rarity: "legendary", xpReward: 500, badgeId: "badge_xp_master", titleId: null, condition: { metric: "total_xp", operator: ">=", target: 100000, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "xm_level_100", name: "Centurion Level", description: "Reach level 100", category: "cross_mode", rarity: "epic", xpReward: 500, badgeId: "badge_level_100", titleId: null, condition: { metric: "level", operator: ">=", target: 100, gameMode: null }, hidden: false, prerequisites: [] },

  // Social (3)
  { id: "soc_first_friend", name: "Friendly", description: "Add your first friend", category: "social", rarity: "common", xpReward: 25, badgeId: "badge_soc_friend", titleId: null, condition: { metric: "friends_count", operator: ">=", target: 1, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "soc_mentor", name: "Mentor", description: "Help 10 players via mentorship", category: "social", rarity: "rare", xpReward: 200, badgeId: "badge_soc_mentor", titleId: null, condition: { metric: "mentorship_count", operator: ">=", target: 10, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "soc_influencer", name: "Influencer", description: "Gain 100 followers", category: "social", rarity: "epic", xpReward: 300, badgeId: "badge_soc_influencer", titleId: null, condition: { metric: "followers_count", operator: ">=", target: 100, gameMode: null }, hidden: false, prerequisites: [] },

  // Competitive (4)
  { id: "comp_first_tournament", name: "Competitor", description: "Participate in your first tournament", category: "competitive", rarity: "common", xpReward: 75, badgeId: "badge_comp_first", titleId: null, condition: { metric: "tournaments_played", operator: ">=", target: 1, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "comp_finalist", name: "Finalist", description: "Reach a tournament final", category: "competitive", rarity: "rare", xpReward: 200, badgeId: "badge_comp_finalist", titleId: null, condition: { metric: "tournament_finals", operator: ">=", target: 1, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "comp_champion", name: "Champion", description: "Win a tournament", category: "competitive", rarity: "epic", xpReward: 400, badgeId: "badge_comp_champion", titleId: "title_champion", condition: { metric: "tournament_wins", operator: ">=", target: 1, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "comp_dynasty", name: "Dynasty", description: "Win 10 tournaments", category: "competitive", rarity: "mythic", xpReward: 1000, badgeId: "badge_comp_dynasty", titleId: "title_grandmaster", condition: { metric: "tournament_wins", operator: ">=", target: 10, gameMode: null }, hidden: false, prerequisites: [] },

  // Seasonal (3)
  { id: "sea_season_1", name: "Season Pioneer", description: "Reach level 50 in a season", category: "seasonal", rarity: "epic", xpReward: 300, badgeId: "badge_sea_pioneer", titleId: null, condition: { metric: "season_level", operator: ">=", target: 50, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "sea_top_100", name: "Top 100", description: "Finish a season in the top 100", category: "seasonal", rarity: "legendary", xpReward: 500, badgeId: "badge_sea_top_100", titleId: null, condition: { metric: "season_final_rank", operator: "<=", target: 100, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "sea_completionist", name: "Season Completionist", description: "Claim all season rewards", category: "seasonal", rarity: "mythic", xpReward: 750, badgeId: "badge_sea_completionist", titleId: null, condition: { metric: "season_rewards_claimed", operator: ">=", target: 10, gameMode: null }, hidden: false, prerequisites: [] },

  // Secret (2) — hidden until unlocked
  { id: "sec_midnight", name: "Midnight Scholar", description: "Play a match between midnight and 1 AM", category: "secret", rarity: "rare", xpReward: 100, badgeId: "badge_sec_midnight", titleId: null, condition: { metric: "midnight_matches", operator: ">=", target: 1, gameMode: null }, hidden: true, prerequisites: [] },
  { id: "sec_comeback_king", name: "Comeback King", description: "Win after being in last place", category: "secret", rarity: "legendary", xpReward: 350, badgeId: "badge_sec_comeback", titleId: null, condition: { metric: "comeback_wins", operator: ">=", target: 1, gameMode: null }, hidden: true, prerequisites: [] },

  // Teacher (2)
  { id: "tch_first_class", name: "First Class", description: "Host your first teaching session", category: "teacher", rarity: "common", xpReward: 100, badgeId: "badge_tch_first", titleId: null, condition: { metric: "teaching_sessions", operator: ">=", target: 1, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "tch_master", name: "Master Teacher", description: "Host 100 teaching sessions", category: "teacher", rarity: "legendary", xpReward: 800, badgeId: "badge_tch_master", titleId: "title_teacher", condition: { metric: "teaching_sessions", operator: ">=", target: 100, gameMode: null }, hidden: false, prerequisites: [] },

  // Career (2)
  { id: "car_year_one", name: "Year One", description: "Be active for 365 days", category: "career", rarity: "epic", xpReward: 500, badgeId: "badge_car_year_one", titleId: null, condition: { metric: "active_days", operator: ">=", target: 365, gameMode: null }, hidden: false, prerequisites: [] },
  { id: "car_dedicated", name: "Dedicated", description: "Play 1000 matches", category: "career", rarity: "legendary", xpReward: 1000, badgeId: "badge_car_dedicated", titleId: "title_legend", condition: { metric: "total_matches", operator: ">=", target: 1000, gameMode: null }, hidden: false, prerequisites: [] },
];

export function initializeAchievements(): void {
  for (const a of ACHIEVEMENT_CATALOG) {
    achievementDefs.set(a.id, a);
  }
  log.info("achievements.initialized", { count: ACHIEVEMENT_CATALOG.length });
}

export function getAchievement(id: string): AchievementDefinition | null {
  return achievementDefs.get(id) ?? null;
}

export function listAchievements(category?: AchievementCategory): AchievementDefinition[] {
  const all = Array.from(achievementDefs.values());
  return category ? all.filter(a => a.category === category) : all;
}

export function getPlayerAchievements(userId: string): PlayerAchievement[] {
  return playerAchievements.get(userId) ?? [];
}

export function checkAchievementConditions(userId: string, metrics: Record<string, number>): PlayerAchievement[] {
  const unlocked: PlayerAchievement[] = [];
  const existing = playerAchievements.get(userId) ?? [];
  const existingIds = new Set(existing.map(a => a.achievementId));

  for (const def of achievementDefs.values()) {
    if (existingIds.has(def.id)) continue;
    // Check prerequisites
    if (def.prerequisites.length > 0) {
      if (!def.prerequisites.every(prereq => existingIds.has(prereq))) continue;
    }
    // Check condition
    const metricValue = metrics[def.condition.metric] ?? 0;
    const target = def.condition.target;
    let satisfied = false;
    switch (def.condition.operator) {
      case ">=": satisfied = metricValue >= target; break;
      case ">": satisfied = metricValue > target; break;
      case "==": satisfied = metricValue === target; break;
      case "<=": satisfied = metricValue <= target; break;
      case "<": satisfied = metricValue < target; break;
    }
    if (satisfied) {
      const playerAch: PlayerAchievement = {
        achievementId: def.id,
        userId,
        unlockedAt: new Date().toISOString(),
        progress: metricValue,
        completed: true,
        metadata: { metric: def.condition.metric, target: def.condition.target, value: metricValue },
      };
      existing.push(playerAch);
      unlocked.push(playerAch);

      // Award XP
      awardXP({
        userId,
        source: "achievement",
        amount: def.xpReward,
        metadata: { achievementId: def.id },
      });

      // Grant badge if configured
      if (def.badgeId) {
        awardBadge(userId, def.badgeId, "achievement", null);
      }
      // Grant title if configured
      if (def.titleId) {
        awardTitle(userId, def.titleId);
      }

      log.info("achievement.unlocked", { userId, achievementId: def.id, rarity: def.rarity });
    }
  }
  if (unlocked.length > 0) {
    playerAchievements.set(userId, existing);
  }
  return unlocked;
}

// ===========================================================================
// System 6 — Badge Engine
// ===========================================================================

export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: "badge_welcome", name: "Welcome", description: "Joined EduBek", source: "special_event", iconUrl: null, rarity: "common", cosmeticRewardId: null },
  { id: "badge_beta_tester", name: "Beta Tester", description: "Participated in beta", source: "special_event", iconUrl: null, rarity: "epic", cosmeticRewardId: "frame_beta" },
  { id: "badge_founding_scholar", name: "Founding Scholar", description: "Founding member", source: "organization", iconUrl: null, rarity: "legendary", cosmeticRewardId: "frame_founding" },
  { id: "badge_teacher_favorite", name: "Teacher's Favorite", description: "Awarded by a teacher", source: "teacher_award", iconUrl: null, rarity: "rare", cosmeticRewardId: null },
  { id: "badge_champion_s1", name: "Season 1 Champion", description: "Top performer in Season 1", source: "season", iconUrl: null, rarity: "legendary", cosmeticRewardId: "frame_champion" },
  { id: "badge_competition_winner", name: "Competition Winner", description: "Won an official competition", source: "competition", iconUrl: null, rarity: "epic", cosmeticRewardId: "frame_winner" },
];

export function initializeBadges(): void {
  for (const b of BADGE_CATALOG) {
    badgeDefs.set(b.id, b);
  }
}

export function getBadge(id: string): BadgeDefinition | null {
  return badgeDefs.get(id) ?? null;
}

export function listBadges(): BadgeDefinition[] {
  return Array.from(badgeDefs.values());
}

export function getPlayerBadges(userId: string): PlayerBadge[] {
  return playerBadges.get(userId) ?? [];
}

export function awardBadge(userId: string, badgeId: string, source: BadgeSource, awardedBy: string | null): PlayerBadge | null {
  const def = badgeDefs.get(badgeId);
  if (!def) return null;
  const existing = playerBadges.get(userId) ?? [];
  if (existing.some(b => b.badgeId === badgeId)) return null; // Already has it
  const badge: PlayerBadge = {
    badgeId,
    userId,
    awardedAt: new Date().toISOString(),
    awardedBy,
    source,
    metadata: { name: def.name, rarity: def.rarity },
  };
  existing.push(badge);
  playerBadges.set(userId, existing);

  // Grant cosmetic reward if configured
  if (def.cosmeticRewardId) {
    grantReward({
      userId,
      kind: "cosmetic",
      rewardId: def.cosmeticRewardId,
      displayName: def.name,
      grantedBy: awardedBy,
    });
  }

  log.info("badge.awarded", { userId, badgeId, source });
  return badge;
}

// ===========================================================================
// System 7 — Player Titles
// ===========================================================================

export const TITLE_CATALOG: TitleDefinition[] = [
  { id: "title_quiz_master", name: "Quiz Master", description: "For Classic Quiz scholars", category: "career", rarity: "epic", requirement: "Answer 500 Classic Quiz questions correctly", equipable: true },
  { id: "title_treasure_hunter", name: "Treasure Hunter", description: "For Treasure Heist masters", category: "career", rarity: "epic", requirement: "Successfully steal 100 times", equipable: true },
  { id: "title_empire_founder", name: "Empire Founder", description: "For Empire Builder emperors", category: "career", rarity: "legendary", requirement: "Reach Empire level (5)", equipable: true },
  { id: "title_champion", name: "Champion", description: "For tournament champions", category: "competitive", rarity: "epic", requirement: "Win a tournament", equipable: true },
  { id: "title_grandmaster", name: "Grandmaster", description: "For Battle Royale legends", category: "competitive", rarity: "mythic", requirement: "Win 5 Battle Royale tournaments", equipable: true },
  { id: "title_legend", name: "Legend", description: "For all-time greats", category: "career", rarity: "mythic", requirement: "Win 10 tournaments or 1000 matches", equipable: true },
  { id: "title_scholar", name: "Scholar", description: "For dedicated learners", category: "career", rarity: "rare", requirement: "Answer 1000 questions correctly", equipable: true },
  { id: "title_strategist", name: "Strategist", description: "For versatile players", category: "career", rarity: "rare", requirement: "Win in all 5 game modes", equipable: true },
  { id: "title_teacher", name: "Teacher", description: "For dedicated educators", category: "career", rarity: "legendary", requirement: "Host 100 teaching sessions", equipable: true },
  { id: "title_founder", name: "Founding Member", description: "For founding members", category: "special", rarity: "legendary", requirement: "Be a founding member of EduBek", equipable: true },
];

export function initializeTitles(): void {
  for (const t of TITLE_CATALOG) {
    titleDefs.set(t.id, t);
  }
}

export function getTitle(id: string): TitleDefinition | null {
  return titleDefs.get(id) ?? null;
}

export function listTitles(): TitleDefinition[] {
  return Array.from(titleDefs.values());
}

export function getPlayerTitles(userId: string): PlayerTitle[] {
  return playerTitles.get(userId) ?? [];
}

export function awardTitle(userId: string, titleId: string): PlayerTitle | null {
  const def = titleDefs.get(titleId);
  if (!def) return null;
  const existing = playerTitles.get(userId) ?? [];
  if (existing.some(t => t.titleId === titleId)) return null;
  const title: PlayerTitle = {
    titleId,
    userId,
    unlockedAt: new Date().toISOString(),
    equipped: false,
  };
  existing.push(title);
  playerTitles.set(userId, existing);
  log.info("title.awarded", { userId, titleId });
  return title;
}

export function equipTitle(userId: string, titleId: string): boolean {
  const titles = playerTitles.get(userId);
  if (!titles) return false;
  const hasTitle = titles.some(t => t.titleId === titleId);
  if (!hasTitle) return false;
  // Unequip all others
  for (const t of titles) t.equipped = t.titleId === titleId;
  return true;
}

// ===========================================================================
// System 8 — Avatar & Identity
// ===========================================================================

export const COSMETIC_CATALOG: CosmeticItem[] = [
  { id: "frame_default", kind: "frame", name: "Default Frame", rarity: "common", unlockRequirement: "Available to all" },
  { id: "frame_beta", kind: "frame", name: "Beta Frame", rarity: "epic", unlockRequirement: "Beta Tester badge" },
  { id: "frame_founding", kind: "frame", name: "Founding Frame", rarity: "legendary", unlockRequirement: "Founding Scholar badge" },
  { id: "frame_champion", kind: "frame", name: "Champion Frame", rarity: "legendary", unlockRequirement: "Season Champion badge" },
  { id: "frame_winner", kind: "frame", name: "Winner Frame", rarity: "epic", unlockRequirement: "Competition Winner badge" },
  { id: "border_default", kind: "border", name: "Default Border", rarity: "common", unlockRequirement: "Available to all" },
  { id: "border_gold", kind: "border", name: "Gold Border", rarity: "rare", unlockRequirement: "Reach level 50" },
  { id: "border_diamond", kind: "border", name: "Diamond Border", rarity: "legendary", unlockRequirement: "Reach level 100" },
  { id: "banner_default", kind: "banner", name: "Default Banner", rarity: "common", unlockRequirement: "Available to all" },
  { id: "banner_sunset", kind: "banner", name: "Sunset Banner", rarity: "rare", unlockRequirement: "Reach level 25" },
  { id: "banner_cosmic", kind: "banner", name: "Cosmic Banner", rarity: "epic", unlockRequirement: "Reach level 75" },
];

export function initializeCosmetics(): void {
  for (const c of COSMETIC_CATALOG) {
    cosmeticItems.set(c.id, c);
  }
}

export function getCosmetic(id: string): CosmeticItem | null {
  return cosmeticItems.get(id) ?? null;
}

export function listCosmetics(kind?: CosmeticItem["kind"]): CosmeticItem[] {
  const all = Array.from(cosmeticItems.values());
  return kind ? all.filter(c => c.kind === kind) : all;
}

export function getAvatarCustomization(userId: string): AvatarCustomization {
  let cust = avatarCustomizations.get(userId);
  if (!cust) {
    cust = {
      userId, avatarUrl: null, bannerUrl: null, frameId: "frame_default", borderId: "border_default",
      colorScheme: null, unlockedFrames: ["frame_default"], unlockedBorders: ["border_default"], unlockedBanners: ["banner_default"],
    };
    avatarCustomizations.set(userId, cust);
  }
  return cust;
}

export function unlockCosmetic(userId: string, cosmeticId: string): boolean {
  const item = cosmeticItems.get(cosmeticId);
  if (!item) return false;
  const cust = getAvatarCustomization(userId);
  switch (item.kind) {
    case "frame":
      if (!cust.unlockedFrames.includes(cosmeticId)) cust.unlockedFrames.push(cosmeticId);
      break;
    case "border":
      if (!cust.unlockedBorders.includes(cosmeticId)) cust.unlockedBorders.push(cosmeticId);
      break;
    case "banner":
      if (!cust.unlockedBanners.includes(cosmeticId)) cust.unlockedBanners.push(cosmeticId);
      break;
    case "avatar":
    case "color_scheme":
      // No unlock list for these
      break;
  }
  return true;
}

export function equipCosmetic(userId: string, kind: CosmeticItem["kind"], cosmeticId: string): boolean {
  const cust = getAvatarCustomization(userId);
  switch (kind) {
    case "frame":
      if (!cust.unlockedFrames.includes(cosmeticId)) return false;
      cust.frameId = cosmeticId;
      return true;
    case "border":
      if (!cust.unlockedBorders.includes(cosmeticId)) return false;
      cust.borderId = cosmeticId;
      return true;
    case "banner":
      if (!cust.unlockedBanners.includes(cosmeticId)) return false;
      cust.bannerUrl = cosmeticId;
      return true;
    case "avatar":
      cust.avatarUrl = cosmeticId;
      return true;
    case "color_scheme":
      cust.colorScheme = cosmeticId;
      return true;
    default:
      return false;
  }
}

// ===========================================================================
// System 12 — Daily Missions
// ===========================================================================

export const MISSION_CATALOG: MissionDefinition[] = [
  { id: "daily_50_questions", name: "Daily Scholar", description: "Answer 50 questions", frequency: "daily", xpReward: 50, target: 50, metric: "questions_answered", gameMode: null, assignedBy: null, repeatable: true },
  { id: "daily_3_wins", name: "Daily Winner", description: "Win 3 matches", frequency: "daily", xpReward: 75, target: 3, metric: "wins", gameMode: null, assignedBy: null, repeatable: true },
  { id: "daily_streak", name: "Streak Keeper", description: "Maintain your streak", frequency: "daily", xpReward: 50, target: 1, metric: "streak_maintained", gameMode: null, assignedBy: null, repeatable: true },
  { id: "daily_2_modes", name: "Versatile", description: "Play 2 different game modes", frequency: "daily", xpReward: 60, target: 2, metric: "modes_played", gameMode: null, assignedBy: null, repeatable: true },
  { id: "weekly_10_wins", name: "Weekly Champion", description: "Win 10 matches this week", frequency: "weekly", xpReward: 200, target: 10, metric: "wins", gameMode: null, assignedBy: null, repeatable: true },
  { id: "weekly_5_modes", name: "Mode Explorer", description: "Play 5 different game modes this week", frequency: "weekly", xpReward: 150, target: 5, metric: "modes_played", gameMode: null, assignedBy: null, repeatable: true },
];

export function initializeMissions(): void {
  for (const m of MISSION_CATALOG) {
    missionDefs.set(m.id, m);
  }
}

export function getMission(id: string): MissionDefinition | null {
  return missionDefs.get(id) ?? null;
}

export function listMissions(frequency?: MissionFrequency): MissionDefinition[] {
  const all = Array.from(missionDefs.values());
  return frequency ? all.filter(m => m.frequency === frequency) : all;
}

export function getPlayerMissions(userId: string): PlayerMission[] {
  return playerMissions.get(userId) ?? [];
}

export function assignMission(userId: string, missionId: string, assignedBy: string | null = null, expiresInHours = 24): PlayerMission | null {
  const def = missionDefs.get(missionId);
  if (!def) return null;
  const list = playerMissions.get(userId) ?? [];
  // Don't assign duplicate active missions
  if (list.some(m => m.missionId === missionId && !m.completed)) return null;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);
  const mission: PlayerMission = {
    missionId,
    userId,
    progress: 0,
    target: def.target,
    completed: false,
    completedAt: null,
    claimedAt: null,
    assignedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  list.push(mission);
  playerMissions.set(userId, list);
  return mission;
}

export function updateMissionProgress(userId: string, metric: string, value: number): PlayerMission[] {
  const list = playerMissions.get(userId) ?? [];
  const updated: PlayerMission[] = [];
  for (const m of list) {
    if (m.completed) continue;
    const def = missionDefs.get(m.missionId);
    if (!def || def.metric !== metric) continue;
    m.progress = Math.min(m.target, m.progress + value);
    if (m.progress >= m.target) {
      m.completed = true;
      m.completedAt = new Date().toISOString();
      // Award XP
      awardXP({
        userId,
        source: def.frequency === "daily" ? "daily_mission" : "weekly_mission",
        amount: def.xpReward,
        metadata: { missionId: m.missionId },
      });
    }
    updated.push(m);
  }
  return updated;
}

export function claimMissionReward(userId: string, missionId: string): boolean {
  const list = playerMissions.get(userId);
  if (!list) return false;
  const mission = list.find(m => m.missionId === missionId);
  if (!mission || !mission.completed || mission.claimedAt) return false;
  mission.claimedAt = new Date().toISOString();
  return true;
}

// ===========================================================================
// System 13 — Weekly Challenges
// ===========================================================================

export const CHALLENGE_CATALOG: ChallengeDefinition[] = [
  { id: "weekly_global_top_10", name: "Global Top 10", description: "Reach top 10 in weekly XP", scope: "global", frequency: "weekly", xpReward: 300, target: 10, metric: "weekly_xp_rank", startDate: "", endDate: "", leaderboardId: "weekly_global" },
  { id: "weekly_classroom_champion", name: "Classroom Champion", description: "Top your classroom this week", scope: "classroom", frequency: "weekly", xpReward: 200, target: 1, metric: "classroom_weekly_rank", startDate: "", endDate: "", leaderboardId: "weekly_classroom" },
  { id: "weekly_org_leader", name: "Organization Leader", description: "Lead your organization this week", scope: "organization", frequency: "weekly", xpReward: 250, target: 1, metric: "org_weekly_rank", startDate: "", endDate: "", leaderboardId: "weekly_org" },
];

export function initializeChallenges(): void {
  for (const c of CHALLENGE_CATALOG) {
    challengeDefs.set(c.id, c);
  }
}

export function getChallenge(id: string): ChallengeDefinition | null {
  return challengeDefs.get(id) ?? null;
}

export function listChallenges(scope?: ChallengeScope): ChallengeDefinition[] {
  const all = Array.from(challengeDefs.values());
  return scope ? all.filter(c => c.scope === scope) : all;
}

export function getPlayerChallenges(userId: string): PlayerChallenge[] {
  return playerChallenges.get(userId) ?? [];
}

export function enrollInChallenge(userId: string, challengeId: string): PlayerChallenge | null {
  const def = challengeDefs.get(challengeId);
  if (!def) return null;
  const list = playerChallenges.get(userId) ?? [];
  if (list.some(c => c.challengeId === challengeId)) return null;
  const challenge: PlayerChallenge = {
    challengeId,
    userId,
    progress: 0,
    target: def.target,
    completed: false,
    completedAt: null,
    rank: null,
  };
  list.push(challenge);
  playerChallenges.set(userId, list);
  return challenge;
}

export function updateChallengeProgress(userId: string, challengeId: string, progress: number, rank?: number): PlayerChallenge | null {
  const list = playerChallenges.get(userId);
  if (!list) return null;
  const challenge = list.find(c => c.challengeId === challengeId);
  if (!challenge || challenge.completed) return null;
  challenge.progress = Math.min(challenge.target, progress);
  if (rank !== undefined) challenge.rank = rank;
  if (challenge.progress >= challenge.target) {
    challenge.completed = true;
    challenge.completedAt = new Date().toISOString();
    const def = challengeDefs.get(challengeId);
    if (def) {
      awardXP({
        userId,
        source: "weekly_mission",
        amount: def.xpReward,
        metadata: { challengeId },
      });
    }
  }
  return challenge;
}

// ===========================================================================
// System 14 — Monthly Challenges
// ===========================================================================

export const MONTHLY_CHALLENGE_CATALOG: MonthlyChallengeDefinition[] = [
  {
    id: "monthly_xp_5000", name: "Monthly Grinder", description: "Earn 5000 XP this month",
    scope: "global", frequency: "monthly", xpReward: 1000, target: 5000, metric: "monthly_xp",
    startDate: "", endDate: "", leaderboardId: "monthly_global",
    tiers: [
      { rank: 1, reward: "mythic_frame" },
      { rank: 2, reward: "legendary_frame" },
      { rank: 3, reward: "epic_frame" },
      { rank: 10, reward: "rare_frame" },
      { rank: 100, reward: "common_frame" },
    ],
    leaderboardIntegration: true,
  },
  {
    id: "monthly_achievements_10", name: "Achievement Hunter", description: "Unlock 10 achievements this month",
    scope: "global", frequency: "monthly", xpReward: 800, target: 10, metric: "monthly_achievements",
    startDate: "", endDate: "", leaderboardId: "monthly_achievements",
    tiers: [
      { rank: 1, reward: "title_achievement_master" },
      { rank: 3, reward: "badge_achievement_hunter" },
    ],
    leaderboardIntegration: true,
  },
];

export function listMonthlyChallenges(): MonthlyChallengeDefinition[] {
  return MONTHLY_CHALLENGE_CATALOG;
}

// ===========================================================================
// System 15 — Event Challenges
// ===========================================================================

export function createEventChallenge(input: {
  name: string;
  description: string;
  kind: EventKind;
  startDate: string;
  endDate: string;
  xpReward: number;
  badgeId?: string | null;
  missions: string[];
}): EventChallenge {
  const id = randomUUID();
  const event: EventChallenge = {
    id,
    name: input.name,
    description: input.description,
    kind: input.kind,
    startDate: input.startDate,
    endDate: input.endDate,
    xpReward: input.xpReward,
    badgeId: input.badgeId ?? null,
    missions: input.missions,
    active: new Date() >= new Date(input.startDate) && new Date() <= new Date(input.endDate),
  };
  eventChallenges.set(id, event);
  log.info("event_challenge.created", { id, name: input.name, kind: input.kind });
  return event;
}

export function getEventChallenge(id: string): EventChallenge | null {
  return eventChallenges.get(id) ?? null;
}

export function listEventChallenges(activeOnly = false): EventChallenge[] {
  const all = Array.from(eventChallenges.values());
  return activeOnly ? all.filter(e => e.active) : all;
}

export function _resetAchievementsForTesting(): void {
  achievementDefs.clear();
  playerAchievements.clear();
  badgeDefs.clear();
  playerBadges.clear();
  titleDefs.clear();
  playerTitles.clear();
  avatarCustomizations.clear();
  cosmeticItems.clear();
  missionDefs.clear();
  playerMissions.clear();
  challengeDefs.clear();
  playerChallenges.clear();
  eventChallenges.clear();
}
