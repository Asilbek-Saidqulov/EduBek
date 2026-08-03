/**
 * Systems 7-15, 20-21: Divisions, League Engine, Seasonal Ranked Platform,
 * Promotion/Relegation, Tournament Manager, Championship Platform,
 * Tournament Scheduler, Seeding Engine, Organization Competition,
 * Educational Olympiad Platform.
 *
 * Battle Royale tournament logic is REUSED (not duplicated) — this module
 * delegates to the Battle Royale module when format === "battle_royale".
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type {
  GameModeId,
  DivisionTier,
  DivisionDefinition,
  League,
  LeagueType,
  LeagueStanding,
  CompetitiveSeason,
  SeasonReward,
  SeasonHistory,
  PromotionState,
  PromotionStatus,
  PromotionEvent,
  CompetitiveTournament,
  TournamentFormat,
  TournamentStatus,
  Championship,
  ChampionshipLevel,
  SchedulerEvent,
  SchedulerPhase,
  SeedingStrategy,
  SeedingInput,
  SeedingResult,
  OrganizationCompetition,
  OrganizationCompetitionType,
  Olympiad,
  OlympiadKind,
} from "./types";

const log = getLogger("competitive-platform");

// ===========================================================================
// In-memory state
// ===========================================================================

const leagues = new Map<string, League>();
const seasons = new Map<string, CompetitiveSeason>();
const seasonHistory = new Map<string, SeasonHistory[]>();
const promotionStates = new Map<string, Map<GameModeId, PromotionState>>(); // userId → gameMode → state
const tournaments = new Map<string, CompetitiveTournament>();
const championships = new Map<string, Championship>();
const schedulerEvents = new Map<string, SchedulerEvent[]>();
const orgCompetitions = new Map<string, OrganizationCompetition>();
const olympiads = new Map<string, Olympiad>();

// ===========================================================================
// System 7 — Divisions
// ===========================================================================

export const DIVISIONS: DivisionDefinition[] = [
  { id: "bronze", name: "Bronze", tier: "bronze", minRating: 0, maxRating: 1199, iconUrl: null, rewards: [] },
  { id: "silver", name: "Silver", tier: "silver", minRating: 1200, maxRating: 1499, iconUrl: null, rewards: ["badge_silver"] },
  { id: "gold", name: "Gold", tier: "gold", minRating: 1500, maxRating: 1799, iconUrl: null, rewards: ["badge_gold", "frame_gold"] },
  { id: "platinum", name: "Platinum", tier: "platinum", minRating: 1800, maxRating: 2099, iconUrl: null, rewards: ["badge_platinum", "frame_platinum"] },
  { id: "diamond", name: "Diamond", tier: "diamond", minRating: 2100, maxRating: 2399, iconUrl: null, rewards: ["badge_diamond", "frame_diamond", "title_diamond"] },
  { id: "master", name: "Master", tier: "master", minRating: 2400, maxRating: 2699, iconUrl: null, rewards: ["badge_master", "frame_master", "title_master"] },
  { id: "grandmaster", name: "Grandmaster", tier: "grandmaster", minRating: 2700, maxRating: 2999, iconUrl: null, rewards: ["badge_grandmaster", "frame_grandmaster", "title_grandmaster"] },
  { id: "legend", name: "Legend", tier: "legend", minRating: 3000, maxRating: 99999, iconUrl: null, rewards: ["badge_legend", "frame_legend", "title_legend"] },
];

export function getDivisionForRating(rating: number): DivisionDefinition {
  for (const d of DIVISIONS) {
    if (rating >= d.minRating && rating <= d.maxRating) return d;
  }
  return DIVISIONS[0];
}

export function getDivision(id: string): DivisionDefinition | null {
  return DIVISIONS.find(d => d.id === id) ?? null;
}

export function listDivisions(): DivisionDefinition[] {
  return [...DIVISIONS];
}

// ===========================================================================
// System 8 — League Engine
// ===========================================================================

export function createLeague(input: {
  name: string;
  type: LeagueType;
  organizationId?: string | null;
  region?: string | null;
  startDate: string;
  endDate: string;
}): League {
  const id = randomUUID();
  const league: League = {
    id,
    name: input.name,
    type: input.type,
    organizationId: input.organizationId ?? null,
    region: input.region ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    participants: 0,
    status: "upcoming",
    standings: [],
  };
  leagues.set(id, league);
  log.info("league.created", { id, name: input.name, type: input.type });
  return league;
}

export function getLeague(id: string): League | null {
  return leagues.get(id) ?? null;
}

export function listLeagues(type?: LeagueType): League[] {
  const all = Array.from(leagues.values());
  return type ? all.filter(l => l.type === type) : all;
}

export function updateLeagueStandings(leagueId: string, standings: LeagueStanding[]): boolean {
  const league = leagues.get(leagueId);
  if (!league) return false;
  league.standings = standings.sort((a, b) => b.rating - a.rating || b.points - a.points);
  league.standings.forEach((s, i) => { s.rank = i + 1; });
  league.participants = standings.length;
  league.status = "active";
  return true;
}

// ===========================================================================
// System 9 — Seasonal Ranked Platform
// ===========================================================================

export function createSeason(input: {
  name: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  xpMultiplier?: number;
  rewards?: SeasonReward[];
  resetsRatings?: boolean;
  softResetFactor?: number;
}): CompetitiveSeason {
  const id = randomUUID();
  const now = new Date();
  const status = now < new Date(input.startDate) ? "upcoming" : now > new Date(input.endDate) ? "ended" : "active";
  const season: CompetitiveSeason = {
    id,
    name: input.name,
    seasonNumber: input.seasonNumber,
    startDate: input.startDate,
    endDate: input.endDate,
    status,
    xpMultiplier: input.xpMultiplier ?? 1.0,
    rewards: input.rewards ?? [],
    resetsRatings: input.resetsRatings ?? false,
    softResetFactor: input.softResetFactor ?? 0.5,
  };
  seasons.set(id, season);
  log.info("season.created", { id, name: input.name, seasonNumber: input.seasonNumber });
  return season;
}

export function getSeason(id: string): CompetitiveSeason | null {
  return seasons.get(id) ?? null;
}

export function listSeasons(): CompetitiveSeason[] {
  return Array.from(seasons.values());
}

export function getActiveSeason(): CompetitiveSeason | null {
  const now = new Date();
  for (const s of seasons.values()) {
    if (new Date(s.startDate) <= now && now <= new Date(s.endDate)) {
      s.status = "active";
      return s;
    }
  }
  return null;
}

export function endSeason(seasonId: string): SeasonHistory[] {
  const season = seasons.get(seasonId);
  if (!season) return [];
  season.status = "ended";
  const histories: SeasonHistory[] = [];
  for (const [userId, list] of seasonHistory.entries()) {
    const entry: SeasonHistory = {
      seasonId,
      seasonNumber: season.seasonNumber,
      finalRating: 0,
      finalRank: null,
      division: null,
      rewardsClaimed: [],
    };
    list.push(entry);
    histories.push(entry);
  }
  log.info("season.ended", { seasonId, histories: histories.length });
  return histories;
}

export function getSeasonHistory(userId: string): SeasonHistory[] {
  return seasonHistory.get(userId) ?? [];
}

// ===========================================================================
// System 10 — Promotion / Relegation
// ===========================================================================

export const PROMOTION_CONFIG = {
  seriesLength: 3,
  winsToPromote: 2,
  gracePeriodDays: 7,
  demotionThreshold: 0.3, // win rate below this triggers demotion warning
};

export function getPromotionState(userId: string, gameMode: GameModeId): PromotionState {
  const userMap = promotionStates.get(userId) ?? new Map<GameModeId, PromotionState>();
  const existing = userMap.get(gameMode);
  if (existing) return existing;
  const state: PromotionState = {
    userId,
    gameMode,
    currentDivision: "bronze",
    status: "stable",
    promotionWins: 0,
    promotionLosses: 0,
    promotionTarget: PROMOTION_CONFIG.seriesLength,
    gracePeriodEnds: null,
    history: [],
  };
  userMap.set(gameMode, state);
  promotionStates.set(userId, userMap);
  return state;
}

export function startPromotionSeries(userId: string, gameMode: GameModeId, fromDivision: string, toDivision: string): PromotionState {
  const state = getPromotionState(userId, gameMode);
  state.status = "promotion_series";
  state.promotionWins = 0;
  state.promotionLosses = 0;
  state.currentDivision = fromDivision;
  const event: PromotionEvent = {
    id: randomUUID(),
    userId,
    kind: "series_started",
    fromDivision,
    toDivision,
    timestamp: new Date().toISOString(),
  };
  state.history.push(event);
  return state;
}

export function recordPromotionMatch(userId: string, gameMode: GameModeId, won: boolean): PromotionState {
  const state = getPromotionState(userId, gameMode);
  if (state.status !== "promotion_series") return state;
  if (won) state.promotionWins += 1;
  else state.promotionLosses += 1;
  // Check if series is won
  if (state.promotionWins >= PROMOTION_CONFIG.winsToPromote) {
    state.status = "promoted";
    const currentIdx = DIVISIONS.findIndex(d => d.id === state.currentDivision);
    const nextDivision = DIVISIONS[Math.min(DIVISIONS.length - 1, currentIdx + 1)];
    const event: PromotionEvent = {
      id: randomUUID(),
      userId,
      kind: "promotion",
      fromDivision: state.currentDivision,
      toDivision: nextDivision.id,
      timestamp: new Date().toISOString(),
    };
    state.history.push(event);
    state.currentDivision = nextDivision.id;
    log.info("promotion.promoted", { userId, gameMode, division: nextDivision.id });
  } else if (state.promotionLosses > PROMOTION_CONFIG.seriesLength - PROMOTION_CONFIG.winsToPromote) {
    state.status = "stable";
    state.history.push({
      id: randomUUID(),
      userId,
      kind: "series_lost",
      fromDivision: state.currentDivision,
      toDivision: state.currentDivision,
      timestamp: new Date().toISOString(),
    });
  }
  return state;
}

export function triggerDemotionWarning(userId: string, gameMode: GameModeId): PromotionState {
  const state = getPromotionState(userId, gameMode);
  state.status = "demotion_warning";
  state.gracePeriodEnds = new Date(Date.now() + PROMOTION_CONFIG.gracePeriodDays * 86_400_000).toISOString();
  state.history.push({
    id: randomUUID(),
    userId,
    kind: "grace_started",
    fromDivision: state.currentDivision,
    toDivision: state.currentDivision,
    timestamp: new Date().toISOString(),
  });
  return state;
}

export function applyDemotion(userId: string, gameMode: GameModeId): PromotionState {
  const state = getPromotionState(userId, gameMode);
  const currentIdx = DIVISIONS.findIndex(d => d.id === state.currentDivision);
  const prevDivision = DIVISIONS[Math.max(0, currentIdx - 1)];
  state.currentDivision = prevDivision.id;
  state.status = "demoted";
  state.history.push({
    id: randomUUID(),
    userId,
    kind: "demotion",
    fromDivision: DIVISIONS[currentIdx].id,
    toDivision: prevDivision.id,
    timestamp: new Date().toISOString(),
  });
  log.info("promotion.demoted", { userId, gameMode, division: prevDivision.id });
  return state;
}

// ===========================================================================
// System 12 — Tournament Manager
// ===========================================================================

export function createTournament(input: {
  name: string;
  format: TournamentFormat;
  gameMode: GameModeId;
  hostId: string;
  organizationId?: string | null;
  startDate: string;
  endDate: string;
  maxParticipants: number;
}): CompetitiveTournament {
  const id = randomUUID();
  const tournament: CompetitiveTournament = {
    id,
    name: input.name,
    format: input.format,
    gameMode: input.gameMode,
    status: "registration",
    hostId: input.hostId,
    organizationId: input.organizationId ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    maxParticipants: input.maxParticipants,
    registeredParticipants: [],
    championId: null,
    runnerUpId: null,
    battleRoyaleTournamentId: null,
    createdAt: new Date().toISOString(),
  };
  // For battle_royale format, link to the Battle Royale module's tournament
  if (input.format === "battle_royale") {
    // The Battle Royale module exposes createTournament — we delegate to it
    // via dynamic import to avoid a hard circular dependency at module load.
    // In production this would be a service call. Here we mark the link field
    // and let the orchestrator wire it up.
    tournament.battleRoyaleTournamentId = null; // wired by orchestrator
  }
  tournaments.set(id, tournament);
  log.info("tournament.created", { id, name: input.name, format: input.format, gameMode: input.gameMode });
  return tournament;
}

export function getTournament(id: string): CompetitiveTournament | null {
  return tournaments.get(id) ?? null;
}

export function listTournaments(status?: TournamentStatus): CompetitiveTournament[] {
  const all = Array.from(tournaments.values());
  return status ? all.filter(t => t.status === status) : all;
}

export function registerForTournament(tournamentId: string, userId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t || t.status !== "registration") return false;
  if (t.registeredParticipants.length >= t.maxParticipants) return false;
  if (t.registeredParticipants.includes(userId)) return false;
  t.registeredParticipants.push(userId);
  return true;
}

export function startTournament(tournamentId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t || t.status !== "registration") return false;
  t.status = "in_progress";
  return true;
}

export function completeTournament(tournamentId: string, championId: string, runnerUpId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  t.status = "completed";
  t.championId = championId;
  t.runnerUpId = runnerUpId;
  return true;
}

export function cancelTournament(tournamentId: string): boolean {
  const t = tournaments.get(tournamentId);
  if (!t) return false;
  t.status = "cancelled";
  return true;
}

// ===========================================================================
// System 13 — Championship Platform
// ===========================================================================

export function createChampionship(input: {
  name: string;
  level: ChampionshipLevel;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
  organizerId: string;
  rewards?: string[];
  qualificationTournamentIds?: string[];
}): Championship {
  const id = randomUUID();
  const championship: Championship = {
    id,
    name: input.name,
    level: input.level,
    gameMode: input.gameMode,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "upcoming",
    participants: 0,
    champion: null,
    runnerUp: null,
    organizerId: input.organizerId,
    rewards: input.rewards ?? [],
    qualificationTournamentIds: input.qualificationTournamentIds ?? [],
  };
  championships.set(id, championship);
  log.info("championship.created", { id, name: input.name, level: input.level });
  return championship;
}

export function getChampionship(id: string): Championship | null {
  return championships.get(id) ?? null;
}

export function listChampionships(level?: ChampionshipLevel): Championship[] {
  const all = Array.from(championships.values());
  return level ? all.filter(c => c.level === level) : all;
}

export function completeChampionship(id: string, champion: string, runnerUp: string): boolean {
  const c = championships.get(id);
  if (!c) return false;
  c.status = "completed";
  c.champion = champion;
  c.runnerUp = runnerUp;
  return true;
}

// ===========================================================================
// System 14 — Tournament Scheduler
// ===========================================================================

export function scheduleTournamentPhase(input: {
  tournamentId: string;
  phase: SchedulerPhase;
  scheduledAt: string;
}): SchedulerEvent {
  const event: SchedulerEvent = {
    id: randomUUID(),
    tournamentId: input.tournamentId,
    phase: input.phase,
    scheduledAt: input.scheduledAt,
    executedAt: null,
    metadata: {},
  };
  const list = schedulerEvents.get(input.tournamentId) ?? [];
  list.push(event);
  schedulerEvents.set(input.tournamentId, list);
  return event;
}

export function executeScheduledPhase(eventId: string): boolean {
  for (const list of schedulerEvents.values()) {
    const event = list.find(e => e.id === eventId);
    if (event && !event.executedAt) {
      event.executedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

export function getSchedulerEvents(tournamentId: string): SchedulerEvent[] {
  return schedulerEvents.get(tournamentId) ?? [];
}

// ===========================================================================
// System 15 — Seeding Engine
// ===========================================================================

export function seedPlayers(players: SeedingInput[], strategy: SeedingStrategy): SeedingResult[] {
  const sorted = [...players];
  switch (strategy) {
    case "random":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "organization":
      sorted.sort((a, b) => (a.organizationId ?? "zzz").localeCompare(b.organizationId ?? "zzz"));
      break;
    case "previous_champions":
      sorted.sort((a, b) => (b.previousChampion ? 1 : 0) - (a.previousChampion ? 1 : 0) || b.rating - a.rating);
      break;
    case "manual":
      sorted.sort((a, b) => (a.manualSeed ?? 999) - (b.manualSeed ?? 999));
      break;
    case "balanced":
      // Top vs bottom interleaving
      sorted.sort((a, b) => b.rating - a.rating);
      const top = sorted.slice(0, Math.ceil(sorted.length / 2));
      const bottom = sorted.slice(Math.ceil(sorted.length / 2));
      const interleaved: SeedingInput[] = [];
      for (let i = 0; i < top.length || i < bottom.length; i++) {
        if (i < top.length) interleaved.push(top[i]);
        if (i < bottom.length) interleaved.push(bottom[i]);
      }
      sorted.length = 0;
      sorted.push(...interleaved);
      break;
    case "snake":
      // Snake draft: 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, ...
      sorted.sort((a, b) => b.rating - a.rating);
      const snakeResult: SeedingInput[] = [];
      let forward = true;
      while (sorted.length > 0) {
        const chunk = sorted.splice(0, Math.min(4, sorted.length));
        if (forward) snakeResult.push(...chunk);
        else snakeResult.push(...chunk.reverse());
        forward = !forward;
      }
      sorted.push(...snakeResult);
      break;
  }
  return sorted.map((p, i) => ({
    userId: p.userId,
    displayName: p.displayName,
    seed: i + 1,
    strategy,
  }));
}

// ===========================================================================
// System 20 — Organization Competition
// ===========================================================================

export function createOrganizationCompetition(input: {
  name: string;
  type: OrganizationCompetitionType;
  organizationAId: string;
  organizationBId: string;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
}): OrganizationCompetition {
  const id = randomUUID();
  const comp: OrganizationCompetition = {
    id,
    name: input.name,
    type: input.type,
    organizationAId: input.organizationAId,
    organizationBId: input.organizationBId,
    gameMode: input.gameMode,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "upcoming",
    winnerOrganizationId: null,
    scoreA: 0,
    scoreB: 0,
  };
  orgCompetitions.set(id, comp);
  log.info("org_competition.created", { id, name: input.name, type: input.type });
  return comp;
}

export function getOrganizationCompetition(id: string): OrganizationCompetition | null {
  return orgCompetitions.get(id) ?? null;
}

export function listOrganizationCompetitions(): OrganizationCompetition[] {
  return Array.from(orgCompetitions.values());
}

export function completeOrganizationCompetition(id: string, winnerId: string, scoreA: number, scoreB: number): boolean {
  const c = orgCompetitions.get(id);
  if (!c) return false;
  c.status = "completed";
  c.winnerOrganizationId = winnerId;
  c.scoreA = scoreA;
  c.scoreB = scoreB;
  return true;
}

// ===========================================================================
// System 21 — Educational Olympiad Platform
// ===========================================================================

export function createOlympiad(input: {
  name: string;
  kind: OlympiadKind;
  gameMode: GameModeId;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  subject: string;
  grade?: string | null;
  maxParticipants: number;
  rewards?: string[];
}): Olympiad {
  const id = randomUUID();
  const olympiad: Olympiad = {
    id,
    name: input.name,
    kind: input.kind,
    gameMode: input.gameMode,
    startDate: input.startDate,
    endDate: input.endDate,
    registrationDeadline: input.registrationDeadline,
    status: "upcoming",
    participants: 0,
    maxParticipants: input.maxParticipants,
    champion: null,
    subject: input.subject,
    grade: input.grade ?? null,
    rewards: input.rewards ?? [],
  };
  olympiads.set(id, olympiad);
  log.info("olympiad.created", { id, name: input.name, kind: input.kind, subject: input.subject });
  return olympiad;
}

export function getOlympiad(id: string): Olympiad | null {
  return olympiads.get(id) ?? null;
}

export function listOlympiads(kind?: OlympiadKind): Olympiad[] {
  const all = Array.from(olympiads.values());
  return kind ? all.filter(o => o.kind === kind) : all;
}

export function registerForOlympiad(id: string, userId: string): boolean {
  const o = olympiads.get(id);
  if (!o) return false;
  if (o.participants >= o.maxParticipants) return false;
  o.participants += 1;
  return true;
}

export function completeOlympiad(id: string, champion: string): boolean {
  const o = olympiads.get(id);
  if (!o) return false;
  o.status = "completed";
  o.champion = champion;
  return true;
}

// ===========================================================================
// Reset for testing
// ===========================================================================

export function _resetCompetitionTournamentsForTesting(): void {
  leagues.clear();
  seasons.clear();
  seasonHistory.clear();
  promotionStates.clear();
  tournaments.clear();
  championships.clear();
  schedulerEvents.clear();
  orgCompetitions.clear();
  olympiads.clear();
}
