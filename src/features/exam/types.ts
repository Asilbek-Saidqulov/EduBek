/**
 * EduBek — Exam feature domain types (DTOs).
 *
 * An exam is a timed assessment with extra invariants:
 *   • Timer cannot exceed duration (the assessment row's `duration` field)
 *   • Auto-submit fires when `expiresAt` passes
 *   • Attempt is locked to a single in_progress state — no concurrent attempts
 *   • Browser refresh recovery: the client polls /resume to recompute timeRemaining
 */
import type { AttemptWithResponsesDto } from "@/features/assessment/types";

export interface ExamStateDto {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  status: "in_progress" | "paused" | "submitted" | "graded" | "expired";
  startedAt: string;
  expiresAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  timeRemainingMs: number | null;
  /** Server-clock snapshot used by the client to compute remaining time */
  serverNow: string;
}

export interface ExamAutoSubmitResult {
  attemptId: string;
  status: string;
  reason: string;
  submittedAt: string;
}

export interface ExamAutoSubmitBatchResult {
  processed: number;
  results: ExamAutoSubmitResult[];
}

export type ExamResumeResult = AttemptWithResponsesDto & {
  examState: ExamStateDto;
};
