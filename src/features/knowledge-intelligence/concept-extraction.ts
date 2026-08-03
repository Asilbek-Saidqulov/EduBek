/**
 * EduBek — Concept Extraction Engine.
 *
 * Phase 4F.5: Automatically analyzes any educational resource, quiz,
 * worksheet, lesson, or marketplace asset and extracts structured
 * educational metadata:
 *
 *   • Concepts (atomic educational concepts like "quadratic formula")
 *   • Formulas (mathematical expressions, equations)
 *   • Definitions (term + meaning pairs)
 *   • Keywords (subject-specific vocabulary)
 *   • Skills (observable capabilities like "factoring polynomials")
 *   • Learning objectives (what the student should be able to do)
 *   • Bloom taxonomy level (remember / understand / apply / analyze / evaluate / create)
 *   • Misconceptions (common errors students make)
 *   • Examples (worked problems with solutions)
 *   • Vocabulary (terms to know)
 *   • Difficulty (0-1)
 *
 * The extraction is deterministic for Phase 4F.5 — a rule-based NLP
 * pipeline that recognizes common educational patterns. A future
 * phase can plug in an LLM via the AI Workspace without changing the
 * DTO shape.
 *
 * Reuses:
 *   • Phase 4F.1 Knowledge Graph (auto-creates graph nodes for concepts)
 *   • Phase 4F.2 Semantic Search (embeddings for similarity queries)
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  BloomLevel,
  ConceptAttributes,
  ConceptExtractionResult,
  ResourceConceptRelationship,
} from "./types";

const log = getLogger("concept-extraction");

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extract educational concepts from text content.
 *
 * @param content The full text content of the resource (markdown, plain text, etc.)
 * @param subject Optional subject hint (e.g. "mathematics", "physics") — improves extraction accuracy.
 */
export function extractConcepts(input: {
  content: string;
  subject?: string;
  title?: string;
}): ConceptExtractionResult {
  const { content, subject, title } = input;
  const text = `${title ?? ""}\n\n${content}`.trim();

  // --- Concepts ---
  // Look for known educational concept patterns: bolded terms, "X is defined as",
  // "X is the Y", heading titles, etc.
  const concepts = extractConceptNames(text, subject);

  // --- Formulas ---
  const formulas = extractFormulas(text);

  // --- Definitions ---
  const definitions = extractDefinitions(text);

  // --- Keywords ---
  const keywords = extractKeywords(text, subject);

  // --- Skills ---
  const skills = extractSkills(text);

  // --- Examples ---
  const examples = extractExamples(text);

  // --- Vocabulary ---
  const vocabulary = extractVocabulary(text);

  // --- Misconceptions ---
  const misconceptions = extractMisconceptions(text);

  // --- Bloom level ---
  const bloomLevel = detectBloomLevel(text);

  // --- Difficulty ---
  const difficulty = estimateDifficulty(text, formulas.length, concepts.length);

  // --- Estimated study time ---
  const estimatedMinutes = estimateStudyTime(text);

  // --- AI confidence (heuristic) ---
  const aiConfidence = computeExtractionConfidence({
    textLength: text.length,
    conceptCount: concepts.length,
    formulaCount: formulas.length,
    definitionCount: definitions.length,
  });

  const attributes: ConceptAttributes = {
    formulas,
    definitions,
    keywords,
    skills,
    examples,
    vocabulary,
    misconceptions,
  };

  log.info("concepts.extracted", {
    subject,
    conceptCount: concepts.length,
    formulaCount: formulas.length,
    bloomLevel,
    difficulty,
    confidence: aiConfidence,
  });

  return {
    concepts: concepts.map((c) => ({
      name: c.name,
      slug: slugify(c.name),
      confidence: c.confidence,
      weight: c.weight,
      relationship: c.relationship,
    })),
    bloomLevel,
    difficulty,
    estimatedMinutes,
    attributes,
    aiConfidence,
    model: "edubek-extract-v1",
  };
}

// ---------------------------------------------------------------------------
// Apply extraction to an entity (persist concepts + ResourceConcept links)
// ---------------------------------------------------------------------------

