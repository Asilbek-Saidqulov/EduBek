/**
 * Systems 6-18: Gameplay Flow, Leaderboards, Achievements, Summary,
 * Analytics, Teacher Controls, Student UX, Accessibility, Dashboard,
 * Anti-Cheat, Balance, Replay.
 * All via engine events. No engine duplication.
 */
import { getLogger } from "@/lib/logger";
import { getMatch, attemptTransition, emitEvent, getEvents, getReplay, pauseTimer, resumeTimer, detectCheat } from "@/features/game-engine";
import { ROYALE_RULES, getRules, BALANCE_PRESETS, getLifeState, getLives, loseLife, restoreLife, grantLife, revivePlayer, getShieldState, earnShield, consumeShield, grantShield, eliminatePlayer, checkFinalSurvivor, getSurvivalState, initSurvivalState, recordElimination, recordShieldUsage, recordComeback, checkDangerState } from "./survival-engine";
import type { RoyaleGameplayPhase, RoyaleLeaderboardEntry, RoyaleLeaderboardType, RoyaleAchievement, RoyaleAchievementStats, RoyaleMatchSummary, RoyaleAnalytics, RoyaleTeacherAction, RoyaleTeacherResult, RoyaleStudentUXState, RoyaleAccessibilityConfig, RoyaleDashboard, RoyaleCheatFinding } from "./types";
import type { DeathReason } from "@/features/game-engine";

const log = getLogger("quiz-royale");

// ===========================================================================
// System 6 — Gameplay Flow
// ===========================================================================

export function runQuestionPhase(matchId: string): RoyaleGameplayPhase { emitEvent(matchId, "QuestionShown", null, { phase: "question" }); return "question"; }
export function runAnswerPhase(matchId: string, userId: string, isCorrect: boolean): RoyaleGameplayPhase {
  emitEvent(matchId, "AnswerSubmitted", userId, { isCorrect });
  if (!isCorrect) {
    const shieldState = getShieldState(matchId, userId);
    if (shieldState && shieldState.shields > 0) {
      consumeShield(matchId, userId);
      recordShieldUsage(matchId);
      emitEvent(matchId, "ScoreUpdated", userId, { shieldUsed: true });
      return "shield_check";
    }
    loseLife(matchId, userId, "wrong_answer");
  }
  return "life_update";
}
export function runEliminationPhase(matchId: string): RoyaleGameplayPhase {
  const m = getMatch(matchId);
  if (!m) return "next_question";
  for (const p of m.players) {
    const ls = getLifeState(matchId, p.userId);
    if (ls && ls.isEliminated) {
      const survivor = getSurvivalState(matchId);
      if (survivor && !survivor.eliminationOrder.includes(p.userId)) {
        // If life state recorded a deathReason (the usual path), use it.
        // Fall back to manual_elimination for legacy callers.
        const deathReason: DeathReason = ls.deathReason ?? "manual_elimination";
        recordElimination(matchId, { userId: p.userId, matchId, eliminatedAt: ls.eliminatedAt!, deathReason, reason: deathReason, rank: survivor.currentSurvivors.length, livesRemaining: 0 });
      }
    }
  }
  const winner = checkFinalSurvivor(matchId);
  if (winner) { attemptTransition(matchId, "match_finished"); return "final_winner"; }
  return "leaderboard";
}
export function runLeaderboardPhase(matchId: string): RoyaleGameplayPhase { return "leaderboard"; }
export function runNextQuestionPhase(matchId: string): RoyaleGameplayPhase { return "next_question"; }

// ===========================================================================
// System 7 — Leaderboards
// ===========================================================================

