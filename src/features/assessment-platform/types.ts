/**
 * EduBek — Assessment Platform types.
 * Phase 5A.2: Universal Assessment, Credentialing & Academic Integrity.
 */
// Assessment types
export type AssessmentType = "quiz" | "exam" | "assignment" | "essay" | "oral_exam" | "practical" | "project" | "peer_review" | "lab_work" | "presentation" | "coding" | "competency";
export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface AssessmentBlueprintItem {
  questionType: string;
  topic: string;
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  points: number;
  conceptIds: string[];
}

export interface AssessmentBlueprintDto {
  id: string;
  title: string;
  description: string | null;
  assessmentType: AssessmentType;
  items: AssessmentBlueprintItem[];
  rubricId: string | null;
  estimatedDurationMinutes: number;
  predictedAvgScore: number;
  predictedDifficulty: number;
  frameworkId: string | null;
  standardIds: string[];
  bloomDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  confidence: number;
  createdBy: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Rubric
export interface RubricLevel { points: number; label: string; description: string; }
export interface RubricCriterionDto {
  id: string;
  rubricId: string;
  name: string;
  description: string | null;
  maxPoints: number;
  levels: RubricLevel[];
  order: number;
}

// AI Grading
export interface AiGradingResult {
  score: number;
  maxScore: number;
  rubricBreakdown: Array<{ criterionId: string; criterionName: string; score: number; maxPoints: number; feedback: string }>;
  evidence: string[];
  explanation: string;
  confidence: number;
  suggestedTeacherReview: boolean;
}

// Integrity
export type IntegrityCheckType = "plagiarism" | "ai_generated" | "duplicate_submission" | "collusion" | "unusual_behavior" | "answer_similarity" | "identity_anomaly";
export type RiskLevel = "low" | "medium" | "high";

export interface IntegrityCheckDto {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  checkType: IntegrityCheckType;
  riskScore: number;
  riskLevel: RiskLevel;
  findings: Record<string, unknown>;
  explanation: string | null;
  status: "pending" | "reviewed" | "confirmed" | "dismissed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// Secure Exam
export interface SecureExamSessionDto {
  id: string;
  assessmentId: string;
  userId: string;
  status: "not_started" | "in_progress" | "paused" | "submitted" | "auto_submitted" | "expired";
  questionOrder: string[];
  adaptiveState: Record<string, unknown>;
  startedAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  timeRemainingMs: number | null;
  lastAutosaveAt: string | null;
  lockdownEnabled: boolean;
  auditLog: Array<{ timestamp: string; event: string; details: string }>;
  offlineRecoveryAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Competency
export type CompetencyLevel = "foundational" | "intermediate" | "advanced" | "expert";

export interface CompetencyDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  subject: string | null;
  level: CompetencyLevel;
  conceptIds: string[];
  assessmentIds: string[];
  resourceIds: string[];
  prerequisiteIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyEvidenceDto {
  id: string;
  competencyId: string;
  userId: string;
  evidenceType: string;
  entityId: string | null;
  masteryLevel: number;
  status: "pending" | "verified" | "rejected";
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

// Digital Credential
export type CredentialType = "certificate" | "badge" | "micro_credential" | "competency_certificate" | "course_certificate" | "organization_certificate";

export interface DigitalCredentialDto {
  id: string;
  type: CredentialType;
  title: string;
  description: string | null;
  userId: string;
  issuerId: string;
  issuerType: string;
  verificationId: string;
  verificationUrl: string | null;
  qrCodeData: string | null;
  digitalSignature: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  competencyIds: string[];
  evidenceLinks: string[];
  issuedAt: string;
  expiresAt: string | null;
  status: "active" | "revoked" | "expired";
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Transcript
export interface TranscriptEntry {
  type: "course" | "competency" | "certificate" | "project" | "assessment" | "achievement";
  title: string;
  description: string | null;
  date: string;
  score: number | null;
  competencyId: string | null;
  credentialId: string | null;
  metadata: Record<string, unknown>;
}

export interface AcademicTranscriptDto {
  id: string;
  userId: string;
  entries: TranscriptEntry[];
  aiSummary: string | null;
  skills: string[];
  timeline: Array<{ date: string; event: string; title: string }>;
  totalCourses: number;
  totalCredits: number;
  avgScore: number;
  totalCredentials: number;
  totalCompetencies: number;
  updatedAt: string;
}

// Assessment Intelligence
export interface AssessmentItemDto {
  id: string;
  assessmentId: string;
  questionId: string | null;
  difficultyIndex: number | null;
  discriminationIndex: number | null;
  distractorAnalysis: Record<string, number> | null;
  bloomLevel: string | null;
  attemptCount: number;
  correctCount: number;
  avgTimeMs: number | null;
}

export interface AssessmentQualityDto {
  id: string;
  assessmentId: string;
  overallQuality: number;
  bloomCoverage: Record<string, number>;
  curriculumCoverage: number;
  difficultyDistribution: Record<string, number>;
  gradingConsistency: number;
  fairnessScore: number;
  itemAnalysis: Record<string, unknown>;
  recommendations: string[];
  analyzedAt: string;
}

// Accreditation
export interface AccreditationReportDto {
  id: string;
  organizationId: string;
  day: string;
  curriculumCompliance: number;
  assessmentQuality: number;
  competencyCoverage: number;
  totalCredentialsIssued: number;
  totalCompetenciesVerified: number;
  graduateOutcomes: Record<string, unknown>;
  gradingConsistency: number;
  auditReadiness: number;
  aiSummary: string | null;
  recommendations: { strengths: string[]; weaknesses: string[]; recommendations: string[] };
  createdAt: string;
}

// Credential Verification
export interface CredentialVerificationDto {
  id: string;
  verificationId: string;
  credentialId: string;
  verifiedBy: string | null;
  method: string;
  result: "valid" | "revoked" | "expired" | "not_found";
  verifiedAt: string;
  ipAddress: string | null;
}
