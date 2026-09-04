export type RoomStatus =
  | "lobby"
  | "countdown"
  | "in_progress"
  | "question_results"
  | "finished"
  | "cancelled";

export type PlayerStatus =
  | "active"
  | "ready"
  | "submitted"
  | "disconnected"
  | "left"
  | "eliminated";

export type PlayerRole = "host" | "co_host" | "player" | "spectator";

export type GameMode = "classic" | "royale" | "heist" | "empire" | "battle";

export interface AuthoritativeQuestion {
  id: string;
  prompt: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "multiple_select";
  options: string[];
  correctIndex?: number;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  explanation?: string;
  points: number;
  durationMs: number;
  difficulty?: string;
}

export interface SanitizedQuestion {
  id: string;
  prompt: string;
  type: string;
  options: string[];
  points: number;
  durationMs: number;
  roundNumber: number;
  totalRounds: number;
}

export interface PlayerAnswerSubmission {
  roundNumber: number;
  answer: string | number | string[];
  clientTimestamp?: number;
  submissionId?: string;
}

export interface PlayerAnswerRecord {
  playerId: string;
  roundNumber: number;
  answer: string | number | string[];
  isCorrect: boolean;
  responseMs: number;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  pointsAwarded: number;
  submittedAt: Date;
  submissionId?: string;
}

export interface AuthoritativePlayer {
  id: string;
  userId: string | null;
  socketId: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role: PlayerRole;
  status: PlayerStatus;
  isGuest: boolean;
  score: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  longestStreak: number;
  avgResponseMs: number;
  totalResponseMs: number;
  answeredCount: number;
  isReady: boolean;
  hasAnsweredCurrentRound: boolean;
  lastPointsEarned: number;
  joinedAt: Date;
  lastSeenAt: Date;
  disconnectedAt: Date | null;
  modeState?: {
    gold: number;
    pendingGold: number;
    hearts: number;
    shield: boolean;
    resources: {wood: number; stone: number; gold: number; food: number};
    empireTier: number;
    battlePoints: number;
  }
}

export interface LeaderboardEntry {
  playerId: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role: PlayerRole;
  score: number;
  rank: number;
  correctCount: number;
  currentStreak: number;
  lastPointsEarned: number;
  change: number; // position change since last round
  isReady: boolean;
  status: PlayerStatus;
  hasAnsweredCurrentRound: boolean;
}

export interface QuestionResultView {
  roundNumber: number;
  questionId: string;
  prompt: string;
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  answerDistribution: Record<string, number>;
  totalAnswers: number;
  correctAnswersCount: number;
  playerResult?: {
    isCorrect: boolean;
    pointsAwarded: number;
    speedBonus: number;
    streakBonus: number;
    selectedAnswer: any;
    currentScore: number;
    currentRank: number;
  };
}

export interface RoomStateSnapshot {
  roomId: string;
  code: string;
  hostId: string;
  title: string;
  description?: string | null;
  gameMode: GameMode;
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
  durationMs: number;
  roundStartedAt: string | null;
  roundEndsAt: string | null;
  serverTime: string;
  activeQuestion: SanitizedQuestion | null;
  lastQuestionResult: QuestionResultView | null;
  leaderboard: LeaderboardEntry[];
  myPlayerId?: string;
  isHost: boolean;
  hasSubmittedAnswer: boolean;
  canStart: boolean;
  reconnectGraceMs?: number;
  modeHud?: AuthoritativePlayer["modeState"] | null;
}