export function buildRoyaleLeaderboard(players: Array<{ userId: string; displayName: string; matchId: string; score: number; correctAnswers: number; totalAnswered: number; avgSpeedMs: number; longestStreak: number }>, type: RoyaleLeaderboardType = "survival_rank"): RoyaleLeaderboardEntry[] {
  const entries: RoyaleLeaderboardEntry[] = players.map(p => {
    const ls = getLifeState(p.matchId, p.userId);
    const ss = getShieldState(p.matchId, p.userId);
    const sv = getSurvivalState(p.matchId);
    const elimRank = sv?.eliminationOrder.indexOf(p.userId) ?? -1;
    return {
      rank: 0, userId: p.userId, displayName: p.displayName,
      lives: ls?.lives ?? 0, shields: ss?.shields ?? 0, score: p.score,
      accuracy: p.totalAnswered > 0 ? Math.round((p.correctAnswers / p.totalAnswered) * 100) / 100 : 0,
      avgSpeedMs: p.avgSpeedMs, longestStreak: p.longestStreak,
      eliminated: ls?.isEliminated ?? false,
      eliminationRank: elimRank >= 0 ? sv!.eliminatedPlayers.length - elimRank : null,
    };
  });
  const sortFn: Record<RoyaleLeaderboardType, (a: RoyaleLeaderboardEntry, b: RoyaleLeaderboardEntry) => number> = {
    survival_rank: (a, b) => (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) || b.lives - a.lives || b.score - a.score,
    elimination_order: (a, b) => (b.eliminationRank ?? 0) - (a.eliminationRank ?? 0),
    remaining_lives: (a, b) => b.lives - a.lives,
    shields: (a, b) => b.shields - a.shields,
    score: (a, b) => b.score - a.score,
    accuracy: (a, b) => b.accuracy - a.accuracy,
    response_speed: (a, b) => a.avgSpeedMs - b.avgSpeedMs,
    longest_streak: (a, b) => b.longestStreak - a.longestStreak,
    teacher_dashboard: (a, b) => (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) || b.lives - a.lives,
    final_standings: (a, b) => (a.eliminated ? 1 : 0) - (b.eliminated ? 1 : 0) || b.lives - a.lives || b.score - a.score,
  };
  entries.sort(sortFn[type] ?? sortFn.survival_rank);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

// ===========================================================================
// System 8 — Achievements
// ===========================================================================

export const ROYALE_ACHIEVEMENTS: RoyaleAchievement[] = [
  { id: "last_survivor", name: "Last Survivor", description: "Win the match", condition: (s) => s.won, xpReward: 200 },
  { id: "untouchable", name: "Untouchable", description: "Win without losing a life", condition: (s) => s.won && s.mistakes === 0, xpReward: 150 },
  { id: "shield_master", name: "Shield Master", description: "Use 3 shields", condition: (s) => s.shieldsUsed >= 3, xpReward: 75 },
  { id: "comeback_king", name: "Comeback King", description: "Comeback 2+ times", condition: (s) => s.comebacks >= 2, xpReward: 100 },
  { id: "survivor", name: "Survivor", description: "Survive 5+ questions", condition: (s) => s.totalAnswered >= 5, xpReward: 25 },
  { id: "perfect_defender", name: "Perfect Defender", description: "Use shield on every mistake", condition: (s) => s.shieldsUsed === s.mistakes && s.mistakes > 0, xpReward: 75 },
  { id: "iron_mind", name: "Iron Mind", description: "Answer 10 correctly in a row", condition: (s) => s.longestStreak >= 10, xpReward: 100 },
  { id: "royal_champion", name: "Royal Champion", description: "Win 3 matches in a row (rank 1)", condition: (s) => s.won && s.rank === 1, xpReward: 150 },
  { id: "no_mistakes", name: "No Mistakes", description: "Zero wrong answers", condition: (s) => s.mistakes === 0 && s.totalAnswered > 0, xpReward: 100 },
  { id: "lucky_escape", name: "Lucky Escape", description: "Survive with 1 life remaining", condition: (s) => s.won && s.livesRemaining === 1, xpReward: 50 },
  { id: "shield_collector", name: "Shield Collector", description: "Have 2 shields at once", condition: (s) => s.shieldsRemaining >= 2, xpReward: 50 },
  { id: "fast_survivor", name: "Fast Survivor", description: "Answer in under 2s", condition: (s) => s.fastestMs > 0 && s.fastestMs <= 2000, xpReward: 75 },
  { id: "marathon_player", name: "Marathon Player", description: "Survive 15+ minutes", condition: (s) => s.survivedMs >= 900_000, xpReward: 75 },
  { id: "flawless_victory", name: "Flawless Victory", description: "Win with max lives", condition: (s) => s.won && s.livesRemaining >= 5, xpReward: 150 },
  { id: "legend", name: "Legend", description: "Win with no shields used", condition: (s) => s.won && s.shieldsUsed === 0, xpReward: 100 },
];

export function checkRoyaleAchievements(stats: RoyaleAchievementStats): RoyaleAchievement[] {
  return ROYALE_ACHIEVEMENTS.filter(a => a.condition(stats));
}

// ===========================================================================
// System 9 — Match Summary
// ===========================================================================

export function generateRoyaleMatchSummary(matchId: string): RoyaleMatchSummary | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const players = m.players.map(p => ({ userId: p.userId, displayName: p.displayName, matchId, score: p.score, correctAnswers: 0, totalAnswered: 0, avgSpeedMs: 0, longestStreak: 0 }));
  const leaderboard = buildRoyaleLeaderboard(players, "final_standings");
  const champion = leaderboard.find(e => !e.eliminated) ?? null;
  const sv = getSurvivalState(matchId);
  const events = getEvents(matchId);
  const teacherEvents = events.filter(e => e.type === "TeacherOverride");
  return {
    matchId, champion,
    eliminationTimeline: sv?.eliminatedPlayers ?? [],
    survivalGraph: sv?.eliminatedPlayers.map((e, i) => ({ timestamp: e.eliminatedAt, survivors: m.players.length - i - 1 })) ?? [],
    shieldUsage: { total: sv?.shieldUsageCount ?? 0, successful: sv?.shieldUsageCount ?? 0, expired: 0 },
    lifeHistory: { totalLivesLost: 0, totalLivesGained: 0, revives: sv?.comebackCount ?? 0 },
    averageAccuracy: leaderboard.length > 0 ? Math.round(leaderboard.reduce((s, e) => s + e.accuracy, 0) / leaderboard.length * 100) / 100 : 0,
    replayAvailable: !!getReplay(matchId),
    teacherReport: { interventions: teacherEvents.length, revives: teacherEvents.filter(e => (e.payload as Record<string, unknown>).action === "revive_player").length, pauses: teacherEvents.filter(e => (e.payload as Record<string, unknown>).action === "pause").length },
    achievements: leaderboard.map(e => ({ userId: e.userId, achievements: checkRoyaleAchievements({ won: !e.eliminated, livesRemaining: e.lives, shieldsUsed: 0, shieldsRemaining: e.shields, correctCount: 0, totalAnswered: 0, longestStreak: e.longestStreak, rank: e.rank, comebacks: 0, mistakes: 0, fastestMs: e.avgSpeedMs, survivedMs: 0 }).map(a => a.id) })),
  };
}

