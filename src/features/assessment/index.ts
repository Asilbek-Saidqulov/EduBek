/**
 * EduBek — Assessment feature barrel export.
 */
export {
  createAssessment,
  getAssessment,
  listAssessments,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  duplicateAssessment,
  addQuestions,
  removeQuestion,
  startAttempt,
  submitAttempt,
  getAttempt,
  listAttempts,
  gradeResponse,
  getMyAttempts,
} from "./service";

export {
  createAssessmentBodySchema,
  updateAssessmentBodySchema,
  addQuestionsBodySchema,
  startAttemptBodySchema,
  submitAttemptBodySchema,
  gradeResponseBodySchema,
  listAssessmentsQuerySchema,
  listAttemptsQuerySchema,
  assessmentTypeSchema,
  type CreateAssessmentBody,
  type UpdateAssessmentBody,
  type AddQuestionsBody,
  type StartAttemptBody,
  type SubmitAttemptBody,
  type GradeResponseBody,
  type ListAssessmentsQuery,
  type ListAttemptsQuery,
} from "./schema";

export {
  gradeResponse as gradeQuestionResponse,
  batchGradeResponses,
  type GradeResult,
  type BatchGradeItem,
  type BatchGradeOutput,
} from "./auto-grader";

export {
  generateQuestions,
  generateAssessment,
  generateRubric,
  generateExplanation,
  generatePracticeQuiz,
  type GenerateQuestionsInput,
  type GenerateAssessmentInput,
  type GenerateRubricInput,
  type GenerateExplanationInput,
  type GeneratePracticeQuizInput,
} from "./ai-integration";

export type {
  AssessmentType,
  AssessmentStatus,
  AttemptStatus,
  ResponseGradedBy,
  AssessmentDto,
  AssessmentQuestionDto,
  AssessmentWithQuestionsDto,
  AssessmentAttemptDto,
  AssessmentResponseDto,
  AttemptWithResponsesDto,
} from "./types";
