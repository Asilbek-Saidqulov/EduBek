/**
 * EduBek — Learning Planner types.
 *
 * Phase 4F.3: Adaptive Learning Planner, AI Study Planner, Spaced
 * Repetition (SM-2), Adaptive Difficulty, AI Coach, Milestones,
 * Velocity, Burnout Detection, Daily Agenda, Weekly Report, Goal
 * Management, Streak Intelligence, Smart Notifications, Analytics.
 *
 * All DTOs are JSON-serializable so they can flow through API routes,
 * the event bus, and the notification system without transformation.
 */

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------

export interface LearningGoalConstraints {
  targetDate?: string;
  dailyMinutes?: number;
  currentLevel?: "beginner" | "intermediate" | "advanced";
  targetLevel?: "beginner" | "intermediate" | "advanced";
  topics?: string[];
}

export interface LearningGoalDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  constraints: LearningGoalConstraints;
  completionPct: number;
  confidence: number;
  estimatedFinish: string | null;
  achievedAt: string | null;
  status: "active" | "paused" | "achieved" | "archived";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export interface LearningPlanMetadata {
  difficultyCurve?: Array<{ week: number; difficulty: Difficulty }>;
  estimatedTotalMinutes?: number;
  confidenceScore?: number;
  generatorVersion?: string;
  weeklySchedule?: WeeklySchedule[];
}

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface WeeklySchedule {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  days: Array<{
    dayOfWeek: number; // 0 = Sunday
    sessions: Array<{
      type: PlanItemType;
      durationMinutes: number;
      title: string;
      topic?: string;
    }>;
  }>;
}

export interface LearningPlanDto {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  metadata: LearningPlanMetadata;
  completionPct: number;
  masteryPct: number;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: LearningPlanItemDto[];
}

export type PlanItemType =
  | "lesson"
  | "quiz"
  | "review"
  | "ai_session"
  | "marketplace"
  | "practice"
  | "mock_exam";

export type PlanItemStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface PlanItemRecommendation {
  reason: string;
  reasonKey: string;
  confidence: number; // 0-1
  expectedImpactPct: number; // e.g. +18 means +18% mastery
  actionItems: string[];
}

