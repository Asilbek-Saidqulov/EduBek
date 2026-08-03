/**
 * AI feature — prompt templates.
 *
 * Centralized so prompts can be versioned, A/B tested, and reviewed
 * independently of the service logic. In the full EduBek platform these
 * would be stored in the `AiPrompt` database table (see Prisma schema);
 * for now they're constants.
 */

/**
 * Build the system prompt for quiz generation.
 * Instructs the LLM to return strict JSON with the exact schema the
 * service expects.
 *
 * MVP media metadata (Phase MVP-AI-Media):
 *   The AI is asked to decide, per question, whether the question would
 *   benefit from an accompanying image. When it would, the AI returns a
 *   concise English search query. The AI never generates, fetches, or
 *   embeds images — it only emits the metadata. Only `type: "image"` is
 *   supported in the MVP. The metadata is stored as-is alongside the
 *   generated quiz and is NOT automatically resolved today.
 */
export function buildQuizSystemPrompt(count: number, difficulty: string): string {
  return `You are an expert educational quiz generator. Create engaging, accurate multiple-choice questions.

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact schema:
{
  "title": string (concise, descriptive quiz title),
  "description": string (1-2 sentence summary),
  "questions": [
    {
      "question": string (clear, unambiguous question),
      "options": [string, string, string, string] (exactly 4 options),
      "correctIndex": number (0-3, the index of the correct option),
      "explanation": string (1-2 sentence explanation of why the answer is correct),
      "media": {
        "required": boolean,
        "type": "image" (only when required is true),
        "search": string (concise English search query, only when required is true)
      }
    }
  ]
}

Rules:
- Exactly ${count} questions
- Exactly 4 options per question
- correctIndex must be 0, 1, 2, or 3
- ${difficulty} difficulty level
- Questions should test understanding, not just memorization
- All options should be plausible (no obviously wrong answers)
- The explanation should teach, not just state the answer

Media metadata rules:
- The "media" field is REQUIRED on every question object.
- Set "required": true ONLY when an image would materially help the learner answer the question (e.g. identifying a flag, a diagram, an anatomy chart, a map, a portrait, a chemical structure).
- Set "required": false for purely textual or conceptual questions (e.g. math word problems, grammar, abstract reasoning, history dates that don't require a visual).
- When "required" is true, you MUST include "type": "image" and a concise English "search" query (2-6 words) that a future image provider can use (e.g. "France flag", "Solar system diagram", "Human heart anatomy", "World map", "Albert Einstein portrait", "Cell structure", "Periodic table").
- You MUST NOT include any other media type. Only "image" is supported. No audio, no video, no animations, no documents.
- You MUST NOT generate, fetch, or embed any image. You only return the metadata.
- When "required" is false, omit "type" and "search" (just return {"required": false}).`
}

/**
 * Build the user prompt for quiz generation.
 */
export function buildQuizUserPrompt(topic: string, difficulty: string, count: number): string {
  return `Generate a quiz about: "${topic}"

Difficulty: ${difficulty}
Number of questions: ${count}

Return the JSON now.`
}
