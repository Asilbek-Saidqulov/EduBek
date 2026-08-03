/**
 * EduBek — Cross-System Workflow Registry.
 *
 * Phase 5D.4: Workflows become declarative instead of hardcoded. Each
 * `WorkflowDefinition` describes the cross-module cascade that should
 * fire when a triggering event occurs. The `event-orchestrator.ts`
 * module is responsible for actually executing these declarations.
 *
 * The registry ships with a curated set of workflows derived from the
 * integration patterns documented in the phase specification — every
 * important user action (Quiz Published, Resource Created, Submission
 * Graded, AI Generation Completed, etc.) propagates through the entire
 * platform automatically.
 *
 * Adding a workflow:
 *   1. Append a new `WorkflowDefinition` to `BUILTIN_WORKFLOWS`.
 *   2. Reference real module names from `src/features/`.
 *   3. Make sure each step's `module` matches an existing service.
 */
import type { DomainEventType } from "@/infra/event-bus/events";
import {
  RESOURCE_CREATED, RESOURCE_UPDATED, AI_GENERATION_COMPLETED,
  ASSESSMENT_PUBLISHED, ASSESSMENT_SUBMITTED, ASSESSMENT_AUTO_GRADED,
  SUBMISSION_GRADED, CERTIFICATE_ISSUED, PROGRESS_UPDATED,
  LEARNING_SESSION_COMPLETED, LIVE_SESSION_FINISHED,
  USER_REGISTERED, CLASSROOM_CREATED, STUDENT_JOINED_CLASS,
  ASSIGNMENT_PUBLISHED, ASSIGNMENT_SUBMITTED,
  PLAGIARISM_FLAGGED, INVOICE_PAID, LISTING_PUBLISHED,
  REVIEW_CREATED, SUBSCRIPTION_STARTED,
} from "@/infra/event-bus/events";
import type { WorkflowDefinition, WorkflowExecutionDto } from "./types";

// ===========================================================================
// Built-in workflows
// ===========================================================================