// ===========================================================================
// System 10 — Teacher Controls
// ===========================================================================

export function executeRoyaleTeacherAction(matchId: string, teacherId: string, action: RoyaleTeacherAction, payload?: Record<string, unknown>): RoyaleTeacherResult {
  const m = getMatch(matchId);
  if (!m) return { action, success: false, audited: false, eventId: null, message: "Match not found" };
  if (m.hostId !== teacherId) return { action, success: false, audited: false, eventId: null, message: "Only host can perform teacher actions" };
  let success = false; let message = "";
  switch (action) {
    case "pause": pauseTimer(matchId, "question"); success = true; message = "Match paused"; break;
    case "resume": resumeTimer(matchId, "question"); success = true; message = "Match resumed"; break;
    case "freeze": success = true; message = "Game frozen"; break;
    case "revive_player": if (payload?.userId) { revivePlayer(matchId, payload.userId as string); success = true; message = "Player revived"; } else { message = "userId required"; } break;
    case "grant_life": if (payload?.userId) { grantLife(matchId, payload.userId as string); success = true; message = "Life granted"; } else { message = "userId required"; } break;
    case "remove_life": if (payload?.userId) { loseLife(matchId, payload.userId as string, "teacher_removed"); success = true; message = "Life removed"; } else { message = "userId required"; } break;
    case "grant_shield": if (payload?.userId) { grantShield(matchId, payload.userId as string); success = true; message = "Shield granted"; } else { message = "userId required"; } break;
    case "remove_shield": if (payload?.userId) { const s = getShieldState(matchId, payload.userId as string); if (s) { s.shields = Math.max(0, s.shields - 1); success = true; message = "Shield removed"; } } else { message = "userId required"; } break;
    case "skip": success = true; message = "Question skipped"; break;
    case "reveal": success = true; message = "Info revealed"; break;
    case "hide": success = true; message = "Info hidden"; break;
    case "emergency_stop": attemptTransition(matchId, "cancelled"); success = true; message = "Emergency stop"; break;
    case "end_match": attemptTransition(matchId, "match_finished"); success = true; message = "Match ended"; break;
    default: message = "Unknown action";
  }
  const event = emitEvent(matchId, "TeacherOverride", teacherId, { action, success, ...payload });
  log.info("teacher.action", { action, matchId, success });
  return { action, success, audited: true, eventId: event.id, message };
}

