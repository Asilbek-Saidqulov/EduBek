/**
 * EduBek — AI Prompt Registry.
 *
 * Phase 5D.4: Centralize every AI prompt in one registry. Supports
 * versioning, experiments, localization, rollback, analytics, provider
 * overrides, and evaluation.
 *
 * Every AI feature should load prompts from this registry — no prompt
 * text should be hardcoded in service files anymore.
 *
 * The registry ships with a curated set of built-in prompts derived
 * from existing prompt-template usage across the platform. Custom
 * prompts can be added at runtime via `registerPrompt`.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { PromptDefinition, PromptVersionDto } from "./types";

const log = getLogger("prompt-registry");

// ===========================================================================
// Built-in prompts — minimal but representative
// ===========================================================================

export const BUILTIN_PROMPTS: Array<Omit<PromptDefinition, "createdAt" | "updatedAt" | "createdBy">> = [
  {
    id: "lesson.generator",
    name: "Lesson Generator",
    description: "Generates a structured lesson plan from a topic, audience, and learning objectives.",
    module: "ai-workspace",
    version: 1,
    versionTag: "1.0.0",
    template: `You are an expert instructional designer. Generate a comprehensive lesson plan.

Topic: {{topic}}
Audience: {{audience}}
Learning objectives: {{objectives}}
Duration: {{duration}} minutes
Difficulty: {{difficulty}}

Return a JSON object with:
- title
- summary
- sections (array of { title, content, duration_minutes })
- assessment_questions (array of { question, options, answer, explanation })
- key_takeaways (array of strings)`,
    variables: [
      { name: "topic", required: true, description: "Lesson topic" },
      { name: "audience", required: true, description: "Target learner audience" },
      { name: "objectives", required: true, description: "Comma-separated learning objectives" },
      { name: "duration", required: false, description: "Lesson duration in minutes (default 45)" },
      { name: "difficulty", required: false, description: "beginner | intermediate | advanced" },
    ],
    localizations: [
      { locale: "en", templateKey: "lesson.generator.en" },
      { locale: "uz", templateKey: "lesson.generator.uz" },
      { locale: "ru", templateKey: "lesson.generator.ru" },
    ],
    active: true,
  },
  {
    id: "quiz.generator",
    name: "Quiz Generator",
    description: "Generates assessment questions from a topic, count, and difficulty.",
    module: "ai-workspace",
    version: 1,
    versionTag: "1.0.0",
    template: `You are an expert assessment author. Generate {{count}} multiple-choice questions.

Topic: {{topic}}
Difficulty: {{difficulty}}
Question type: {{question_type}}

For each question, provide:
- question (string)
- options (array of 4 strings)
- answer (index 0-3)
- explanation (string)
- bloom_level (remember | understand | apply | analyze | evaluate | create)

Return as a JSON array.`,
    variables: [
      { name: "topic", required: true, description: "Quiz topic" },
      { name: "count", required: true, description: "Number of questions" },
      { name: "difficulty", required: false, description: "beginner | intermediate | advanced" },
      { name: "question_type", required: false, description: "multiple_choice | true_false | short_answer" },
    ],
    localizations: [
      { locale: "en", templateKey: "quiz.generator.en" },
      { locale: "uz", templateKey: "quiz.generator.uz" },
      { locale: "ru", templateKey: "quiz.generator.ru" },
    ],
    active: true,
  },
  {
    id: "tutor.explainer",
    name: "AI Tutor Explainer",
    description: "Explains a concept to a student at their preferred difficulty.",
    module: "learning-studio",
    version: 1,
    versionTag: "1.0.0",
    template: `You are a patient tutor. Explain the following concept to a student.

Concept: {{concept}}
Student level: {{level}}
Preferred language: {{language}}

Use analogies suitable for the student's level. Provide:
- A short intuitive explanation (2-3 sentences)
- A worked example
- A common misconception to avoid
- A follow-up question to check understanding`,
    variables: [
      { name: "concept", required: true, description: "Concept to explain" },
      { name: "level", required: true, description: "beginner | intermediate | advanced" },
      { name: "language", required: false, description: "ISO 639-1 language code" },
    ],
    localizations: [
      { locale: "en", templateKey: "tutor.explainer.en" },
      { locale: "uz", templateKey: "tutor.explainer.uz" },
      { locale: "ru", templateKey: "tutor.explainer.ru" },
    ],
    active: true,
  },
  {
    id: "grader.essay",
    name: "Essay Grader",
    description: "Grades an essay against a rubric and provides structured feedback.",
    module: "assessment-platform",
    version: 1,
    versionTag: "1.0.0",
    template: `You are an expert essay grader. Grade the following essay.

Essay: {{essay}}
Rubric: {{rubric}}
Max points: {{max_points}}

Provide:
- score (0 to max_points)
- per-criterion scores (JSON object)
- strengths (array of strings)
- weaknesses (array of strings)
- suggested_revisions (array of strings)
- overall_feedback (string)`,
    variables: [
      { name: "essay", required: true, description: "The student's essay text" },
      { name: "rubric", required: true, description: "The grading rubric (JSON or text)" },
      { name: "max_points", required: true, description: "Maximum points possible" },
    ],
    localizations: [
      { locale: "en", templateKey: "grader.essay.en" },
    ],
    active: true,
  },
  {
    id: "planner.adaptive",
    name: "Adaptive Learning Plan",
    description: "Generates an adaptive learning plan based on student mastery and goals.",
    module: "learning-planner",
    version: 1,
    versionTag: "1.0.0",
    template: `You are an adaptive learning planner. Design a study plan.

Student mastery: {{mastery}}
Goals: {{goals}}
Available time per day: {{daily_minutes}} minutes
Days: {{days}}

Provide a JSON object with:
- daily_schedule (array of { day, sessions: [{ topic, duration_minutes, activity }] })
- milestones (array of { title, target_date, metric })
- recommendations (array of strings)`,
    variables: [
      { name: "mastery", required: true, description: "JSON object of topic → mastery score" },
      { name: "goals", required: true, description: "Learning goals" },
      { name: "daily_minutes", required: false, description: "Daily study time" },
      { name: "days", required: false, description: "Number of days for the plan" },
    ],
    localizations: [
      { locale: "en", templateKey: "planner.adaptive.en" },
    ],
    active: true,
  },
  {
    id: "curriculum.mapper",
    name: "Curriculum Mapper",
    description: "Maps learning resources to curriculum standards.",
    module: "knowledge-intelligence",
    version: 1,
    versionTag: "1.0.0",
    template: `You are a curriculum alignment expert. Map the following resource to curriculum standards.

Resource title: {{title}}
Resource content: {{content}}
Standards framework: {{framework}}

Return a JSON array of:
- standard_id
- alignment_strength (0-1)
- rationale (string)`,
    variables: [
      { name: "title", required: true, description: "Resource title" },
      { name: "content", required: true, description: "Resource content" },
      { name: "framework", required: true, description: "Curriculum framework id" },
    ],
    localizations: [{ locale: "en", templateKey: "curriculum.mapper.en" }],
    active: true,
  },
  {
    id: "research.assistant",
    name: "Research Assistant",
    description: "Helps with literature review, hypothesis generation, and experiment design.",
    module: "research-platform",
    version: 1,
    versionTag: "1.0.0",
    template: `You are a research assistant. Help the user with their research task.

Task: {{task}}
Domain: {{domain}}
Constraints: {{constraints}}

Provide:
- A summary of relevant literature (3-5 paragraphs)
- 3 potential hypotheses
- 2 experiment designs (with variables, controls, and metrics)
- 5 recommended references (with brief annotations)`,
    variables: [
      { name: "task", required: true, description: "Research task description" },
      { name: "domain", required: false, description: "Research domain" },
      { name: "constraints", required: false, description: "Constraints (time, budget, etc.)" },
    ],
    localizations: [{ locale: "en", templateKey: "research.assistant.en" }],
    active: true,
  },
  {
    id: "civilization.advisor",
    name: "Civilization Advisor",
    description: "Generates strategic recommendations for institutional improvement.",
    module: "civilization-engine",
    version: 1,
    versionTag: "1.0.0",
    template: `You are an autonomous institutional advisor. Analyze the situation and provide recommendations.

Institution type: {{institution_type}}
Current state: {{current_state}}
Recent decisions: {{recent_decisions}}
Goals: {{goals}}
Time horizon: {{horizon}}

Provide:
- 3-5 prioritized recommendations (with rationale, expected impact, and cost estimate)
- 2-3 risks to monitor
- 1 strategic narrative (3-4 paragraphs)
- Confidence score (0-1) with explanation`,
    variables: [
      { name: "institution_type", required: true, description: "Type of institution" },
      { name: "current_state", required: true, description: "JSON snapshot of current state" },
      { name: "recent_decisions", required: false, description: "Recent decisions made" },
      { name: "goals", required: false, description: "Strategic goals" },
      { name: "horizon", required: false, description: "1_year | 3_year | 5_year" },
    ],
    localizations: [{ locale: "en", templateKey: "civilization.advisor.en" }],
    active: true,
  },
];

// ===========================================================================
// In-memory cache for fast lookup — kept in sync with the DB
// ===========================================================================

const promptCache = new Map<string, PromptDefinition>();
let cacheHydrated = false;

async function hydrateCache(): Promise<void> {
  if (cacheHydrated) return;
  cacheHydrated = true;
  // Seed built-in prompts
  for (const p of BUILTIN_PROMPTS) {
    const existing = await repo.findPromptById(p.id).catch(() => null);
    if (!existing) {
      try {
        await repo.createPrompt({
          promptId: p.id, name: p.name, description: p.description, module: p.module,
          version: p.version, versionTag: p.versionTag, template: p.template,
          variables: p.variables, providerOverride: p.providerOverride ?? null,
          modelOverride: p.modelOverride ?? null, localizations: p.localizations,
          active: p.active, experimentId: p.experimentId ?? null,
          evaluation: p.evaluation ?? null, notes: null, createdBy: null,
        });
      } catch (err) {
        log.warn("prompt.seed_failed", { promptId: p.id, error: (err as Error).message });
      }
    }
  }
  // Load all into cache
  const rows = await repo.listPrompts({ activeOnly: false }).catch(() => []);
  for (const row of rows) {
    promptCache.set(row.promptId, mapRowToDto(row));
  }
}

function mapRowToDto(row: Awaited<ReturnType<typeof repo.findPromptById>>): PromptDefinition {
  if (!row) throw new Error("Cannot map null row");
  return {
    id: row.promptId,
    name: row.name,
    description: row.description,
    module: row.module,
    version: row.version,
    versionTag: row.versionTag,
    template: row.template,
    variables: safeParse(row.variables, []),
    providerOverride: row.providerOverride ?? undefined,
    modelOverride: row.modelOverride ?? undefined,
    localizations: safeParse(row.localizations, []),
    active: row.active,
    experimentId: row.experimentId ?? undefined,
    evaluation: row.evaluation ? safeParse(row.evaluation, undefined) : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
  };
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// Public API
// ===========================================================================

export async function getPrompt(promptId: string): Promise<PromptDefinition | null> {
  await hydrateCache();
  return promptCache.get(promptId) ?? null;
}

export async function getPromptVersion(promptId: string, version: number): Promise<PromptDefinition | null> {
  const row = await repo.findPromptVersion(promptId, version).catch(() => null);
  if (!row) return null;
  return mapRowToDto(row);
}

export async function listPrompts(filter?: { module?: string; activeOnly?: boolean }): Promise<PromptDefinition[]> {
  await hydrateCache();
  let prompts = Array.from(promptCache.values());
  if (filter?.module) prompts = prompts.filter(p => p.module === filter.module);
  if (filter?.activeOnly) prompts = prompts.filter(p => p.active);
  return prompts.sort((a, b) => a.id.localeCompare(b.id));
}

export async function listPromptVersions(promptId: string): Promise<PromptVersionDto[]> {
  const rows = await repo.listPromptVersions(promptId);
  return rows.map(r => ({
    promptId: r.promptId,
    version: r.version,
    versionTag: r.versionTag,
    template: r.template,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    notes: r.notes,
  }));
}

export interface CreatePromptInput {
  promptId: string; name: string; description: string; module: string;
  template: string; variables?: Array<{ name: string; required: boolean; description: string }>;
  providerOverride?: string; modelOverride?: string;
  localizations?: Array<{ locale: string; templateKey: string }>;
  experimentId?: string; notes?: string; createdBy?: string;
}

export async function createPromptVersion(input: CreatePromptInput): Promise<PromptDefinition> {
  await hydrateCache();
  const existing = promptCache.get(input.promptId);
  const newVersion = existing ? existing.version + 1 : 1;
  const versionTag = `${newVersion}.0.0`;
  const row = await repo.createPrompt({
    promptId: input.promptId, name: input.name, description: input.description,
    module: input.module, version: newVersion, versionTag, template: input.template,
    variables: input.variables ?? [], providerOverride: input.providerOverride ?? null,
    modelOverride: input.modelOverride ?? null, localizations: input.localizations ?? [],
    active: true, experimentId: input.experimentId ?? null, evaluation: null,
    notes: input.notes ?? null, createdBy: input.createdBy ?? null,
  });
  // Deactivate previous versions
  if (existing) {
    try {
      await repo.updatePromptActive(input.promptId, existing.version, false);
    } catch { /* noop */ }
  }
  const dto = mapRowToDto(row);
  promptCache.set(input.promptId, dto);
  log.info("prompt.version_created", { promptId: input.promptId, version: newVersion });
  return dto;
}