export async function analyzeAndIndexEntity(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  subject?: string;
}): Promise<{
  extracted: ConceptExtractionResult;
  conceptIds: string[];
}> {
  const { entityType, entityId, title, content, subject } = input;
  const extracted = extractConcepts({ content, subject, title });

  // Persist each unique concept and link it to the entity.
  const conceptIds: string[] = [];
  for (const c of extracted.concepts) {
    // Find or create the concept
    let concept: { id: string } | null = await repo.findConceptBySlug(c.slug).catch(() => null);
    if (!concept) {
      const created = await repo.createConcept({
        slug: c.slug,
        name: c.name,
        subject: subject ?? undefined,
        bloomLevel: extracted.bloomLevel ?? undefined,
        difficulty: extracted.difficulty,
        estimatedMinutes: extracted.estimatedMinutes,
        attributes: JSON.stringify(extracted.attributes),
        aiConfidence: c.confidence,
      }).catch((err) => {
        log.warn("concept.create_failed", { slug: c.slug, error: (err as Error).message });
        return null;
      });
      concept = created;
    }
    if (!concept) continue;

    conceptIds.push(concept.id);

    // Link the concept to the entity
    await repo.createResourceConcept({
      conceptId: concept.id,
      entityType,
      entityId,
      relationship: c.relationship,
      confidence: c.confidence,
      weight: c.weight,
    }).catch(() => undefined);
  }

  log.info("entity.analyzed", {
    entityType,
    entityId,
    conceptCount: conceptIds.length,
  });

  return { extracted, conceptIds };
}

// ---------------------------------------------------------------------------
// Extractors (rule-based, deterministic)
// ---------------------------------------------------------------------------

interface ExtractedConcept {
  name: string;
  confidence: number;
  weight: number;
  relationship: ResourceConceptRelationship;
}

/**
 * Extract concept names from text. Patterns recognized:
 *   • Markdown headings (# Foo, ## Bar) → primary concepts
 *   • Bolded terms (**Foo**) → concepts
 *   • "X is defined as ..." → definitions
 *   • "X is the Y" → concepts
 *   • CamelCase / Title Case multi-word phrases in subject context
 */
