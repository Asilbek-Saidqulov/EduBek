/**
 * EduBek — Live Quiz Tournament feature barrel export.
 */
export {
  createTournament,
  getTournament,
  listTournaments,
  register,
  startTournament,
  finishMatch,
  listMatches,
  // Phase 4C.1 additive
  checkIn,
  getMatchHistory,
  getTournamentStats,
  autoAdvanceReadyMatches,
} from "./service";

export {
  createTournamentBodySchema,
  registerBodySchema,
  listTournamentsQuerySchema,
  checkInBodySchema,
  type CreateTournamentBody,
  type RegisterBody,
  type ListTournamentsQuery,
  type CheckInBody,
} from "./schema";

export type {
  TournamentFormat,
  TournamentStatus,
  TournamentDto,
  TournamentMatchDto,
  TournamentStatsDto,
  MatchHistoryDto,
  Bracket,
} from "./types";
