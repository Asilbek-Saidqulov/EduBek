import type { AuthoritativePlayer } from "@/features/multiplayer/types";
import { classicAchievements, classicScore } from "@/features/multiplayer/mode-rules";

export function checkAchievements(players: AuthoritativePlayer[]) {
  return players.map((p) => ({
    playerId: p.id,
    displayName: p.displayName,
    ...classicAchievements({
      score: p.score,
      correctCount: p.correctCount,
      answeredCount: p.answeredCount,
      longestStreak: p.longestStreak,
    }),
  }));
}

export function generateMatchAnalytics(players: AuthoritativePlayer[]) {
  const answered = players.reduce((s, p) => s + p.answeredCount, 0);
  const correct = players.reduce((s, p) => s + p.correctCount, 0);
  return {
    playerCount: players.length,
    averageScore: players.length ? Math.round(players.reduce((s, p) => s + p.score, 0) / players.length) : 0,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    topScore: Math.max(0, ...players.map((p) => p.score)),
  };
}

export function generateTeacherDashboard(players: AuthoritativePlayer[]) {
  return {
    analytics: generateMatchAnalytics(players),
    achievements: checkAchievements(players),
    ranking: [...players].sort((a, b) => b.score - a.score).map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      name: p.displayName,
      score: p.score,
      accuracy: p.accuracy,
    })),
  };
}

export { classicScore };
export const calculateScore = classicScore;
export const generateMatchSummary = generateMatchAnalytics;
export function buildLeaderboard(players: AuthoritativePlayer[] = []) {
  return generateTeacherDashboard(players).ranking;
}
export function getRules() {
  return { mode: "classic", basePoints: 500, maxPoints: 1000 };
}
export function getClassicStatus() {
  return { mode: "classic", ready: true };
}
export const getClassicQuizStatus = getClassicStatus;