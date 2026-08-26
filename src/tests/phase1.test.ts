import { describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";
import { AiError, generateText, generateStructuredJson, chatCompletion } from "@/lib/ai";
import { createEmptyBlackboardDocument, createEmptyDocument } from "@/lib/tutor/blackboard-state";
import { z } from "zod";

describe("Phase 1 — Core Backend Repair Unit & Integration Tests", () => {
  describe("Rate Limiter Import & Logic Verification", () => {
    it("exports and evaluates checkRateLimit correctly", () => {
      const key = `phase1-limiter-test-${Date.now()}`;
      const first = checkRateLimit(key, 2, 10000);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);

      const second = checkRateLimit(key, 2, 10000);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);

      const third = checkRateLimit(key, 2, 10000);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
    });
  });

  describe("AI Compatibility Module (@/lib/ai)", () => {
    it("instantiates and throws typed AiError properly", () => {
      const err = new AiError("Model rate limited", "RATE_LIMITED", 429);
      expect(err.name).toBe("AiError");
      expect(err.code).toBe("RATE_LIMITED");
      expect(err.statusCode).toBe(429);
      expect(err.message).toBe("Model rate limited");
      expect(err instanceof Error).toBe(true);
      expect(err instanceof AiError).toBe(true);
    });

    it("throws appropriate error when Gemini API key is missing", async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      await expect(
        generateText({ prompt: "Hello" })
      ).rejects.toThrow(AiError);

      await expect(
        generateStructuredJson({
          prompt: "Return json",
          schema: z.object({ msg: z.string() }),
        })
      ).rejects.toThrow(AiError);

      await expect(
        chatCompletion({
          messages: [{ role: "user", content: "Hi" }],
        })
      ).rejects.toThrow(AiError);

      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });

  describe("Tutor Blackboard State Factory", () => {
    it("exports createEmptyBlackboardDocument and initializes clean document structure", () => {
      const doc = createEmptyBlackboardDocument("Linear Algebra", "Math", "Matrix Transformations");
      expect(doc.id).toBeDefined();
      expect(doc.title).toBe("Linear Algebra");
      expect(doc.subject).toBe("Math");
      expect(doc.topic).toBe("Matrix Transformations");
      expect(Array.isArray(doc.sections)).toBe(true);
      expect(doc.sections.length).toBe(0);
      expect(doc.updatedAt).toBeDefined();
    });

    it("supports default parameter initialization", () => {
      const doc = createEmptyDocument();
      expect(doc.title).toBe("Untitled Lesson");
      expect(doc.sections.length).toBe(0);
    });
  });

  describe("Wallet Route Protection & Unauthenticated Rejection", () => {
    it("rejects unauthenticated requests to /api/wallet/balance", async () => {
      const { GET } = await import("@/app/api/wallet/balance/route");
      const req = new Request("http://localhost:3000/api/wallet/balance");
      const res = await GET(req as any);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/wallet/history", async () => {
      const { GET } = await import("@/app/api/wallet/history/route");
      const req = new Request("http://localhost:3000/api/wallet/history");
      const res = await GET(req as any);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });
  });
});
