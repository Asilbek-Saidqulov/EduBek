import { getGeminiClient } from "@/lib/gemini";
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
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiMeta {
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

export interface GenerateStructuredJsonOptions<T> {
  prompt: string;
  systemPrompt?: string;
  schema?: z.ZodType<T>;
  temperature?: number;
  model?: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Generate plain text response using Gemini
 */
export async function generateText(
  options: GenerateTextOptions
): Promise<{ text: string; meta: AiMeta }> {
  const { prompt, systemPrompt, temperature = 0.3, model = DEFAULT_MODEL } = options;
  const ai = getGeminiClient();
  if (!ai) {
    throw new AiError(
      "Gemini AI client is not configured. Please ensure GEMINI_API_KEY is set.",
      "API_KEY_MISSING",
      503
    );
  }

  const startTime = Date.now();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        temperature,
      },
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text || "";
    const usage = response.usageMetadata;

    return {
      text,
      meta: {
        model,
        latencyMs,
        tokensIn: usage?.promptTokenCount,
        tokensOut: usage?.candidatesTokenCount,
      },
    };
  } catch (error: any) {
    console.error("[AI generateText error]:", error);
    if (error instanceof AiError) throw error;
    throw new AiError(
      error?.message || "Failed to generate text from AI model",
      "GENERATION_FAILED",
      500
    );
  }
}

/**
 * Generate structured JSON validated by a Zod schema using Gemini
 */
export async function generateStructuredJson<T>(
  options: GenerateStructuredJsonOptions<T>
): Promise<{ data: T; meta: AiMeta }> {
  const { prompt, systemPrompt, schema, temperature = 0.3, model = DEFAULT_MODEL } = options;
  const ai = getGeminiClient();
  if (!ai) {
    throw new AiError(
      "Gemini AI client is not configured. Please ensure GEMINI_API_KEY is set.",
      "API_KEY_MISSING",
      503
    );
  }

  const startTime = Date.now();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        temperature,
        responseMimeType: "application/json",
      },
    });

    const latencyMs = Date.now() - startTime;
    const rawText = response.text || "{}";
    const usage = response.usageMetadata;

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsedJson = JSON.parse(cleaned);
    }

    let validatedData: T = parsedJson;
    if (schema) {
      const validationResult = schema.safeParse(parsedJson);
      if (!validationResult.success) {
        throw new AiError(
          `AI output validation failed: ${validationResult.error.message}`,
          "SCHEMA_VALIDATION_ERROR",
          500
        );
      }
      validatedData = validationResult.data;
    }

    return {
      data: validatedData,
      meta: {
        model,
        latencyMs,
        tokensIn: usage?.promptTokenCount,
        tokensOut: usage?.candidatesTokenCount,
      },
    };
  } catch (error: any) {
    console.error("[AI generateStructuredJson error]:", error);
    if (error instanceof AiError) throw error;
    throw new AiError(
      error?.message || "Failed to generate structured JSON from AI model",
      "STRUCTURED_GENERATION_FAILED",
      500
    );
  }
}

/**
 * Multi-turn chat completion using Gemini
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<{ text: string; meta: AiMeta }> {
  const { messages, systemPrompt, temperature = 0.7, model = DEFAULT_MODEL } = options;
  const ai = getGeminiClient();
  if (!ai) {
    throw new AiError(
      "Gemini AI client is not configured. Please ensure GEMINI_API_KEY is set.",
      "API_KEY_MISSING",
      503
    );
  }

  const startTime = Date.now();
  try {
    const nonSystemMessages = messages.filter((m) => m.role !== "system");
    const systemMessages = messages.filter((m) => m.role === "system");

    const fullSystemInstruction = [
      systemPrompt,
      ...systemMessages.map((m) => m.content),
    ]
      .filter(Boolean)
      .join("\n\n");

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: fullSystemInstruction
          ? { parts: [{ text: fullSystemInstruction }] }
          : undefined,
        temperature,
      },
    });

    const latencyMs = Date.now() - startTime;
    const text = response.text || "";
    const usage = response.usageMetadata;

    return {
      text,
      meta: {
        model,
        latencyMs,
        tokensIn: usage?.promptTokenCount,
        tokensOut: usage?.candidatesTokenCount,
      },
    };
  } catch (error: any) {
    console.error("[AI chatCompletion error]:", error);
    if (error instanceof AiError) throw error;
    throw new AiError(
      error?.message || "Failed to complete chat conversation with AI model",
      "CHAT_COMPLETION_FAILED",
      500
    );
  }
}
