import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  generateText,
  generateStructuredJson,
  chatCompletion,
  extractJsonString,
  AiConfigError,
  AiRateLimitError,
  AiProviderError,
  AiValidationError,
} from "@/lib/ai/openrouter";

describe("OpenRouter AI Client (Unit Tests)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OPENROUTER_API_KEY = "test-openrouter-key-12345";
    process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-001";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("extractJsonString Helper", () => {
    it("should clean standard json fences", () => {
      const raw = "```json\n{\"hello\":\"world\"}\n```";
      expect(extractJsonString(raw)).toBe("{\"hello\":\"world\"}");
    });

    it("should clean generic code fences", () => {
      const raw = "```\n{\"foo\":\"bar\"}\n```";
      expect(extractJsonString(raw)).toBe("{\"foo\":\"bar\"}");
    });

    it("should keep already clean json untouched", () => {
      const raw = "{\"key\": 123}";
      expect(extractJsonString(raw)).toBe("{\"key\": 123}");
    });
  });

  describe("generateText", () => {
    it("should throw AiConfigError if API key is not configured", async () => {
      delete process.env.OPENROUTER_API_KEY;

      await expect(
        generateText({ prompt: "Hello AI" })
      ).rejects.toThrow(AiConfigError);
    });

    it("should successfully generate text when provider returns 200", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: "google/gemini-2.0-flash-001",
          choices: [
            {
              message: {
                role: "assistant",
                content: "This is a real educational explanation.",
              },
            },
          ],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 25,
          },
        }),
      });

      global.fetch = mockFetch;

      const result = await generateText({
        prompt: "Explain Newton's second law",
        systemPrompt: "You are a physics teacher.",
      });

      expect(result.text).toBe("This is a real educational explanation.");
      expect(result.meta.model).toBe("google/gemini-2.0-flash-001");
      expect(result.meta.tokensIn).toBe(15);
      expect(result.meta.tokensOut).toBe(25);
      expect(result.meta.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should throw AiProviderError if response text is empty", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "" } }],
        }),
      });

      await expect(
        generateText({ prompt: "Hello" })
      ).rejects.toThrow(AiProviderError);
    });
  });

  describe("generateStructuredJson", () => {
    const testSchema = z.object({
      title: z.string(),
      count: z.number(),
      items: z.array(z.string()),
    });

    it("should parse and validate structured JSON response", async () => {
      const payload = {
        title: "Test Quiz",
        count: 2,
        items: ["Question 1", "Question 2"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: "google/gemini-2.0-flash-001",
          choices: [
            {
              message: {
                content: JSON.stringify(payload),
              },
            },
          ],
          usage: { prompt_tokens: 20, completion_tokens: 30 },
        }),
      });

      const result = await generateStructuredJson({
        prompt: "Generate a 2-question quiz",
        schema: testSchema,
      });

      expect(result.data).toEqual(payload);
      expect(result.data.title).toBe("Test Quiz");
      expect(result.data.items).toHaveLength(2);
    });

    it("should handle JSON returned inside markdown fences", async () => {
      const payload = {
        title: "Fenced Quiz",
        count: 1,
        items: ["Item A"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
              },
            },
          ],
        }),
      });

      const result = await generateStructuredJson({
        prompt: "Generate fenced JSON",
        schema: testSchema,
      });

      expect(result.data.title).toBe("Fenced Quiz");
    });

    it("should throw AiValidationError if schema validation fails", async () => {
      const invalidPayload = {
        title: "Invalid Schema",
        count: "not a number", // Fails schema
        items: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(invalidPayload),
              },
            },
          ],
        }),
      });

      await expect(
        generateStructuredJson({
          prompt: "Generate invalid JSON",
          schema: testSchema,
        })
      ).rejects.toThrow(AiValidationError);
    });
  });

  describe("chatCompletion", () => {
    it("should handle multi-turn conversational messages", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Step 1: Apply the quadratic formula.",
              },
            },
          ],
        }),
      });

      const result = await chatCompletion({
        messages: [
          { role: "user", content: "How do I solve x^2 + 5x + 6 = 0?" },
          { role: "assistant", content: "Factor into (x+2)(x+3) = 0" },
          { role: "user", content: "What if it doesn't factor easily?" },
        ],
        systemPrompt: "You are an algebra tutor.",
      });

      expect(result.text).toBe("Step 1: Apply the quadratic formula.");
    });
  });

  describe("Error Handling & Rate Limits", () => {
    it("should throw AiRateLimitError on 429 status code after retries", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => JSON.stringify({ error: { message: "Rate limit exceeded" } }),
      });

      await expect(
        generateText({ prompt: "Spam query" })
      ).rejects.toThrow(AiRateLimitError);
    });

    it("should throw AiProviderError on 503 service unavailable", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service Unavailable",
      });

      await expect(
        generateText({ prompt: "Query" })
      ).rejects.toThrow(AiProviderError);
    });
  });
});
