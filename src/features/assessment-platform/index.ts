/** EduBek — Assessment Platform barrel export. Phase 5A.2. */
export {
  buildAssessment, getBlueprint, listBlueprints,
  aiGrade,
  runIntegrityCheck, listIntegrityChecks, reviewIntegrityCheck,
  startSecureExam, pauseSecureExam, resumeSecureExam, submitSecureExam, autosaveSecureExam, getSecureExamSession,
  createCompetency, getCompetency, listCompetencies, recordCompetencyEvidence, verifyCompetencyEvidence, getUserCompetencies,
  issueCredential, getCredential, verifyCredential, listCredentials, revokeCredential,
  getTranscript, rebuildTranscript,
  analyzeAssessmentQuality, getAssessmentQuality,
  generateAccreditationReport, getAccreditationReport,
} from "./service";

export type {
  AssessmentType, BloomLevel, Difficulty, AssessmentBlueprintItem, AssessmentBlueprintDto,
  RubricLevel, RubricCriterionDto, AiGradingResult,
  IntegrityCheckType, RiskLevel, IntegrityCheckDto,
  SecureExamSessionDto, CompetencyLevel, CompetencyDto, CompetencyEvidenceDto,
  CredentialType, DigitalCredentialDto, TranscriptEntry, AcademicTranscriptDto,
  AssessmentItemDto, AssessmentQualityDto, AccreditationReportDto, CredentialVerificationDto,
} from "./types";
