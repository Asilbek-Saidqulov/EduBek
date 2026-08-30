import { describe, it, expect } from "vitest";
import {
  computeMemoryRelevanceScore,
  rankStudentMemories,
  extractKeywords,
  formatStudentMemoryForPrompt,
  type StudentMemoryProfile,
} from "@/lib/tutor/student-memory";

describe("EduBek Tutor — Student Memory Relevance Scoring System", () => {
  const fixedNow = new Date("2026-08-30T12:00:00Z");

  describe("Keyword Extraction & Tokenization", () => {
    it("extracts meaningful keywords and strips common stopwords across languages", () => {
      const uzText = "Kvadrat tenglamalar va diskriminantni hisoblash qanday bo'ladi";
      const keywordsUz = extractKeywords(uzText);
      expect(keywordsUz).toContain("kvadrat");
      expect(keywordsUz).toContain("tenglamalar");
      expect(keywordsUz).toContain("diskriminantni");
      expect(keywordsUz).not.toContain("va"); // stopword

      const enText = "Newton third law of motion action and reaction forces with vectors";
      const keywordsEn = extractKeywords(enText);
      expect(keywordsEn).toContain("newton");
      expect(keywordsEn).toContain("third");
      expect(keywordsEn).toContain("motion");
      expect(keywordsEn).toContain("reaction");
      expect(keywordsEn).not.toContain("and"); // stopword
      expect(keywordsEn).not.toContain("the"); // stopword
    });
  });

  describe("Deterministic Relevance Scoring Formula", () => {
    it("assigns highest topic score to exact topic match compared to unrelated topics", () => {
      const relevantMemory = {
        userId: "user-1",
        memoryType: "weakness",
        content: "Frequently makes sign errors when calculating quadratic formula discriminant",
        confidence: 0.8,
        createdAt: new Date("2026-08-28T10:00:00Z"),
      };

      const unrelatedMemory = {
        userId: "user-1",
        memoryType: "weakness",
        content: "Struggles with French vocabulary past tense conjugations",
        confidence: 0.8,
        createdAt: new Date("2026-08-28T10:00:00Z"),
      };

      const context = {
        targetTopic: "Quadratic Equations",
        currentMessage: "How do I solve 2x^2 - 4x - 6 = 0 with the discriminant?",
        subject: "Mathematics",
        now: fixedNow,
      };

      const scoreRel = computeMemoryRelevanceScore(relevantMemory, context);
      const scoreUnrel = computeMemoryRelevanceScore(unrelatedMemory, context);

      expect(scoreRel.breakdown.topicScore).toBeGreaterThan(scoreUnrel.breakdown.topicScore);
      expect(scoreRel.score).toBeGreaterThan(scoreUnrel.score);
      expect(scoreRel.matchReasons.length).toBeGreaterThan(0);
    });

    it("prioritizes misconceptions and active weaknesses over mastered topics", () => {
      const misconceptionMem = {
        userId: "user-1",
        memoryType: "misconception",
        content: "Believes heavier objects fall significantly faster in a vacuum",
        confidence: 0.9,
        createdAt: new Date("2026-08-29T10:00:00Z"),
      };

      const masteredMem = {
        userId: "user-1",
        memoryType: "mastered_topic",
        content: "Understands gravitational acceleration g = 9.8 m/s^2",
        confidence: 0.9,
        createdAt: new Date("2026-08-29T10:00:00Z"),
      };

      const context = {
        targetTopic: "Gravity and Free Fall",
        subject: "Physics",
        now: fixedNow,
      };

      const scoreMisconception = computeMemoryRelevanceScore(misconceptionMem, context);
      const scoreMastered = computeMemoryRelevanceScore(masteredMem, context);

      expect(scoreMisconception.breakdown.typeScore).toBe(25); // misconception weight
      expect(scoreMastered.breakdown.typeScore).toBe(12); // mastered topic weight
      expect(scoreMisconception.score).toBeGreaterThan(scoreMastered.score);
    });

    it("factors in confidence weighting deterministically", () => {
      const highConfMem = {
        userId: "user-1",
        memoryType: "weakness",
        content: "Trigonometric unit circle coordinates",
        confidence: 0.95,
        createdAt: fixedNow,
      };

      const lowConfMem = {
        userId: "user-1",
        memoryType: "weakness",
        content: "Trigonometric unit circle coordinates",
        confidence: 0.2,
        createdAt: fixedNow,
      };

      const context = { targetTopic: "Trigonometry", now: fixedNow };

      const scoreHigh = computeMemoryRelevanceScore(highConfMem, context);
      const scoreLow = computeMemoryRelevanceScore(lowConfMem, context);

      expect(scoreHigh.breakdown.confidenceScore).toBeGreaterThan(scoreLow.breakdown.confidenceScore);
      expect(scoreHigh.score).toBeGreaterThan(scoreLow.score);
    });

    it("applies recency decay while maintaining a baseline floor for older long-term memories", () => {
      const recentMem = {
        userId: "user-1",
        memoryType: "misconception",
        content: "Confuses electric potential with electric field",
        confidence: 0.8,
        createdAt: new Date("2026-08-29T12:00:00Z"), // 1 day ago
      };

      const oldMem = {
        userId: "user-1",
        memoryType: "misconception",
        content: "Confuses electric potential with electric field",
        confidence: 0.8,
        createdAt: new Date("2026-01-01T12:00:00Z"), // 240 days ago
      };

      const context = { targetTopic: "Electrostatics", now: fixedNow };

      const scoreRecent = computeMemoryRelevanceScore(recentMem, context);
      const scoreOld = computeMemoryRelevanceScore(oldMem, context);

      expect(scoreRecent.breakdown.recencyScore).toBeGreaterThan(scoreOld.breakdown.recencyScore);
      expect(scoreOld.breakdown.recencyScore).toBeGreaterThanOrEqual(3); // Floor preserved
      expect(scoreOld.score).toBeGreaterThan(30); // Long-term misconception is not eliminated
    });
  });

  describe("Candidate Ranking & Filter Engine", () => {
    it("filters out expired memories automatically", () => {
      const candidateMemories = [
        {
          userId: "user-1",
          memoryType: "weakness",
          content: "Expired temporary diagnostic observation",
          confidence: 0.8,
          createdAt: new Date("2026-08-01T12:00:00Z"),
          expiresAt: new Date("2026-08-15T12:00:00Z"), // Expired before fixedNow
        },
        {
          userId: "user-1",
          memoryType: "weakness",
          content: "Active weakness in calculus derivatives",
          confidence: 0.8,
          createdAt: new Date("2026-08-25T12:00:00Z"),
          expiresAt: null, // Active
        },
      ];

      const ranked = rankStudentMemories(candidateMemories, {
        targetTopic: "Calculus",
        now: fixedNow,
      });

      expect(ranked.length).toBe(1);
      expect(ranked[0].content).toBe("Active weakness in calculus derivatives");
    });

    it("ranks topic-relevant memories at the top and respects limit constraints", () => {
      const memories = [
        {
          userId: "user-1",
          memoryType: "strength",
          content: "Strong at Photosynthesis light reactions in biology",
          confidence: 0.9,
          createdAt: fixedNow,
        },
        {
          userId: "user-1",
          memoryType: "misconception",
          content: "Mistakes matrix multiplication order AB = BA in Linear Algebra",
          confidence: 0.9,
          createdAt: fixedNow,
        },
        {
          userId: "user-1",
          memoryType: "weak_topic",
          content: "Finding eigenvalues and eigenvectors in Linear Algebra",
          confidence: 0.85,
          createdAt: fixedNow,
        },
        {
          userId: "user-1",
          memoryType: "learning_style",
          content: "Prefers geometric visual representations and step-by-step proofs",
          confidence: 0.95,
          createdAt: fixedNow,
        },
      ];

      const ranked = rankStudentMemories(memories, {
        targetTopic: "Linear Algebra",
        currentMessage: "Can you help me compute the determinant and eigenvalues of this 2x2 matrix?",
        limit: 3,
        now: fixedNow,
      });

      expect(ranked.length).toBe(3);
      // Top 2 should be Linear Algebra items
      expect(ranked[0].content).toContain("Linear Algebra");
      expect(ranked[1].content).toContain("Linear Algebra");
      // Biology memory should not be in the top 3
      const contents = ranked.map((r) => r.content);
      expect(contents).not.toContain("Strong at Photosynthesis light reactions in biology");
    });

    it("handles graceful fallback when student has 0 memories or no topic context", () => {
      const emptyRanked = rankStudentMemories([], { targetTopic: "Chemistry", now: fixedNow });
      expect(emptyRanked).toEqual([]);

      const generalRanked = rankStudentMemories(
        [
          {
            userId: "user-1",
            memoryType: "learning_style",
            content: "Visual learner using LaTeX and diagrams",
            confidence: 0.9,
            createdAt: fixedNow,
          },
        ],
        { now: fixedNow } // No topic specified
      );

      expect(generalRanked.length).toBe(1);
      expect(generalRanked[0].score).toBeGreaterThan(30);
    });
  });

  describe("Prompt Context Generation", () => {
    it("generates concise, high-signal pedagogical system prompt block", () => {
      const profile: StudentMemoryProfile = {
        userId: "user-abc",
        name: "Dilnoza",
        locale: "uz",
        preferredDifficulty: "advanced",
        strengths: ["Algebraic identities"],
        weaknesses: ["Trigonometric identity simplification"],
        misconceptions: ["Assumes sin(a+b) = sin(a) + sin(b)"],
        masteredTopics: ["Polynomial division"],
        weakTopics: ["Complex numbers"],
        learningPreferences: ["Socratic questions with intermediate hints"],
        goals: ["Top 1% in University Entrance Exam"],
        recentQuizMistakes: [
          {
            quizTitle: "Trigonometry Diagnostic",
            score: 2,
            maxScore: 5,
          },
        ],
        recentNotesCount: 3,
      };

      const uzPrompt = formatStudentMemoryForPrompt(profile, "uz");
      expect(uzPrompt).toContain("O'QUVCHINING XOTIRASI");
      expect(uzPrompt).toContain("Dilnoza");
      expect(uzPrompt).toContain("Assumes sin(a+b) = sin(a) + sin(b)");
      expect(uzPrompt).toContain("Trigonometric identity simplification");
      expect(uzPrompt).toContain("Polynomial division");
      expect(uzPrompt).toContain("Trigonometry Diagnostic (2/5 pts)");
      expect(uzPrompt).toContain("PEDAGOGIK KO'RSATMA");

      const enPrompt = formatStudentMemoryForPrompt(profile, "en");
      expect(enPrompt).toContain("STUDENT RELEVANT MEMORY");
      expect(enPrompt).toContain("Known Weaknesses & Misconceptions");
      expect(enPrompt).toContain("Assumes sin(a+b) = sin(a) + sin(b)");
    });
  });
});
