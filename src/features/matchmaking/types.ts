/**
 * EduBek — Live Quiz Matchmaking module types.
 *
 * Matchmaking is the entry point for participants looking to join a
 * Quiz Session without an explicit PIN. The matchmaking service finds
 * (or creates) a suitable Quiz Session based on the participant's
 * preferences.
 *
 * Matchmaking strategies (all three Live Quiz join methods are
 * supported):
 *   • random     — drop into any open public Lobby
 *   • tournament — register for a tournament bracket
 *   • classroom  — Join Classroom: find a Quiz Session launched by the
 *                  participant's teacher (no PIN required)
 *   • org        — join any open Quiz Session in the participant's org
 *   • invitation — Join by Invitation Link / Token
 *   • private    — the host created a private Quiz Session; PIN only
 *   • public     — browse open public Lobbies and pick one
 *
 * Join by PIN (the most common workflow) goes through
 * `POST /api/live/join` directly and does not use matchmaking.
 *
 * Tournaments are managed separately by the tournament module; this
 * service delegates tournament matchmaking to it.
 */

export type MatchmakingStrategy =
  | "random"
  | "tournament"
  | "classroom"
  | "org"
  | "invitation"
  | "private"
  | "public";

export interface MatchResult {
  matched: boolean;
  sessionId?: string;
  joinCode?: string;
  reason?: string;
}

export interface MatchmakingRequest {
  strategy: MatchmakingStrategy;
  gameMode?: string;
  classroomId?: string;
  orgId?: string;
  tournamentId?: string;
  inviteToken?: string;
  maxWaitMs?: number;
}
