/**
 * EduBek — Benchmark Library (System 1).
 *
 * Maintains benchmark datasets across 17 categories. Each benchmark
 * contains a question, expected answer, acceptable alternatives,
 * evidence, difficulty, curriculum mapping, tags, and evaluation
 * strategy.
 *
 * Ships with built-in benchmark questions — deterministic, no LLM
 * required.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import type {
  BenchmarkQuestion, BenchmarkDataset, BenchmarkCategory,
  Difficulty, EvaluationStrategy, BenchmarkLibraryReport,
} from "./types";

const log = getLogger("benchmark-library");

// ===========================================================================
// Built-in benchmark questions — one per category minimum
// ===========================================================================

export const BUILTIN_BENCHMARKS: BenchmarkQuestion[] = [
  {
    id: "bench-math-001",
    category: "mathematics",
    question: "Solve for x: 2x + 5 = 13",
    expectedAnswer: "x = 4",
    acceptableAlternatives: ["4", "x=4", "x = 4"],
    evidence: ["Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4."],
    difficulty: "beginner",
    curriculumMapping: ["algebra.linear_equations"],
    tags: ["algebra", "equations"],
    evaluationStrategy: "exact_match",
    points: 5,
  },
  {
    id: "bench-math-002",
    category: "mathematics",
    question: "What is the derivative of f(x) = 3x² + 2x - 5?",
    expectedAnswer: "f'(x) = 6x + 2",
    acceptableAlternatives: ["6x + 2", "6x+2"],
    evidence: ["Power rule: d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-5) = 0."],
    difficulty: "intermediate",
    curriculumMapping: ["calculus.derivatives"],
    tags: ["calculus", "derivatives"],
    evaluationStrategy: "exact_match",
    points: 7,
  },
  {
    id: "bench-physics-001",
    category: "physics",
    question: "What is Newton's second law of motion?",
    expectedAnswer: "Force equals mass times acceleration (F = ma)",
    acceptableAlternatives: ["F = ma", "Force = mass × acceleration", "F=ma"],
    evidence: ["Newton's second law states F = ma, where F is force, m is mass, and a is acceleration."],
    difficulty: "beginner",
    curriculumMapping: ["physics.mechanics.newtons_laws"],
    tags: ["mechanics", "newton"],
    evaluationStrategy: "contains_keywords",
    points: 5,
  },
  {
    id: "bench-chem-001",
    category: "chemistry",
    question: "What is the chemical formula for water?",
    expectedAnswer: "H₂O",
    acceptableAlternatives: ["H2O", "h2o"],
    evidence: ["Water consists of two hydrogen atoms and one oxygen atom."],
    difficulty: "beginner",
    curriculumMapping: ["chemistry.basics.molecules"],
    tags: ["molecules", "basics"],
    evaluationStrategy: "exact_match",
    points: 3,
  },
  {
    id: "bench-bio-001",
    category: "biology",
    question: "What process do plants use to convert sunlight into energy?",
    expectedAnswer: "Photosynthesis",
    acceptableAlternatives: ["photosynthesis"],
    evidence: ["Photosynthesis is the process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen."],
    difficulty: "beginner",
    curriculumMapping: ["biology.biology.photosynthesis"],
    tags: ["photosynthesis", "plants"],
    evaluationStrategy: "exact_match",
    points: 3,
  },
  {
    id: "bench-prog-001",
    category: "programming",
    question: "Write a function that reverses a string in Python.",
    expectedAnswer: "def reverse(s): return s[::-1]",
    acceptableAlternatives: ["s[::-1]", "return s[::-1]", "''.join(reversed(s))"],
    evidence: ["Python slicing with [::-1] reverses a string."],
    difficulty: "beginner",
    curriculumMapping: ["programming.python.strings"],
    tags: ["python", "strings"],
    evaluationStrategy: "contains_keywords",
    points: 5,
  },
  {
    id: "bench-lang-001",
    category: "languages",
    question: "What is the past tense of 'go'?",
    expectedAnswer: "went",
    acceptableAlternatives: ["Went"],
    evidence: ["'Go' is an irregular verb; its past tense is 'went'."],
    difficulty: "beginner",
    curriculumMapping: ["languages.english.grammar"],
    tags: ["grammar", "irregular_verbs"],
    evaluationStrategy: "exact_match",
    points: 3,
  },
  {
    id: "bench-hist-001",
    category: "history",
    question: "In what year did World War II end?",
    expectedAnswer: "1945",
    acceptableAlternatives: ["September 1945", "September 2, 1945"],
    evidence: ["World War II ended in 1945 with Japan's surrender on September 2."],
    difficulty: "beginner",
    curriculumMapping: ["history.modern.wwii"],
    tags: ["wwii", "dates"],
    evaluationStrategy: "contains_keywords",
    points: 3,
  },
  {
    id: "bench-econ-001",
    category: "economics",
    question: "What is the law of supply and demand?",
    expectedAnswer: "As price increases, quantity supplied increases and quantity demanded decreases, and vice versa.",
    acceptableAlternatives: ["Price up → supply up, demand down"],
    evidence: ["The law of supply states that quantity supplied increases with price; the law of demand states that quantity demanded decreases with price."],
    difficulty: "intermediate",
    curriculumMapping: ["economics.microeconomics.supply_demand"],
    tags: ["supply", "demand", "microeconomics"],
    evaluationStrategy: "semantic_similarity",
    points: 7,
  },
  {
    id: "bench-med-001",
    category: "medical",
    question: "What is the normal resting heart rate for an adult?",
    expectedAnswer: "60-100 beats per minute",
    acceptableAlternatives: ["60 to 100 bpm", "60-100 bpm"],
    evidence: ["The American Heart Association defines normal resting heart rate as 60-100 bpm for adults."],
    difficulty: "beginner",
    curriculumMapping: ["medical.physiology.cardiovascular"],
    tags: ["cardiovascular", "vitals"],
    evaluationStrategy: "contains_keywords",
    points: 5,
  },
  {
    id: "bench-curr-001",
    category: "curriculum_reasoning",
    question: "A student has mastered 'addition' but struggles with 'multiplication'. What prerequisite concept should be reviewed?",
    expectedAnswer: "Repeated addition and skip counting",
    acceptableAlternatives: ["repeated addition", "skip counting", "groups of"],
    evidence: ["Multiplication builds on repeated addition. If a student struggles with multiplication, reviewing repeated addition and skip counting is the logical prerequisite."],
    difficulty: "intermediate",
    curriculumMapping: ["mathematics.arithmetic.multiplication"],
    tags: ["prerequisites", "curriculum", "mathematics"],
    evaluationStrategy: "semantic_similarity",
    points: 8,
  },
  {
    id: "bench-lesson-001",
    category: "lesson_planning",
    question: "Create a 45-minute lesson plan for teaching fractions to 4th graders.",
    expectedAnswer: "A structured lesson plan with introduction, guided practice, independent practice, and assessment sections.",
    acceptableAlternatives: [],
    evidence: ["Effective lesson plans include: learning objectives, hook/introduction, direct instruction, guided practice, independent practice, closure, and assessment."],
    difficulty: "intermediate",
    curriculumMapping: ["mathematics.fractions"],
    tags: ["lesson_plan", "fractions", "elementary"],
    evaluationStrategy: "rubric_scored",
    points: 10,
  },
  {
    id: "bench-assess-001",
    category: "assessment_generation",
    question: "Generate 3 multiple-choice questions about the water cycle at an intermediate level.",
    expectedAnswer: "Three MCQs covering evaporation, condensation, and precipitation with correct answers and explanations.",
    acceptableAlternatives: [],
    evidence: ["The water cycle includes evaporation, condensation, precipitation, and collection. Questions should cover these stages."],
    difficulty: "intermediate",
    curriculumMapping: ["science.earth_science.water_cycle"],
    tags: ["assessment", "water_cycle", "mcq"],
    evaluationStrategy: "rubric_scored",
    points: 10,
  },
  {
    id: "bench-kg-001",
    category: "knowledge_graph",
    question: "What concepts are prerequisites for learning calculus?",
    expectedAnswer: "Algebra, trigonometry, functions, limits, and pre-calculus",
    acceptableAlternatives: ["algebra and trigonometry", "functions and limits"],
    evidence: ["Calculus requires understanding of algebra, trigonometry, functions, and the concept of limits."],
    difficulty: "intermediate",
    curriculumMapping: ["mathematics.calculus.prerequisites"],
    tags: ["knowledge_graph", "prerequisites", "calculus"],
    evaluationStrategy: "semantic_similarity",
    points: 7,
  },
  {
    id: "bench-search-001",
    category: "search",
    question: "Find resources about photosynthesis for 6th grade students.",
    expectedAnswer: "A list of age-appropriate resources including videos, articles, and interactive activities about photosynthesis.",
    acceptableAlternatives: [],
    evidence: ["Search results should be relevant, age-appropriate, and cover photosynthesis fundamentals."],
    difficulty: "beginner",
    curriculumMapping: ["biology.photosynthesis"],
    tags: ["search", "relevance", "photosynthesis"],
    evaluationStrategy: "automated_heuristic",
    points: 5,
  },
  {
    id: "bench-market-001",
    category: "marketplace",
    question: "What factors should be considered when pricing a marketplace listing for a math quiz?",
    expectedAnswer: "Quality, question count, subject difficulty, target grade, competitor pricing, and creator reputation.",
    acceptableAlternatives: ["quality and question count", "competitor pricing"],
    evidence: ["Marketplace pricing depends on content quality, quantity, difficulty, target audience, competition, and creator reputation."],
    difficulty: "intermediate",
    curriculumMapping: ["marketplace.pricing"],
    tags: ["marketplace", "pricing", "strategy"],
    evaluationStrategy: "semantic_similarity",
    points: 7,
  },
  {
    id: "bench-gen-001",
    category: "general",
    question: "Explain the importance of critical thinking in education.",
    expectedAnswer: "Critical thinking enables students to analyze information, evaluate arguments, solve problems, and make informed decisions.",
    acceptableAlternatives: ["analyzing and evaluating information"],
    evidence: ["Critical thinking is a foundational skill that supports learning across all subjects."],
    difficulty: "beginner",
    curriculumMapping: ["general.critical_thinking"],
    tags: ["critical_thinking", "education"],
    evaluationStrategy: "semantic_similarity",
    points: 5,
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export function listBuiltinBenchmarks(category?: BenchmarkCategory): BenchmarkQuestion[] {
  return category ? BUILTIN_BENCHMARKS.filter(b => b.category === category) : BUILTIN_BENCHMARKS;
}

export function getBenchmarkQuestion(id: string): BenchmarkQuestion | null {
  return BUILTIN_BENCHMARKS.find(b => b.id === id) ?? null;
}

export function listBenchmarkCategories(): BenchmarkCategory[] {
  const categories = new Set(BUILTIN_BENCHMARKS.map(b => b.category));
  return Array.from(categories) as BenchmarkCategory[];
}

export function buildBenchmarkDataset(category: BenchmarkCategory): BenchmarkDataset {
  const questions = listBuiltinBenchmarks(category);
  return {
    id: `dataset-${category}-${randomUUID().slice(0, 8)}`,
    name: `${category} Benchmark Dataset`,
    description: `Built-in benchmark questions for ${category}`,
    category,
    questions,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function generateLibraryReport(): BenchmarkLibraryReport {
  const datasets = listBenchmarkCategories().map(cat => buildBenchmarkDataset(cat));
  const totalQuestions = BUILTIN_BENCHMARKS.length;
  const categoryCounts: Record<string, number> = {};
  for (const b of BUILTIN_BENCHMARKS) {
    categoryCounts[b.category] = (categoryCounts[b.category] ?? 0) + 1;
  }
  log.info("benchmark.library_report", {
    datasets: datasets.length, totalQuestions,
    categories: Object.keys(categoryCounts).length,
  });
  return {
    generatedAt: new Date().toISOString(),
    datasets,
    totalQuestions,
    categoriesCovered: listBenchmarkCategories(),
    categoryCounts,
  };
}

// ===========================================================================
// Evaluation strategy helpers (deterministic)
// ===========================================================================

export function evaluateExactMatch(output: string, expected: string, alternatives: string[]): boolean {
  const normalized = output.trim().toLowerCase();
  if (normalized === expected.trim().toLowerCase()) return true;
  return alternatives.some(a => normalized === a.trim().toLowerCase());
}

export function evaluateContainsKeywords(output: string, keywords: string[]): boolean {
  const lower = output.toLowerCase();
  return keywords.every(kw => lower.includes(kw.toLowerCase()));
}

export function evaluateSemanticSimilarity(output: string, expected: string): number {
  // Deterministic Jaccard similarity on word sets
  const outputWords = new Set(output.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const expectedWords = new Set(expected.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (outputWords.size === 0 || expectedWords.size === 0) return 0;
  const intersection = Array.from(outputWords).filter(w => expectedWords.has(w)).length;
  const union = outputWords.size + expectedWords.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function evaluateByStrategy(
  output: string,
  question: BenchmarkQuestion,
): { score: number; rationale: string } {
  switch (question.evaluationStrategy) {
    case "exact_match":
      return {
        score: evaluateExactMatch(output, question.expectedAnswer, question.acceptableAlternatives) ? 1 : 0,
        rationale: "Exact match check against expected answer and alternatives.",
      };
    case "contains_keywords": {
      const keywords = [question.expectedAnswer, ...question.acceptableAlternatives];
      const passed = evaluateContainsKeywords(output, keywords);
      return {
        score: passed ? 1 : 0.3,
        rationale: `Keyword check for: ${keywords.join(", ")}`,
      };
    }
    case "semantic_similarity": {
      const sim = evaluateSemanticSimilarity(output, question.expectedAnswer);
      return {
        score: sim,
        rationale: `Jaccard similarity: ${(sim * 100).toFixed(0)}%`,
      };
    }
    case "rubric_scored":
      // Check if output contains structural elements
      const structureScore = evaluateStructure(output);
      return {
        score: structureScore,
        rationale: `Structural rubric score: ${(structureScore * 100).toFixed(0)}%`,
      };
    case "automated_heuristic":
      // Check output length and relevance
      const lengthScore = Math.min(1, output.length / 200);
      return {
        score: lengthScore,
        rationale: `Heuristic score based on output length: ${output.length} chars`,
      };
    case "human_review":
      return {
        score: 0.5,
        rationale: "Human review required — defaulting to 0.5",
      };
    default:
      return { score: 0, rationale: "Unknown evaluation strategy" };
  }
}

function evaluateStructure(output: string): number {
  // Check for structural elements: numbered lists, sections, bullet points
  let score = 0;
  if (output.length > 100) score += 0.3;
  if (/\d+\./.test(output)) score += 0.2; // numbered list
  if (/[-*]/.test(output)) score += 0.2; // bullet points
  if (/#{1,3}\s/.test(output)) score += 0.15; // markdown headers
  if (output.includes("\n\n")) score += 0.15; // paragraphs
  return Math.min(1, score);
}