function extractConceptNames(text: string, subject?: string): ExtractedConcept[] {
  const concepts: ExtractedConcept[] = [];
  const seen = new Set<string>();

  // Markdown headings (highest weight)
  const headingMatches = text.matchAll(/^#{1,6}\s+(.+)$/gm);
  for (const m of headingMatches) {
    const name = m[1]!.trim().replace(/[*_`]/g, "");
    if (name.length < 3 || name.length > 100) continue;
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    concepts.push({
      name,
      confidence: 0.85,
      weight: 0.95, // heading = primary concept
      relationship: "teaches",
    });
  }

  // Bolded terms (**Foo** or __Foo__)
  const boldMatches = text.matchAll(/\*\*([^*]+)\*\*|__([^_]+)__/g);
  for (const m of boldMatches) {
    const name = (m[1] ?? m[2])!.trim();
    if (name.length < 3 || name.length > 100) continue;
    if (isStopphrase(name)) continue;
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    concepts.push({
      name,
      confidence: 0.7,
      weight: 0.7,
      relationship: "teaches",
    });
  }

  // "X is defined as Y" / "X is the Y" / "X means Y" → definitions
  const defMatches = text.matchAll(/([A-Z][a-zA-Z\s]{2,40})\s+(?:is defined as|is the|means|refers to)\s+([^.]+)/g);
  for (const m of defMatches) {
    const name = m[1]!.trim();
    if (name.length < 3 || name.length > 60) continue;
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    concepts.push({
      name,
      confidence: 0.75,
      weight: 0.8,
      relationship: "teaches",
    });
  }

  // Subject-specific keyword lookup
  if (subject) {
    const subjectConcepts = SUBJECT_CONCEPTS[subject.toLowerCase()];
    if (subjectConcepts) {
      const lowerText = text.toLowerCase();
      for (const c of subjectConcepts) {
        if (lowerText.includes(c.toLowerCase())) {
          const slug = slugify(c);
          if (seen.has(slug)) continue;
          seen.add(slug);
          concepts.push({
            name: c,
            confidence: 0.65,
            weight: 0.5,
            relationship: "references",
          });
        }
      }
    }
  }

  // Limit to top 15 concepts (sorted by weight × confidence)
  return concepts
    .sort((a, b) => (b.weight * b.confidence) - (a.weight * a.confidence))
    .slice(0, 15);
}

/**
 * Extract formulas — math expressions like:
 *   • $E = mc^2$ (LaTeX inline)
 *   • $$x = (-b ± √(b²-4ac)) / 2a$$ (LaTeX block)
 *   • a² + b² = c² (Unicode superscripts)
 *   • E = mc^2 (caret notation)
 */
function extractFormulas(text: string): string[] {
  const formulas: string[] = [];
  const seen = new Set<string>();

  // LaTeX block: $$...$$
  const blockMatches = text.matchAll(/\$\$([^$]+)\$\$/g);
  for (const m of blockMatches) {
    const f = m[1]!.trim();
    if (f.length < 2 || f.length > 200) continue;
    if (seen.has(f)) continue;
    seen.add(f);
    formulas.push(f);
  }

  // LaTeX inline: $...$
  const inlineMatches = text.matchAll(/(?<!\$)\$([^$\n]+)\$(?!\$)/g);
  for (const m of inlineMatches) {
    const f = m[1]!.trim();
    if (f.length < 2 || f.length > 200) continue;
    if (seen.has(f)) continue;
    // Skip if it's just a number
    if (/^\$?\d+(\.\d+)?\$?$/.test(f)) continue;
    seen.add(f);
    formulas.push(f);
  }

  // Unicode / caret notation: contains = and at least one math symbol
  const mathSymbols = /[+\-*/=^√∑∫π∞±≤≥≠≈√]/;
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 200) continue;
    if (!trimmed.includes("=")) continue;
    if (!mathSymbols.test(trimmed)) continue;
    // Skip sentences (likely prose)
    if (trimmed.split(" ").length > 8) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    formulas.push(trimmed);
  }

  return formulas.slice(0, 20);
}

/**
 * Extract definitions — "X is defined as Y", "X is the Y", "X means Y", "X: Y" (term: meaning).
 */
function extractDefinitions(text: string): string[] {
  const definitions: string[] = [];
  const seen = new Set<string>();

  // Pattern 1: "X is defined as Y" / "X is the Y" / "X means Y"
  // Captures: m[1] = term, m[2] = meaning
  const pattern1 = /([A-Z][a-zA-Z\s]{2,40})\s+(?:is defined as|is the|means|refers to)\s+([^.]+)/g;
  for (const m of text.matchAll(pattern1)) {
    const term = m[1]!.trim();
    const meaning = m[2]!.trim();
    if (term.length < 3 || term.length > 60) continue;
    if (meaning.length < 5 || meaning.length > 300) continue;
    const def = `${term}: ${meaning}`;
    if (seen.has(def)) continue;
    seen.add(def);
    definitions.push(def);
  }

  // Pattern 2: "- **Term**: meaning" (markdown bold + colon)
  // Captures: m[2] = term, m[3] = meaning
  const pattern2 = /^([-*]?\s*\*\*([^*]+)\*\*\s*:\s*(.+))$/gm;
  for (const m of text.matchAll(pattern2)) {
    const term = m[2]!.trim();
    const meaning = m[3]!.trim();
    if (term.length < 3 || term.length > 60) continue;
    if (meaning.length < 5 || meaning.length > 300) continue;
    const def = `${term}: ${meaning}`;
    if (seen.has(def)) continue;
    seen.add(def);
    definitions.push(def);
  }

  return definitions.slice(0, 20);
}

/**
 * Extract keywords — subject-specific vocabulary terms.
 */
function extractKeywords(text: string, subject?: string): string[] {
  const keywords = new Set<string>();
  const lower = text.toLowerCase();

  // Pull from all subject dictionaries
  for (const [subj, terms] of Object.entries(SUBJECT_CONCEPTS)) {
    if (subject && subj !== subject.toLowerCase()) continue;
    for (const t of terms) {
      if (lower.includes(t.toLowerCase())) keywords.add(t);
    }
  }

  // Pull capitalized multi-word terms (proper nouns / Title Case)
  const titleCaseMatches = text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);
  for (const m of titleCaseMatches) {
    const term = m[1]!.trim();
    if (term.length < 5 || term.length > 50) continue;
    if (isStopphrase(term)) continue;
    keywords.add(term);
  }

  return Array.from(keywords).slice(0, 30);
}

/**
 * Extract skills — phrases indicating observable capabilities.
 *   • "Students will be able to X"
 *   • "You can Y"
 *   • "Able to Z"
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /(?:students will be able to|you (?:can|should be able to|will be able to)|able to)\s+([^.!\n]+)/gi,
    /(?:learn how to|how to)\s+([^.!\n]+)/gi,
  ];

  for (const p of patterns) {
    const matches = text.matchAll(p);
    for (const m of matches) {
      const skill = m[1]!.trim().replace(/[*_`]/g, "");
      if (skill.length < 5 || skill.length > 100) continue;
      if (seen.has(skill)) continue;
      seen.add(skill);
      skills.push(skill);
    }
  }

  return skills.slice(0, 15);
}

