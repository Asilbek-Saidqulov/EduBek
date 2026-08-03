/**
 * EduBek — Live Quiz Spectator module types.
 *
 * Spectators are read-only viewers of a Quiz Session. They cannot
 * answer questions or affect gameplay, but they receive every state
 * update (round started, answers submitted, leaderboard updates).
 *
 * Spectator access is controlled by the Quiz Session's visibility:
 *   • private      — host must explicitly invite spectators
 *   • classroom    — any classroom member can spectate
 *   • org          — any org member can spectate
 *   • public       — anyone can spectate
 */

export interface SpectatorTokenDto {
  token: string;
  sessionId: string;
  expiresAt: string;
}

export interface SpectatorSessionView {
  session: {
    id: string;
    title: string;
    gameMode: string;
    status: string;
    currentRound: number;
    totalRounds: number;
  };
  leaderboard: Array<{
    playerId: string;
    displayName: string;
    score: number;
    rank: number;
    accuracy: number;
    streak: number;
  }>;
  playerCount: number;
  spectatorCount: number;
}