// ===========================================================================
// System 11 — Student UX
// ===========================================================================

export function getRoyaleStudentUXState(matchId: string, userId: string): RoyaleStudentUXState {
  const m = getMatch(matchId);
  if (!m) return "loading";
  const ls = getLifeState(matchId, userId);
  if (ls?.isEliminated) return "eliminated";
  if (checkDangerState(matchId, userId)) return "danger";
  const ss = getShieldState(matchId, userId);
  if (ss && ss.shields > 0) return "shield_active";
  switch (m.state) {
    case "lobby": case "waiting_for_players": return "lobby";
    case "ready_check": return "ready";
    case "countdown": case "question_active": return "question";
    case "answer_collection": return "waiting";
    case "match_finished": case "rewards": case "replay_saved": case "archived": return checkFinalSurvivor(matchId) === userId ? "winner" : "summary";
    default: return "loading";
  }
}

// ===========================================================================
// System 13 — Analytics
// ===========================================================================

export function generateRoyaleAnalytics(matchId: string): RoyaleAnalytics | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const sv = getSurvivalState(matchId);
  const events = getEvents(matchId);
  return {
    matchId,
    // Build the distribution from the STRUCTURED deathReason field — the
    // legacy free-text `reason` is preserved on the record but no longer
    // used for aggregation (it could contain arbitrary notes).
    eliminationDistribution: sv?.eliminatedPlayers.reduce((acc, e) => {
      const key = e.deathReason ?? "manual_elimination";
      acc[key] = (acc[key] ?? 0) + 1; return acc;
    }, {} as Record<string, number>) ?? {},
    mistakes: 0, shieldsUsed: sv?.shieldUsageCount ?? 0, shieldSuccessRate: 1,
    comebackRate: sv?.comebackCount ?? 0, disconnects: m.statistics.dropoutCount, reconnects: m.statistics.reconnectCount,
    avgSurvivalMs: 0, longestSurvivalMs: sv?.longestSurvivalMs ?? 0, dropouts: m.statistics.dropoutCount,
    completionRate: m.state === "archived" || m.state === "match_finished" ? 1 : 0,
  };
}

/**
 * Build a per-DeathReason breakdown for a match. Useful for moderation
 * dashboards ("how many players were AFK this week?") and tournament
 * dispute resolution ("was this player disconnected or rule-violated?").
 */
export function getDeathReasonBreakdown(matchId: string): Record<DeathReason, number> {
  const sv = getSurvivalState(matchId);
  const empty: Record<DeathReason, number> = {
    wrong_answer: 0, timeout: 0, disconnected: 0, teacher_removed: 0,
    afk: 0, manual_elimination: 0, rule_violation: 0, reconnect_expired: 0,
  };
  if (!sv) return empty;
  for (const e of sv.eliminatedPlayers) {
    const key = e.deathReason ?? "manual_elimination";
    empty[key] += 1;
  }
  return empty;
}

