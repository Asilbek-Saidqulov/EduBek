/**
 * AI feature — domain types.
 *
 * DTOs for AI-generated quiz results.
 */

export type AiDifficulty = 'easy' | 'medium' | 'hard'

/**
 * Media suggestion emitted by the AI quiz generator.
 *
 * MVP scope (Phase MVP-AI-Media):
 *   - The AI DOES NOT generate images.
 *   - The AI DOES NOT search images.
 *   - It ONLY returns metadata describing whether a question would benefit
 *     from an image, plus a concise English search query that future
 *     image-provider integrations can resolve.
 *
 * Future evolution (intentionally NOT implemented today):
 *   - `type: 'audio' | 'video' | 'animation' | 'document'` — the union is
 *     deliberately permissive (`string`) so adding new media kinds later
 *     is non-breaking. Today only `'image'` is produced.
 *   - `provider?: string` — reserved for future provider hints
 *     (unsplash, pexels, internal-library, …).
 *   - `resolvedUrl?: string` — reserved for when a media-intelligence
 *     engine resolves the suggestion into an actual asset reference.
 *
 * The shape is forward-compatible: clients MUST treat unknown `type`
 * values as "no media" rather than failing.
 */
export interface MediaSuggestion {
  /** Whether the question would benefit from a media asset. */
  required: boolean
  /**
   * Media kind. Today only `'image'` is produced by the AI; the field
   * is typed as a string so future kinds can be added without breaking
   * the DTO contract.
   */
  type?: 'image'
  /**
   * Concise English search query suitable for a future image provider
   * (e.g. "France flag", "Solar system diagram", "Human heart anatomy").
   * Present only when `required === true`.
   */
  search?: string
}

export interface AiQuizQuestionDto {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  /**
   * Optional media metadata. The AI decides whether a question benefits
   * from an image and emits a search query; it never produces the image
   * itself. Stored as-is with the generated quiz as preparation for
   * future image-provider integration. Not yet automatically resolved.
   */
  media?: MediaSuggestion
}

export interface AiQuizMetadataDto {
  topic: string
  difficulty: string
  count: number
  model: string
  generatedAt: string
}

export interface AiQuizResultDto {
  title: string
  description: string
  questions: AiQuizQuestionDto[]
  metadata: AiQuizMetadataDto
}
