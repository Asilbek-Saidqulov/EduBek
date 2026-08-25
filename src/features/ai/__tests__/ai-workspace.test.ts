import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateBodySchema,
  editBodySchema,
  convertBodySchema,
  createSessionBodySchema,
  generateResource,
  editResource,
  convertResource,
  getSuggestions,
  listPromptTemplates,
} from "@/features/ai-workspace";
import * as aiLib from "@/lib/ai";

vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return {
    ...actual,
    generateText: vi.fn(),
    generateStructuredJson: vi.fn(),
    chatCompletion: vi.fn(),
  };
});

describe("AI Workspace Feature Module (Unit Tests)", () => {
  const mockCtx: any = {
    userId: "user-test-123",
    email: "student@edubek.uz",
    locale: "uz",
    platformRoles: ["STUDENT"],
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Schema Validations", () => {
    it("should validate valid generateBodySchema", () => {
      const parsed = generateBodySchema.safeParse({
        topic: "Quadratic Equations",
        resourceType: "quiz",
        grade: "9th Grade",
        language: "uz",
        instructions: "Include 5 questions with worked steps",
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject short topic in generateBodySchema", () => {
      const parsed = generateBodySchema.safeParse({
        topic: "a",
      });
      expect(parsed.success).toBe(false);
    });

    it("should validate editBodySchema", () => {
      const parsed = editBodySchema.safeParse({
        content: "Photosynthesis takes place in chloroplasts.",
        instruction: "Add formula for light-dependent reaction",
      });
      expect(parsed.success).toBe(true);
    });

    it("should validate convertBodySchema", () => {
      const parsed = convertBodySchema.safeParse({
        content: "Newton's first law states that an object remains at rest unless acted on by force.",
        targetFormat: "flashcards",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("generateResource", () => {
    it("should generate structured educational resource", async () => {
      vi.mocked(aiLib.generateStructuredJson).mockResolvedValue({
        data: {
          title: "Introduction to Algorithms",
          summary: "Core principles of time and space complexity.",
          contentMarkdown: "# Algorithms\n\nBig O measures efficiency.",
          sections: [{ heading: "Time Complexity", body: "O(1) vs O(n)" }],
          keyTerms: [{ term: "Algorithm", definition: "Step by step procedure" }],
        },
        rawText: "{}",
        meta: { model: "google/gemini-2.0-flash-001", latencyMs: 120 },
      });

      const res = await generateResource(mockCtx, {
        topic: "Algorithms",
        resourceType: "lesson_plan",
        language: "en",
      });

      expect(res.success).toBe(true);
      expect(res.data.title).toBe("Introduction to Algorithms");
      expect(res.data.keyTerms).toHaveLength(1);
    });
  });

  describe("editResource", () => {
    it("should edit content using instruction", async () => {
      vi.mocked(aiLib.generateText).mockResolvedValue({
        text: "Edited: Photosynthesis (6CO2 + 6H2O -> C6H12O6 + 6O2)",
        meta: { model: "google/gemini-2.0-flash-001", latencyMs: 150 },
      });

      const res = await editResource(mockCtx, {
        content: "Photosynthesis converts light to sugar.",
        instruction: "Add the chemical balanced equation.",
        locale: "en",
      });

      expect(res.success).toBe(true);
      expect(res.editedContent).toContain("6CO2 + 6H2O");
    });
  });

  describe("convertResource", () => {
    it("should convert content format", async () => {
      vi.mocked(aiLib.generateStructuredJson).mockResolvedValue({
        data: {
          title: "Newton's Laws Flashcards",
          summary: "3 Flashcards created from lecture notes.",
          contentMarkdown: "- Front: First Law | Back: Inertia",
          sections: [],
          keyTerms: [],
        },
        rawText: "{}",
        meta: { model: "google/gemini-2.0-flash-001", latencyMs: 100 },
      });

      const res = await convertResource(mockCtx, {
        content: "An object remains at rest unless acted on by force.",
        targetFormat: "flashcards",
      });

      expect(res.success).toBe(true);
      expect(res.data.title).toBe("Newton's Laws Flashcards");
    });
  });

  describe("Suggestions & Templates", () => {
    it("should return prompt templates", async () => {
      const res = await listPromptTemplates(mockCtx);
      expect(res.success).toBe(true);
      expect(res.templates.length).toBeGreaterThanOrEqual(4);
    });

    it("should return starter suggestions", async () => {
      const res = await getSuggestions(mockCtx);
      expect(res.success).toBe(true);
      expect(res.suggestions.length).toBeGreaterThanOrEqual(4);
    });
  });
});
