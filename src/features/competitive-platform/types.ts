/**
 * EduBek — Competitive Ranking, Matchmaking, Leagues & Tournament Ecosystem types.
 * Phase 6G.8: Production-grade competitive orchestration layer.
 *
 * Architecture (event-driven, fully decoupled):
 *
 *                    Universal Game Engine
 *                             │
 *                      Engine Event Bus
 *                             │
 *       ┌──────────────┬──────────────┬──────────────┬──────────────┐
 *       │              │              │              │
 *       ▼              ▼              ▼              ▼
 *  Player          Competitive    Analytics     Hall of Fame
 *  Progression     Platform
 *
 *   This module is the SINGLE COMPETITIVE LAYER for every current and future
 *   game mode. It manages rankings, matchmaking, ratings, queues, divisions,
 *   leagues, tournaments, championships, seasonal competition, and educational
 *   esports.
 *
 *   It NEVER owns gameplay mechanics.
 *   It NEVER modifies the Universal Game Engine.
 *   It NEVER duplicates Battle Royale tournament logic — it delegates.
 *
 *   Game modes remain responsible only for gameplay.
 *   This platform manages only competitive progression.
 *
 *   Every actual match is delegated to the Universal Game Engine.
 *
 * Ownership boundaries (strict):
 *   - Competitive Platform owns: rating, division, league, matchmaking,
 *     queue, tournament (competitive-side), championship, fair play,
 *     leaderboard, season (competitive-side), olympiad, hall of fame.
 *   - Competitive Platform NEVER owns: XP, level, achievements, badges,
 *     titles, milestones, career stats, missions, rewards (progression-side).
 *   - Competitive Platform NEVER imports from player-progression.
 *   - Competitive Platform NEVER calls awardXP / grantReward / updateLevel /
 *     unlockAchievement or any progression API.
 *
 * Integration:
 *   - This platform subscribes to engine events via event-bus-bridge.ts.
 *   - All competitive mutations are triggered by engine events.
 *   - No direct service-to-service calls.
 *   - No circular dependencies.
 */

// ===========================================================================
// System 1 — Competitive Profile
// ===========================================================================

export type GameModeId = "classic_quiz" | "treasure_heist" | "empire_builder" | "quiz_royale" | "battle_royale";

