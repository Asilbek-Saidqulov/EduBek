/**
 * EduBek — Live Quiz Analytics module types.
 *
 * Real-time + historical analytics for the Live Quiz Engine. The
 * analytics service reads from the LiveSession / LivePlayer / LiveRound
 * / LiveAnswer tables and aggregates them into the metrics requested in
 * the Phase 4C spec:
 *   • Participation      — participants per Quiz Session, drop-off rate
 *   • Accuracy           — % correct answers
 *   • Response Time      — average ms per answer
 *   • Drop-off           — participants leaving mid-Quiz-Session
 *   • Question Difficulty— % correct per question
 *   • Most Missed        — questions with lowest accuracy
 *   • Average Score      — per Quiz Session + per Game Mode
 *   • Session Duration   — average ms
 *   • Game Mode Popularity— Quiz Session count per Game Mode
 */

export interface SessionAnalyticsDto {
  sessionId: string;
  title: string;
  /** Internal id (e.g. "classic") — kept stable for machine consumers. */
  gameMode: string;
  /** Display name (e.g. "Classic Quiz") — for UI/reports. */
  gameModeName: string;
  playerCount: number;
  averageScore: number;
  averageAccuracy: number;
  averageResponseMs: number;
  durationMs: number;
  dropOffCount: number;
  dropOffRate: number;
  perRoundStats: Array<{
    roundNumber: number;
    questionId: string | null;
    answerCount: number;
    correctCount: number;
    accuracy: number;
    averageResponseMs: number;
  }>;
  // ---- Phase 4C.1 additive fields (all optional, backward-compatible) ----
  /** Distribution of response times in 1-second buckets (0-1s, 1-2s, …, 30+s). */
  responseDistribution?: Array<{ bucketMs: number; count: number }>;
  /** Fastest single-answer response time in ms. */
  fastestResponseMs?: number;
  /** Slowest single-answer response time in ms. */
  slowestResponseMs?: number;
  /** Average "thinking time" — response time of correct answers only. */
  averageThinkingMs?: number;
  /** Per-round participant count (drop-off graph data points). */
  dropOffGraph?: Array<{ roundNumber: number; participantCount: number }>;
  /** Cumulative accuracy after each round (trend line). */
  accuracyTrend?: Array<{ roundNumber: number; cumulativeAccuracy: number }>;
}

/** Phase 4C.1: per-question analytics. */
export interface PerQuestionAnalyticsDto {
  questionId: string;
  questionType: string | null;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  skipCount: number;
  accuracy: number;
  /** Difficulty score: 0 (everyone correct) to 1 (everyone wrong). */
  difficulty: number;
  averageResponseMs: number;
  /** Distribution of wrong-answer choices (for MCQ/MSQ). */
  wrongAnswerDistribution?: Array<{ optionIndex: number; count: number }>;
}

/** Phase 4C.1: per-Game-Mode analytics. */
export interface PerGameModeAnalyticsDto {
  gameMode: string;
  gameModeName: string;
  totalSessions: number;
  totalParticipants: number;
  averageDurationMs: number;
  /** Fraction of sessions that reached the `finished` status (vs cancelled). */
  completionRate: number;
  /** Fraction of participants who stayed until the end (drop-off inverse). */
  retentionRate: number;
  /** Sessions over time (popularity trend) — buckets by day. */
  popularityTrend?: Array<{ date: string; sessionCount: number }>;
}

export interface PlatformAnalyticsDto {
  totalSessions: number;
  totalPlayers: number;
  totalAnswers: number;
  averageAccuracy: number;
  averageResponseMs: number;
  averageSessionDurationMs: number;
  dropOffRate: number;
  gameModePopularity: Array<{
    /** Internal id (e.g. "classic"). */
    gameMode: string;
    /** Display name (e.g. "Classic Quiz"). */
    gameModeName: string;
    sessionCount: number;
    playerCount: number;
  }>;
  mostMissedQuestions: Array<{ questionId: string; correctRate: number; attempts: number }>;
}

export interface LiveAnalyticsUpdateDto {
  sessionId: string;
  timestamp: string;
  activePlayers: number;
  totalAnswers: number;
  currentRoundAccuracy: number;
  averageResponseMs: number;
}
