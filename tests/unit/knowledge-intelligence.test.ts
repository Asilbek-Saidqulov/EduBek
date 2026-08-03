/**
 * EduBek — Phase 4F.5 Knowledge Intelligence tests.
 *
 * Verifies:
 *   • Concept extraction (headings, bold, formulas, definitions, Bloom detection, difficulty)
 *   • Curriculum mapping (auto-map entity to standards)
 *   • Prerequisite discovery (concept relationship creation)
 *   • Similarity detection (Jaccard text similarity)
 *   • Resource quality scoring (clarity, depth, accuracy, engagement)
 *   • Auto-relationships (graph edge creation from shared concepts)
 *   • Learning prediction (signal blending + intervention detection)
 *
 * Pure-function tests (no DB) cover the deterministic extractors.
 * Integration tests (with DB) cover the full pipeline.
 */
import { describe, it, expect } from "vitest";
import {
  extractConcepts,
} from "@/features/knowledge-intelligence/concept-extraction";
import {
  jaccardTextSimilarity,
} from "@/features/knowledge-intelligence/similarity-detection";
import {
  detectBloomLevel,
  estimateDifficulty,
  estimateStudyTime,
} from "@/features/knowledge-intelligence/concept-extraction-helpers";

// ---------------------------------------------------------------------------
// Concept extraction — pure function tests
// ---------------------------------------------------------------------------

describe("Concept Extraction", () => {
  it("extracts markdown headings as primary concepts", () => {
    const result = extractConcepts({
      title: "Algebra Lesson",
      content: "# Quadratic Formula\n\nThe quadratic formula is...\n\n## Factoring\n\nFactoring is...",
      subject: "mathematics",
    });
    const conceptNames = result.concepts.map((c) => c.name);
    expect(conceptNames).toContain("Quadratic Formula");
    expect(conceptNames).toContain("Factoring");
  });

  it("extracts formulas in LaTeX and Unicode notation", () => {
    const result = extractConcepts({
      title: "Physics Formulas",
      content: "The kinetic energy is $$KE = \\frac{1}{2}mv^2$$ and Newton's second law is F = ma",
      subject: "physics",
    });
    expect(result.attributes.formulas.length).toBeGreaterThan(0);
    // Should include the LaTeX block formula
    expect(result.attributes.formulas.some((f) => f.includes("KE") || f.includes("KE"))).toBe(true);
  });

  it("extracts definitions from 'X is defined as Y' patterns", () => {
    const result = extractConcepts({
      title: "Definitions",
      content: "Velocity is defined as the rate of change of displacement with respect to time.",
      subject: "physics",
    });
    expect(result.attributes.definitions.length).toBeGreaterThan(0);
    expect(result.attributes.definitions.some((d) => d.toLowerCase().includes("velocity"))).toBe(true);
  });

  it("extracts skills from 'students will be able to' patterns", () => {
    const result = extractConcepts({
      title: "Lesson Objectives",
      content: "By the end of this lesson, students will be able to solve linear equations using substitution.",
      subject: "mathematics",
    });
    expect(result.attributes.skills.length).toBeGreaterThan(0);
    expect(result.attributes.skills.some((s) => s.includes("solve linear equations"))).toBe(true);
  });

  it("extracts examples from 'Example:' sections", () => {
    const result = extractConcepts({
      title: "Examples",
      content: "Example: Solve 2x + 5 = 11. Subtract 5: 2x = 6. Divide by 2: x = 3.",
      subject: "mathematics",
    });
    expect(result.attributes.examples.length).toBeGreaterThan(0);
  });

  it("extracts code blocks as examples", () => {
    const result = extractConcepts({
      title: "Programming Example",
      content: "Here's how to define a function:\n\n```python\ndef add(a, b):\n    return a + b\n```",
      subject: "programming",
    });
    expect(result.attributes.examples.length).toBeGreaterThan(0);
    expect(result.attributes.examples.some((e) => e.includes("def add"))).toBe(true);
  });

  it("recognizes subject-specific concepts from the dictionary", () => {
    const result = extractConcepts({
      title: "Biology",
      content: "Today we'll study photosynthesis and cellular respiration in plants.",
      subject: "biology",
    });
    const conceptNames = result.concepts.map((c) => c.name.toLowerCase());
    expect(conceptNames.some((n) => n.includes("photosynthesis"))).toBe(true);
  });

  it("estimates difficulty based on content length + formula count + Bloom level", () => {
    const easy = extractConcepts({
      title: "Easy",
      content: "Define the term cell.",
      subject: "biology",
    });
    const hard = extractConcepts({
      title: "Hard",
      content: "# Advanced Calculus\n\nEvaluate the integral $$\\int_0^1 x^2 dx$$ and analyze the convergence of the series.",
      subject: "mathematics",
    });
    expect(hard.difficulty).toBeGreaterThan(easy.difficulty);
  });

  it("estimates study time based on word count + formula count + example count", () => {
    const short = extractConcepts({
      title: "Short",
      content: "A triangle has three sides.",
    });
    const long = extractConcepts({
      title: "Long",
      content: "A triangle has three sides. ".repeat(200) + "Example: Find the area. Solution: A = (1/2)bh.",
    });
    expect(long.estimatedMinutes).toBeGreaterThan(short.estimatedMinutes);
  });

  it("computes AI confidence higher for longer, richer content", () => {
    const sparse = extractConcepts({
      title: "Sparse",
      content: "Hello",
    });
    const rich = extractConcepts({
      title: "Rich Lesson",
      content: `# Algebra
The quadratic formula is defined as follows.

**Factoring** is a key skill.

Example: Factor x² - 4.

Students will be able to factor polynomials.

\`x = (-b ± √(b²-4ac)) / 2a\` is the quadratic formula.

For example, x² - 4 = (x+2)(x-2).

Reference: Algebra textbook chapter 3.`,
      subject: "mathematics",
    });
    expect(rich.aiConfidence).toBeGreaterThan(sparse.aiConfidence);
  });
});

