import { buildBattleBracket, BATTLE_DUEL_QUESTIONS } from "@/features/multiplayer/mode-rules";
import type { AuthoritativePlayer } from "@/features/multiplayer/types";

export function getByes(playerIds: string[]) {
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, playerIds.length)));
  return Math.max(0, size - playerIds.length);
}

export function getAdvancementEvents(playerIds: string[]) {
  return buildBattleBracket(playerIds);
}

export function generateBattleDashboard(players: AuthoritativePlayer[]) {
  return {
    bracket: buildBattleBracket(players.map((p) => p.id)),
    duelQuestions: BATTLE_DUEL_QUESTIONS,
    scores: players.map((p) => ({ id: p.id, name: p.displayName, points: p.modeState?.battlePoints ?? p.score })),
  };
}

export { buildBattleBracket, BATTLE_DUEL_QUESTIONS };
export type BattleRoyaleLeaderboardType = "points" | "bracket";
export const getBracket = getAdvancementEvents;
export const getTournament = generateBattleDashboard;
export const generateDashboard = generateBattleDashboard;
export const generateAnalytics = generateBattleDashboard;
export function buildLeaderboard(players: AuthoritativePlayer[] = []) {
  return generateBattleDashboard(players).scores;
}
export function getChampionship() {
  return { title: "EduBek Battle Royale", duelQuestions: BATTLE_DUEL_QUESTIONS };
}
export function listDuels(playerIds: string[] = []) {
  return buildBattleBracket(playerIds);
}
export function getWalkovers() { return []; }
export function getTieResolutions() { return []; }
export function getReplayTimeline() { return []; }
export function getBalancePresets() { return { duelQuestions: BATTLE_DUEL_QUESTIONS }; }
export function getBattleRoyaleStatus() {
  return { mode: "battle", ready: true };
}
export function getRules() {
  return { duelQuestions: BATTLE_DUEL_QUESTIONS, format: "single-elim" };
}