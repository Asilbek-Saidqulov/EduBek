/**
 * EduBek — Live Quiz Leaderboard feature barrel export.
 */
export {
  saveLeaderboardSnapshot,
  getLatestLeaderboard,
  getLatestSnapshot,
  getHistory,
  getByRound,
} from "./service";

export type {
  LeaderboardSnapshotDto,
  LeaderboardEntryDto,
  SaveLeaderboardInput,
} from "./types";
