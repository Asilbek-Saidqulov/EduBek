/**
 * AI feature — business logic layer (service).
 *
 * The public API of the AI feature. Handles all LLM calls via the
 * AI provider registry (OpenRouter + Gemini 3.7 Flash by default).
 * Providers can be swapped without touching API routes.
 *
 * No repository layer — AI generation is stateless (no DB reads/writes).
 */

import { HttpError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { clamp } from '@/lib/utils'
import { generate as aiGenerate } from '@/infra/ai-providers'
import type { AiQuizResultDto, AiQuizQuestionDto } from './ai.types'
import type { GenerateQuizInput } from './ai.schema'
import { buildQuizSystemPrompt, buildQuizUserPrompt } from './ai.prompts'
import { extractJson, sanitizeQuestion } from './ai.internals'

// Re-export pure helpers for unit tests (no LLM, no I/O).
export { sanitizeMedia, sanitizeQuestion, extractJson } from './ai.internals'

const log = logger.child({ module: 'ai-service' })

/** Raw shape the LLM is instructed to return. */
interface RawLlmQuiz {
  title?: unknown
  description?: unknown
  questions?: unknown
}

/**
 * Generate a quiz from a topic using the LLM.
 *
 * Steps:
 *   1. Clamp the question count to [3, 10].
 *   2. Build system + user prompts.
 *   3. Call the LLM via the AI provider registry (OpenRouter).
 *   4. Parse + validate the JSON response.
 *   5. Sanitize each question (coerce types, drop invalid ones).
 *   6. Return the structured result.
 *
 * Throws HttpError(502, 'AI_GENERATION_FAILED') on any failure.
 */
export async function generateQuiz(input: GenerateQuizInput): Promise<AiQuizResultDto> {
  const count = clamp(input.count, 3, 10)
  log.info('generateQuiz', { topic: input.topic, difficulty: input.difficulty, count })

  const systemPrompt = buildQuizSystemPrompt(count, input.difficulty)
  const userPrompt = buildQuizUserPrompt(input.topic, input.difficulty, count)

  let content: string
  let model: string
  try {
    const result = await aiGenerate(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 4096,
      },
      'quiz_generation',
    )
    content = result.content
    model = result.model
  } catch (err) {
    log.error('LLM call failed', { error: (err as Error).message })
    const message = err instanceof Error ? err.message : 'AI generation failed'
    throw new HttpError(502, message, 'AI_GENERATION_FAILED')
  }

  if (!content) {
    log.warn('LLM returned empty content')
    throw new HttpError(502, 'AI returned no content. Please try again.', 'AI_INVALID_RESPONSE')
  }

  // Parse JSON
  const rawJson = extractJson(content)
  if (!rawJson) {
    log.warn('LLM returned malformed JSON', { contentPreview: content.slice(0, 200) })
    throw new HttpError(502, 'AI returned malformed JSON. Please try again.', 'AI_INVALID_RESPONSE')
  }
  const raw = rawJson as RawLlmQuiz

  // Validate top-level structure
  if (!raw.title || !Array.isArray(raw.questions)) {
    log.warn('LLM returned incomplete quiz structure')
    throw new HttpError(502, 'AI returned an incomplete quiz. Please try again.', 'AI_INVALID_RESPONSE')
  }

  // Sanitize questions
  const questions = (raw.questions as unknown[])
    .map((q, i) => sanitizeQuestion(q as Record<string, unknown>, i))
    .filter((q): q is AiQuizQuestionDto => q !== null)

  if (questions.length === 0) {
    log.warn('LLM generated no valid questions')
    throw new HttpError(502, 'AI generated no valid questions. Please try again.', 'AI_INVALID_RESPONSE')
  }

  log.info('Quiz generated successfully', { questionCount: questions.length, model })

  return {
    title: String(raw.title),
    description: String(raw.description ?? ''),
    questions,
    metadata: {
      topic: input.topic,
      difficulty: input.difficulty,
      count: questions.length,
      model: model || 'gemini-3.7-flash',
      generatedAt: new Date().toISOString(),
    },
  }
}
