/**
 * EduBek — Journey Engine.
 *
 * Phase 5D.5 System 2: The platform understands where the user currently
 * is in a multi-step journey (creating a lesson, preparing an exam,
 * studying, reviewing, etc.). Each journey has steps, completion %,
 * estimated remaining work, AI suggestions, and blocked-step detection.
 *
 * REUSES Platform Orchestrator's workflow registry as the source of
 * truth for cross-system cascades — journeys map to user-facing flows,
 * workflows map to system-internal cascades. The two layers are
 * complementary.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { JourneyKind, JourneyState, JourneyStep } from "./types";

const log = getLogger("journey-engine");

// ===========================================================================
// Built-in journey templates
// ===========================================================================

interface JourneyTemplate {
  kind: JourneyKind;
  title: string;
  steps: Array<Omit<JourneyStep, "status">>;
  /** Estimated minutes per step. */
  minutesPerStep: number;
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    kind: "teacher_lesson_creation",
    title: "Create a Lesson",
    minutesPerStep: 8,
    steps: [
      { index: 0, label: "Choose topic & objectives", module: "knowledge-intelligence", aiAssisted: true, actionUrl: "/knowledge" },
      { index: 1, label: "Generate lesson outline", module: "ai-workspace", aiAssisted: true, actionUrl: "/ai" },
      { index: 2, label: "Add content & examples", module: "resource", aiAssisted: false, actionUrl: "/resources/new" },
      { index: 3, label: "Align to curriculum", module: "knowledge-intelligence", aiAssisted: true },
      { index: 4, label: "Add assessment questions", module: "assessment-platform", aiAssisted: true, actionUrl: "/assessments/new" },
      { index: 5, label: "Publish to classroom", module: "classroom", aiAssisted: false, actionUrl: "/classroom" },
    ],
  },
  {
    kind: "teacher_exam_preparation",
    title: "Prepare an Exam",
    minutesPerStep: 10,
    steps: [
      { index: 0, label: "Select topics & blueprint", module: "assessment-platform", aiAssisted: true },
      { index: 1, label: "Generate questions (Bloom-balanced)", module: "assessment-platform", aiAssisted: true },
      { index: 2, label: "Configure rubric", module: "assessment-platform", aiAssisted: true },
      { index: 3, label: "Set up secure exam session", module: "assessment-platform", aiAssisted: false },
      { index: 4, label: "Schedule & notify students", module: "education-os", aiAssisted: false },
      { index: 5, label: "Preview & publish", module: "assessment-platform", aiAssisted: false },
    ],
  },
  {
    kind: "student_studying",
    title: "Study Session",
    minutesPerStep: 15,
    steps: [
      { index: 0, label: "Review learning plan", module: "learning-planner", aiAssisted: false, actionUrl: "/planner" },
      { index: 1, label: "Review weak topics", module: "knowledge-intelligence", aiAssisted: true },
      { index: 2, label: "Work through materials", module: "discovery", aiAssisted: false },
      { index: 3, label: "Practice with quiz", module: "assessment-platform", aiAssisted: true },
      { index: 4, label: "Ask AI tutor for help", module: "learning-studio", aiAssisted: true },
      { index: 5, label: "Update mastery & reflect", module: "learning-planner", aiAssisted: false },
    ],
  },
  {
    kind: "student_reviewing",
    title: "Review Past Material",
    minutesPerStep: 12,
    steps: [
      { index: 0, label: "Open spaced-repetition queue", module: "learning-planner", aiAssisted: false },
      { index: 1, label: "Review flashcards", module: "learning-planner", aiAssisted: false },
      { index: 2, label: "Re-attempt weak questions", module: "assessment-platform", aiAssisted: true },
      { index: 3, label: "Update mastery", module: "knowledge-intelligence", aiAssisted: false },
    ],
  },
  {
    kind: "organization_analytics",
    title: "Analyze Organization Performance",
    minutesPerStep: 10,
    steps: [
      { index: 0, label: "Open organization dashboard", module: "civilization-engine", aiAssisted: false },
      { index: 1, label: "Review KPIs & trends", module: "platform-intelligence", aiAssisted: true },
      { index: 2, label: "Identify at-risk classrooms", module: "digital-twins", aiAssisted: true },
      { index: 3, label: "Drill into root causes", module: "knowledge-intelligence", aiAssisted: true },
      { index: 4, label: "Plan interventions", module: "civilization-engine", aiAssisted: true },
    ],
  },
  {
    kind: "marketplace_publishing",
    title: "Publish to Marketplace",
    minutesPerStep: 8,
    steps: [
      { index: 0, label: "Finalize resource", module: "resource", aiAssisted: false },
      { index: 1, label: "Set pricing & license", module: "commerce", aiAssisted: false },
      { index: 2, label: "Submit for review", module: "marketplace", aiAssisted: false },
      { index: 3, label: "Respond to reviewer feedback", module: "marketplace", aiAssisted: true },
      { index: 4, label: "Publish", module: "marketplace", aiAssisted: false },
    ],
  },
  {
    kind: "research",
    title: "Research Project",
    minutesPerStep: 30,
    steps: [
      { index: 0, label: "Define hypothesis", module: "research-platform", aiAssisted: true },
      { index: 1, label: "Literature review", module: "research-platform", aiAssisted: true },
      { index: 2, label: "Design experiment", module: "research-platform", aiAssisted: true },
      { index: 3, label: "Collect & analyze data", module: "research-platform", aiAssisted: true },
      { index: 4, label: "Draft publication", module: "research-platform", aiAssisted: true },
      { index: 5, label: "Peer review & submit", module: "research-platform", aiAssisted: false },
    ],
  },
  {
    kind: "certification",
    title: "Earn a Certification",
    minutesPerStep: 25,
    steps: [
      { index: 0, label: "Review competency requirements", module: "assessment-platform", aiAssisted: false },
      { index: 1, label: "Complete prerequisite learning", module: "learning-planner", aiAssisted: true },
      { index: 2, label: "Take practice exam", module: "assessment-platform", aiAssisted: true },
      { index: 3, label: "Schedule final assessment", module: "assessment-platform", aiAssisted: false },
      { index: 4, label: "Complete assessment", module: "assessment-platform", aiAssisted: false },
      { index: 5, label: "Receive digital credential", module: "assessment-platform", aiAssisted: false },
    ],
  },
];