// ===========================================================================
// System 14 — Accessibility
// ===========================================================================

export const ROYALE_ACCESSIBILITY: RoyaleAccessibilityConfig = {
  colorBlind: true, reducedMotion: false, screenReader: true, largeUI: false,
  keyboard: true, captions: true, timerWarnings: true, highContrast: false,
};

// ===========================================================================
// System 15 — Dashboard
// ===========================================================================

export function generateRoyaleDashboard(matchId: string): RoyaleDashboard | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const sv = getSurvivalState(matchId);
  const allPlayerIds = sv?.currentSurvivors.concat(sv.eliminationOrder) ?? m.players.map(p => p.userId);
  const players = allPlayerIds.map(id => {
    const mp = m.players.find(p => p.userId === id);
    return { userId: id, displayName: mp?.displayName ?? id, matchId, score: mp?.score ?? 0, correctAnswers: 0, totalAnswered: 0, avgSpeedMs: 0, longestStreak: 0 };
  });
  const leaderboard = buildRoyaleLeaderboard(players, "teacher_dashboard");
  const survivors = allPlayerIds.filter(id => { const ls = getLifeState(matchId, id); return ls && !ls.isEliminated; }).length;
  const totalShields = allPlayerIds.reduce((s, id) => s + (getShieldState(matchId, id)?.shields ?? 0), 0);
  const totalLives = allPlayerIds.reduce((s, id) => s + getLives(matchId, id), 0);
  const dangerPlayers = allPlayerIds.filter(id => checkDangerState(matchId, id));
  const events = getEvents(matchId);
  const interventions = events.filter(e => e.type === "TeacherOverride").length;
  return {
    matchId, survivors, eliminated: allPlayerIds.length - survivors,
    totalShields, totalLives, leaderboard, interventions, avgLatencyMs: 0,
    reconnects: m.statistics.reconnectCount, matchHealth: "healthy", dangerPlayers,
  };
}

// ===========================================================================
// System 16 — Anti-Cheat Extensions
// ===========================================================================

export function checkRoyaleCheats(matchId: string, userId: string, kind: "impossible_revive" | "duplicate_shield" | "illegal_life_count" | "forged_elimination", description: string, evidence: string): RoyaleCheatFinding {
  const finding = detectCheat({ matchId, userId, kind, description, evidence, severity: "high" });
  return { id: finding.id, matchId, userId, kind: finding.kind, severity: finding.severity, description: finding.description, evidence: finding.evidence };
}

// ===========================================================================
// System 17 — Balance Configuration
// ===========================================================================

export function getBalancePresets() { return BALANCE_PRESETS; }

// ===========================================================================
// System 18 — Replay Integration (reuses engine replay)
// ===========================================================================

export function getRoyaleReplayTimeline(matchId: string): Array<{ timestamp: string; event: string; details: string; deathReason?: DeathReason }> {
  const events = getEvents(matchId);
  return events.filter(e => ["PlayerLeft", "PlayerReconnected", "ScoreUpdated", "ResourceChanged", "TeacherOverride", "MatchFinished"].includes(e.type)).map(e => {
    const payload = e.payload as Record<string, unknown>;
    return {
      timestamp: e.timestamp, event: e.type,
      details: JSON.stringify(payload).slice(0, 100),
      // Surface the structured DeathReason on replay annotations so viewers
      // can see "Alice was eliminated — Reason: timeout" without parsing
      // free-text. Used by tournaments and anti-cheat review.
      deathReason: typeof payload.deathReason === "string" ? (payload.deathReason as DeathReason) : undefined,
    };
  });
}

// ===========================================================================
// Status
// ===========================================================================

export function getRoyaleStatus(matchId?: string) {
  return { gameMode: "quiz_royale", rules: ROYALE_RULES, presets: BALANCE_PRESETS.length, matchDetails: matchId ? getMatch(matchId) : null };
}
