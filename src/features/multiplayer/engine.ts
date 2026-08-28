import {
  RoomStatus,
  PlayerStatus,
  PlayerRole,
  GameMode,
  AuthoritativeQuestion,
  SanitizedQuestion,
  AuthoritativePlayer,
  PlayerAnswerSubmission,
  PlayerAnswerRecord,
  LeaderboardEntry,
  QuestionResultView,
  RoomStateSnapshot,
} from "./types";
import {
  calculateAuthoritativeScore,
  sortAndRankPlayers,
} from "./scoring";
import {
  validateAnswerTiming,
  sanitizeAndValidateAnswerFormat,
} from "./anti-cheat";

export interface GameRoomOptions {
  roomId: string;
  code: string;
  hostId: string;
  title: string;
  description?: string | null;
  gameMode?: GameMode;
  maxPlayers?: number;
  questions: AuthoritativeQuestion[];
  autoAdvance?: boolean;
  resultsDurationMs?: number;
  reconnectGraceMs?: number;
  onStateChange?: (room: GameRoom, eventName: string, data?: any) => void;
}

export class GameRoom {
  public readonly roomId: string;
  public readonly code: string;
  public readonly hostId: string;
  public readonly title: string;
  public readonly description: string | null;
  public readonly gameMode: GameMode;
  public readonly maxPlayers: number;
  public readonly totalRounds: number;
  public readonly resultsDurationMs: number;
  public readonly reconnectGraceMs: number;

  public status: RoomStatus = "lobby";
  public currentRoundIndex: number = 0; // 0-indexed internally, 1-indexed in public state

  private questions: AuthoritativeQuestion[];
  private players: Map<string, AuthoritativePlayer> = new Map();
  private socketToPlayerId: Map<string, string> = new Map();
  private userToPlayerId: Map<string, string> = new Map();

  // Round tracking
  private roundStartedAt: Date | null = null;
  private roundLockAt: Date | null = null;
  private roundAnswers: Map<string, PlayerAnswerRecord> = new Map(); // key: playerId
  private lastQuestionResult: QuestionResultView | null = null;
  private previousRanks: Map<string, number> = new Map();

  // Timers
  private activeTimer: NodeJS.Timeout | null = null;
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  private onStateChangeCallback?: (room: GameRoom, eventName: string, data?: any) => void;

  constructor(options: GameRoomOptions) {
    this.roomId = options.roomId;
    this.code = options.code.toUpperCase();
    this.hostId = options.hostId;
    this.title = options.title;
    this.description = options.description || null;
    this.gameMode = options.gameMode || "classic";
    this.maxPlayers = options.maxPlayers || 50;
    this.questions = options.questions || [];
    this.totalRounds = this.questions.length;
    this.resultsDurationMs = options.resultsDurationMs || 5000;
    this.reconnectGraceMs = options.reconnectGraceMs || 60000;
    this.onStateChangeCallback = options.onStateChange;
  }

  // ---------------------------------------------------------------------------
  // Player Management
  // ---------------------------------------------------------------------------

  public addOrUpdatePlayer(params: {
    playerId?: string;
    userId?: string | null;
    socketId?: string | null;
    displayName: string;
    avatarUrl?: string | null;
    role?: PlayerRole;
    isGuest?: boolean;
  }): { player: AuthoritativePlayer; isNew: boolean } {
    // Check capacity if new player
    const existingById = params.playerId ? this.players.get(params.playerId) : undefined;
    const existingByUserId = params.userId ? this.userToPlayerId.get(params.userId) : undefined;
    const existingPlayer = existingById || (existingByUserId ? this.players.get(existingByUserId) : undefined);

    if (!existingPlayer && this.players.size >= this.maxPlayers) {
      throw new Error("Room is at maximum capacity");
    }

    if (this.status === "finished" || this.status === "cancelled") {
      throw new Error("Cannot join a closed match");
    }

    const now = new Date();

    if (existingPlayer) {
      // Re-link player
      if (params.socketId) {
        if (existingPlayer.socketId) {
          this.socketToPlayerId.delete(existingPlayer.socketId);
        }
        existingPlayer.socketId = params.socketId;
        this.socketToPlayerId.set(params.socketId, existingPlayer.id);
      }
      existingPlayer.lastSeenAt = now;
      existingPlayer.status = existingPlayer.status === "disconnected" ? "active" : existingPlayer.status;
      existingPlayer.disconnectedAt = null;

      // Clear disconnect timer if active
      const dt = this.disconnectTimers.get(existingPlayer.id);
      if (dt) {
        clearTimeout(dt);
        this.disconnectTimers.delete(existingPlayer.id);
      }

      this.notify("player:reconnected", { player: existingPlayer });
      return { player: existingPlayer, isNew: false };
    }

    const id = params.playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const role = params.role || (params.userId === this.hostId ? "host" : "player");

    const newPlayer: AuthoritativePlayer = {
      id,
      userId: params.userId || null,
      socketId: params.socketId || null,
      displayName: params.displayName.trim() || `Player ${this.players.size + 1}`,
      avatarUrl: params.avatarUrl || null,
      role,
      status: role === "host" ? "ready" : "active",
      isGuest: Boolean(params.isGuest || !params.userId),
      score: 0,
      accuracy: 0,
      correctCount: 0,
      wrongCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      avgResponseMs: 0,
      totalResponseMs: 0,
      answeredCount: 0,
      isReady: role === "host",
      hasAnsweredCurrentRound: false,
      lastPointsEarned: 0,
      joinedAt: now,
      lastSeenAt: now,
      disconnectedAt: null,
    };

    this.players.set(id, newPlayer);
    if (params.socketId) {
      this.socketToPlayerId.set(params.socketId, id);
    }
    if (params.userId) {
      this.userToPlayerId.set(params.userId, id);
    }

    this.notify("player:joined", { player: newPlayer });
    return { player: newPlayer, isNew: true };
  }

