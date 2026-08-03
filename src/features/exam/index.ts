/**
 * EduBek — Exam feature barrel export.
 */
export {
  startExam,
  pauseExam,
  resumeExam,
  submitExam,
  autoSubmitExpiredExams,
  recordProctoring,
} from "./service";

export {
  startExamBodySchema,
  recordProctoringBodySchema,
  type StartExamBody,
  type RecordProctoringBody,
} from "./schema";

// Re-export the assessment submit schema so routes that submit exams can
// import everything from one place.
export {
  submitAttemptBodySchema,
  type SubmitAttemptBody,
} from "@/features/assessment";

export type {
  ExamStateDto,
  ExamAutoSubmitResult,
  ExamAutoSubmitBatchResult,
  ExamResumeResult,
} from "./types";
