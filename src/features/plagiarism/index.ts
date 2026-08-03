/**
 * EduBek — Plagiarism feature barrel export.
 */
export {
  compareSubmissions,
  calculateSimilarity,
  flagSubmission,
  getReport,
  listReportsByAttempt,
  registerProvider,
  getProvider,
} from "./service";

export type {
  PlagiarismReportDto,
  SimilarityResult,
  PlagiarismProvider,
} from "./types";