export const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  // -------------------------------------------------------------------------
  // Quiz / Assessment published
  // -------------------------------------------------------------------------
  {
    id: "assessment.published",
    name: "Assessment Published Cascade",
    description: "Propagates a newly-published assessment through knowledge intelligence, discovery, recommendations, marketplace, notifications, analytics, timeline, audit, event store, digital twin, knowledge graph, automation, education OS, civilization, and the global intelligence network.",
    triggers: [ASSESSMENT_PUBLISHED, ASSIGNMENT_PUBLISHED],
    participatingModules: [
      "assessment-platform", "knowledge-intelligence", "discovery",
      "analytics", "education-os", "digital-twins", "platform-intelligence",
      "civilization-engine", "data-fabric", "global-intelligence",
      "learning-planner",
    ],
    enabled: true,
    tags: ["assessment", "publish", "cross-system"],
    slaMs: 5_000,
    steps: [
      { order: 1, module: "knowledge-intelligence", action: "extract_concepts", critical: false },
      { order: 2, module: "knowledge-intelligence", action: "update_coverage", critical: false },
      { order: 3, module: "discovery", action: "index_assessment", critical: false },
      { order: 4, module: "discovery", action: "compute_embeddings", critical: false },
      { order: 5, module: "knowledge-intelligence", action: "update_knowledge_graph", critical: false },
      { order: 6, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 7, module: "digital-twins", action: "sync_classroom_twin", critical: false },
      { order: 8, module: "learning-planner", action: "add_to_agenda", critical: false },
      { order: 9, module: "platform-intelligence", action: "record_feedback_event", critical: false },
      { order: 10, module: "analytics", action: "increment_metric", critical: false },
      { order: 11, module: "education-os", action: "notify_agents", critical: false },
      { order: 12, module: "civilization-engine", action: "record_timeline_event", critical: false },
      { order: 13, module: "data-fabric", action: "append_event_store", critical: true },
      { order: 14, module: "global-intelligence", action: "publish_to_network", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Submission graded — recompute mastery + planner + recommendations
  // -------------------------------------------------------------------------
  {
    id: "submission.graded",
    name: "Submission Graded Cascade",
    description: "When a submission is graded, recompute mastery, update the student's digital twin, refresh the learning plan, surface new recommendations, record feedback for AI learning, and update analytics.",
    triggers: [SUBMISSION_GRADED, ASSESSMENT_AUTO_GRADED],
    participatingModules: [
      "assessment-platform", "knowledge-intelligence", "learning-planner",
      "digital-twins", "platform-intelligence", "analytics",
      "gradebook", "education-os", "discovery",
    ],
    enabled: true,
    tags: ["grading", "mastery", "feedback"],
    slaMs: 3_000,
    steps: [
      { order: 1, module: "gradebook", action: "update_entry", critical: true },
      { order: 2, module: "knowledge-intelligence", action: "update_mastery", critical: false },
      { order: 3, module: "digital-twins", action: "sync_student_twin", critical: false },
      { order: 4, module: "learning-planner", action: "recompute_plan", critical: false },
      { order: 5, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 6, module: "platform-intelligence", action: "record_outcome", critical: false },
      { order: 7, module: "analytics", action: "increment_metric", critical: false },
      { order: 8, module: "education-os", action: "notify_agents", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Resource created → index everywhere
  // -------------------------------------------------------------------------
  {
    id: "resource.created",
    name: "Resource Created Cascade",
    description: "When a new resource is created, extract concepts, compute embeddings, update the knowledge graph, index in semantic search, refresh recommendations, and notify the data fabric.",
    triggers: [RESOURCE_CREATED, RESOURCE_UPDATED],
    participatingModules: [
      "knowledge-intelligence", "discovery", "data-fabric",
      "platform-intelligence", "analytics",
    ],
    enabled: true,
    tags: ["resource", "indexing"],
    slaMs: 5_000,
    steps: [
      { order: 1, module: "knowledge-intelligence", action: "extract_concepts", critical: false },
      { order: 2, module: "discovery", action: "compute_embeddings", critical: false },
      { order: 3, module: "knowledge-intelligence", action: "update_knowledge_graph", critical: false },
      { order: 4, module: "discovery", action: "index_resource", critical: false },
      { order: 5, module: "knowledge-intelligence", action: "compute_quality_score", critical: false },
      { order: 6, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 7, module: "data-fabric", action: "append_event_store", critical: true },
      { order: 8, module: "platform-intelligence", action: "record_feedback_event", critical: false },
      { order: 9, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // AI generation completed → audit + learn + cost tracking
  // -------------------------------------------------------------------------
  {
    id: "ai.generation_completed",
    name: "AI Generation Completed Cascade",
    description: "After any AI generation completes, record cost, audit the invocation, feed the result into the prompt-learning loop, update analytics, and refresh the digital twin if applicable.",
    triggers: [AI_GENERATION_COMPLETED],
    participatingModules: [
      "ai-workspace", "platform-intelligence", "cloud-infra",
      "analytics", "digital-twins", "education-os",
    ],
    enabled: true,
    tags: ["ai", "audit", "cost"],
    slaMs: 2_000,
    steps: [
      { order: 1, module: "cloud-infra", action: "record_cost", critical: true },
      { order: 2, module: "platform-intelligence", action: "audit_ai_generation", critical: true },
      { order: 3, module: "platform-intelligence", action: "record_prompt_evaluation", critical: false },
      { order: 4, module: "platform-intelligence", action: "record_feedback_event", critical: false },
      { order: 5, module: "analytics", action: "increment_metric", critical: false },
      { order: 6, module: "digital-twins", action: "sync_twin", critical: false },
      { order: 7, module: "education-os", action: "notify_agents", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Learning session completed → analytics + planner + twin
  // -------------------------------------------------------------------------
  {
    id: "learning.session_completed",
    name: "Learning Session Completed Cascade",
    description: "After a learning session completes, update analytics, refresh the learning planner, sync the student twin, recompute streak intelligence, and update the burnout detector.",
    triggers: [LEARNING_SESSION_COMPLETED, PROGRESS_UPDATED],
    participatingModules: [
      "analytics", "learning-planner", "digital-twins",
      "platform-intelligence", "education-os", "discovery",
    ],
    enabled: true,
    tags: ["learning", "session"],
    slaMs: 2_000,
    steps: [
      { order: 1, module: "analytics", action: "increment_metric", critical: false },
      { order: 2, module: "learning-planner", action: "update_streak", critical: false },
      { order: 3, module: "learning-planner", action: "check_burnout", critical: false },
      { order: 4, module: "digital-twins", action: "sync_student_twin", critical: false },
      { order: 5, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 6, module: "platform-intelligence", action: "record_feedback_event", critical: false },
      { order: 7, module: "education-os", action: "notify_agents", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Certificate issued → civilization + global + transcript
  // -------------------------------------------------------------------------
  {
    id: "certificate.issued",
    name: "Certificate Issued Cascade",
    description: "When a certificate is issued, update the lifelong transcript, record a civilization timeline event, sync the institution twin, notify the global intelligence network, and trigger marketplace eligibility if applicable.",
    triggers: [CERTIFICATE_ISSUED],
    participatingModules: [
      "assessment-platform", "civilization-engine", "digital-twins",
      "global-intelligence", "marketplace", "analytics",
    ],
    enabled: true,
    tags: ["certificate", "credential"],
    slaMs: 3_000,
    steps: [
      { order: 1, module: "assessment-platform", action: "update_transcript", critical: true },
      { order: 2, module: "civilization-engine", action: "record_timeline_event", critical: false },
      { order: 3, module: "digital-twins", action: "sync_institution_twin", critical: false },
      { order: 4, module: "global-intelligence", action: "publish_to_network", critical: false },
      { order: 5, module: "marketplace", action: "check_eligibility", critical: false },
      { order: 6, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Live session finished → analytics + replays + recommendations
  // -------------------------------------------------------------------------
  {
    id: "live.session_finished",
    name: "Live Session Finished Cascade",
    description: "After a live quiz/session finishes, generate a replay, update leaderboards, refresh student twins, run analytics, and trigger follow-up recommendations for participants.",
    triggers: [LIVE_SESSION_FINISHED],
    participatingModules: [
      "analytics", "digital-twins", "discovery", "platform-intelligence",
    ],
    enabled: true,
    tags: ["live", "session"],
    slaMs: 5_000,
    steps: [
      { order: 1, module: "analytics", action: "increment_metric", critical: false },
      { order: 2, module: "digital-twins", action: "sync_classroom_twin", critical: false },
      { order: 3, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 4, module: "platform-intelligence", action: "record_feedback_event", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Plagiarism flagged → integrity + civilization + notification
  // -------------------------------------------------------------------------
  {
    id: "plagiarism.flagged",
    name: "Plagiarism Flagged Cascade",
    description: "When plagiarism is detected, log the integrity violation, notify the institution via the civilization timeline, and trigger an intervention workflow.",
    triggers: [PLAGIARISM_FLAGGED],
    participatingModules: [
      "assessment-platform", "civilization-engine", "education-os", "analytics",
    ],
    enabled: true,
    tags: ["integrity", "plagiarism"],
    slaMs: 2_000,
    steps: [
      { order: 1, module: "assessment-platform", action: "log_integrity_violation", critical: true },
      { order: 2, module: "civilization-engine", action: "record_timeline_event", critical: false },
      { order: 3, module: "education-os", action: "trigger_intervention", critical: false },
      { order: 4, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // User registered → onboarding workflow
  // -------------------------------------------------------------------------
  {
    id: "user.registered",
    name: "User Registered Onboarding",
    description: "When a new user registers, create an interest profile, initialize a digital twin, seed default recommendations, and notify the education OS agent coordinator.",
    triggers: [USER_REGISTERED],
    participatingModules: [
      "digital-twins", "discovery", "education-os", "analytics",
    ],
    enabled: true,
    tags: ["user", "onboarding"],
    slaMs: 3_000,
    steps: [
      { order: 1, module: "digital-twins", action: "create_student_twin", critical: false },
      { order: 2, module: "discovery", action: "seed_recommendations", critical: false },
      { order: 3, module: "education-os", action: "notify_agents", critical: false },
      { order: 4, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Classroom created → twin + civilization
  // -------------------------------------------------------------------------
  {
    id: "classroom.created",
    name: "Classroom Created Cascade",
    description: "When a classroom is created, initialize a classroom digital twin, register the classroom with the civilization timeline, and notify the education OS.",
    triggers: [CLASSROOM_CREATED, STUDENT_JOINED_CLASS],
    participatingModules: [
      "digital-twins", "civilization-engine", "education-os", "analytics",
    ],
    enabled: true,
    tags: ["classroom"],
    slaMs: 2_000,
    steps: [
      { order: 1, module: "digital-twins", action: "sync_classroom_twin", critical: false },
      { order: 2, module: "civilization-engine", action: "record_timeline_event", critical: false },
      { order: 3, module: "education-os", action: "notify_agents", critical: false },
      { order: 4, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Listing published (marketplace) → recommendations + analytics
  // -------------------------------------------------------------------------
  {
    id: "listing.published",
    name: "Marketplace Listing Published",
    description: "When a marketplace listing is published, index it in discovery, refresh relevant recommendations, notify interested users, and update marketplace analytics.",
    triggers: [LISTING_PUBLISHED],
    participatingModules: ["marketplace", "discovery", "analytics"],
    enabled: true,
    tags: ["marketplace"],
    slaMs: 3_000,
    steps: [
      { order: 1, module: "discovery", action: "index_listing", critical: false },
      { order: 2, module: "discovery", action: "refresh_recommendations", critical: false },
      { order: 3, module: "marketplace", action: "notify_interested_users", critical: false },
      { order: 4, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Review created → marketplace intelligence + creator analytics
  // -------------------------------------------------------------------------
  {
    id: "review.created",
    name: "Review Created Cascade",
    description: "When a user leaves a review, update the listing's quality score, refresh marketplace intelligence, update creator analytics, and feed the platform-intelligence learning loop.",
    triggers: [REVIEW_CREATED],
    participatingModules: ["marketplace", "platform-intelligence", "analytics"],
    enabled: true,
    tags: ["review", "marketplace"],
    slaMs: 2_000,
    steps: [
      { order: 1, module: "marketplace", action: "update_quality_score", critical: false },
      { order: 2, module: "platform-intelligence", action: "record_feedback_event", critical: false },
      { order: 3, module: "analytics", action: "increment_metric", critical: false },
    ],
  },

  // -------------------------------------------------------------------------
  // Subscription started → billing + creator + analytics
  // -------------------------------------------------------------------------
  {
    id: "subscription.started",
    name: "Subscription Started Cascade",
    description: "When a subscription starts, credit the creator wallet, update creator analytics, notify the billing system, and record the event in the civilization timeline.",
    triggers: [SUBSCRIPTION_STARTED, INVOICE_PAID],
    participatingModules: [
      "billing", "creator-economy", "civilization-engine", "analytics",
    ],
    enabled: true,
    tags: ["billing", "subscription"],
    slaMs: 3_000,
    steps: [
      { order: 1, module: "billing", action: "record_invoice", critical: true },
      { order: 2, module: "creator-economy", action: "credit_wallet", critical: true },
      { order: 3, module: "creator-economy", action: "update_analytics", critical: false },
      { order: 4, module: "civilization-engine", action: "record_timeline_event", critical: false },
      { order: 5, module: "analytics", action: "increment_metric", critical: false },
    ],
  },
];

// ===========================================================================
// Registry API
// ===========================================================================

const registry = new Map<string, WorkflowDefinition>();
for (const w of BUILTIN_WORKFLOWS) registry.set(w.id, w);

export function listWorkflows(filter?: { enabledOnly?: boolean; tag?: string; module?: string }): WorkflowDefinition[] {
  let workflows = Array.from(registry.values());
  if (filter?.enabledOnly) workflows = workflows.filter(w => w.enabled);
  if (filter?.tag) workflows = workflows.filter(w => w.tags.includes(filter.tag!));
  if (filter?.module) workflows = workflows.filter(w => w.participatingModules.includes(filter.module!));
  return workflows.sort((a, b) => a.id.localeCompare(b.id));
}

export function getWorkflow(id: string): WorkflowDefinition | null {
  return registry.get(id) ?? null;
}

export function findWorkflowsForEvent(eventType: DomainEventType): WorkflowDefinition[] {
  return Array.from(registry.values()).filter(w => w.enabled && w.triggers.includes(eventType));
}

export function registerWorkflow(workflow: WorkflowDefinition): void {
  registry.set(workflow.id, workflow);
}

export function setWorkflowEnabled(id: string, enabled: boolean): boolean {
  const w = registry.get(id);
  if (!w) return false;
  registry.set(id, { ...w, enabled });
  return true;
}

export function workflowStats() {
  const all = Array.from(registry.values());
  return {
    total: all.length,
    enabled: all.filter(w => w.enabled).length,
    disabled: all.filter(w => !w.enabled).length,
    totalSteps: all.reduce((s, w) => s + w.steps.length, 0),
    participatingModules: Array.from(new Set(all.flatMap(w => w.participatingModules))).sort(),
    totalTriggers: Array.from(new Set(all.flatMap(w => w.triggers))).length,
  };
}

// ===========================================================================
// Execution helpers — used by event-orchestrator
// ===========================================================================

/** Build the initial step list for a fresh execution. */
export function buildExecutionSteps(workflow: WorkflowDefinition): WorkflowExecutionDto["steps"] {
  return workflow.steps.map(step => ({
    order: step.order,
    module: step.module,
    action: step.action,
    status: "pending" as const,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    error: null,
  }));
}

/** Check whether a workflow is internally well-formed. */
export function validateWorkflow(w: WorkflowDefinition): Array<{ field: string; issue: string }> {
  const issues: Array<{ field: string; issue: string }> = [];
  if (!w.id) issues.push({ field: "id", issue: "missing" });
  if (!w.name) issues.push({ field: "name", issue: "missing" });
  if (w.triggers.length === 0) issues.push({ field: "triggers", issue: "must have at least one trigger" });
  if (w.steps.length === 0) issues.push({ field: "steps", issue: "must have at least one step" });
  const orders = w.steps.map(s => s.order);
  if (orders.some((o, i) => orders.indexOf(o) !== i)) issues.push({ field: "steps", issue: "duplicate order values" });
  if (!Array.from(new Set(orders)).every(o => Number.isInteger(o) && o > 0)) {
    issues.push({ field: "steps", issue: "orders must be positive integers" });
  }
  return issues;
}
