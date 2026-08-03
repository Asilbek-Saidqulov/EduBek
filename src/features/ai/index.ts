/**
 * AI feature — barrel export.
 */

export { generateQuiz } from './ai.service'
export { sanitizeMedia, sanitizeQuestion, extractJson } from './ai.internals'
export type {
  AiDifficulty,
  AiQuizQuestionDto,
  AiQuizMetadataDto,
  AiQuizResultDto,
  MediaSuggestion,
} from './ai.types'
export {
  generateQuizBodySchema,
  type GenerateQuizBody,
  type GenerateQuizInput,
} from './ai.schema'
