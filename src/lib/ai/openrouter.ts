import { z } from "zod";

/**
 * OpenRouter AI Client for EduBek
 *
 * Centralized, server-side AI provider integration using OpenRouter's
 * OpenAI-compatible completions API.
 */

export class AiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "AI_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AiError";
  }
}

export class AiConfigError extends AiError {
  constructor(message = "OpenRouter API key is not configured") {
    super(message, 503, "AI_CONFIG_ERROR");
    this.name = "AiConfigError";
  }
}

export class AiRateLimitError extends AiError {
  constructor(message = "AI service rate limit reached. Please try again in a moment.") {
    super(message, 429, "AI_RATE_LIMIT_ERROR");
    this.name = "AiRateLimitError";
  }
}

export class AiProviderError extends AiError {
  constructor(message = "AI service is temporarily unavailable. Please try again.") {
    super(message, 503, "AI_PROVIDER_ERROR");
    this.name = "AiProviderError";
  }
}

export class AiValidationError extends AiError {
  constructor(message = "Failed to parse and validate AI response.") {
    super(message, 502, "AI_VALIDATION_ERROR");
    this.name = "AiValidationError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateJsonOptions<T> {
  prompt: string;
  systemPrompt?: string;
  schema: z.ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiResponseMeta {
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
}

export interface AiTextResult {
  text: string;
  meta: AiResponseMeta;
}

export interface AiJsonResult<T> {
  data: T;
  rawText: string;
  meta: AiResponseMeta;
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_FALLBACK_MODEL = "google/gemini-2.0-flash-001";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY?.trim() || null;
}

function getModel(overrideModel?: string): string {
  if (overrideModel && overrideModel.trim()) {
    return overrideModel.trim();
  }
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
}

function getReferer(): string {
  return process.env.OPENROUTER_REFERER?.trim() || "https://edubek.uz";
}

/**
 * Execute a raw fetch to OpenRouter with retries and timeout
 */
async function executeOpenRouterRequest(
  payload: Record<string, unknown>,
  retryCount = 0
): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AiConfigError();
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": getReferer(),
        "X-Title": "EduBek AI Education Ecosystem",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // raw text
      }

      const errorMessage =
        parsedError?.error?.message || parsedError?.message || res.statusText;

      // Handle rate limits
      if (res.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 1500;
          await new Promise((r) => setTimeout(r, delay));
          return executeOpenRouterRequest(payload, retryCount + 1);
        }
        throw new AiRateLimitError();
      }

      // Handle transient server errors with retry
      if ([500, 502, 503, 504].includes(res.status)) {
        if (retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          return executeOpenRouterRequest(payload, retryCount + 1);
        }
        throw new AiProviderError(
          "AI provider is currently experiencing high load. Please try again."
        );
      }

      if (res.status === 401) {
        throw new AiConfigError("Invalid OpenRouter API credentials");
      }

      if (res.status === 402) {
        throw new AiProviderError("Insufficient AI provider credits.");
      }

      throw new AiError(
        `AI request failed: ${errorMessage}`,
        res.status,
        "AI_REQUEST_FAILED"
      );
    }

    const data = await res.json();
    return { data, latencyMs: Date.now() - startTime };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof AiError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new AiProviderError("AI request timed out. Please try again.");
    }

    if (retryCount < MAX_RETRIES) {
      const delay = (retryCount + 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return executeOpenRouterRequest(payload, retryCount + 1);
    }

    throw new AiProviderError("Network failure connecting to AI service.");
  }
}

/**
 * Generate free-form educational text with OpenRouter
 */
export async function generateText(options: GenerateTextOptions): Promise<AiTextResult> {
  const model = getModel(options.model);
  const messages: ChatMessage[] = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.maxTokens) {
    payload.max_tokens = options.maxTokens;
  }

  const { data, latencyMs } = await executeOpenRouterRequest(payload);
  const choice = data?.choices?.[0];
  const text = choice?.message?.content?.trim() || "";

  if (!text) {
    throw new AiProviderError("AI returned an empty response. Please try again.");
  }

  return {
    text,
    meta: {
      model: data?.model || model,
      tokensIn: data?.usage?.prompt_tokens,
      tokensOut: data?.usage?.completion_tokens,
      latencyMs,
    },
  };
}

/**
 * Multi-turn conversational chat completion
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<AiTextResult> {
  const model = getModel(options.model);
  const messages: ChatMessage[] = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }

  messages.push(...options.messages);

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.maxTokens) {
    payload.max_tokens = options.maxTokens;
  }

  const { data, latencyMs } = await executeOpenRouterRequest(payload);
  const choice = data?.choices?.[0];
  const text = choice?.message?.content?.trim() || "";

  if (!text) {
    throw new AiProviderError("AI returned an empty response. Please try again.");
  }

  return {
    text,
    meta: {
      model: data?.model || model,
      tokensIn: data?.usage?.prompt_tokens,
      tokensOut: data?.usage?.completion_tokens,
      latencyMs,
    },
  };
}

/**
 * Clean JSON output from potential markdown fences (e.g. ```json ... ```)
 */
export function extractJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

/**
 * Generate and validate strictly-typed structured JSON
 */
export async function generateStructuredJson<T>(
  options: GenerateJsonOptions<T>
): Promise<AiJsonResult<T>> {
  const model = getModel(options.model);
  const systemInstruction = options.systemPrompt
    ? `${options.systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON matching the requested structure without any markdown formatting or commentary.`
    : "You are an expert academic AI. You MUST respond ONLY with valid, minified JSON matching the exact schema requested without any conversational preamble or markdown formatting.";

  const messages: ChatMessage[] = [
    { role: "system", content: systemInstruction },
    { role: "user", content: options.prompt },
  ];

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    response_format: { type: "json_object" },
  };

  if (options.maxTokens) {
    payload.max_tokens = options.maxTokens;
  }

  const { data, latencyMs } = await executeOpenRouterRequest(payload);
  const choice = data?.choices?.[0];
  const rawText = choice?.message?.content?.trim() || "";

  if (!rawText) {
    throw new AiProviderError("AI returned an empty JSON response.");
  }

  const cleanedJson = extractJsonString(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err) {
    // Attempt fallback extraction if wrapped in substring
    const firstBrace = cleanedJson.indexOf("{");
    const lastBrace = cleanedJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleanedJson.substring(firstBrace, lastBrace + 1));
      } catch {
        throw new AiValidationError("AI output was not valid JSON.");
      }
    } else {
      throw new AiValidationError("AI output was not valid JSON.");
    }
  }

  const validationResult = options.schema.safeParse(parsed);
  if (!validationResult.success) {
    console.error(
      "AI Structured JSON validation failed:",
      validationResult.error.issues
    );
    throw new AiValidationError(
      `AI generated content did not meet schema constraints: ${validationResult.error.issues[0]?.message || "Validation failed"}`
    );
  }

  return {
    data: validationResult.data,
    rawText,
    meta: {
      model: data?.model || model,
      tokensIn: data?.usage?.prompt_tokens,
      tokensOut: data?.usage?.completion_tokens,
      latencyMs,
    },
  };
}