/**
 * Extract examples — "Example:", "For example,", "e.g.,", code blocks.
 */
function extractExamples(text: string): string[] {
  const examples: string[] = [];
  const seen = new Set<string>();

  // Code blocks
  const codeBlocks = text.matchAll(/```[\w]*\n([\s\S]+?)\n```/g);
  for (const m of codeBlocks) {
    const example = m[1]!.trim();
    if (example.length < 5 || example.length > 500) continue;
    if (seen.has(example)) continue;
    seen.add(example);
    examples.push(example);
  }

  // "Example:" or "For example," sections
  const exampleSections = text.matchAll(/(?:Example|For example|e\.g\.)[:,]?\s*([^\n]+(?:\n(?![#*-]).*)*)/gi);
  for (const m of exampleSections) {
    const example = m[1]!.trim();
    if (example.length < 5 || example.length > 500) continue;
    if (seen.has(example)) continue;
    seen.add(example);
    examples.push(example);
  }

  return examples.slice(0, 10);
}

/**
 * Extract vocabulary — list items starting with "- " or "* " that look like
 * term lists.
 */
function extractVocabulary(text: string): string[] {
  const vocabulary: string[] = [];
  const seen = new Set<string>();

  // List items
  const listMatches = text.matchAll(/^[-*]\s+([^\n]+)$/gm);
  for (const m of listMatches) {
    const term = m[1]!.trim().replace(/[*_`]/g, "");
    // Split on ":" or "—" to get just the term
    const justTerm = term.split(/[:—–-]/)[0]!.trim();
    if (justTerm.length < 2 || justTerm.length > 60) continue;
    if (seen.has(justTerm)) continue;
    if (isStopphrase(justTerm)) continue;
    seen.add(justTerm);
    vocabulary.push(justTerm);
  }

  return vocabulary.slice(0, 30);
}

/**
 * Extract misconceptions — explicit mentions of common errors.
 *   • "Common mistake: ..."
 *   • "Don't confuse X with Y"
 *   • "Note: ... is not ..."
 */
function extractMisconceptions(text: string): string[] {
  const misconceptions: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /(?:common mistake|common error|common misconception|don't confuse|do not confuse|note:|warning:|caution:)\s*:?\s*([^\n]+)/gi,
    /(\w[\w\s]+)\s+is not\s+([^.]+)/gi,
  ];

  for (const p of patterns) {
    const matches = text.matchAll(p);
    for (const m of matches) {
      const misconception = m[0]!.trim();
      if (misconception.length < 5 || misconception.length > 300) continue;
      if (seen.has(misconception)) continue;
      seen.add(misconception);
      misconceptions.push(misconception);
    }
  }

  return misconceptions.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Bloom level detection
// ---------------------------------------------------------------------------

const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  remember: ["define", "list", "name", "identify", "recall", "recognize", "label", "state", "describe"],
  understand: ["explain", "summarize", "interpret", "classify", "compare", "discuss", "illustrate"],
  apply: ["apply", "demonstrate", "calculate", "solve", "use", "implement", "compute", "execute"],
  analyze: ["analyze", "differentiate", "distinguish", "examine", "investigate", "deconstruct", "contrast"],
  evaluate: ["evaluate", "critique", "judge", "assess", "justify", "defend", "argue", "rank"],
  create: ["create", "design", "develop", "formulate", "construct", "compose", "generate", "produce"],
};

export function detectBloomLevel(text: string): BloomLevel | null {
  const lower = text.toLowerCase();
  const counts: Record<BloomLevel, number> = {
    remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0,
  };

  for (const [level, verbs] of Object.entries(BLOOM_VERBS)) {
    for (const v of verbs) {
      // Match whole word (not part of another word)
      const re = new RegExp(`\\b${v}\\b`, "gi");
      const matches = lower.match(re);
      if (matches) counts[level as BloomLevel] += matches.length;
    }
  }

  // Find the highest-count level
  let best: BloomLevel | null = null;
  let bestCount = 0;
  for (const [level, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      best = level as BloomLevel;
    }
  }

  return bestCount > 0 ? best : null;
}

// ---------------------------------------------------------------------------
// Difficulty estimation
// ---------------------------------------------------------------------------

export function estimateDifficulty(text: string, formulaCount: number, conceptCount: number): number {
  let difficulty = 0.3; // baseline

  // More formulas → harder
  difficulty += Math.min(0.3, formulaCount * 0.03);

  // More concepts → harder (denser content)
  difficulty += Math.min(0.2, conceptCount * 0.02);

  // Higher Bloom level verbs → harder
  const lower = text.toLowerCase();
  if (/\b(analyze|evaluate|create|design|critique|justify)\b/.test(lower)) difficulty += 0.15;
  else if (/\b(apply|solve|calculate|demonstrate)\b/.test(lower)) difficulty += 0.1;
  else if (/\b(define|list|name|identify)\b/.test(lower)) difficulty -= 0.05;

  // Longer text → harder (more reading)
  if (text.length > 5000) difficulty += 0.1;
  else if (text.length < 500) difficulty -= 0.1;

  return Math.max(0.1, Math.min(1, difficulty));
}

// ---------------------------------------------------------------------------
// Study time estimation
// ---------------------------------------------------------------------------

export function estimateStudyTime(text: string): number {
  // Reading speed: ~200 wpm for educational content (slower than casual)
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const readingMinutes = words / 200;

  // Add 5 min per formula (formulas need extra study time)
  const formulaCount = (text.match(/\$\$|```math/g) ?? []).length;
  const formulaMinutes = formulaCount * 5;

  // Add 2 min per example (students work through examples)
  const exampleCount = (text.match(/(?:Example|For example|e\.g\.)[:,]/gi) ?? []).length;
  const exampleMinutes = exampleCount * 2;

  return Math.max(5, Math.round(readingMinutes + formulaMinutes + exampleMinutes));
}

// ---------------------------------------------------------------------------
// Confidence estimation
// ---------------------------------------------------------------------------

function computeExtractionConfidence(input: {
  textLength: number;
  conceptCount: number;
  formulaCount: number;
  definitionCount: number;
}): number {
  let confidence = 0.4; // baseline

  // Longer text → more signal
  if (input.textLength > 1000) confidence += 0.15;
  if (input.textLength > 5000) confidence += 0.1;

  // More concepts extracted → higher confidence
  if (input.conceptCount >= 3) confidence += 0.15;
  if (input.conceptCount >= 8) confidence += 0.1;

  // Formulas and definitions are strong signal
  if (input.formulaCount > 0) confidence += 0.05;
  if (input.definitionCount > 0) confidence += 0.05;

  return Math.min(0.95, confidence);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function isStopphrase(s: string): boolean {
  const stopphrases = [
    "the", "this", "that", "these", "those", "introduction", "conclusion",
    "summary", "overview", "table of contents", "example", "note", "warning",
    "step", "next", "previous", "chapter", "section",
  ];
  const lower = s.toLowerCase();
  return stopphrases.includes(lower);
}

// ---------------------------------------------------------------------------
// Subject-specific concept dictionaries
// ---------------------------------------------------------------------------

const SUBJECT_CONCEPTS: Record<string, string[]> = {
  mathematics: [
    "algebra", "geometry", "trigonometry", "calculus", "statistics", "probability",
    "fractions", "decimals", "percentages", "ratios", "proportions",
    "equations", "inequalities", "functions", "graphs", "slope", "intercept",
    "polynomials", "factoring", "quadratic", "linear", "exponential", "logarithm",
    "derivative", "integral", "limit", "vector", "matrix", "determinant",
    "Pythagorean theorem", "quadratic formula", "area", "perimeter", "volume",
    "angle", "triangle", "circle", "polygon", "parallel", "perpendicular",
  ],
  physics: [
    "force", "energy", "momentum", "velocity", "acceleration", "mass", "weight",
    "gravity", "friction", "tension", "Newton's laws", "kinematics", "dynamics",
    "work", "power", "kinetic energy", "potential energy", "conservation of energy",
    "electric field", "magnetic field", "electromagnetism", "circuit", "voltage",
    "current", "resistance", "Ohm's law", "wave", "frequency", "wavelength",
    "amplitude", "reflection", "refraction", "diffraction", "interference",
    "thermodynamics", "heat", "temperature", "entropy", "enthalpy",
    "quantum mechanics", "relativity", "photoelectric effect",
  ],
  chemistry: [
    "atom", "molecule", "ion", "compound", "element", "periodic table",
    "atomic number", "atomic mass", "isotope", "electron", "proton", "neutron",
    "chemical bond", "covalent", "ionic", "metallic", "hydrogen bond",
    "reaction", "oxidation", "reduction", "catalyst", "activation energy",
    "acid", "base", "pH", "neutralization", "titration",
    "stoichiometry", "mole", "molar mass", "Avogadro's number",
    "organic", "inorganic", "hydrocarbon", "alkane", "alkene", "alkyne",
    "polymer", "monomer", "thermodynamics", "kinetics", "equilibrium",
  ],
  biology: [
    "cell", "tissue", "organ", "organism", "ecosystem", "biosphere",
    "photosynthesis", "respiration", "mitosis", "meiosis", "DNA", "RNA",
    "protein", "enzyme", "gene", "chromosome", "genetics", "heredity",
    "evolution", "natural selection", "adaptation", "speciation",
    "classification", "taxonomy", "kingdom", "phylum", "species",
    "bacteria", "virus", "fungi", "protist", "plant", "animal",
    "circulatory", "respiratory", "nervous", "digestive", "immune system",
    "homeostasis", "metabolism", "anabolism", "catabolism",
  ],
  history: [
    "civilization", "empire", "revolution", "war", "treaty", "alliance",
    "democracy", "monarchy", "republic", "dictatorship", "feudalism",
    "colonization", "independence", "constitution", "parliament",
    "Renaissance", "Enlightenment", "Industrial Revolution", "Cold War",
    "ancient", "medieval", "modern", "contemporary",
    "archaeology", "primary source", "secondary source",
  ],
  geography: [
    "continent", "ocean", "river", "mountain", "desert", "forest",
    "climate", "weather", "precipitation", "temperature", "humidity",
    "latitude", "longitude", "equator", "hemisphere", "timezone",
    "population", "urbanization", "migration", "demographics",
    "topography", "cartography", "GIS", "GPS",
    "tectonic plates", "earthquake", "volcano", "erosion", "weathering",
  ],
  literature: [
    "novel", "short story", "poem", "play", "essay", "memoir",
    "character", "protagonist", "antagonist", "plot", "setting", "theme",
    "symbolism", "metaphor", "simile", "personification", "irony",
    "foreshadowing", "alliteration", "imagery", "tone", "mood",
    "narrative", "point of view", "dialogue", "monologue",
    "genre", "fiction", "nonfiction", "fantasy", "science fiction",
  ],
  programming: [
    "variable", "function", "loop", "conditional", "array", "object",
    "class", "method", "inheritance", "polymorphism", "encapsulation",
    "algorithm", "data structure", "recursion", "iteration",
    "string", "integer", "boolean", "null", "undefined",
    "API", "endpoint", "request", "response", "HTTP", "REST", "GraphQL",
    "database", "SQL", "NoSQL", "schema", "query",
    "frontend", "backend", "full-stack", "framework", "library",
    "debugging", "testing", "deployment", "version control",
  ],
};
