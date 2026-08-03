/**
 * EduBek — Learning-session feature domain types (DTOs).
 */
export type LearningSessionStatus = "active" | "paused" | "completed";

export interface LearningSessionDto {
  id: string;
  studentId: string;
  attemptId: string | null;
  resourceId: string | null;
  status: LearningSessionStatus;
  durationMs: number;
  interactions: number;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}