export interface CompetitiveProfile {
  userId: string;
  displayName: string;
  currentRating: number;
  peakRating: number;
  seasonRating: number;
  preferredModes: GameModeId[];
  divisions: Record<GameModeId, string | null>;
  leagues: string[];
  championships: string[];
  placements: PlacementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementStatus {
  completed: boolean;
  matchesPlayed: number;
  matchesRequired: number;
  initialRating: number | null;
  finalRating: number | null;
  placedAt: string | null;
}

// ===========================================================================
// System 2 — Rating Engine
// ===========================================================================

export type RatingAlgorithm = "elo" | "glicko" | "glicko2" | "custom";

export interface RatingConfig {
  algorithm: RatingAlgorithm;
  initialRating: number;
  /** K-factor for Elo. */
  kFactor: number;
  /** Glicko RD (rating deviation) initial. */
  initialRD: number;
  /** Glicko volatility. */
  initialVolatility: number;
  /** Per-game-mode algorithm overrides. */
  perModeOverrides: Partial<Record<GameModeId, Partial<RatingConfig>>>;
}

export interface RatingRecord {
  userId: string;
  gameMode: GameModeId;
  rating: number;
  rd: number;
  volatility: number;
  peakRating: number;
  matchesPlayed: number;
  lastMatchAt: string | null;
}

export interface RatingChange {
  userId: string;
  beforeRating: number;
  afterRating: number;
  delta: number;
  opponentRating: number;
  result: "win" | "loss" | "draw";
  gameMode: GameModeId;
  timestamp: string;
}

// ===========================================================================
// System 3 — Placement Matches
// ===========================================================================

export type PlacementKind = "first_season" | "recalibration" | "inactivity" | "seasonal";

export interface PlacementConfig {
  matchesRequired: number;
  initialRating: number;
  ratingWindow: number;
  inactivityThresholdDays: number;
  seasonalRecalibration: boolean;
}

export interface PlacementMatch {
  id: string;
  userId: string;
  kind: PlacementKind;
  matchNumber: number;
  result: "win" | "loss" | "draw";
  ratingBefore: number;
  ratingAfter: number;
  timestamp: string;
}

// ===========================================================================
// System 4 — Matchmaking Engine
// ===========================================================================

export interface MatchmakingCriteria {
  ratingWindow: number;
  regionMatch: boolean;
  organizationMatch: boolean;
  schoolMatch: boolean;
  maxLatencyMs: number;
  preferredLanguage: string | null;
  gameMode: GameModeId;
  partySize: number;
  tournamentId: string | null;
  privateQueue: boolean;
  /** Maximum seconds to wait before widening the search. */
  wideningIntervalSec: number;
  /** Maximum widening multiplier. */
  maxWideningMultiplier: number;
}

export interface MatchmakingTicket {
  id: string;
  userId: string;
  gameMode: GameModeId;
  queueType: QueueType;
  criteria: MatchmakingCriteria;
  enteredAt: string;
  status: "searching" | "matched" | "expired" | "cancelled";
  matchId: string | null;
  /** Number of times the search window has been widened. */
  wideningCount: number;
}

export interface MatchmakingResult {
  ticketIds: string[];
  matchId: string;
  quality: number;
  averageRating: number;
  ratingSpread: number;
  createdAt: string;
}

// ===========================================================================
// System 5 — Queue Management
// ===========================================================================

export type QueueType =
  | "solo"
  | "party"
  | "classroom"
  | "organization"
  | "custom"
  | "ranked"
  | "casual"
  | "tournament"
  | "practice"
  | "private";

export interface QueueConfig {
  type: QueueType;
  maxSize: number;
  minSize: number;
  priority: number;
  ratingRestricted: boolean;
  organizationRestricted: boolean;
  spectatorAllowed: boolean;
  estimatedWaitSec: number;
}

export interface QueueEntry {
  id: string;
  queueType: QueueType;
  userId: string;
  partyMembers: string[];
  rating: number;
  enteredAt: string;
  priority: number;
}

// ===========================================================================
// System 6 — Ranked System
// ===========================================================================

export type RankedMode = "ranked" | "casual" | "practice" | "private";

export interface RankedConfig {
  mode: RankedMode;
  ratingAdjustment: number;
  placementRequired: boolean;
  rewardsEnabled: boolean;
  /** Minimum matches to qualify for season rewards. */
  minMatchesForRewards: number;
}

// ===========================================================================
// System 7 — Divisions
// ===========================================================================

export type DivisionTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "grandmaster"
  | "legend";

export interface DivisionDefinition {
  id: string;
  name: string;
  tier: DivisionTier;
  minRating: number;
  maxRating: number;
  iconUrl: string | null;
  /** Rewards granted on reaching this division. */
  rewards: string[];
}

// ===========================================================================
// System 8 — League Engine
// ===========================================================================

export type LeagueType =
  | "school"
  | "organization"
  | "regional"
  | "national"
  | "international"
  | "private"
  | "academic";

export interface League {
  id: string;
  name: string;
  type: LeagueType;
  organizationId: string | null;
  region: string | null;
  startDate: string;
  endDate: string;
  participants: number;
  status: "upcoming" | "active" | "ended";
  standings: LeagueStanding[];
}

export interface LeagueStanding {
  userId: string;
  displayName: string;
  rank: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

// ===========================================================================
// System 9 — Seasonal Ranked Platform
// ===========================================================================

export type SeasonStatus = "upcoming" | "active" | "ended";

export interface CompetitiveSeason {
  id: string;
  name: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  xpMultiplier: number;
  rewards: SeasonReward[];
  /** Whether ratings reset at season start. */
  resetsRatings: boolean;
  /** Soft reset factor (0 = full reset, 1 = no reset). */
  softResetFactor: number;
}

export interface SeasonReward {
  id: string;
  tier: string;
  requiredRating: number;
  rewards: string[];
  claimed: boolean;
}

export interface SeasonHistory {
  seasonId: string;
  seasonNumber: number;
  finalRating: number;
  finalRank: number | null;
  division: string | null;
  rewardsClaimed: string[];
}

// ===========================================================================
// System 10 — Promotion / Relegation
// ===========================================================================

export type PromotionStatus =
  | "stable"
  | "promotion_series"
  | "promoted"
  | "demotion_warning"
  | "demoted"
  | "grace_period";

export interface PromotionState {
  userId: string;
  gameMode: GameModeId;
  currentDivision: string;
  status: PromotionStatus;
  promotionWins: number;
  promotionLosses: number;
  promotionTarget: number;
  gracePeriodEnds: string | null;
  history: PromotionEvent[];
}

export interface PromotionEvent {
  id: string;
  userId: string;
  kind: "promotion" | "demotion" | "series_started" | "series_won" | "series_lost" | "grace_started" | "grace_ended";
  fromDivision: string;
  toDivision: string;
  timestamp: string;
}

// ===========================================================================
// System 11 — Leaderboard Platform
// ===========================================================================

export type LeaderboardView =
  | "global"
  | "country"
  | "region"
  | "organization"
  | "school"
  | "teacher"
  | "classroom"
  | "friends"
  | "mode_specific"
  | "seasonal"
  | "lifetime";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  rating: number;
  division: string | null;
  wins: number;
  losses: number;
  winRate: number;
  trend: "up" | "down" | "stable";
  trendDelta: number;
}

export interface Leaderboard {
  view: LeaderboardView;
  scope: string | null;
  gameMode: GameModeId | null;
  seasonId: string | null;
  entries: LeaderboardEntry[];
  updatedAt: string;
}

// ===========================================================================
// System 12 — Tournament Manager
// ===========================================================================

export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "swiss"
  | "round_robin"
  | "league"
  | "group_stage"
  | "hybrid"
  | "battle_royale";

export type TournamentStatus =
  | "draft"
  | "registration"
  | "seeding"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export interface CompetitiveTournament {
  id: string;
  name: string;
  format: TournamentFormat;
  gameMode: GameModeId;
  status: TournamentStatus;
  hostId: string;
  organizationId: string | null;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  registeredParticipants: string[];
  championId: string | null;
  runnerUpId: string | null;
  /** For battle_royale format: links to the Battle Royale module's tournament. */
  battleRoyaleTournamentId: string | null;
  createdAt: string;
}

// ===========================================================================
// System 13 — Championship Platform
// ===========================================================================

export type ChampionshipLevel =
  | "school"
  | "district"
  | "regional"
  | "national"
  | "international"
  | "organization";

export interface Championship {
  id: string;
  name: string;
  level: ChampionshipLevel;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
  status: "upcoming" | "registration" | "in_progress" | "completed";
  participants: number;
  champion: string | null;
  runnerUp: string | null;
  organizerId: string;
  rewards: string[];
  qualificationTournamentIds: string[];
}

// ===========================================================================
// System 14 — Tournament Scheduler
// ===========================================================================

export type SchedulerPhase =
  | "registration"
  | "qualification"
  | "seeding"
  | "start"
  | "pause"
  | "resume"
  | "finals"
  | "awards";

export interface SchedulerEvent {
  id: string;
  tournamentId: string;
  phase: SchedulerPhase;
  scheduledAt: string;
  executedAt: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 15 — Seeding Engine
// ===========================================================================

export type SeedingStrategy =
  | "random"
  | "rating"
  | "organization"
  | "previous_champions"
  | "manual"
  | "balanced"
  | "snake";

export interface SeedingInput {
  userId: string;
  displayName: string;
  rating: number;
  organizationId: string | null;
  previousChampion: boolean;
  manualSeed: number | null;
}

export interface SeedingResult {
  userId: string;
  displayName: string;
  seed: number;
  strategy: SeedingStrategy;
}

// ===========================================================================
// System 16 — Spectator Ranking Dashboard
// ===========================================================================

export interface SpectatorDashboard {
  tournamentId: string | null;
  liveStandings: LeaderboardEntry[];
  brackets: unknown | null;
  leaderboards: Leaderboard[];
  ratings: Array<{ userId: string; displayName: string; rating: number; trend: number }>;
  liveStatistics: LiveStatistics;
}

export interface LiveStatistics {
  activeTournaments: number;
  activePlayers: number;
  matchesInProgress: number;
  totalSpectators: number;
  avgMatchQuality: number;
}

// ===========================================================================
// System 17 — Competitive Rewards
// ===========================================================================

export type CompetitiveRewardKind =
  | "title"
  | "badge"
  | "frame"
  | "certificate"
  | "season_reward"
  | "cosmetic";

export interface CompetitiveReward {
  id: string;
  userId: string;
  kind: CompetitiveRewardKind;
  rewardId: string;
  displayName: string;
  grantedAt: string;
  grantedBy: string | null;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 18 — Fair Play Engine
// ===========================================================================

export type FairPlayViolationKind =
  | "disconnect_abuse"
  | "intentional_forfeit"
  | "queue_dodging"
  | "afk"
  | "smurf_suspicion"
  | "rating_manipulation"
  | "collusion";

export type FairPlaySeverity = "low" | "medium" | "high" | "critical";

export interface FairPlayFinding {
  id: string;
  userId: string;
  kind: FairPlayViolationKind;
  severity: FairPlaySeverity;
  description: string;
  evidence: string;
  detectedAt: string;
  /** The Fair Play Engine NEVER auto-bans — only produces findings. */
  reviewed: boolean;
  reviewedBy: string | null;
  reviewNote: string | null;
}

// ===========================================================================
// System 19 — Competitive Analytics
// ===========================================================================

export interface CompetitiveAnalytics {
  ratingInflation: number;
  avgQueueTimeSec: number;
  matchQuality: number;
  fairnessScore: number;
  balanceScore: number;
  seasonParticipation: number;
  dropRate: number;
  regionalActivity: Record<string, number>;
  queueDistribution: Record<QueueType, number>;
  divisionDistribution: Record<DivisionTier, number>;
}

// ===========================================================================
// System 20 — Organization Competition
// ===========================================================================

export type OrganizationCompetitionType =
  | "school_vs_school"
  | "class_vs_class"
  | "university_vs_university"
  | "district_competition"
  | "organization_championship";

export interface OrganizationCompetition {
  id: string;
  name: string;
  type: OrganizationCompetitionType;
  organizationAId: string;
  organizationBId: string;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
  status: "upcoming" | "in_progress" | "completed";
  winnerOrganizationId: string | null;
  scoreA: number;
  scoreB: number;
}

// ===========================================================================
// System 21 — Educational Olympiad Platform
// ===========================================================================

export type OlympiadKind =
  | "math"
  | "science"
  | "language"
  | "custom"
  | "national_exam"
  | "academic_challenge";

export interface Olympiad {
  id: string;
  name: string;
  kind: OlympiadKind;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: "upcoming" | "registration" | "in_progress" | "completed";
  participants: number;
  maxParticipants: number;
  champion: string | null;
  subject: string;
  grade: string | null;
  rewards: string[];
}

// ===========================================================================
// System 22 — Hall of Fame
// ===========================================================================

export type HallOfFameCategory =
  | "season_champion"
  | "tournament_winner"
  | "top_player"
  | "top_school"
  | "top_organization"
  | "historical_record";

export interface HallOfFameEntry {
  id: string;
  category: HallOfFameCategory;
  userId: string | null;
  organizationId: string | null;
  displayName: string;
  achievement: string;
  date: string;
  metadata: Record<string, unknown>;
}

// ===========================================================================
// System 23 — Competitive Dashboard
// ===========================================================================

export interface CompetitiveDashboard {
  userId: string | null;
  audience: "player" | "teacher" | "organization" | "platform";
  queues: Array<{ type: QueueType; activeEntries: number; avgWaitSec: number }>;
  ratings: Record<GameModeId, RatingRecord | null>;
  divisions: Record<GameModeId, string | null>;
  leagues: League[];
  activeTournaments: CompetitiveTournament[];
  championships: Championship[];
  seasonProgress: { seasonId: string; progressPct: number; daysRemaining: number } | null;
  leaderboards: Leaderboard[];
  alerts: CompetitiveAlert[];
}

export interface CompetitiveAlert {
  id: string;
  kind: "promotion_eligible" | "demotion_warning" | "season_ending" | "tournament_starting" | "placement_incomplete";
  severity: "info" | "warning" | "critical";
  message: string;
  userId: string | null;
}

// ===========================================================================
// System 24 — Ranking Administration
// ===========================================================================

export type AdminAction =
  | "manual_review"
  | "appeal_review"
  | "rating_adjustment"
  | "season_config"
  | "league_config"
  | "tournament_approval";

export interface AdminActionRecord {
  id: string;
  adminId: string;
  action: AdminAction;
  targetUserId: string | null;
  targetTournamentId: string | null;
  description: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  timestamp: string;
  audited: boolean;
}

export interface AppealRecord {
  id: string;
  userId: string;
  findingId: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}
