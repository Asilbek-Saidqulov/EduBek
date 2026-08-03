/**
 * EduBek — Assessment feature domain types (DTOs).
 *
 * Assessments are containers that combine a set of bank questions with
 * rules (duration, passing score, shuffle, etc.) into a graded
 * experience. Each student receives an AssessmentAttempt with one
 * AssessmentResponse per question.
 *
 * Assessment types:
 *   • quiz     — untimed, free navigation
 *   • exam     — timed, locked, proctored (Phase 4B exam module)
 *   • practice — open, multiple attempts, no grading
 */

export type AssessmentType = "quiz" | "exam" | "practice";
export type AssessmentStatus = "draft" | "published" | "archived";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "graded"
  | "expired"
  | "paused";

export type ResponseGradedBy = "auto" | "manual";

export interface AssessmentQuestionDto {
  id: string;
  assessmentId: string;
  questionId: string;
  order: number;
  points: number;
  overrides: Record<string, unknown> | null;
  // Inline question payload for convenience (assessment-assembled view)
  questionType?: string;
  payload?: unknown;
  createdAt: string;
}

export interface AssessmentDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  classroomId: string | null;
  resourceId: string | null;
  assignmentId: string | null;
  rubricId: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  assessmentType: AssessmentType;
  duration: number | null; // seconds; null = no limit
  passingScore: number | null; // percentage 0-100
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResultsImmediately: boolean;
  allowReview: boolean;
  openAt: string | null;
  closeAt: string | null;
  status: AssessmentStatus;
  publishedAt: string | null;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentWithQuestionsDto extends AssessmentDto {
  questions: AssessmentQuestionDto[];
}

export interface AssessmentAttemptDto {
  id: string;
  assessmentId: string;
  studentId: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  expiresAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  timeRemainingMs: number | null;
  score: number | null;
  pointsAwarded: number | null;
  pointsMax: number;
  passed: boolean | null;
  questionOrder: string[] | null;
  autoGradedAt: string | null;
  manualGradedAt: string | null;
  proctoringIncidentCount: number;
  proctoringFlagged: boolean;
  plagiarismScore: number | null;
  plagiarismFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponseDto {
  id: string;
  attemptId: string;
  questionId: string;
  questionType: string;
  answer: unknown;
  pointsAwarded: number | null;
  pointsMax: number;
  isCorrect: boolean | null;
  gradedBy: ResponseGradedBy | null;
  gradedAt: string | null;
  feedback: string | null;
  timeSpentMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptWithResponsesDto extends AssessmentAttemptDto {
  responses: AssessmentResponseDto[];
  assessment?: {
    id: string;
    title: string;
    assessmentType: string;
    duration: number | null;
    passingScore: number | null;
    showResultsImmediately: boolean;
    allowReview: boolean;
  };
}
