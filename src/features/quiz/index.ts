/**
 * Quiz feature — barrel export.
 *
 * Import from `@/features/quiz` to get the service + types. The repository
 * is intentionally NOT exported — it's an internal implementation detail.
 */

export {
  getQuizById,
  createQuiz,
  addQuestion,
  patchQuestion,
  publishQuizToDiscover,
} from './quiz.service'
export type {
  QuizCreatorDto,
  QuizQuestionDto,
  QuizDetailDto,
  Difficulty,
  PlayableQuestion,
  QuestionMedia,
} from './quiz.types'
export {
  getQuizByIdParamsSchema,
  type GetQuizByIdInput,
  createQuizBodySchema,
  type CreateQuizBody,
  type CreateQuizQuestionInput,
  quizQuestionMediaSchema,
  createQuizQuestionSchema,
  addQuestionBodySchema,
  type AddQuestionBody,
  updateQuestionBodySchema,
  type UpdateQuestionBody,
  publishToDiscoverBodySchema,
  type PublishToDiscoverBody,
} from './quiz.schema'
