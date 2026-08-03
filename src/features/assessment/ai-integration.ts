/**
 * EduBek — Phase 4B AI integration helpers.
 *
 * Wraps the AI Workspace + subscription gate so assessment/question-bank
 * /rubric services can request AI generations without duplicating the
 * `canUseFeature` + `aiGenerate` wiring.
 *
 * All functions:
 *   1. Check the user's subscription via `canUseFeature("ai_generate")`.
 *   2. Build a prompt + call the AI provider via `@/infra/ai-providers`.
 *   3. Parse the JSON response defensively.
 *   4. Consume usage via `consumeUsage()`.
 *
 * None of these functions write to the DB — they return parsed payloads
 * that the caller persists via the appropriate service.
 */
import { forbidden, unauthorized, HttpError } from "@/lib/errors";
import { type AuthContext } from "@/features/rbac";
import { canUseFeature, consumeUsage } from "@/features/subscription/service";
import { generate as aiGenerate } from "@/infra/ai-providers";
import { eventBus } from "@/infra/event-bus";
import {
  AI_GENERATION_COMPLETED,
  AI_GENERATION_FAILED,
  AI_GENERATION_STARTED,
  buildEvent,
} from "@/infra/event-bus/events";
import { getLogger } from "@/lib/logger";
import { buildPromptContext, resolveLanguage, wrapSystemPrompt } from "@/features/ai-workspace/prompt-context";

const log = getLogger("assessment-ai");

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const GENERATE_QUESTIONS_SYS = `You are an expert educational content creator. Return ONLY valid JSON (no markdown).
Schema:
{
  "questions": [
    {
      "questionType": "multiple_choice" | "multiple_select" | "true_false" | "short_answer" | "essay" | "matching" | "ordering" | "fill_blank",
      "payload": { /* per-type payload, see rules */ },
      "subject": string | null,
      "grade": string | null,
      "difficulty": "easy" | "medium" | "hard",
      "topic": string | null,
      "estimatedTime": number | null,
      "learningObjective": string | null,
      "points": number
    }
  ]
}

Per-type payload shapes:
- multiple_choice: { prompt, options: string[], correctIndex: number, explanation?: string }
- multiple_select: { prompt, options: string[], correctIndices: number[], explanation?: string }
- true_false: { prompt, correct: boolean, explanation?: string }
- short_answer: { prompt, acceptableAnswers: string[], explanation?: string }
- essay: { prompt, minWords?: number, maxWords?: number, explanation?: string }
- matching: { prompt, pairs: [{left, right}] }
- ordering: { prompt, items: string[] }
- fill_blank: { prompt, blanks: string[] }

Rules:
- Return exactly the requested number of questions.
- Use clear, age-appropriate language.
- Each question must have a verifiable correct answer.`;

const GENERATE_ASSESSMENT_SYS = `You are an expert educational assessor. Return ONLY valid JSON (no markdown).
Schema:
{
  "title": string,
  "description": string,
  "instructions": string,
  "duration": number | null,
  "passingScore": number | null,
  "maxAttempts": number,
  "shuffleQuestions": boolean,
  "showResultsImmediately": boolean,
  "allowReview": boolean
}

Rules:
- duration in seconds (null = no limit)
- passingScore 0-100
- Provide clear instructions to the student.`;

const GENERATE_RUBRIC_SYS = `You are an expert educational rubric designer. Return ONLY valid JSON (no markdown).
Schema:
{
  "name": string,
  "description": string,
  "maxPoints": number,
  "criteria": [
    {
      "name": string,
      "description": string,
      "maxPoints": number,
      "levels": [
        { "points": number, "label": string, "description": string }
      ]
    }
  ]
}

Rules:
- 3-5 performance levels per criterion.
- Level points must sum to the criterion maxPoints.
- Criteria maxPoints must sum to <= rubric maxPoints.`;

const GENERATE_EXPLANATION_SYS = `You are an expert tutor. Return ONLY valid JSON (no markdown).
Schema:
{
  "explanation": string,
  "alternativeApproach": string,
  "commonMistakes": [string]
}

Rules:
- Be concise (under 300 words per field).
- Use language the student can understand.`;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function callAi(
  ctx: AuthContext,
  systemPrompt: string,
  userPrompt: string,
  kind: string,
): Promise<unknown> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const gate = await canUseFeature(ctx, "ai_generate");
  if (!gate.allowed) {
    throw forbidden(gate.reason ?? "AI generation quota reached", "backend.ai.errors.rateLimit");
  }

  // Phase 4E.4: wrap system prompt with locale-specific instructions
  const promptCtx = buildPromptContext(ctx);
  const wrappedSystemPrompt = wrapSystemPrompt(systemPrompt, promptCtx);

  eventBus.publish(
    buildEvent({
      type: AI_GENERATION_STARTED,
      actorId: ctx.userId,
      occurredAt: new Date(),
      generationType: kind,
    } as any),
  );

  let result;
  try {
    result = await aiGenerate({ systemPrompt: wrappedSystemPrompt, userPrompt }, kind);
  } catch (err) {
    eventBus.publish(
      buildEvent({
        type: AI_GENERATION_FAILED,
        actorId: ctx.userId,
        occurredAt: new Date(),
        generationType: kind,
        error: err instanceof Error ? err.message : String(err),
      } as any),
    );
    throw new HttpError("AI_GENERATION_FAILED", "AI generation failed", { messageKey: "backend.ai.errors.generationFailed" });
  }

  // Parse JSON.
  const text = result.content;
  let parsed: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(cleaned);
  } catch {
    eventBus.publish(
      buildEvent({
        type: AI_GENERATION_FAILED,
        actorId: ctx.userId,
        occurredAt: new Date(),
        generationType: kind,
        error: "Invalid JSON in AI response",
      } as any),
    );
    throw new HttpError("AI_INVALID_RESPONSE", "AI returned malformed content", { messageKey: "backend.ai.errors.invalidResponse" });
  }

  // Consume usage (fire-and-forget).
  await consumeUsage(ctx, "ai_generate", 1);

  eventBus.publish(
    buildEvent({
      type: AI_GENERATION_COMPLETED,
      actorId: ctx.userId,
      occurredAt: new Date(),
      generationType: kind,
      model: result.model,
      provider: result.provider,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    } as any),
  );

  log.info("ai.completed", { kind, tokensOut: result.tokensOut, locale: promptCtx.locale });
  return parsed;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export interface GenerateQuestionsInput {
  topic: string;
  subject?: string;
  grade?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: string;
  count?: number;
  language?: string;
}

