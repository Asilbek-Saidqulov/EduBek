import type { z } from "zod";

export class AiError extends Error {
  constructor(
    message: string,
    public code: string = "AI_SERVICE_ERROR",
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AiError";
  }
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface AiMeta {
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface OpenRouterToolDeclaration {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
}

export interface GenerateStructuredJsonOptions<T> {
  prompt: string;
  systemPrompt?: string;
  schema?: z.ZodType<T>;
  temperature?: number;
  model?: string;
  maxTokens?: number;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  tools?: OpenRouterToolDeclaration[];
  toolChoice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
}

export interface ChatCompletionResult {
  text: string;
  toolCalls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  meta: AiMeta;
}

export const DEFAULT_GENERAL_MODEL = "deepseek/deepseek-v4-flash-0731";
export const DEFAULT_TUTOR_MODEL = "qwen/qwen3.5-flash-02-23";
export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function getGeneralModel(): string {
  if (process.env.OPENROUTER_GENERAL_MODEL) {
    return process.env.OPENROUTER_GENERAL_MODEL;
  }
  if (process.env.OPENROUTER_MODEL && !process.env.OPENROUTER_MODEL.includes("gemini")) {
    return process.env.OPENROUTER_MODEL;
  }
  return DEFAULT_GENERAL_MODEL;
}

export function getTutorModel(): string {
  return process.env.OPENROUTER_TUTOR_MODEL || DEFAULT_TUTOR_MODEL;
}

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "OpenRouter AI API key is not configured. Please ensure OPENROUTER_API_KEY is set.",
      "API_KEY_MISSING",
      503
    );
  }

  const referer = process.env.OPENROUTER_REFERER || "https://edubek.app";
  return { apiKey, referer };
}

/**
 * Clean thinking/reasoning blocks and tags from model output
 */
export function cleanModelOutputText(rawText: string): string {
  if (!rawText) return "";
  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^Thinking Process:[\s\S]*?<\/think>/gi, "")
    .replace(/^Thinking Process:[\s\S]*?\n\n/gi, "")
    .trim();

  // If entire text was enclosed in <think> without closing tag, attempt best effort recovery
  if (!cleaned && rawText.includes("<think>")) {
    cleaned = rawText.replace(/<think>/gi, "").replace(/<\/think>/gi, "").trim();
  }

  return cleaned || rawText.trim();
}

/**
 * Clean markdown json blocks and parse
 */
function parseJsonSafely<T>(rawText: string, schema?: z.ZodType<T>): T {
  const cleanedText = cleanModelOutputText(rawText);
  let parsed: any;

  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    // Strip markdown code fences if present
    const stripped = cleanedText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      parsed = JSON.parse(stripped);
    } catch {
      // Find outermost JSON object or array bounds
      const firstBrace = stripped.indexOf("{");
      const lastBrace = stripped.lastIndexOf("}");
      const firstBracket = stripped.indexOf("[");
      const lastBracket = stripped.lastIndexOf("]");

      if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        parsed = JSON.parse(stripped.slice(firstBrace, lastBrace + 1));
      } else if (firstBracket !== -1 && lastBracket !== -1) {
        parsed = JSON.parse(stripped.slice(firstBracket, lastBracket + 1));
      } else {
        throw new AiError("Failed to parse JSON response from AI model", "JSON_PARSE_ERROR", 500);
      }
    }
  }

  if (schema) {
    const validationResult = schema.safeParse(parsed);
    if (!validationResult.success) {
      throw new AiError(
        `AI output validation failed: ${validationResult.error.message}`,
        "SCHEMA_VALIDATION_ERROR",
        500
      );
    }
    return validationResult.data;
  }

  return parsed as T;
}

/**
 * Helper to call OpenRouter Chat Completions API with bounded max_tokens and error normalization
 */
