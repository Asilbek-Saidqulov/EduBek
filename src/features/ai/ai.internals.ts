/**
 * AI feature — pure helpers extracted for unit testing.
 *
 * These helpers are pure (no I/O, no LLM calls) and deterministic, which
 * makes them safe to test directly without mocking the AI provider.
 *
 * The `ai.service.ts` module re-exports them so the public surface stays
 * unchanged; tests import from this module instead.
 */

import type { AiQuizQuestionDto, MediaSuggestion } from './ai.types'

/**
 * Sanitize the optional `media` metadata emitted by the LLM.
 *
 * MVP rules:
 *   - Only `type: "image"` is supported. Any other type is dropped
 *     (treated as "no media") so we never persist unsupported kinds.
 *   - `search` is kept only when `required === true` and `type === "image"`.
 *   - Malformed shapes degrade gracefully to `{ required: false }` rather
 *     than dropping the whole question.
 *
 * The shape is forward-compatible: future media kinds (audio, video, …)
 * can be added by widening the `type` union in `MediaSuggestion` without
 * touching this sanitizer.
 */
export function sanitizeMedia(raw: unknown): MediaSuggestion {
  if (!raw || typeof raw !== 'object') {
    return { required: false }
  }
  const m = raw as Record<string, unknown>
  const required = m.required === true
  // Only 'image' is supported in the MVP. Unknown / future types are dropped.
  const type = m.type === 'image' ? 'image' : undefined
  const search = typeof m.search === 'string' && m.search.trim().length > 0 ? m.search.trim().slice(0, 200) : undefined
  if (required && type === 'image' && search) {
    return { required: true, type: 'image', search }
  }
  if (required && type === 'image') {
    // Required but missing search query — keep the flag but no search.
    return { required: true, type: 'image' }
  }
  return { required: false }
}

/**
 * Sanitize a single question from the LLM into a trusted DTO.
 * Coerces types, clamps indices, drops invalid options.
 */
export function sanitizeQuestion(q: Record<string, unknown>, index: number): AiQuizQuestionDto | null {
  const question = String(q.question ?? `Question ${index + 1}`)
  const rawOptions = Array.isArray(q.options) ? q.options : []
  const options = rawOptions.slice(0, 4).map(String)
  if (options.length !== 4) return null // need exactly 4

  const rawCorrect = q.correctIndex
  const correctIndex =
    Number.isInteger(rawCorrect) && (rawCorrect as number) >= 0 && (rawCorrect as number) <= 3
      ? (rawCorrect as number)
      : 0

  const explanation = String(q.explanation ?? '')
  const media = sanitizeMedia(q.media)

  return { question, options, correctIndex, explanation, media }
}

/**
 * Strip markdown code fences that some models wrap around JSON output,
 * then parse. Returns null if the content isn't valid JSON.
 */
export function extractJson(content: string): unknown | null {
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}