// ===========================================================================
// Public API
// ===========================================================================

export function listJourneyTemplates(): Array<{ kind: JourneyKind; title: string; stepCount: number }> {
  return JOURNEY_TEMPLATES.map(t => ({ kind: t.kind, title: t.title, stepCount: t.steps.length }));
}

export function getJourneyTemplate(kind: JourneyKind): JourneyTemplate | null {
  return JOURNEY_TEMPLATES.find(t => t.kind === kind) ?? null;
}

export async function startJourney(userId: string, kind: JourneyKind): Promise<JourneyState> {
  const template = getJourneyTemplate(kind);
  if (!template) throw new Error(`Unknown journey kind: ${kind}`);
  const steps: JourneyStep[] = template.steps.map(s => ({ ...s, status: "pending" }));
  if (steps.length > 0) steps[0].status = "in_progress";
  const row = await repo.createJourney({
    userId, kind, title: template.title, steps,
    completionPercent: 0,
    estimatedRemainingMinutes: steps.length * template.minutesPerStep,
  });
  log.info("journey.started", { id: row.id, kind, userId });
  return mapJourney(row);
}

export async function getJourney(id: string): Promise<JourneyState | null> {
  const row = await repo.findJourney(id);
  return row ? mapJourney(row) : null;
}

export async function getActiveJourney(userId: string): Promise<JourneyState | null> {
  const row = await repo.findActiveJourney(userId);
  return row ? mapJourney(row) : null;
}

export async function listUserJourneys(userId: string): Promise<JourneyState[]> {
  const rows = await repo.listJourneys(userId);
  return rows.map(mapJourney);
}

