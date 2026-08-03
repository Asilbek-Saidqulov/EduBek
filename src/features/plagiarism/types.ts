/**
 * EduBek — Plagiarism feature domain types (DTOs).
 *
 * Phase 4B implements only an internal similarity comparison based on
 * trigram overlap. Future providers (Turnitin, Copyleaks, GPTZero, …)
 * should plug into the `PlagiarismProvider` interface — see
 * `service.ts`.
 */

export interface PlagiarismReportDto {
  id: string;
  attemptId: string;
  studentId: string;
  sourceResponseId: string | null;
  comparedWith: string[]; // response ids
  similarityScore: number; // 0-100
  threshold: number; // 0-100
  flagged: boolean;
  details: Record<string, unknown> | null;
  provider: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimilarityResult {
  similarityScore: number; // 0-100
  details: Record<string, unknown>;
}

export interface PlagiarismProvider {
  name: string;
  compare(a: string, b: string): SimilarityResult;
}