  public setPlayerReady(playerId: string, isReady: boolean): AuthoritativePlayer {
    const player = this.players.get(playerId);
    if (!player) throw new Error("Player not found in room");

    player.isReady = isReady;
    player.status = isReady ? "ready" : "active";
    this.notify("player:ready", { playerId, isReady });
    return player;
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (player.socketId) {
      this.socketToPlayerId.delete(player.socketId);
    }
    if (player.userId) {
      this.userToPlayerId.delete(player.userId);
    }
    this.players.delete(playerId);

    const dt = this.disconnectTimers.get(playerId);
    if (dt) {
      clearTimeout(dt);
      this.disconnectTimers.delete(playerId);
    }

    this.notify("player:left", { playerId });
  }

  public handleSocketDisconnect(socketId: string): void {
    const playerId = this.socketToPlayerId.get(socketId);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    this.socketToPlayerId.delete(socketId);
    player.socketId = null;
    player.status = "disconnected";
    player.disconnectedAt = new Date();

    // Start grace period
    const dt = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      if (player.status === "disconnected") {
        player.status = "left";
        this.notify("player:left", { playerId });
      }
    }, this.reconnectGraceMs);

    this.disconnectTimers.set(playerId, dt);
    this.notify("player:disconnected", { playerId });
  }

  public getPlayerBySocketId(socketId: string): AuthoritativePlayer | undefined {
    const pid = this.socketToPlayerId.get(socketId);
    return pid ? this.players.get(pid) : undefined;
  }

  public getPlayerByUserId(userId: string): AuthoritativePlayer | undefined {
    const pid = this.userToPlayerId.get(userId);
    return pid ? this.players.get(pid) : undefined;
  }

  public getPlayerById(playerId: string): AuthoritativePlayer | undefined {
    return this.players.get(playerId);
  }

  public getAllPlayers(): AuthoritativePlayer[] {
    return Array.from(this.players.values());
  }

  // ---------------------------------------------------------------------------
  // Match Lifecycle & State Transitions
  // ---------------------------------------------------------------------------

  public startCountdown(requesterId: string): void {
    const requester = this.players.get(requesterId);
    if (!requester || (requester.role !== "host" && requester.userId !== this.hostId)) {
      throw new Error("Only the host can start the match");
    }

    if (this.status !== "lobby") {
      throw new Error(`Cannot start countdown from status ${this.status}`);
    }

    if (this.questions.length === 0) {
      throw new Error("Cannot start match without questions");
    }

    this.status = "countdown";
    this.notify("game:countdown", { durationSeconds: 3 });

    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.activeTimer = setTimeout(() => {
      this.startRound(0);
    }, 3000);
  }

  public startRound(roundIndex: number): void {
    if (roundIndex >= this.questions.length) {
      this.finishMatch();
      return;
    }

    this.currentRoundIndex = roundIndex;
    this.status = "in_progress";
    this.roundAnswers.clear();

    // Reset current round answer state on all active players
    for (const player of this.players.values()) {
      player.hasAnsweredCurrentRound = false;
      player.lastPointsEarned = 0;
    }

    const currentQuestion = this.questions[roundIndex];
    const now = new Date();
    const durationMs = currentQuestion.durationMs || 30000;

    this.roundStartedAt = now;
    this.roundLockAt = new Date(now.getTime() + durationMs);

    const sanitizedQuestion = this.getSanitizedCurrentQuestion();

    this.notify("question:active", {
      question: sanitizedQuestion,
      roundNumber: roundIndex + 1,
      totalRounds: this.totalRounds,
      durationMs,
      startedAt: this.roundStartedAt.toISOString(),
      endsAt: this.roundLockAt.toISOString(),
    });

    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.activeTimer = setTimeout(() => {
      this.finishRound();
    }, durationMs + 200); // 200ms boundary buffer
  }

  public submitAnswer(
    playerId: string,
    submission: PlayerAnswerSubmission
  ): { record: PlayerAnswerRecord; isFirstSubmission: boolean } {
    if (this.status !== "in_progress") {
      throw new Error("No active question round accepting answers");
    }

    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not registered in this room");
    }

    // Check if player already submitted this round (Idempotency)
    const existing = this.roundAnswers.get(playerId);
    if (existing) {
      return { record: existing, isFirstSubmission: false };
    }

    const currentQuestion = this.questions[this.currentRoundIndex];
    const serverNow = new Date();

    // Timing anti-cheat validation
    const timing = validateAnswerTiming(
      this.roundStartedAt!,
      this.roundLockAt!,
      serverNow
    );

    if (!timing.valid) {
      throw new Error(timing.error || "Submission rejected due to timing violation");
    }

    // Format anti-cheat sanitization
    const sanitized = sanitizeAndValidateAnswerFormat(
      currentQuestion,
      submission.answer
    );

    if (!sanitized.valid) {
      throw new Error(sanitized.error || "Malformed answer payload");
    }

    // Authoritative score calculation
    const scoreResult = calculateAuthoritativeScore(
      currentQuestion,
      sanitized.sanitized,
      timing.responseMs,
      player.currentStreak
    );

    const record: PlayerAnswerRecord = {
      playerId,
      roundNumber: this.currentRoundIndex + 1,
      answer: sanitized.sanitized,
      isCorrect: scoreResult.isCorrect,
      responseMs: timing.responseMs,
      basePoints: scoreResult.basePoints,
      speedBonus: scoreResult.speedBonus,
      streakBonus: scoreResult.streakBonus,
      pointsAwarded: scoreResult.totalPoints,
      submittedAt: serverNow,
      submissionId: submission.submissionId,
    };

    this.roundAnswers.set(playerId, record);

    // Update Player Stats
    player.score += scoreResult.totalPoints;
    player.lastPointsEarned = scoreResult.totalPoints;
    player.answeredCount++;
    player.totalResponseMs += timing.responseMs;
    player.avgResponseMs = Math.round(player.totalResponseMs / player.answeredCount);
    player.hasAnsweredCurrentRound = true;

    if (scoreResult.isCorrect) {
      player.correctCount++;
      player.currentStreak++;
      if (player.currentStreak > player.longestStreak) {
        player.longestStreak = player.currentStreak;
      }
    } else {
      player.wrongCount++;
      player.currentStreak = 0;
    }

    player.accuracy = player.answeredCount > 0
      ? Math.round((player.correctCount / player.answeredCount) * 100)
      : 0;

    // Check if all active players have submitted
    const activePlayers = Array.from(this.players.values()).filter(
      (p) => p.status === "active" || p.status === "ready" || p.status === "submitted"
    );
    const allSubmitted = activePlayers.length > 0 && activePlayers.every((p) => this.roundAnswers.has(p.id));

    this.notify("player:answered", {
      playerId,
      hasAnswered: true,
      totalAnswered: this.roundAnswers.size,
      totalActive: activePlayers.length,
    });

    if (allSubmitted) {
      if (this.activeTimer) clearTimeout(this.activeTimer);
      // Small 500ms delay so final animation can play smoothly
      this.activeTimer = setTimeout(() => {
        this.finishRound();
      }, 500);
    }

    return { record, isFirstSubmission: true };
  }

  public finishRound(): void {
    if (this.status !== "in_progress") return;

    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    this.status = "question_results";
    const currentQuestion = this.questions[this.currentRoundIndex];

    // Compute distribution
    const distribution: Record<string, number> = {};
    let correctCount = 0;

    for (const ans of this.roundAnswers.values()) {
      const key = String(ans.answer);
      distribution[key] = (distribution[key] || 0) + 1;
      if (ans.isCorrect) correctCount++;
    }

    // Save previous ranks before generating new leaderboard
    const newLeaderboard = sortAndRankPlayers(Array.from(this.players.values()), this.previousRanks);
    this.previousRanks = new Map(newLeaderboard.map((e) => [e.playerId, e.rank]));

    this.lastQuestionResult = {
      roundNumber: this.currentRoundIndex + 1,
      questionId: currentQuestion.id,
      prompt: currentQuestion.prompt,
      correctIndex: currentQuestion.correctIndex,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      answerDistribution: distribution,
      totalAnswers: this.roundAnswers.size,
      correctAnswersCount: correctCount,
    };

    this.notify("question:result", {
      result: this.lastQuestionResult,
      leaderboard: newLeaderboard,
    });
  }

  public nextQuestion(requesterId: string): void {
    const requester = this.players.get(requesterId);
    if (!requester || (requester.role !== "host" && requester.userId !== this.hostId)) {
      throw new Error("Only the host can advance to the next question");
    }

    if (this.status !== "question_results") {
      throw new Error("Cannot advance when not in results view");
    }

    const nextIndex = this.currentRoundIndex + 1;
    if (nextIndex >= this.totalRounds) {
      this.finishMatch();
    } else {
      this.startRound(nextIndex);
    }
  }

  public finishMatch(): void {
    if (this.status === "finished") return;

    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    this.status = "finished";
    const finalLeaderboard = sortAndRankPlayers(Array.from(this.players.values()));

    this.notify("game:finished", {
      finalLeaderboard,
      totalRounds: this.totalRounds,
      finishedAt: new Date().toISOString(),
    });
  }

  public cancelMatch(reason?: string): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    for (const dt of this.disconnectTimers.values()) {
      clearTimeout(dt);
    }
    this.disconnectTimers.clear();

    this.status = "cancelled";
    this.notify("game:cancelled", { reason: reason || "Match was cancelled by host" });
  }

  // ---------------------------------------------------------------------------
  // Snapshots & Sanitization
  // ---------------------------------------------------------------------------

  public getSanitizedCurrentQuestion(): SanitizedQuestion | null {
    if (this.status !== "in_progress" || this.currentRoundIndex >= this.questions.length) {
      return null;
    }

    const q = this.questions[this.currentRoundIndex];
    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      points: q.points,
      durationMs: q.durationMs,
      roundNumber: this.currentRoundIndex + 1,
      totalRounds: this.totalRounds,
    };
  }

  public getAuthoritativeQuestion(index: number): AuthoritativeQuestion | undefined {
    return this.questions[index];
  }

  public getRoundAnswers(): Map<string, PlayerAnswerRecord> {
    return new Map(this.roundAnswers);
  }

  public getStateSnapshot(playerId?: string): RoomStateSnapshot {
    const player = playerId ? this.players.get(playerId) : undefined;
    const isHost = Boolean(player && (player.role === "host" || player.userId === this.hostId));
    const leaderboard = sortAndRankPlayers(Array.from(this.players.values()), this.previousRanks);

    return {
      roomId: this.roomId,
      code: this.code,
      hostId: this.hostId,
      title: this.title,
      description: this.description,
      gameMode: this.gameMode,
      status: this.status,
      currentRound: this.currentRoundIndex + 1,
      totalRounds: this.totalRounds,
      durationMs: this.questions[this.currentRoundIndex]?.durationMs || 30000,
      roundStartedAt: this.roundStartedAt ? this.roundStartedAt.toISOString() : null,
      roundEndsAt: this.roundLockAt ? this.roundLockAt.toISOString() : null,
      serverTime: new Date().toISOString(),
      activeQuestion: this.status === "in_progress" ? this.getSanitizedCurrentQuestion() : null,
      lastQuestionResult: this.status === "question_results" || this.status === "finished" ? this.lastQuestionResult : null,
      leaderboard,
      myPlayerId: playerId,
      isHost,
      hasSubmittedAnswer: Boolean(playerId && this.roundAnswers.has(playerId)),
      canStart: this.status === "lobby" && this.players.size >= 1 && this.questions.length > 0,
      reconnectGraceMs: this.reconnectGraceMs,
    };
  }

  public destroy(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    for (const dt of this.disconnectTimers.values()) {
      clearTimeout(dt);
    }
    this.disconnectTimers.clear();
    this.players.clear();
    this.socketToPlayerId.clear();
    this.userToPlayerId.clear();
  }

  private notify(eventName: string, data?: any): void {
    if (this.onStateChangeCallback) {
      try {
        this.onStateChangeCallback(this, eventName, data);
      } catch (err) {
        console.error(`[GameRoom ${this.roomId}] error in onStateChange callback:`, err);
      }
    }
  }
}