export async function rollbackPrompt(promptId: string, version: number): Promise<PromptDefinition | null> {
  await hydrateCache();
  const target = await repo.findPromptVersion(promptId, version).catch(() => null);
  if (!target) return null;
  // Deactivate current active version
  const current = promptCache.get(promptId);
  if (current) {
    try { await repo.updatePromptActive(promptId, current.version, false); } catch { /* noop */ }
  }
  // Activate the target version
  await repo.updatePromptActive(promptId, version, true);
  const dto = mapRowToDto(target);
  promptCache.set(promptId, dto);
  log.info("prompt.rollback", { promptId, version });
  return dto;
}

export async function setPromptActive(promptId: string, active: boolean): Promise<boolean> {
  await hydrateCache();
  const current = promptCache.get(promptId);
  if (!current) return false;
  await repo.updatePromptActive(promptId, current.version, active);
  promptCache.set(promptId, { ...current, active });
  return true;
}

export async function assignExperiment(promptId: string, experimentId: string | null): Promise<boolean> {
  await hydrateCache();
  const current = promptCache.get(promptId);
  if (!current) return false;
  // We just update the cache — the assignment is recorded on the next version bump
  promptCache.set(promptId, { ...current, experimentId: experimentId ?? undefined });
  return true;
}

export async function recordPromptEvaluation(promptId: string, score: number): Promise<void> {
  await hydrateCache();
  const current = promptCache.get(promptId);
  if (!current) return;
  const existingEval = current.evaluation ?? { sampleSize: 0, averageScore: 0, confidence: 0 };
  const newSampleSize = existingEval.sampleSize + 1;
  const newAverage = (existingEval.averageScore * existingEval.sampleSize + score) / newSampleSize;
  // Wilson-style confidence — grows with sample size, capped at 0.95
  const newConfidence = Math.min(0.95, newSampleSize / 30);
  const evaluation = { sampleSize: newSampleSize, averageScore: newAverage, confidence: newConfidence };
  await repo.updatePromptEvaluation(promptId, current.version, evaluation).catch(() => null);
  promptCache.set(promptId, { ...current, evaluation });
}

// ===========================================================================
// Template rendering
// ===========================================================================

export function renderPromptTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export async function resolvePrompt(promptId: string, vars: Record<string, string | number | undefined>): Promise<{
  prompt: string; definition: PromptDefinition | null;
}> {
  const def = await getPrompt(promptId);
  if (!def) {
    return { prompt: renderPromptTemplate(`{{system_prompt}}`, vars), definition: null };
  }
  return { prompt: renderPromptTemplate(def.template, vars), definition: def };
}

// ===========================================================================
// Stats
// ===========================================================================

export async function promptRegistryStats() {
  await hydrateCache();
  const all = Array.from(promptCache.values());
  return {
    total: all.length,
    active: all.filter(p => p.active).length,
    byModule: all.reduce<Record<string, number>>((acc, p) => {
      acc[p.module] = (acc[p.module] ?? 0) + 1;
      return acc;
    }, {}),
    totalVersions: all.reduce((s, p) => s + p.version, 0),
  };
}