async function callOpenRouter(options: {
  messages: Array<{ role: string; content: string; name?: string; tool_call_id?: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
  tools?: OpenRouterToolDeclaration[];
  toolChoice?: any;
}): Promise<{ text: string; toolCalls?: any[]; meta: AiMeta }> {
  const { apiKey, referer } = getOpenRouterConfig();
  const modelToUse = options.model || getGeneralModel();
  const maxTokensToUse = options.maxTokens ?? 3000;
  const temperatureToUse = options.temperature ?? 0.3;

  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const bodyPayload: Record<string, any> = {
      model: modelToUse,
      messages: options.messages,
      temperature: temperatureToUse,
      max_tokens: maxTokensToUse,
    };

    if (options.responseFormat) {
      bodyPayload.response_format = options.responseFormat;
    }

    if (options.tools && options.tools.length > 0) {
      bodyPayload.tools = options.tools;
      if (options.toolChoice) {
        bodyPayload.tool_choice = options.toolChoice;
      }
    }

    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "EduBek AI Platform",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      console.error("[OpenRouter API error response]:", response.status, errorBody);

      if (response.status === 401) {
        throw new AiError("Invalid or expired OpenRouter API key", "UNAUTHORIZED", 401);
      }
      if (response.status === 402) {
        throw new AiError(
          "OpenRouter credit reservation error or insufficient balance",
          "INSUFFICIENT_CREDITS",
          402
        );
      }
      if (response.status === 429) {
        throw new AiError(
          "OpenRouter rate limit reached. Please try again in a few moments.",
          "RATE_LIMITED",
          429
        );
      }

      const errMsg =
        typeof errorBody === "object" && errorBody?.error?.message
          ? errorBody.error.message
          : `OpenRouter request failed with status ${response.status}`;

      throw new AiError(
        errMsg,
        "OPENROUTER_ERROR",
        response.status >= 400 && response.status < 600 ? response.status : 500
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    const choice = data.choices?.[0];
    const rawText = choice?.message?.content || "";
    const cleanedText = cleanModelOutputText(rawText);
    const toolCalls = choice?.message?.tool_calls;
    const usage = data.usage;

    return {
      text: cleanedText,
      toolCalls,
      meta: {
        model: data.model || modelToUse,
        latencyMs,
        tokensIn: usage?.prompt_tokens,
        tokensOut: usage?.completion_tokens,
      },
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw new AiError("OpenRouter request timed out after 60 seconds", "TIMEOUT", 504);
    }
    if (error instanceof AiError) throw error;
    console.error("[OpenRouter network error]:", error);
    throw new AiError(
      error?.message || "Failed to communicate with OpenRouter AI gateway",
      "GATEWAY_ERROR",
      502
    );
  }
}

/**
 * Generate plain text response using OpenRouter (General AI default: DeepSeek V4 Flash)
 */
export async function generateText(
  options: GenerateTextOptions
): Promise<{ text: string; meta: AiMeta }> {
  const { prompt, systemPrompt, temperature = 0.3, model, maxTokens = 2048 } = options;

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const result = await callOpenRouter({
    messages,
    model: model || getGeneralModel(),
    temperature,
    maxTokens,
  });

  return {
    text: result.text,
    meta: result.meta,
  };
}

/**
 * Generate structured JSON validated by a Zod schema using OpenRouter (General AI default: DeepSeek V4 Flash)
 */
export async function generateStructuredJson<T>(
  options: GenerateStructuredJsonOptions<T>
): Promise<{ data: T; meta: AiMeta }> {
  const {
    prompt,
    systemPrompt,
    schema,
    temperature = 0.3,
    model,
    maxTokens = 3500,
  } = options;

  const messages: Array<{ role: string; content: string }> = [];
  const fullSystemPrompt = [
    systemPrompt,
    "CRITICAL REQUIREMENT: You MUST respond ONLY with valid, RFC 8259 compliant JSON matching the requested structure. Do not output conversational preamble, thinking tags, or markdown code blocks.",
  ]
    .filter(Boolean)
    .join("\n\n");

  messages.push({ role: "system", content: fullSystemPrompt });
  messages.push({ role: "user", content: prompt });

  const result = await callOpenRouter({
    messages,
    model: model || getGeneralModel(),
    temperature,
    maxTokens,
    responseFormat: { type: "json_object" },
  });

  const parsedData = parseJsonSafely<T>(result.text, schema);

  return {
    data: parsedData,
    meta: result.meta,
  };
}

/**
 * Multi-turn chat completion using OpenRouter (defaults to specified model or General/Tutor model)
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const {
    messages,
    systemPrompt,
    temperature = 0.4,
    model,
    maxTokens = 2500,
    tools,
    toolChoice,
  } = options;

  const formattedMessages: Array<{ role: string; content: string; name?: string; tool_call_id?: string }> = [];
  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }

  for (const m of messages) {
    formattedMessages.push({
      role: m.role,
      content: m.content,
      ...(m.name ? { name: m.name } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    });
  }

  const result = await callOpenRouter({
    messages: formattedMessages,
    model: model || getGeneralModel(),
    temperature,
    maxTokens,
    tools,
    toolChoice,
  });

  return {
    text: result.text,
    toolCalls: result.toolCalls,
    meta: result.meta,
  };
}
