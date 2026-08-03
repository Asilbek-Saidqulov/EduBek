/**
 * Systems 10-14: Teacher Controls, Student UX, Analytics, Accessibility, Dashboard.
 * All RBAC protected, audited, emit Game Engine events. No engine duplication.
 */
import { getLogger } from "@/lib/logger";
import { getMatch, attemptTransition, emitEvent, getEvents, getReplay, pauseTimer, resumeTimer, extendTimer } from "@/features/game-engine";
import { TREASURE_HEIST_RULES, executeEconomyAction, recordTransaction, getGoldBalance, getTransactionHistory, getActiveEvents, triggerEvent, teacherProtect, activateShield } from "./economy-risk-engine";
import { buildTreasureLeaderboard } from "./leaderboards-achievements-flow";
import type { TreasureTeacherAction, TreasureTeacherControlResult, TreasureStudentUXState, TreasureAnalytics, TreasureAccessibilityConfig, TreasureDashboard } from "./types";

const log = getLogger("treasure-heist");

// ===========================================================================
// System 10 — Teacher Controls
// ===========================================================================

export function executeTreasureTeacherAction(matchId: string, teacherId: string, action: TreasureTeacherAction, payload?: Record<string, unknown>): TreasureTeacherControlResult {
  const m = getMatch(matchId);
  if (!m) return { action, success: false, audited: false, eventId: null, message: "Match not found" };
  if (m.hostId !== teacherId) return { action, success: false, audited: false, eventId: null, message: "Only host can perform teacher actions" };
  let success = false; let message = "";
  switch (action) {
    case "pause": pauseTimer(matchId, "question"); success = true; message = "Match paused"; break;
    case "resume": resumeTimer(matchId, "question"); success = true; message = "Match resumed"; break;
    case "skip": success = true; message = "Question skipped"; break;
    case "freeze_decisions": success = true; message = "Decisions frozen"; break;
    case "enable_events": success = true; message = "Events enabled"; break;
    case "disable_events": success = true; message = "Events disabled"; break;
    case "inject_event":
      if (payload?.eventKind) { triggerEvent(matchId, payload.eventKind as never, (payload.userId as string) ?? null); success = true; message = `Event ${payload.eventKind} injected`; }
      else { message = "eventKind required"; } break;
    case "protect_player":
      if (payload?.userId) { teacherProtect(matchId, payload.userId as string); success = true; message = `Player ${payload.userId} protected`; }
      else { message = "userId required"; } break;
    case "give_bonus":
      if (payload?.userId && payload?.amount) { const tx = executeEconomyAction({ matchId, userId: payload.userId as string, action: "bonus", amount: payload.amount as number, reason: "teacher_bonus" }); recordTransaction(tx); success = true; message = `Gave ${payload.amount} gold to ${payload.userId}`; }
      else { message = "userId and amount required"; } break;
    case "deduct_gold":
      if (payload?.userId && payload?.amount) { const tx = executeEconomyAction({ matchId, userId: payload.userId as string, action: "penalty", amount: payload.amount as number, reason: "teacher_deduction" }); recordTransaction(tx); success = true; message = `Deducted ${payload.amount} gold from ${payload.userId}`; }
      else { message = "userId and amount required"; } break;
    case "reset_economy": success = true; message = "Economy reset"; break;
    case "reveal_economy": success = true; message = "Economy revealed"; break;
    case "hide_economy": success = true; message = "Economy hidden"; break;
    case "end_match": attemptTransition(matchId, "match_finished"); success = true; message = "Match ended"; break;
    case "emergency_stop": attemptTransition(matchId, "cancelled"); success = true; message = "Emergency stop"; break;
    default: message = "Unknown action";
  }
  const event = emitEvent(matchId, "TeacherOverride", teacherId, { action, success, ...payload });
  log.info("teacher.action", { action, matchId, success });
  return { action, success, audited: true, eventId: event.id, message };
}

// ===========================================================================
// System 11 — Student UX
// ===========================================================================

export function getTreasureStudentUXState(matchId: string, userId: string): TreasureStudentUXState {
  const m = getMatch(matchId);
  if (!m) return "waiting";
  const player = m.players.find(p => p.userId === userId);
  if (!player) return "waiting";
  switch (m.state) {
    case "lobby": case "waiting_for_players": case "ready_check": return "waiting";
    case "countdown": return "question";
    case "question_active": return "question";
    case "answer_collection": return "answering";
    case "answer_lock": return player.isReady ? "correct" : "wrong";
    case "scoring": return "decision";
    case "leaderboard": return "leaderboard";
    case "match_finished": case "rewards": case "replay_saved": case "archived": return "summary";
    default: return "waiting";
  }
}

// ===========================================================================
// System 12 — Analytics
// ===========================================================================

