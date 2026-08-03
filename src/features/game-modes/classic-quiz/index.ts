/** Classic Quiz barrel export. Phase 6G.2. */
export { CLASSIC_QUIZ_RULES, getRules, validateRules, calculateScore, calculateScoreWithPlugin, SCORING_CONFIG, createStreakState, updateStreak, checkStreakMilestones, STREAK_MILESTONES, buildLeaderboard, ACHIEVEMENTS, checkAchievements, calculateXP,
  startClassicQuizMatch, runQuestionFlow, submitAnswer, lockAnswers, advanceToNextQuestion, executeTeacherAction, getStudentUXState, generateMatchSummary, generateMatchAnalytics, generateReplayTimeline, checkClassicQuizCheats, ACCESSIBILITY_CONFIG, getAccessibilityConfig, generateTeacherDashboard, getClassicQuizStatus,
} from "./service";

export type {
  ClassicQuizRules, QuestionFlowPhase, ScoreInput, ScoreResult,
  StreakState, StreakMilestone, LeaderboardType, LeaderboardEntry,
  TeacherAction, TeacherControlResult, StudentUXState, MatchSummary,
  QuestionAnalytics, StudentAnalytics, MatchAnalytics, Achievement,
  ReplayTimelineEvent, ClassicQuizCheatFinding, AccessibilityConfig, TeacherDashboard,
} from "./types";