export async function generateQuestions(
  ctx: AuthContext,
  input: GenerateQuestionsInput,
): Promise<unknown> {
  const effectiveLanguage = resolveLanguage(ctx, input.language);
  const userPrompt = `Generate ${input.count ?? 5} ${input.difficulty ?? "medium"} ${input.questionType ?? "multiple_choice"} question${(input.count ?? 5) === 1 ? "" : "s"} about "${input.topic}". Subject: ${input.subject ?? "General"}. Grade: ${input.grade ?? "Middle School"}. Language: ${effectiveLanguage}. Return JSON.`;
  return callAi(ctx, GENERATE_QUESTIONS_SYS, userPrompt, "generate_questions");
}

export interface GenerateAssessmentInput {
  topic: string;
  subject?: string;
  grade?: string;
  assessmentType?: "quiz" | "exam" | "practice";
  questionCount?: number;
  durationMinutes?: number;
  language?: string;
}

export async function generateAssessment(
  ctx: AuthContext,
  input: GenerateAssessmentInput,
): Promise<unknown> {
  const effectiveLanguage = resolveLanguage(ctx, input.language);
  const userPrompt = `Design a ${input.assessmentType ?? "quiz"} about "${input.topic}". Subject: ${input.subject ?? "General"}. Grade: ${input.grade ?? "Middle School"}. ${input.questionCount ?? 10} questions. ${input.durationMinutes ? `Duration: ${input.durationMinutes} minutes.` : ""} Language: ${effectiveLanguage}. Return JSON.`;
  return callAi(ctx, GENERATE_ASSESSMENT_SYS, userPrompt, "generate_assessment");
}

export interface GenerateRubricInput {
  topic: string;
  subject?: string;
  grade?: string;
  maxPoints?: number;
  language?: string;
}

export async function generateRubric(
  ctx: AuthContext,
  input: GenerateRubricInput,
): Promise<unknown> {
  const effectiveLanguage = resolveLanguage(ctx, input.language);
  const userPrompt = `Design a rubric for an assignment about "${input.topic}". Subject: ${input.subject ?? "General"}. Grade: ${input.grade ?? "Middle School"}. Maximum points: ${input.maxPoints ?? 100}. Language: ${effectiveLanguage}. Return JSON.`;
  return callAi(ctx, GENERATE_RUBRIC_SYS, userPrompt, "generate_rubric");
}

export interface GenerateExplanationInput {
  questionPrompt: string;
  questionType: string;
  correctAnswer: string;
  studentAnswer?: string;
  language?: string;
}

export async function generateExplanation(
  ctx: AuthContext,
  input: GenerateExplanationInput,
): Promise<unknown> {
  const effectiveLanguage = resolveLanguage(ctx, input.language);
  const userPrompt = `Question: ${input.questionPrompt}\nQuestion type: ${input.questionType}\nCorrect answer: ${input.correctAnswer}\n${input.studentAnswer ? `Student's answer: ${input.studentAnswer}\n` : ""}Explain why the correct answer is correct${input.studentAnswer ? " and why the student's answer was wrong" : ""}. Language: ${effectiveLanguage}. Return JSON.`;
  return callAi(ctx, GENERATE_EXPLANATION_SYS, userPrompt, "generate_explanation");
}

export interface GeneratePracticeQuizInput {
  topic: string;
  weakAreas?: string[];
  questionCount?: number;
  language?: string;
}

export async function generatePracticeQuiz(
  ctx: AuthContext,
  input: GeneratePracticeQuizInput,
): Promise<unknown> {
  const effectiveLanguage = resolveLanguage(ctx, input.language);
  const userPrompt = `Generate ${input.questionCount ?? 5} practice questions about "${input.topic}"${input.weakAreas && input.weakAreas.length > 0 ? `, focusing on these weak areas: ${input.weakAreas.join(", ")}` : ""}. Language: ${effectiveLanguage}. Return JSON with the same schema as generate_questions.`;
  return callAi(ctx, GENERATE_QUESTIONS_SYS, userPrompt, "generate_practice_quiz");
}