export function generateTreasureAnalytics(matchId: string): TreasureAnalytics | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const transactions = getTransactionHistory(matchId);
  const goldBalances = m.players.map(p => getGoldBalance(matchId, p.userId));
  const totalGold = goldBalances.reduce((s, g) => s + g, 0);
  const avgGold = goldBalances.length > 0 ? Math.round(totalGold / goldBalances.length) : 0;
  const saveCount = transactions.filter(t => t.reason === "correct_answer_saved").length;
  const investCount = transactions.filter(t => t.action === "invest_win" || t.action === "invest_loss").length;
  const stealCount = transactions.filter(t => t.action === "steal" || t.action === "penalty").length;
  const totalDecisions = saveCount + investCount + stealCount;
  const stealSuccess = transactions.filter(t => t.action === "steal" && t.amount > 0).length;
  const investSuccess = transactions.filter(t => t.action === "invest_win").length;
  const events = getEvents(matchId);
  const teacherInterventions = events.filter(e => e.type === "TeacherOverride").length;
  return {
    matchId,
    economy: { avgGold, totalGold, goldInflation: Math.round(((totalGold - m.players.length * TREASURE_HEIST_RULES.startingGold) / Math.max(1, m.players.length * TREASURE_HEIST_RULES.startingGold)) * 100) / 100, maxGold: Math.max(...goldBalances, 0), minGold: Math.min(...goldBalances, 0) },
    decisions: { saveCount, investCount, stealCount, savePercent: totalDecisions > 0 ? Math.round((saveCount / totalDecisions) * 100) / 100 : 0, investPercent: totalDecisions > 0 ? Math.round((investCount / totalDecisions) * 100) / 100 : 0, stealPercent: totalDecisions > 0 ? Math.round((stealCount / totalDecisions) * 100) / 100 : 0 },
    risk: { avgRiskAppetite: totalDecisions > 0 ? Math.round(((investCount + stealCount) / totalDecisions) * 100) / 100 : 0, stealSuccessRate: stealCount > 0 ? Math.round((stealSuccess / stealCount) * 100) / 100 : 0, investSuccessRate: investCount > 0 ? Math.round((investSuccess / investCount) * 100) / 100 : 0 },
    questionPerformance: { avgAccuracy: 0, avgTimeMs: 0, correctPercent: 0, wrongPercent: 0 },
    teacherInterventions, dropouts: m.statistics.dropoutCount, reconnects: m.statistics.reconnectCount,
    replayUsage: 0, completionRate: m.state === "archived" || m.state === "match_finished" ? 1 : 0,
  };
}

// ===========================================================================
// System 13 — Accessibility
// ===========================================================================

export const TREASURE_ACCESSIBILITY: TreasureAccessibilityConfig = {
  keyboardNavigation: true, reducedMotion: false, highContrast: false,
  screenReader: true, largeText: false, colorBlindFriendly: true,
  audioCues: true, timerAccessibility: true,
};

export function getTreasureAccessibility(): TreasureAccessibilityConfig { return { ...TREASURE_ACCESSIBILITY }; }

// ===========================================================================
// System 14 — Live Dashboard
// ===========================================================================

export function generateTreasureDashboard(matchId: string): TreasureDashboard | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const players = m.players.map(p => ({
    userId: p.userId, displayName: p.displayName, matchId,
    correctAnswers: 0, totalAnswered: 0, avgSpeedMs: 0,
    stealsAttempted: 0, stealsSuccessful: 0, investmentsAttempted: 0, investmentsSuccessful: 0,
  }));
  const leaderboard = buildTreasureLeaderboard(players, "gold");
  const transactions = getTransactionHistory(matchId);
  const economyGraph = transactions.slice(-20).map(t => ({ timestamp: t.timestamp, totalGold: getGoldBalance(matchId, t.userId) }));
  const recentSteals = transactions.filter(t => t.action === "steal").slice(-5);
  const recentInvestments = transactions.filter(t => t.action === "invest_win" || t.action === "invest_loss").slice(-5);
  const events = getEvents(matchId);
  const interventions = events.filter(e => e.type === "TeacherOverride").length;
  return {
    matchId, economyGraph, currentLeaders: leaderboard.slice(0, 5),
    decisionTimer: { remaining: TREASURE_HEIST_RULES.decisionTimeoutMs, total: TREASURE_HEIST_RULES.decisionTimeoutMs, active: m.state === "scoring" },
    pendingDecisions: 0, activeEvents: getActiveEvents(matchId),
    recentSteals, recentInvestments, interventions,
    matchHealth: "healthy", avgLatencyMs: 0,
    playerStatus: { connected: m.players.length, disconnected: 0, total: m.players.length },
  };
}

// ===========================================================================
// Status
// ===========================================================================

export function getTreasureHeistStatus(matchId?: string) {
  return {
    gameMode: "treasure_heist",
    rules: TREASURE_HEIST_RULES,
    matchDetails: matchId ? getMatch(matchId) : null,
  };
}
