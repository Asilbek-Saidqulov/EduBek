/**
 * EduBek — Live Quiz Participant module types.
 *
 * The participant module is a thin wrapper around the LivePlayer
 * repository for participant-state queries and updates that don't fit
 * naturally inside the Quiz Session service. Most participant mutations
 * happen through the Quiz Session service (join/leave/answer/eliminate);
 * this module exposes read endpoints and admin-style overrides (e.g.
 * update display name, restore an eliminated participant).
 */
import type { LivePlayerDto } from "@/features/live-session/types";

export interface PlayerStatsDto {
  playerId: string;
  userId: string;
  displayName: string;
  totalSessions: number;
  totalScore: number;
  averageScore: number;
  averageAccuracy: number;
  averageResponseMs: number;
  bestStreak: number;
  totalWins: number;
  favoriteGameMode: string | null;
}

export interface PlayerHistoryDto {
  playerId: string;
  sessions: Array<{
    sessionId: string;
    title: string;
    gameMode: string;
    finalRank: number | null;
    score: number;
    finishedAt: string | null;
  }>;
}

export interface UpdatePlayerInput {
  displayName?: string;
  // For host-only admin overrides (e.g. un-eliminate a player who disconnected)
  status?: "active" | "eliminated" | "disconnected" | "left";
}

export type PlayerDto = LivePlayerDto;
