/**
 * EduBek MVP enhancements — unit tests.
 *
 * Covers the pure logic added in Phase MVP-AI-Media, MVP-Quiz-Image,
 * MVP-Discover-Policy, and MVP-Marketplace-Policy:
 *   - AI media sanitizer (sanitizeMedia, sanitizeQuestion, extractJson)
 *   - Quiz Zod schemas (createQuizBodySchema, addQuestionBodySchema,
 *     updateQuestionBodySchema, publishToDiscoverBodySchema)
 *   - Marketplace policy flag detection (isResourceAiGenerated)
 *     — pure logic, mocked db.
 *
 * No LLM calls, no HTTP, no real Prisma. All deterministic.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// AI sanitizer — pure functions re-exported from ai.internals.
// ---------------------------------------------------------------------------

import {
  sanitizeMedia,
  sanitizeQuestion,
  extractJson,
} from "@/features/ai";

describe("AI media sanitizer — sanitizeMedia", () => {
  it("returns { required: false } for null", () => {
    expect(sanitizeMedia(null)).toEqual({ required: false });
  });
  it("returns { required: false } for undefined", () => {
    expect(sanitizeMedia(undefined)).toEqual({ required: false });
  });
  it("returns { required: false } for primitives", () => {
    expect(sanitizeMedia("foo")).toEqual({ required: false });
    expect(sanitizeMedia(42)).toEqual({ required: false });
    expect(sanitizeMedia(true)).toEqual({ required: false });
  });
  it("returns { required: false } for empty object", () => {
    expect(sanitizeMedia({})).toEqual({ required: false });
  });
  it("returns { required: false } when required is false", () => {
    expect(sanitizeMedia({ required: false })).toEqual({ required: false });
  });
  it("returns { required: false } when required is true but type is not image", () => {
    expect(sanitizeMedia({ required: true, type: "audio" as any, search: "x" })).toEqual({ required: false });
    expect(sanitizeMedia({ required: true, type: "video" as any, search: "x" })).toEqual({ required: false });
  });
  it("returns { required: true, type: image, search } for valid required image", () => {
    expect(sanitizeMedia({ required: true, type: "image", search: "France flag" })).toEqual({
      required: true,
      type: "image",
      search: "France flag",
    });
  });
  it("drops search when required is true but type is missing", () => {
    expect(sanitizeMedia({ required: true, search: "x" })).toEqual({ required: false });
  });
  it("keeps type=image when required is true but search is missing", () => {
    expect(sanitizeMedia({ required: true, type: "image" })).toEqual({
      required: true,
      type: "image",
    });
  });
  it("trims and truncates search to 200 chars", () => {
    const long = "a".repeat(500);
    const r = sanitizeMedia({ required: true, type: "image", search: `  ${long}  ` });
    expect(r.required).toBe(true);
    expect(r.type).toBe("image");
    expect(r.search?.length).toBe(200);
  });
  it("drops search when it is empty after trim", () => {
    expect(sanitizeMedia({ required: true, type: "image", search: "   " })).toEqual({
      required: true,
      type: "image",
    });
  });
  it("drops search when it is not a string", () => {
    expect(sanitizeMedia({ required: true, type: "image", search: 42 as any })).toEqual({
      required: true,
      type: "image",
    });
  });
  it("ignores unknown extra fields", () => {
    expect(
      sanitizeMedia({ required: true, type: "image", search: "x", extra: "ignored", provider: "unsplash" } as any),
    ).toEqual({ required: true, type: "image", search: "x" });
  });
  it("does not crash on weird shapes", () => {
    expect(sanitizeMedia({ required: "yes" as any })).toEqual({ required: false });
    expect(sanitizeMedia({ required: 1 as any })).toEqual({ required: false });
    expect(sanitizeMedia({ type: "image" })).toEqual({ required: false });
  });
});

describe("AI media sanitizer — sanitizeQuestion", () => {
  const base = {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    correctIndex: 0,
    explanation: "Paris is the capital of France.",
  };
  it("preserves a well-formed question without media", () => {
    const q = sanitizeQuestion(base, 0);
    expect(q).not.toBeNull();
    expect(q!.question).toBe(base.question);
    expect(q!.media).toEqual({ required: false });
  });
  it("preserves a well-formed question with required image media", () => {
    const q = sanitizeQuestion({ ...base, media: { required: true, type: "image", search: "France map" } }, 0);
    expect(q).not.toBeNull();
    expect(q!.media).toEqual({ required: true, type: "image", search: "France map" });
  });
  it("drops non-image media to { required: false }", () => {
    const q = sanitizeQuestion({ ...base, media: { required: true, type: "audio" as any, search: "x" } }, 0);
    expect(q).not.toBeNull();
    expect(q!.media).toEqual({ required: false });
  });
  it("returns null when options length is not 4", () => {
    expect(sanitizeQuestion({ ...base, options: ["a", "b"] }, 0)).toBeNull();
    expect(sanitizeQuestion({ ...base, options: ["a", "b", "c", "d", "e"] }, 0)).not.toBeNull();
  });
  it("clamps missing correctIndex to 0", () => {
    const q = sanitizeQuestion({ ...base, correctIndex: undefined as any }, 0);
    expect(q).not.toBeNull();
    expect(q!.correctIndex).toBe(0);
  });
  it("clamps out-of-range correctIndex to 0", () => {
    const q = sanitizeQuestion({ ...base, correctIndex: 99 as any }, 0);
    expect(q).not.toBeNull();
    expect(q!.correctIndex).toBe(0);
  });
  it("uses fallback question text when missing", () => {
    const q = sanitizeQuestion({ ...base, question: undefined as any }, 5);
    expect(q).not.toBeNull();
    expect(q!.question).toBe("Question 6");
  });
  it("coerces non-string options to strings", () => {
    const q = sanitizeQuestion({ ...base, options: [1, 2, 3, 4] as any }, 0);
    expect(q).not.toBeNull();
    expect(q!.options).toEqual(["1", "2", "3", "4"]);
  });
  it("coerces missing explanation to empty string", () => {
    const q = sanitizeQuestion({ ...base, explanation: undefined as any }, 0);
    expect(q).not.toBeNull();
    expect(q!.explanation).toBe("");
  });
});

describe("AI media sanitizer — extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("parses JSON wrapped in ```json fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("parses JSON wrapped in plain ``` fences", () => {
    expect(extractJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("returns null for non-JSON", () => {
    expect(extractJson("not json")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(extractJson("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Quiz Zod schemas — pure validation.
// ---------------------------------------------------------------------------

import {
  createQuizBodySchema,
  addQuestionBodySchema,
  updateQuestionBodySchema,
  publishToDiscoverBodySchema,
  quizQuestionMediaSchema,
} from "@/features/quiz";

describe("Quiz schemas — quizQuestionMediaSchema", () => {
  it("accepts a valid image", () => {
    expect(quizQuestionMediaSchema.parse({ imageUrl: "/uploads/x.png" })).toEqual({
      imageUrl: "/uploads/x.png",
    });
  });
  it("accepts an image with alt text", () => {
    expect(quizQuestionMediaSchema.parse({ imageUrl: "https://x.com/y.png", alt: "diagram" })).toEqual({
      imageUrl: "https://x.com/y.png",
      alt: "diagram",
    });
  });
  it("rejects an empty imageUrl", () => {
    expect(() => quizQuestionMediaSchema.parse({ imageUrl: "" })).toThrow();
  });
  it("rejects a missing imageUrl", () => {
    expect(() => quizQuestionMediaSchema.parse({ alt: "x" })).toThrow();
  });
});

describe("Quiz schemas — createQuizBodySchema", () => {
  const validQuestion = {
    question: "What is 2+2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    explanation: "2+2=4",
  };
  it("accepts a minimal quiz without media", () => {
    const out = createQuizBodySchema.parse({ title: "Math", questions: [validQuestion] });
    expect(out.title).toBe("Math");
    expect(out.questions[0].media).toBeUndefined();
    expect(out.isAiGenerated).toBe(false);
    expect(out.difficulty).toBe("medium");
    expect(out.language).toBe("en");
  });
  it("accepts a question with image media", () => {
    const out = createQuizBodySchema.parse({
      title: "Geography",
      questions: [{ ...validQuestion, media: { imageUrl: "/uploads/flag.png" } }],
    });
    expect(out.questions[0].media?.imageUrl).toBe("/uploads/flag.png");
  });
  it("accepts isAiGenerated=true", () => {
    const out = createQuizBodySchema.parse({
      title: "AI Quiz",
      isAiGenerated: true,
      aiPromptId: "session-123",
      questions: [validQuestion],
    });
    expect(out.isAiGenerated).toBe(true);
    expect(out.aiPromptId).toBe("session-123");
  });
  it("rejects empty title", () => {
    expect(() => createQuizBodySchema.parse({ title: "", questions: [validQuestion] })).toThrow();
  });
  it("rejects empty questions array", () => {
    expect(() => createQuizBodySchema.parse({ title: "X", questions: [] })).toThrow();
  });
  it("rejects options array with wrong length", () => {
    expect(() =>
      createQuizBodySchema.parse({
        title: "X",
        questions: [{ ...validQuestion, options: ["a", "b"] }],
      }),
    ).toThrow();
  });
  it("rejects correctIndex out of range", () => {
    expect(() =>
      createQuizBodySchema.parse({
        title: "X",
        questions: [{ ...validQuestion, correctIndex: 4 }],
      }),
    ).toThrow();
  });
  it("rejects malformed media (empty imageUrl)", () => {
    expect(() =>
      createQuizBodySchema.parse({
        title: "X",
        questions: [{ ...validQuestion, media: { imageUrl: "" } }],
      }),
    ).toThrow();
  });
});

describe("Quiz schemas — addQuestionBodySchema", () => {
  it("accepts a question with media", () => {
    const out = addQuestionBodySchema.parse({
      question: "q",
      options: ["a", "b", "c", "d"],
      correctIndex: 0,
      media: { imageUrl: "/x.png" },
    });
    expect(out.media?.imageUrl).toBe("/x.png");
  });
  it("accepts a question without media", () => {
    const out = addQuestionBodySchema.parse({
      question: "q",
      options: ["a", "b", "c", "d"],
      correctIndex: 0,
    });
    expect(out.media).toBeUndefined();
  });
});

describe("Quiz schemas — updateQuestionBodySchema", () => {
  it("accepts an empty patch", () => {
    expect(updateQuestionBodySchema.parse({})).toEqual({});
  });
  it("accepts media=null to remove the image", () => {
    const out = updateQuestionBodySchema.parse({ media: null });
    expect(out.media).toBeNull();
  });
  it("accepts a new media object", () => {
    const out = updateQuestionBodySchema.parse({ media: { imageUrl: "/new.png" } });
    expect(out.media?.imageUrl).toBe("/new.png");
  });
  it("accepts partial fields", () => {
    const out = updateQuestionBodySchema.parse({ question: "new text" });
    expect(out.question).toBe("new text");
    expect(out.options).toBeUndefined();
  });
});

describe("Quiz schemas — publishToDiscoverBodySchema", () => {
  it("defaults isAiGenerated to false", () => {
    expect(publishToDiscoverBodySchema.parse({}).isAiGenerated).toBe(false);
  });
  it("accepts isAiGenerated=true with aiPromptId", () => {
    const out = publishToDiscoverBodySchema.parse({ isAiGenerated: true, aiPromptId: "s1" });
    expect(out.isAiGenerated).toBe(true);
    expect(out.aiPromptId).toBe("s1");
  });
  it("accepts aiPromptId=null", () => {
    const out = publishToDiscoverBodySchema.parse({ aiPromptId: null });
    expect(out.aiPromptId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Marketplace policy — isResourceAiGenerated (mocked db).
// ---------------------------------------------------------------------------

// Shared mock state — populated by the helpers below. The vi.mock factory
// closes over this object so the policy module reads the same data the
// tests mutate.
const mockState: { resources: Map<string, any>; quizzes: Map<string, any> } = {
  resources: new Map(),
  quizzes: new Map(),
};

vi.mock("@/lib/db", () => ({
  db: {
    resource: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        mockState.resources.get(where.id) ?? null,
    },
    quiz: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        mockState.quizzes.get(where.id) ?? null,
    },
  },
}));

import { isResourceAiGenerated } from "@/features/marketplace";

function setResource(id: string, metadata: Record<string, unknown>, content: Record<string, unknown> = {}) {
  mockState.resources.set(id, {
    metadata: JSON.stringify(metadata),
    content: JSON.stringify(content),
  });
}
function setQuiz(id: string, isAiGenerated: boolean) {
  mockState.quizzes.set(id, { isAiGenerated });
}
function resetState() {
  mockState.resources.clear();
  mockState.quizzes.clear();
}

describe("Marketplace policy — isResourceAiGenerated", () => {
  beforeEach(() => {
    resetState();
  });

  it("returns false for a non-existent resource", async () => {
    expect(await isResourceAiGenerated("missing")).toBe(false);
  });

  it("returns false when metadata has no isAiGenerated flag", async () => {
    setResource("r1", {});
    expect(await isResourceAiGenerated("r1")).toBe(false);
  });

  it("returns false when metadata.isAiGenerated is not a boolean true", async () => {
    setResource("r2", { isAiGenerated: "true" });
    expect(await isResourceAiGenerated("r2")).toBe(false);
    setResource("r2b", { isAiGenerated: 1 });
    expect(await isResourceAiGenerated("r2b")).toBe(false);
    setResource("r2c", { isAiGenerated: null });
    expect(await isResourceAiGenerated("r2c")).toBe(false);
  });

  it("returns true when metadata.isAiGenerated is true", async () => {
    setResource("r3", { isAiGenerated: true });
    expect(await isResourceAiGenerated("r3")).toBe(true);
  });

  it("returns false when metadata is malformed JSON", async () => {
    mockState.resources.set("r4", { metadata: "not-json{", content: "{}" });
    expect(await isResourceAiGenerated("r4")).toBe(false);
  });

  it("returns true when the resource links to an AI-generated quiz via content.quizId", async () => {
    setResource("r5", {}, { quizId: "q1" });
    setQuiz("q1", true);
    expect(await isResourceAiGenerated("r5")).toBe(true);
  });

  it("returns false when the resource links to a non-AI quiz via content.quizId", async () => {
    setResource("r6", {}, { quizId: "q2" });
    setQuiz("q2", false);
    expect(await isResourceAiGenerated("r6")).toBe(false);
  });

  it("returns false when content.quizId points to a non-existent quiz", async () => {
    setResource("r7", {}, { quizId: "missing-quiz" });
    expect(await isResourceAiGenerated("r7")).toBe(false);
  });

  it("returns false when content is malformed JSON", async () => {
    mockState.resources.set("r8", { metadata: "{}", content: "not-json{" });
    expect(await isResourceAiGenerated("r8")).toBe(false);
  });

  it("prefers metadata flag over quiz flag", async () => {
    setResource("r9", { isAiGenerated: true }, { quizId: "q3" });
    setQuiz("q3", false);
    expect(await isResourceAiGenerated("r9")).toBe(true);
  });

  it("ignores non-string quizId in content", async () => {
    setResource("r10", {}, { quizId: 123 });
    expect(await isResourceAiGenerated("r10")).toBe(false);
  });

  it("ignores empty-string quizId in content", async () => {
    setResource("r11", {}, { quizId: "" });
    expect(await isResourceAiGenerated("r11")).toBe(false);
  });
});
