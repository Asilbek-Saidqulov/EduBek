/**
 * EduBek — Classic Quiz Production Edition types.
 * Phase 6G.2: Flagship multiplayer game mode built on top of the
 * Universal Game Engine (Phase 6G.1). Pure configuration/rules layer —
 * zero engine duplication.
 */

// System 1 — Rules
export interface ClassicQuizRules {
  gameMode: "classic_quiz";
  minPlayers: number; maxPlayers: number;
  allowSpectators: boolean; allowLateJoin: boolean;
  reconnectPolicy: "allow" | "deny" | "limited";
  roundCount: number; questionsPerRound: number;
  timePerQuestionMs: number; overtimeDisabled: boolean;
  hostControls: string[]; organizationRestricted: boolean;
}

// System 2 — Question Flow
export type QuestionFlowPhase =
  | "preload" | "asset_preload" | "countdown" | "question_reveal"
  | "answer_collection" | "answer_validation" | "answer_lock"
  | "scoring" | "leaderboard_animation" | "statistics_update" | "next_question";

// System 3 — Scoring
export interface ScoreInput {
  isCorrect: boolean; responseTimeMs: number; thresholdMs: number;
}
export interface ScoreResult {
  baseScore: number; speedBonus: number; totalScore: number;
  tier: "perfect" | "great" | "good" | "ok" | "wrong";
}

// System 4 — Combo & Streak
export interface StreakState {
  currentStreak: number; longestStreak: number;
  comboBonus: number; perfectRound: boolean;
}
export interface StreakMilestone {
  id: string; name: string; threshold: number; bonus: number; achieved: boolean;
}

// System 5 — Leaderboards
export type LeaderboardType =
  | "current_score" | "accuracy" | "average_response" | "fastest_player"
  | "longest_streak" | "correct_answers" | "combo" | "teacher_view" | "final_ranking";

export interface LeaderboardEntry {
  rank: number; userId: string; displayName: string; score: number;
  accuracy: number; avgResponseMs: number; longestStreak: number;
  correctAnswers: number; combo: number;
}

// System 6 — Teacher Controls
export type TeacherAction =
  | "pause_match" | "resume_match" | "skip_question" | "restart_question"
  | "extend_timer" | "reduce_timer" | "lock_answers" | "unlock_answers"
  | "kick_player" | "mute_chat" | "freeze_lobby" | "end_match" | "emergency_stop";

export interface TeacherControlResult {
  action: TeacherAction; success: boolean; audited: boolean;
  eventId: string | null; message: string;
}

// System 7 — Student UX States
export type StudentUXState =
  | "joining" | "waiting" | "countdown" | "question" | "answer_submitted"
  | "waiting_results" | "leaderboard" | "disconnected" | "reconnecting"
  | "recovered" | "finished" | "animations" | "loading" | "offline_recovery";

// System 8 — Match Summary
export interface MatchSummary {
  matchId: string; winner: LeaderboardEntry | null;
  top3: LeaderboardEntry[]; averageAccuracy: number;
  averageSpeedMs: number; fastestThinker: LeaderboardEntry | null;
  highestCombo: LeaderboardEntry | null; mostImproved: LeaderboardEntry | null;
  perfectPlayers: string[]; xpEarned: Record<string, number>;
  achievements: Array<{ userId: string; achievements: string[] }>;
  replayAvailable: boolean; exportAvailable: boolean;
  teacherSummary: { interventions: number; pauses: number; questionSkips: number };
}

// System 9 — Analytics
export interface QuestionAnalytics {
  questionId: string; difficulty: number; accuracy: number;
  averageTimeMs: number; skipped: number; wrongPercent: number; correctPercent: number;
  speedDistribution: Array<{ range: string; count: number }>;
}
export interface StudentAnalytics {
  userId: string; accuracy: number; responseTimeMs: number;
  improvement: number; participation: number;
}
export interface MatchAnalytics {
  matchId: string; completionRate: number; dropoutCount: number;
  reconnectCount: number; teacherInterventions: number; replayUsage: number;
  perQuestion: QuestionAnalytics[]; perStudent: StudentAnalytics[];
}

// System 10 — Achievements
export interface Achievement {
  id: string; name: string; description: string;
  condition: (stats: { correctCount: number; totalAnswered: number; fastestMs: number; longestStreak: number; rank: number; perfectRound: boolean }) => boolean;
  xpReward: number;
}

// System 11 — Replay
export interface ReplayTimelineEvent {
  timestamp: number; type: string; description: string;
  matchState: string; leaderboard: Array<{ userId: string; score: number }>;
}

// System 12 — Anti-Cheat
export interface ClassicQuizCheatFinding {
  id: string; matchId: string; userId: string; kind: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string; evidence: string;
}

// System 13 — Accessibility
export interface AccessibilityConfig {
  keyboardNavigation: boolean; screenReaderLabels: boolean;
  reducedMotion: boolean; highContrast: boolean; largeTimer: boolean;
  colorBlindFriendly: boolean; mobileFriendly: boolean; tabletFriendly: boolean;
}

// System 14 — Dashboard
export interface TeacherDashboard {
  matchId: string; livePlayers: number; disconnectedPlayers: number;
  readyStatus: { ready: number; notReady: number };
  currentQuestion: number; remainingTimeMs: number;
  averageAccuracy: number; fastestStudent: LeaderboardEntry | null;
  leaderboard: LeaderboardEntry[]; interventions: number;
  replayAvailable: boolean; exportAvailable: boolean;
}