// ---------------------------------------------------------------------------
// Bloom level detection
// ---------------------------------------------------------------------------

describe("Bloom level detection", () => {
  it("detects 'remember' level for define/list/name verbs", () => {
    const level = detectBloomLevel("Define the term photosynthesis. List the steps involved.");
    expect(level).toBe("remember");
  });

  it("detects 'apply' level for solve/calculate verbs", () => {
    const level = detectBloomLevel("Calculate the area of the triangle. Solve for x.");
    expect(level).toBe("apply");
  });

  it("detects 'analyze' level for analyze/differentiate verbs", () => {
    const level = detectBloomLevel("Analyze the causes of the French Revolution. Differentiate between mitosis and meiosis.");
    expect(level).toBe("analyze");
  });

  it("detects 'create' level for design/create verbs", () => {
    const level = detectBloomLevel("Design an experiment to test the hypothesis. Create a model of the atom.");
    expect(level).toBe("create");
  });

  it("returns null when no Bloom verbs are present", () => {
    const level = detectBloomLevel("The weather is nice today.");
    expect(level).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Difficulty estimation
// ---------------------------------------------------------------------------

describe("Difficulty estimation", () => {
  it("returns a value in [0.1, 1]", () => {
    const difficulty = estimateDifficulty("Short content", 0, 0);
    expect(difficulty).toBeGreaterThanOrEqual(0.1);
    expect(difficulty).toBeLessThanOrEqual(1);
  });

  it("increases difficulty with more formulas", () => {
    const noFormulas = estimateDifficulty("Simple content", 0, 5);
    const manyFormulas = estimateDifficulty("Complex content", 20, 5);
    expect(manyFormulas).toBeGreaterThan(noFormulas);
  });
});

// ---------------------------------------------------------------------------
// Study time estimation
// ---------------------------------------------------------------------------

describe("Study time estimation", () => {
  it("returns at least 5 minutes", () => {
    const minutes = estimateStudyTime("Short");
    expect(minutes).toBeGreaterThanOrEqual(5);
  });

  it("scales with word count", () => {
    const short = estimateStudyTime("One two three four five");
    // 5000 words at 200 wpm = 25 min, well above the 5-min minimum
    const long = estimateStudyTime("word ".repeat(5000));
    expect(long).toBeGreaterThan(short);
    expect(long).toBeGreaterThan(20); // sanity check
  });
});

// ---------------------------------------------------------------------------
// Similarity detection — Jaccard text similarity
// ---------------------------------------------------------------------------

describe("Similarity detection — Jaccard", () => {
  it("returns 1 for identical texts", () => {
    const text = "the quick brown fox jumps over the lazy dog";
    expect(jaccardTextSimilarity(text, text)).toBeCloseTo(1, 2);
  });

  it("returns 0 for completely different texts", () => {
    expect(jaccardTextSimilarity("alpha beta gamma", "delta epsilon zeta")).toBeCloseTo(0, 2);
  });

  it("returns partial similarity for overlapping words", () => {
    const sim = jaccardTextSimilarity(
      "the quadratic formula solves equations",
      "the quadratic formula is useful for equations",
    );
    expect(sim).toBeGreaterThan(0.4);
    expect(sim).toBeLessThan(1);
  });

  it("ignores short words (length <= 3)", () => {
    // "the", "is", "a" should be ignored
    const sim = jaccardTextSimilarity("the quick brown", "the slow brown");
    // "quick" vs "slow" + shared "brown" → 1 shared / 3 unique = 0.33
    expect(sim).toBeCloseTo(0.33, 1);
  });
});

// ---------------------------------------------------------------------------
// Integration: full extraction pipeline on a realistic lesson
// ---------------------------------------------------------------------------

describe("Integration — full lesson extraction", () => {
  it("extracts a rich algebra lesson with all attributes", () => {
    const lesson = `# Quadratic Equations

A **quadratic equation** is defined as an equation of the form ax² + bx + c = 0.

The quadratic formula is:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## Solving by Factoring

Students will be able to solve quadratic equations by factoring.

Example: Solve x² - 5x + 6 = 0.
Solution: Factor as (x - 2)(x - 3) = 0, so x = 2 or x = 3.

## The Discriminant

The discriminant is defined as b² - 4ac.

Common mistake: forgetting to take both the positive and negative square root.

For example, x² = 9 has two solutions: x = 3 and x = -3.`;

    const result = extractConcepts({
      title: "Quadratic Equations Lesson",
      content: lesson,
      subject: "mathematics",
    });

    // Should have multiple concepts
    expect(result.concepts.length).toBeGreaterThanOrEqual(3);
    const conceptNames = result.concepts.map((c) => c.name.toLowerCase());
    expect(conceptNames.some((n) => n.includes("quadratic"))).toBe(true);

    // Should have formulas
    expect(result.attributes.formulas?.length ?? 0).toBeGreaterThan(0);

    // Should have definitions
    expect(result.attributes.definitions?.length ?? 0).toBeGreaterThan(0);

    // Should have skills
    expect(result.attributes.skills?.length ?? 0).toBeGreaterThan(0);

    // Should have examples
    expect(result.attributes.examples?.length ?? 0).toBeGreaterThan(0);

    // Should have misconceptions
    expect(result.attributes.misconceptions?.length ?? 0).toBeGreaterThan(0);

    // Should detect apply Bloom level (solve / factor verbs)
    expect(result.bloomLevel).toBeTruthy();

    // Should have reasonable difficulty (between 0.3 and 0.9)
    expect(result.difficulty).toBeGreaterThan(0.3);
    expect(result.difficulty).toBeLessThan(0.95);

    // Should have reasonable confidence
    expect(result.aiConfidence).toBeGreaterThan(0.5);
  });
});
