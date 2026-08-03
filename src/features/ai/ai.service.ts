/**
 * AI feature — business logic layer (service).
 *
 * The public API of the AI feature. Handles all LLM calls.
 * Future providers can be swapped in without touching API routes.
 *
 * No repository layer — AI generation is stateless (no DB reads/writes).
 * When the full EduBek AI Assistant lands, it will have a repository for
 * conversations, messages, decision logs, etc.
 */

import ZAI from 'z-ai-web-dev-sdk'
import { HttpError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { clamp } from '@/lib/utils'
import type { AiQuizResultDto, AiQuizQuestionDto } from './ai.types'
import type { GenerateQuizInput } from './ai.schema'
import { buildQuizSystemPrompt, buildQuizUserPrompt } from './ai.prompts'
import { extractJson, sanitizeQuestion } from './ai.internals'

// Re-export pure helpers for unit tests (no LLM, no I/O).
export { sanitizeMedia, sanitizeQuestion, extractJson } from './ai.internals'

const log = logger.child({ module: 'ai-service' })

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

/** Raw shape the LLM is instructed to return. */
interface RawLlmQuiz {
  title?: unknown
  description?: unknown
  questions?: unknown
}

// ----------------------------------------------------------------------------
// Public service functions
// ----------------------------------------------------------------------------

/**
 * Generate a quiz from a topic using the LLM.
 *
 * Steps:
 *   1. Clamp the question count to [3, 10].
 *   2. Build system + user prompts.
 *   3. Call the configured LLM provider.
 *   4. Parse + validate the JSON response.
 *   5. Sanitize each question (coerce types, drop invalid ones).
 *   6. Return the structured result.
 *
 * Throws HttpError(502, 'AI_GENERATION_FAILED') on any failure.
 */
export async function generateQuiz(input: GenerateQuizInput): Promise<AiQuizResultDto> {
  const count = clamp(input.count, 3, 10)
  log.info('generateQuiz', { topic: input.topic, difficulty: input.difficulty, count })

  // 1. Initialize the SDK
  let zai
  try {
    zai = await ZAI.create()
  } catch (err) {
    log.error('AI provider initialization failed', { error: (err as Error).message })
    throw new HttpError(503, 'AI service is not available.', 'AI_GENERATION_FAILED')
  }

  // 2. Call the LLM
  const systemPrompt = buildQuizSystemPrompt(count, input.difficulty)
  const userPrompt = buildQuizUserPrompt(input.topic, input.difficulty, count)

  let completion
  try {
    completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })
  } catch (err) {
    log.error('LLM call failed', { error: (err as Error).message })
    throw new HttpError(502, 'AI generation failed. Please try again.', 'AI_GENERATION_FAILED')
  }

  const content = completion.choices[0]?.message?.content
  if (!content) {
    log.warn('LLM returned empty content')
    throw new HttpError(502, 'AI returned no content. Please try again.', 'AI_INVALID_RESPONSE')
  }

  // 3. Parse JSON
  const rawJson = extractJson(content)
  if (!rawJson) {
    log.warn('LLM returned malformed JSON', { contentPreview: content.slice(0, 200) })
    throw new HttpError(502, 'AI returned malformed JSON. Please try again.', 'AI_INVALID_RESPONSE')
  }
  const raw = rawJson as RawLlmQuiz

  // 4. Validate top-level structure
  if (!raw.title || !Array.isArray(raw.questions)) {
    log.warn('LLM returned incomplete quiz structure')
    throw new HttpError(502, 'AI returned an incomplete quiz. Please try again.', 'AI_INVALID_RESPONSE')
  }

  // 5. Sanitize questions
  const questions = (raw.questions as unknown[])
    .map((q, i) => sanitizeQuestion(q as Record<string, unknown>, i))
    .filter((q): q is AiQuizQuestionDto => q !== null)

  if (questions.length === 0) {
    log.warn('LLM generated no valid questions')
    throw new HttpError(502, 'AI generated no valid questions. Please try again.', 'AI_INVALID_RESPONSE')
  }

  log.info('Quiz generated successfully', { questionCount: questions.length, model: completion.model })

  // 6. Return structured result
  return {
    title: String(raw.title),
    description: String(raw.description ?? ''),
    questions,
    metadata: {
      topic: input.topic,
      difficulty: input.difficulty,
      count: questions.length,
      model: completion.model || 'default',
      generatedAt: new Date().toISOString(),
    },
  }
}