export async function advanceJourney(id: string): Promise<JourneyState | null> {
  const row = await repo.findJourney(id);
  if (!row) return null;
  const steps = repo.safeParse<JourneyStep[]>(row.steps, []);
  const currentIdx = row.currentStepIndex;
  if (currentIdx < steps.length) {
    steps[currentIdx].status = "completed";
  }
  const nextIdx = currentIdx + 1;
  if (nextIdx < steps.length) {
    steps[nextIdx].status = "in_progress";
  }
  const completedCount = steps.filter(s => s.status === "completed").length;
  const completionPercent = Math.round((completedCount / steps.length) * 100);
  const template = getJourneyTemplate(row.kind as JourneyKind);
  const remainingSteps = steps.length - completedCount;
  const estimatedRemainingMinutes = remainingSteps * (template?.minutesPerStep ?? 10);
  const status = completionPercent === 100 ? "completed" : "active";
  const updated = await repo.updateJourney(id, {
    currentStepIndex: nextIdx,
    steps,
    completionPercent,
    estimatedRemainingMinutes,
    status,
    completedAt: status === "completed" ? new Date() : null,
  });
  log.info("journey.advanced", { id, currentStepIndex: nextIdx, completionPercent });
  return mapJourney(updated);
}

export async function blockStep(id: string, stepIndex: number, reason: string): Promise<JourneyState | null> {
  const row = await repo.findJourney(id);
  if (!row) return null;
  const steps = repo.safeParse<JourneyStep[]>(row.steps, []);
  if (stepIndex < 0 || stepIndex >= steps.length) return null;
  steps[stepIndex].status = "blocked";
  const blockedSteps = repo.safeParse<Array<{ stepIndex: number; reason: string }>>(row.blockedSteps, []);
  blockedSteps.push({ stepIndex, reason });
  const updated = await repo.updateJourney(id, { steps, blockedSteps });
  return mapJourney(updated);
}

export async function addSuggestion(id: string, suggestion: { action: string; rationale: string; priority: number }): Promise<JourneyState | null> {
  const row = await repo.findJourney(id);
  if (!row) return null;
  const suggestions = repo.safeParse<Array<{ action: string; rationale: string; priority: number }>>(row.suggestions, []);
  suggestions.push(suggestion);
  suggestions.sort((a, b) => b.priority - a.priority);
  const updated = await repo.updateJourney(id, { suggestions });
  return mapJourney(updated);
}

// ===========================================================================
// Helpers
// ===========================================================================

function mapJourney(row: Awaited<ReturnType<typeof repo.findJourney>>): JourneyState {
  if (!row) throw new Error("Cannot map null journey row");
  return {
    kind: row.kind as JourneyKind,
    title: row.title,
    completionPercent: row.completionPercent,
    estimatedRemainingMinutes: row.estimatedRemainingMinutes,
    currentStepIndex: row.currentStepIndex,
    steps: repo.safeParse<JourneyStep[]>(row.steps, []),
    suggestions: repo.safeParse(row.suggestions, []),
    blockedSteps: repo.safeParse(row.blockedSteps, []),
    startedAt: row.startedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Compute journey suggestions based on current state. Reused by assistant-orchestrator. */
export function computeJourneySuggestions(journey: JourneyState): Array<{ action: string; rationale: string; priority: number }> {
  const suggestions: Array<{ action: string; rationale: string; priority: number }> = [];
  const currentStep = journey.steps[journey.currentStepIndex];
  if (currentStep) {
    if (currentStep.aiAssisted) {
      suggestions.push({
        action: `Ask AI to help with: ${currentStep.label}`,
        rationale: "The current step is AI-assisted — invoking the assistant will accelerate progress.",
        priority: 80,
      });
    }
    if (currentStep.actionUrl) {
      suggestions.push({
        action: `Open ${currentStep.label}`,
        rationale: "Navigate to the step's workspace to continue.",
        priority: 70,
      });
    }
  }
  if (journey.blockedSteps.length > 0) {
    suggestions.push({
      action: "Resolve blocked steps",
      rationale: `${journey.blockedSteps.length} step(s) are blocked — resolving them unblocks the journey.`,
      priority: 90,
    });
  }
  if (journey.completionPercent >= 50 && journey.completionPercent < 100) {
    suggestions.push({
      action: "Review progress so far",
      rationale: "Past the halfway point — a quick review prevents rework later.",
      priority: 50,
    });
  }
  return suggestions;
}
