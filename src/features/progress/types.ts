/**
 * EduBek — Progress feature domain types (DTOs).
 */

export type ProgressMetric =
  | "assignment_completed"
  | "score"
  | "time_spent"
  | "resource_viewed"
  | "streak";

export interface ProgressRecordDto {
  id: string;
  studentId: string;
  classroomId: string | null;
  assignmentId: string | null;
  metric: string;
  value: number;
  metadata: unknown | null;
  createdAt: string;
}

export interface StudentProgressDto {
  studentId: string;
  /** Aggregated totals across all the student's classrooms. */
  assignmentsCompleted: number;
  averageScore: number | null;
  totalTimeSpentMs: number;
  resourcesViewed: number;
  currentStreak: number;
  longestStreak: number;
  recentRecords: ProgressRecordDto[];
}

export interface ClassroomStudentProgressEntry {
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  assignmentsCompleted: number;
  averageScore: number | null;
  totalTimeSpentMs: number;
  lastActivityAt: string | null;
}

export interface ClassroomProgressDto {
  classroomId: string;
  studentCount: number;
  /** Average score across all graded submissions in this classroom. */
  averageScore: number | null;
  /** Percentage (0-100) of published assignments that have at least one
   * submitted attempt per student. */
  completionPct: number;
  /** Number of submissions in this classroom that were submitted past the
   * assignment's due date. */
  lateSubmissions: number;
  /** Number of submissions with status 'submitted' but no Grade row yet. */
  pendingGrading: number;
  students: ClassroomStudentProgressEntry[];
}
