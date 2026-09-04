import { classicScore } from "./mode-rules";
import { AuthoritativeQuestion, AuthoritativePlayer, LeaderboardEntry } from "./types";

export interface ScoreCalculationResult {
  isCorrect: boolean;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  totalPoints: number;
}

/**
 * Checks correctness of a submitted answer against the authoritative question.
 */
export function checkAnswerCorrectness(
  question: AuthoritativeQuestion,
  answer: string | number | string[]
): boolean {
  if (answer === undefined || answer === null) return false;

  switch (question.type) {
    case "multiple_choice": {
      // Answer may be submitted as option index (number) or option string
      if (typeof answer === "number") {
        if (question.correctIndex !== undefined) {
          return answer === question.correctIndex;
        }
        if (question.correctAnswer && question.options[answer]) {
          return (
            question.options[answer].trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase()
          );
        }
        return false;
      }

      if (typeof answer === "string") {
        const cleanAnswer = answer.trim().toLowerCase();
        if (question.correctAnswer) {
          return cleanAnswer === question.correctAnswer.trim().toLowerCase();
        }
        if (
          question.correctIndex !== undefined &&
          question.options[question.correctIndex]
        ) {
          return (
            cleanAnswer ===
            question.options[question.correctIndex].trim().toLowerCase()
          );
        }
      }
      return false;
    }

    case "true_false": {
      const boolStr = String(answer).trim().toLowerCase();
      const targetStr = question.correctAnswer
        ? question.correctAnswer.trim().toLowerCase()
        : question.correctIndex === 0
        ? "true"
        : "false";

      if (boolStr === "true" || boolStr === "1" || boolStr === "t") {
        return targetStr === "true" || targetStr === "1" || targetStr === "t";
      }
      if (boolStr === "false" || boolStr === "0" || boolStr === "f") {
        return targetStr === "false" || targetStr === "0" || targetStr === "f";
      }
      return boolStr === targetStr;
    }

    case "short_answer": {
      const rawText = String(answer).trim().toLowerCase();
      if (!rawText) return false;

      // Check primary correct answer
      if (
        question.correctAnswer &&
        rawText === question.correctAnswer.trim().toLowerCase()
      ) {
        return true;
      }

      // Check acceptable alternative answers
      if (
        Array.isArray(question.acceptableAnswers) &&
        question.acceptableAnswers.some(
          (acc) => acc.trim().toLowerCase() === rawText
        )
      ) {
        return true;
      }

      return false;
    }

    case "multiple_select": {
      if (!Array.isArray(answer)) return false;
      const submitted = answer.map((a) => String(a).trim().toLowerCase()).sort();
      const acceptable = (question.acceptableAnswers || []).map((a) =>
        a.trim().toLowerCase()
      ).sort();

      if (submitted.length !== acceptable.length) return false;
      return submitted.every((val, idx) => val === acceptable[idx]);
    }

    default:
      return false;
  }
}

/**
 * Calculates authoritative score, speed bonus, and streak bonus using integer arithmetic.
 */
export function calculateAuthoritativeScore(
  question: AuthoritativeQuestion,
  answer: string | number | string[],
  responseMs: number,
  currentStreak: number
): ScoreCalculationResult {
  const isCorrect = checkAnswerCorrectness(question, answer);
  if (!isCorrect) {
    return {
      isCorrect: false,
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalPoints: 0,
    };
  }

  const scored = classicScore(true, responseMs);
  return {
    isCorrect: true,
    basePoints: scored.basePoints,
    speedBonus: scored.speedBonus,
    streakBonus: 0,
    totalPoints: scored.totalPoints,
  };
}

/**
 * Deterministic Leaderboard Sorting & Ranking
 * 
 * Primary: score DESC
 * Secondary: correctCount DESC
 * Tertiary: avgResponseMs ASC
 * Quaternary: joinedAt ASC
 * Tie-breaker: playerId ASC
 */
export function sortAndRankPlayers(
  players: AuthoritativePlayer[],
  previousRanks?: Map<string, number>
): LeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => {
    // 1. Score
    if (b.score !== a.score) return b.score - a.score;
    // 2. Correct Count
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    // 3. Avg Response Time (faster is better)
    if (a.avgResponseMs !== b.avgResponseMs) return a.avgResponseMs - b.avgResponseMs;
    // 4. Joined Time (earlier is better)
    const timeDiff = a.joinedAt.getTime() - b.joinedAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    // 5. Deterministic ID tie-breaker
    return a.id.localeCompare(b.id);
  });

  return sorted.map((player, index) => {
    const rank = index + 1;
    const prevRank = previousRanks?.get(player.id) ?? rank;
    const change = prevRank - rank; // positive means climbed up

    return {
      playerId: player.id,
      userId: player.userId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
      role: player.role,
      score: player.score,
      rank,
      correctCount: player.correctCount,
      currentStreak: player.currentStreak,
      lastPointsEarned: player.lastPointsEarned,
      change,
      isReady: player.isReady,
      status: player.status,
      hasAnsweredCurrentRound: player.hasAnsweredCurrentRound,
    };
  });
}
