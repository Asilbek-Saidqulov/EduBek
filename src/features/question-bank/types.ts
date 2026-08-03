/**
 * EduBek — Question Bank feature domain types (DTOs).
 *
 * Phase 4B introduces a reusable question bank independent of the legacy
 * Quiz platform's `Question` table. The bank supports 8 question types
 * (MCQ, MSQ, True/False, Short Answer, Essay, Matching, Ordering,
 * Fill-in-Blank), each stored as a typed JSON `payload` snapshot.
 */

export type QuestionType =
  | "multiple_choice"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "essay"
  | "matching"
  | "ordering"
  | "fill_blank";

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "active" | "archived";

/**
 * Polymorphic question payload. The `payload` string stored on the row is
 * a `JSON.stringify`-d form of one of these. The service layer enforces
 * per-type invariants via Zod (`schema.ts`).
 */
export interface MultipleChoicePayload {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  hint?: string;
}

export interface MultipleSelectPayload {
  prompt: string;
  options: string[];
  correctIndices: number[]; // sorted ascending
  explanation?: string;
  hint?: string;
}

export interface TrueFalsePayload {
  prompt: string;
  correct: boolean;
  explanation?: string;
  hint?: string;
}

export interface ShortAnswerPayload {
  prompt: string;
  acceptableAnswers: string[]; // case-insensitive match
  maxLength?: number;
  explanation?: string;
  hint?: string;
}

export interface EssayPayload {
  prompt: string;
  minWords?: number;
  maxWords?: number;
  rubricId?: string;
  explanation?: string;
  hint?: string;
}

export interface MatchingPayload {
  prompt: string;
  pairs: Array<{ left: string; right: string }>;
  explanation?: string;
  hint?: string;
}

export interface OrderingPayload {
  prompt: string;
  items: string[]; // correct order; student returns reordered indices
  explanation?: string;
  hint?: string;
}

export interface FillBlankPayload {
  prompt: string; // contains "___" placeholders
  blanks: string[]; // correct answers in order
  explanation?: string;
  hint?: string;
}

export type QuestionPayload =
  | MultipleChoicePayload
  | MultipleSelectPayload
  | TrueFalsePayload
  | ShortAnswerPayload
  | EssayPayload
  | MatchingPayload
  | OrderingPayload
  | FillBlankPayload;

export interface QuestionDto {
  id: string;
  ownerId: string;
  orgId: string | null;
  questionType: QuestionType;
  payload: QuestionPayload;
  subject: string | null;
  grade: string | null;
  difficulty: Difficulty;
  topic: string | null;
  estimatedTime: number | null;
  learningObjective: string | null;
  points: number;
  status: QuestionStatus;
  versionNumber: number;
  aiGeneratedFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionVersionDto {
  id: string;
  questionId: string;
  version: number;
  snapshot: QuestionPayload;
  changelog: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface QuestionSearchResult {
  questions: QuestionDto[];
  total: number;
}

export interface QuestionImportResult {
  imported: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}
