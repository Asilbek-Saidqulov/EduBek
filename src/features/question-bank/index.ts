/**
 * EduBek — Question Bank feature barrel export.
 */
export {
  createQuestion,
  getQuestion,
  getQuestionVersions,
  searchQuestions,
  updateQuestion,
  archiveQuestion,
  duplicateQuestion,
  importQuestions,
  exportQuestions,
} from "./service";

export {
  createQuestionBodySchema,
  updateQuestionBodySchema,
  searchQuestionsQuerySchema,
  importQuestionsBodySchema,
  parsePayloadForType,
  questionTypeSchema,
  payloadSchemaByType,
  QUESTION_TYPES,
  type CreateQuestionBody,
  type UpdateQuestionBody,
  type SearchQuestionsQuery,
  type ImportQuestionsBody,
  type QuestionTypeString,
} from "./schema";

export type {
  QuestionType,
  Difficulty,
  QuestionStatus,
  QuestionPayload,
  MultipleChoicePayload,
  MultipleSelectPayload,
  TrueFalsePayload,
  ShortAnswerPayload,
  EssayPayload,
  MatchingPayload,
  OrderingPayload,
  FillBlankPayload,
  QuestionDto,
  QuestionVersionDto,
  QuestionSearchResult,
  QuestionImportResult,
} from "./types";
