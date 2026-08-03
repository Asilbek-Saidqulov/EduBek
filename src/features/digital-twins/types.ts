/**
 * EduBek — Digital Twins types.
 *
 * Phase 5A.1: Autonomous Classroom Operations & Digital Twin Platform.
 * Live digital twins for classrooms, students, teachers, and institutions,
 * plus academic calendar, autonomous workflows, longitudinal memory,
 * scenario planning, and an autonomous operations center.
 *
 * All DTOs are JSON-serializable + carry messageKey / params for i18n.
 */

// ---------------------------------------------------------------------------
// Twin types
// ---------------------------------------------------------------------------

export type TwinType = "classroom" | "student" | "teacher" | "institution";

export interface DigitalTwinDto {
  id: string;
  twinType: TwinType;
  entityId: string;
  state: Record<string, unknown>;
  version: number;
  lastSyncedAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Classroom Twin
// ---------------------------------------------------------------------------

export interface ClassroomTwinState {
  classroomId: string;
  classroomName: string;
  teacherId: string;
  studentCount: number;
  // Curriculum progress 0-100
  curriculumProgress: number;
  // Avg mastery 0-1
  avgMastery: number;
  // Engagement rate 0-1
  engagementRate: number;
  // Assignment completion rate 0-1
  assignmentCompletionRate: number;
  // Attendance rate 0-1
  attendanceRate: number;
  // Predicted exam readiness 0-1
  predictedExamReadiness: number;
  // Risk indicators
  riskIndicators: Array<{ type: string; severity: "low" | "medium" | "high"; description: string }>;
  // AI recommendations
  aiRecommendations: Array<{ type: string; title: string; priority: number }>;
  // Resource usage stats
  resourceUsage: { totalResources: number; aiGenerated: number; marketplacePurchased: number };
  // Discussion activity
  discussionActivity: { totalThreads: number; totalReplies: number; activeThreads: number };
  // Collaboration graph density 0-1
  collaborationDensity: number;
  // Weak topics
  weakTopics: Array<{ topic: string; mastery: number }>;
  // At-risk students
  atRiskStudents: Array<{ userId: string; riskScore: number; reason: string }>;
  // Last updated
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Student Twin
// ---------------------------------------------------------------------------

export interface StudentTwinState {
  userId: string;
  userName: string | null;
  // Knowledge map — concepts the student has encountered
  knowledgeMap: {
    mastered: string[];
    learning: string[];
    weak: string[];
    forgotten: string[];
  };
  // Mastery graph — concept → mastery level
  masteryGraph: Array<{ concept: string; mastery: number; lastPracticed: string | null }>;
  // Active misconceptions
  misconceptions: Array<{ concept: string; misconception: string; detectedAt: string }>;
  // Learning style
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
    preferredPace: "slow" | "medium" | "fast";
    preferredDifficulty: "easy" | "medium" | "hard";
  };
  // Pacing — actual vs expected
  pacing: {
    currentVelocity: number; // concepts/day
    expectedVelocity: number;
    onTrack: boolean;
  };
  // Predictions
  predictions: {
    predictedGrade: string | null;
    predictedDropoutRisk: number; // 0-1
    predictedMastery: number; // 0-1
    predictedExamScore: number | null; // 0-1
  };
  // AI intervention history
  interventionHistory: Array<{
    type: string;
    description: string;
    timestamp: string;
    outcome: "positive" | "negative" | "neutral" | "pending";
  }>;
  // Strengths + weaknesses
  strengths: string[];
  weaknesses: string[];
  // Confidence evolution — last 10 data points
  confidenceEvolution: Array<{ date: string; confidence: number }>;
  // Review schedule
  reviewSchedule: Array<{ concept: string; nextReviewAt: string; intervalDays: number }>;
  // Streak info
  streak: { dayStreak: number; qualityStreak: number; longestStreak: number };
  // Last updated
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Teacher Twin
// ---------------------------------------------------------------------------

export interface TeacherTwinState {
  userId: string;
  userName: string | null;
  // Classroom count
  classroomCount: number;
  // Total student count across classrooms
  totalStudents: number;
  // Lesson quality avg 0-1
  lessonQuality: number;
  // Curriculum coverage across classrooms 0-1
  curriculumCoverage: number;
  // Avg classroom engagement 0-1
  classroomEngagement: number;
  // Grading load — pending submissions to grade
  gradingLoad: { pendingSubmissions: number; avgGradingTimeMs: number };
  // AI usage
  aiUsage: { totalSessions: number; totalCreditsUsed: number; topUseCases: string[] };
  // Intervention effectiveness 0-1
  interventionEffectiveness: number;
  // Student improvement trend (avg mastery change over last 30 days)
  studentImprovement: number;
  // Content production — resources created in last 30 days
  contentProduction: { resourcesCreated: number; aiGenerated: number; marketplacePublished: number };
  // Collaboration — study groups, discussions, peer recommendations
  collaboration: { studyGroups: number; discussionsStarted: number; peerRecommendations: number };
  // Workload score 0-1 (higher = more overloaded)
  workloadScore: number;
  // Last updated
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Institution Twin
// ---------------------------------------------------------------------------

export interface InstitutionTwinState {
  organizationId: string;
  organizationName: string;
  // Curriculum completion 0-1
  curriculumCompletion: number;
  // Teacher workload avg 0-1
  teacherWorkload: number;
  // AI adoption 0-1
  aiAdoption: number;
  // Certification progress
  certificationProgress: { totalEnrolled: number; totalCompleted: number; avgScore: number };
  // Resource quality avg 0-1
  resourceQuality: number;
  // Department performance
  departmentPerformance: Array<{ department: string; mastery: number; engagement: number }>;
  // Budget estimates
  budgetEstimates: {
    aiCreditsUsed: number;
    aiCreditsProjected: number;
    marketplaceSpending: number;
    estimatedCostPerStudent: number;
  };
  // Infrastructure health
  infrastructureHealth: {
    overallScore: number;
    subsystems: Array<{ name: string; status: string; score: number }>;
  };
  // Knowledge coverage 0-1
  knowledgeCoverage: number;
  // Academic trends
  academicTrends: Array<{ metric: string; trend: "up" | "down" | "flat"; value: number }>;
  // Last updated
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Academic Calendar
// ---------------------------------------------------------------------------

export interface AcademicCalendarDto {
  id: string;
  organizationId: string | null;
  year: string;
  term: string | null;
  startDate: string;
  endDate: string;
  schedule: {
    holidays: Array<{ date: string; name: string }>;
    gradingPeriods: Array<{ start: string; end: string; name: string }>;
    examPeriods: Array<{ start: string; end: string; name: string }>;
  };
  status: "planned" | "active" | "completed" | "archived";
  events: CalendarEventDto[];
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType =
  | "holiday"
  | "exam"
  | "grading_period"
  | "curriculum_deadline"
  | "school_event"
  | "teacher_event";

export interface CalendarEventDto {
  id: string;
  calendarId: string;
  type: CalendarEventType;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  scopeType: string | null;
  scopeId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Academic Workflows
// ---------------------------------------------------------------------------

export type AcademicWorkflowTrigger =
  | "quiz_finished"
  | "lesson_completed"
  | "assignment_submitted"
  | "student_at_risk"
  | "curriculum_gap"
  | "semester_start"
  | "exam_period_start";

export interface AcademicWorkflowStep {
  step: number;
  agent: string;
  task: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

export interface AcademicWorkflowDto {
  id: string;
  trigger: AcademicWorkflowTrigger;
  name: string;
  scopeType: string | null;
  scopeId: string | null;
  steps: AcademicWorkflowStep[];
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  result: unknown;
  executionMs: number;
  triggerEntityId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Academic Memory
// ---------------------------------------------------------------------------

export type AcademicMemoryScope = "student" | "teacher" | "classroom" | "organization";

export type AcademicMemoryType =
  | "enrollment"
  | "curriculum_history"
  | "intervention"
  | "achievement"
  | "trajectory"
  | "teacher_assignment"
  | "class_composition";

export interface AcademicMemoryDto {
  id: string;
  scopeType: AcademicMemoryScope;
  scopeId: string;
  academicYear: string;
  type: AcademicMemoryType;
  summary: string;
  payload: Record<string, unknown>;
  importance: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Scenario Plans
// ---------------------------------------------------------------------------

export type ScenarioType =
  | "make_subject_mandatory"
  | "change_class_size"
  | "remove_quizzes"
  | "ai_credit_forecast"
  | "curriculum_change"
  | "schedule_change";

export interface ScenarioPlanDto {
  id: string;
  type: ScenarioType;
  title: string;
  description: string | null;
  parameters: Record<string, unknown>;
  predictions: Record<string, unknown>;
  affected: Record<string, unknown>;
  estimatedCosts: Record<string, unknown>;
  summary: string | null;
  confidence: number;
  createdBy: string | null;
  status: "draft" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Academic Operations Center
// ---------------------------------------------------------------------------

export type AcademicOperationType =
  | "classroom_needs_attention"
  | "student_at_risk"
  | "curriculum_delay"
  | "missing_assessment"
  | "overloaded_teacher"
  | "optimization_opportunity"
  | "recommended_action";

export interface AcademicOperationDto {
  id: string;
  organizationId: string | null;
  day: string;
  priority: number;
  type: AcademicOperationType;
  title: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  reasoning: {
    reasoning?: string;
    confidence?: number;
    affectedModules?: string[];
    suggestedActions?: string[];
  };
  confidence: number;
  status: "open" | "acknowledged" | "resolved" | "dismissed";
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsCenterDto {
  organizationId: string | null;
  day: string;
  operations: AcademicOperationDto[];
  summary: {
    totalOpen: number;
    critical: number;
    highPriority: number;
    classroomsNeedingAttention: number;
    studentsAtRisk: number;
    overloadedTeachers: number;
    curriculumDelays: number;
  };
  generatedAt: string;
}