export interface LearningPlanItemDto {
  id: string;
  planId: string;
  sortOrder: number;
  itemType: PlanItemType;
  entityType: string;
  entityId: string;
  title: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  recommendation: PlanItemRecommendation;
  status: PlanItemStatus;
  startedAt: string | null;
  completedAt: string | null;
  actualMinutes: number;
  masteryScore: number | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Study Session
// ---------------------------------------------------------------------------

export type StudySessionType =
  | "study"
  | "review"
  | "quiz"
  | "ai_tutor"
  | "practice"
  | "mock_exam";

export interface StudySessionDto {
  id: string;
  userId: string;
  planId: string | null;
  planItemId: string | null;
  learningSessionId: string | null;
  sessionType: StudySessionType;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  accuracy: number | null;
  difficulty: Difficulty | null;
  mood: number | null;
  energy: number | null;
  focus: number | null;
  metadata: {
    topicsCovered?: string[];
    weakSignals?: string[];
    strongSignals?: string[];
    [k: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// Spaced Repetition (SM-2)
// ---------------------------------------------------------------------------

export interface ReviewScheduleDto {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewAt: string | null;
  forgettingScore: number;
  metadata: {
    lastQuality?: number;
    history?: Array<{ date: string; quality: number; timeMs?: number }>;
    [k: string]: unknown;
  };
}

export interface ReviewHistoryDto {
  id: string;
  userId: string;
  reviewScheduleId: string;
  quality: number; // 0-5
  responseMs: number | null;
  correct: boolean;
  createdAt: string;
}

/**
 * SM-2 review input. Quality follows the SuperMemo convention:
 *   0 = complete blackout
 *   1 = incorrect, but felt familiar
 *   2 = incorrect, but easy to recall once shown
 *   3 = correct, but with serious difficulty
 *   4 = correct, after some hesitation
 *   5 = perfect, instant recall
 */
export interface Sm2ReviewInput {
  userId: string;
  entityType: string;
  entityId: string;
  quality: number; // 0-5
  responseMs?: number;
}

export interface Sm2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  forgettingScore: number;
}

// ---------------------------------------------------------------------------
// Adaptive Difficulty
// ---------------------------------------------------------------------------

export interface AdaptiveDifficultyInput {
  /** Current difficulty (before adjustment). */
  current: Difficulty;
  /** 0-1 — fraction of correct answers in recent attempts. */
  accuracy: number;
  /** Average response time in seconds for recent attempts. */
  avgResponseSec: number;
  /** Learner's subjective confidence 1-5. */
  confidence?: number;
  /** Current streak of correct answers. */
  streak?: number;
  /** Mastery 0-1 of the topic. */
  mastery?: number;
  /** Number of recent failures (last 5). */
  recentFailures?: number;
}

export interface AdaptiveDifficultyResult {
  next: Difficulty;
  reason: string;
  reasonKey: string;
  change: "up" | "down" | "same";
  confidence: number;
}

// ---------------------------------------------------------------------------
// AI Coach Recommendation
// ---------------------------------------------------------------------------

export interface AiCoachRecommendation {
  type:
    | "review_prerequisite"
    | "practice_weak"
    | "advance_topic"
    | "ai_tutor_session"
    | "take_break"
    | "review_forgotten"
    | "mock_exam"
    | "marketplace_resource"
    | "change_difficulty";
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  reason: string;
  reasonKey: string;
  confidence: number;
  expectedImpactPct: number;
  estimatedMinutes: number;
  priority: number; // 1 = highest
  actionItems: string[];
  actionItemKeys: string[];
  language: string;
}

// ---------------------------------------------------------------------------
// Milestone
// ---------------------------------------------------------------------------

export type MilestoneType =
  | "topic_mastered"
  | "questions_completed"
  | "plan_finished"
  | "streak_reached"
  | "readiness_reached"
  | "concept_learned";

export interface LearningMilestoneDto {
  id: string;
  userId: string;
  type: MilestoneType;
  title: string;
  description: string | null;
  metadata: {
    topic?: string;
    value?: number;
    threshold?: number;
    goalId?: string;
    [k: string]: unknown;
  };
  achievedAt: string;
  notifiedAt: string | null;
}

// ---------------------------------------------------------------------------
// Velocity
// ---------------------------------------------------------------------------

export interface LearningVelocityDto {
  userId: string;
  weekStart: string;
  conceptsLearned: number;
  minutesStudied: number;
  masteryGained: number;
  quizImprovement: number;
  consistency: number; // 0-1
  dropOffProbability: number; // 0-1
  /** Per-day study minutes for the trailing 7 days. */
  dailyMinutes: Array<{ day: string; minutes: number }>;
}

// ---------------------------------------------------------------------------
// Burnout Detection
// ---------------------------------------------------------------------------

export interface BurnoutReport {
  isBurnout: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  factors: Array<{
    factor: string;
    factorKey: string;
    value: number;
    threshold: number;
    triggered: boolean;
  }>;
  recommendations: Array<{
    text: string;
    textKey: string;
  }>;
}

// ---------------------------------------------------------------------------
// Streak Intelligence
// ---------------------------------------------------------------------------

export interface StreakIntelligence {
  dayStreak: number;
  qualityStreak: number;
  effectiveStreak: number;
  masteryStreak: number;
  reviewStreak: number;
  longestStreak: number;
}

// ---------------------------------------------------------------------------
// Daily Agenda
// ---------------------------------------------------------------------------

export interface DailyAgendaItem {
  itemType: PlanItemType;
  entityType: string;
  entityId: string;
  title: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  reason: string;
  reasonKey: string;
  priority: number;
  planItemId?: string;
  planId?: string;
}

export interface DailyAgenda {
  userId: string;
  date: string;
  items: DailyAgendaItem[];
  reviewsDue: number;
  studyMinutesRemaining: number;
  completionPct: number;
  /** 1-5 estimated learner energy for the day (avg of recent sessions). */
  energyEstimate: number;
  totalEstimatedMinutes: number;
}

// ---------------------------------------------------------------------------
// Weekly Progress Report
// ---------------------------------------------------------------------------

export interface WeeklyReport {
  userId: string;
  weekStart: string;
  weekEnd: string;
  topicsLearned: string[];
  timeSpentMs: number;
  masteryGained: number;
  weakTopics: string[];
  strongTopics: string[];
  quizImprovement: number;
  streak: StreakIntelligence;
  recommendations: AiCoachRecommendation[];
  /** AI-generated natural-language summary. */
  aiSummary: string;
  aiSummaryKey: string;
  milestonesThisWeek: LearningMilestoneDto[];
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface LearningAnalytics {
  userId: string;
  range: { from: string; to: string };
  totalStudyTimeMs: number;
  retentionRate: number; // 0-1
  masteryAvg: number;
  difficultyTrend: Array<{ day: string; difficulty: number }>;
  reviewSuccessRate: number;
  recommendationAcceptance: number;
  aiUsageCount: number;
  goalCompletionPct: number;
  velocityScore: number;
  burnout: BurnoutReport;
  streak: StreakIntelligence;
}

// ---------------------------------------------------------------------------
// Plan lifecycle inputs
// ---------------------------------------------------------------------------

export interface CreateStudyPlanInput {
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  /** The learner's daily available study time in minutes. */
  dailyMinutes?: number;
  /** Target completion date. */
  targetDate?: string;
  /** Starting difficulty — auto if omitted. */
  startingDifficulty?: Difficulty;
  /** Locale for AI-generated reason text. */
  locale?: string;
}

export interface UpdateStudyPlanInput {
  title?: string;
  description?: string;
  status?: "draft" | "active" | "paused" | "completed" | "archived";
  metadata?: Partial<LearningPlanMetadata>;
}

export interface RecommendNextLessonInput {
  userId: string;
  planId: string;
  locale?: string;
}

export interface EstimateCompletionInput {
  planId: string;
}

export interface EstimateCompletionResult {
  planId: string;
  estimatedFinishDate: string;
  confidence: number;
  remainingMinutes: number;
  daysRemaining: number;
  velocity: number; // minutes/day
}
