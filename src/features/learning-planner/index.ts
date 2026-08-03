/**
 * EduBek — Learning Planner barrel export.
 *
 * Phase 4F.3: AI Learning Orchestrator, Adaptive Learning Paths,
 * Intelligent Study Planner, Spaced Repetition (SM-2), Adaptive
 * Difficulty, AI Coach, Milestones, Velocity, Burnout Detection,
 * Daily Agenda, Weekly Report, Goal Management, Streak Intelligence,
 * Smart Notifications, Analytics.
 *
 * Everything is additive — no breaking changes to Phase 4F.1/4F.2.
 */
// Service (plan lifecycle, goals, sessions, reviews)
export {
  // Goals
  createGoal,
  listGoals,
  getGoal,
  // Plans
  createStudyPlan,
  listPlans,
  getPlan,
  updateStudyPlan,
  pausePlan,
  resumePlan,
  finishPlan,
  archivePlan,
  recommendNextLesson,
  estimateCompletion,
  adjustPlanItemDifficulty,
  completePlanItem,
  // Reviews (SM-2)
  recordReview,
  recordReviewAuto,
  getReviewSchedule,
  listDueReviews,
  listUpcomingReviews,
  // Sessions
  recordStudySession,
  listStudySessions,
} from "./service";

// Spaced Repetition (SM-2) — pure functions for testing
export {
  applySm2,
  computeForgettingScore,
  suggestQuality,
  defaultPriorState,
  type PriorSm2State,
} from "./spaced-repetition";

// Adaptive Difficulty — pure functions for testing
export {
  adjustDifficulty,
  difficultyToNumber,
  numberToDifficulty,
} from "./adaptive-difficulty";

// AI Coach
export {
  generateCoachRecommendations,
  estimateExpectedImpact,
} from "./ai-coach";

// Milestones
export {
  recordTopicMastered,
  recordQuestionsCompleted,
  recordPlanFinished,
  recordStreakReached,
  recordReadinessReached,
  recordConceptLearned,
  listMilestones,
  listMilestonesSince,
} from "./milestones";

// Velocity + Burnout + Streak
export {
  computeWeeklyVelocity,
  getVelocityHistory,
  detectBurnout,
  computeStreakIntelligence,
} from "./velocity";

// Daily Agenda
export { getDailyAgenda } from "./agenda";

// Weekly Report
export { generateWeeklyReport } from "./report";

// Types
export type {
  LearningGoalConstraints,
  LearningGoalDto,
  LearningPlanMetadata,
  Difficulty,
  WeeklySchedule,
  LearningPlanDto,
  PlanItemType,
  PlanItemStatus,
  PlanItemRecommendation,
  LearningPlanItemDto,
  StudySessionType,
  StudySessionDto,
  ReviewScheduleDto,
  ReviewHistoryDto,
  Sm2ReviewInput,
  Sm2Result,
  AdaptiveDifficultyInput,
  AdaptiveDifficultyResult,
  AiCoachRecommendation,
  MilestoneType,
  LearningMilestoneDto,
  LearningVelocityDto,
  BurnoutReport,
  StreakIntelligence,
  DailyAgendaItem,
  DailyAgenda,
  WeeklyReport,
  LearningAnalytics,
  CreateStudyPlanInput,
  UpdateStudyPlanInput,
  RecommendNextLessonInput,
  EstimateCompletionInput,
  EstimateCompletionResult,
} from "./types";
