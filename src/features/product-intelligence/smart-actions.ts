/**
 * EduBek — Smart Actions.
 *
 * Phase 5D.5 System 6: Every page automatically generates contextual
 * actions. Actions are derived from entity type + user role + current
 * state — no hardcoding. The system inspects the entity, calls the
 * relevant generators, and returns a prioritized action set.
 *
 * Example: an assessment page generates actions like:
 *   • Generate remediation
 *   • Notify weak students
 *   • Schedule review
 *   • Generate homework
 *   • Recommend resources
 *   • Create discussion
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import type { SmartAction, SmartActionSet } from "./types";

const log = getLogger("smart-actions");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateActions(input: {
  userId: string;
  roles: string[];
  entityType: string;
  entityId?: string;
  organizationId?: string | null;
}): Promise<SmartActionSet> {
  const { userId, roles, entityType, entityId, organizationId } = input;
  const isTeacher = roles.some(r => r.toLowerCase().includes("teacher"));
  const isStudent = roles.some(r => r.toLowerCase().includes("student"));
  const isAdmin = roles.some(r => r.toLowerCase().includes("admin") || r.toLowerCase().includes("superadmin"));

  const generators: Array<(entityId?: string) => Promise<SmartAction[]>> = [];
  switch (entityType) {
    case "assessment":
    case "quiz":
      generators.push(...assessmentGenerators(isTeacher, isStudent, isAdmin));
      break;
    case "lesson":
    case "resource":
      generators.push(...resourceGenerators(isTeacher, isStudent, isAdmin));
      break;
    case "classroom":
      generators.push(...classroomGenerators(isTeacher, isAdmin));
      break;
    case "student":
      generators.push(...studentGenerators(isTeacher, isAdmin));
      break;
    case "discussion":
      generators.push(...discussionGenerators(isTeacher, isStudent));
      break;
    case "organization":
      generators.push(...organizationGenerators(isAdmin));
      break;
    case "marketplace_listing":
      generators.push(...marketplaceGenerators(isTeacher, isAdmin));
      break;
    default:
      generators.push(...genericGenerators(isTeacher, isStudent, isAdmin));
  }
  const allActions: SmartAction[] = [];
  for (const gen of generators) {
    try {
      const actions = await gen(entityId);
      allActions.push(...actions);
    } catch (err) {
      log.warn("smart_actions.generator_failed", { entityType, error: (err as Error).message });
    }
  }
  // Deduplicate by label, then sort by priority desc
  const seen = new Set<string>();
  const deduped = allActions.filter(a => {
    if (seen.has(a.label)) return false;
    seen.add(a.label);
    return true;
  });
  deduped.sort((a, b) => b.priority - a.priority);
  log.info("smart_actions.generated", { entityType, total: deduped.length });
  return {
    entityType,
    entityId,
    actions: deduped,
    total: deduped.length,
  };
}

// ===========================================================================
// Generators — each returns actions for a specific entity type
// ===========================================================================

function assessmentGenerators(isTeacher: boolean, isStudent: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (entityId) => {
      if (!isTeacher) return [];
      const actions: SmartAction[] = [
        makeAction("generate_remediation", "Generate remediation", "Create a remediation plan for students who scored below threshold.", "sparkles", "generate", "assessment-platform", `/api/assessments/${entityId}/remediation`, 90, "assessment.grade", true, 3),
        makeAction("notify_weak_students", "Notify weak students", "Send personalized messages to students who need extra help.", "bell", "notify", "education-os", `/api/assessments/${entityId}/notify`, 75, "assessment.grade", false, 1),
        makeAction("schedule_review", "Schedule review session", "Create a calendar event to review the assessment in class.", "calendar", "schedule", "digital-twins", `/api/calendar/schedule`, 65, "assessment.grade", false, 2),
        makeAction("generate_homework", "Generate homework", "Create follow-up homework based on weak topics.", "book", "generate", "assessment-platform", `/api/assessments/${entityId}/homework`, 80, "content.create", true, 4),
        makeAction("recommend_resources", "Recommend resources", "Suggest additional learning resources for the class.", "lightbulb", "recommend", "discovery", `/api/recommendations`, 60, "content.create", true, 2),
        makeAction("create_discussion", "Create discussion", "Open a class discussion thread for this assessment.", "message", "create", "collaboration", `/api/discussions`, 50, "content.create", false, 1),
      ];
      return actions;
    },
    async (_entityId) => {
      if (!isStudent) return [];
      return [
        makeAction("review_mistakes", "Review my mistakes", "Go through the questions you missed and see explanations.", "eye", "navigate", "assessment-platform", undefined, 85, undefined, true, 5),
        makeAction("practice_similar", "Practice similar questions", "Generate a practice quiz with similar questions.", "sparkles", "generate", "assessment-platform", undefined, 75, undefined, true, 4),
        makeAction("ask_tutor", "Ask AI tutor", "Get a personalized explanation of any confusing question.", "message", "generate", "learning-studio", undefined, 70, "ai.use", true, 3),
      ];
    },
  ];
}

function resourceGenerators(isTeacher: boolean, _isStudent: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      if (!isTeacher) return [];
      return [
        makeAction("assign_to_class", "Assign to class", "Assign this resource to one of your classrooms.", "check", "create", "classroom", undefined, 85, "assignment.publish", false, 2),
        makeAction("publish_to_marketplace", "Publish to marketplace", "List this resource on the marketplace for other educators.", "store", "create", "marketplace", undefined, 70, "marketplace.publish", false, 5),
        makeAction("translate", "Translate", "Generate translations for other supported languages.", "globe", "generate", "ai-workspace", undefined, 60, "ai.use", true, 3),
        makeAction("generate_quiz", "Generate quiz", "Create an assessment from this resource.", "sparkles", "generate", "assessment-platform", undefined, 80, "content.create", true, 4),
        makeAction("improve_with_ai", "Improve with AI", "Get AI suggestions to improve the resource.", "sparkles", "generate", "ai-workspace", undefined, 65, "ai.use", true, 3),
      ];
    },
  ];
}

function classroomGenerators(isTeacher: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (entityId) => {
      if (!isTeacher || !entityId) return [];
      // Fetch at-risk count for context-aware action labels.
      // ConceptMastery has `userId` directly — we count students in the classroom
      // who have any low-mastery concept.
      let atRiskCount = 0;
      try {
        const students = await db.classroomStudent.findMany({
          where: { classroomId: entityId, status: "active" },
          select: { studentId: true },
        });
        if (students.length > 0) {
          const atRisk = await db.conceptMastery.groupBy({
            by: ["userId"],
            where: { userId: { in: students.map(s => s.studentId) }, mastery: { lt: 0.4 } },
            _count: { _all: true },
          });
          atRiskCount = atRisk.length;
        }
      } catch { /* noop */ }
      return [
        makeAction("view_at_risk", `View at-risk students (${atRiskCount})`, "See which students need extra help.", "alert", "navigate", "digital-twins", `/classroom/${entityId}/at-risk`, 90, undefined, false, 1),
        makeAction("generate_lesson", "Generate next lesson", "Use AI to draft the next lesson based on curriculum progress.", "sparkles", "generate", "ai-workspace", `/api/classrooms/${entityId}/generate-lesson`, 80, "ai.use", true, 5),
        makeAction("schedule_exam", "Schedule exam", "Create a new assessment for this classroom.", "calendar", "create", "assessment-platform", `/assessments/new?classroom=${entityId}`, 70, "assessment.publish", false, 3),
        makeAction("view_analytics", "View classroom analytics", "See engagement, mastery, and performance trends.", "chart", "navigate", "analytics", `/classroom/${entityId}/analytics`, 60, undefined, false, 1),
      ];
    },
  ];
}

function studentGenerators(isTeacher: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      if (!isTeacher) return [];
      return [
        makeAction("generate_learning_plan", "Generate learning plan", "Create a personalized plan based on this student's mastery.", "sparkles", "generate", "learning-planner", undefined, 85, "ai.use", true, 4),
        makeAction("schedule_mentorship", "Schedule mentorship", "Book a 1:1 mentorship session.", "calendar", "schedule", "education-os", undefined, 70, undefined, false, 2),
        makeAction("assign_resources", "Assign resources", "Recommend specific resources for this student.", "book", "recommend", "discovery", undefined, 65, "content.create", false, 2),
      ];
    },
  ];
}

function discussionGenerators(_isTeacher: boolean, _isStudent: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      return [
        makeAction("summarize_thread", "Summarize thread", "Get an AI summary of the discussion so far.", "sparkles", "analyze", "ai-workspace", undefined, 70, "ai.use", true, 1),
        makeAction("mark_as_answered", "Mark as answered", "Mark this discussion as resolved.", "check", "create", "collaboration", undefined, 60, undefined, false, 1),
      ];
    },
  ];
}

function organizationGenerators(isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      if (!isAdmin) return [];
      return [
        makeAction("run_strategic_analysis", "Run strategic analysis", "Use the Civilization Engine to analyze the organization's trajectory.", "sparkles", "analyze", "civilization-engine", undefined, 90, "ai.use", true, 10),
        makeAction("review_policies", "Review policies", "See active educational policies and propose updates.", "gavel", "navigate", "civilization-engine", undefined, 70, undefined, false, 2),
        makeAction("benchmark_peers", "Benchmark against peers", "Compare your organization to similar institutions.", "chart", "analyze", "global-intelligence", undefined, 75, undefined, true, 5),
      ];
    },
  ];
}

function marketplaceGenerators(_isTeacher: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      return [
        makeAction("optimize_pricing", "Optimize pricing", "Get AI suggestions for the optimal price.", "sparkles", "analyze", "marketplace", undefined, 80, "ai.use", true, 3),
        makeAction("boost_listing", "Boost listing", "Promote this listing for higher visibility.", "rocket", "create", "marketplace", undefined, 70, undefined, false, 1),
        makeAction("view_analytics", "View sales analytics", "See sales trends and revenue.", "chart", "navigate", "analytics", undefined, 65, undefined, false, 1),
      ];
    },
  ];
}

function genericGenerators(_isTeacher: boolean, _isStudent: boolean, _isAdmin: boolean): Array<(entityId?: string) => Promise<SmartAction[]>> {
  return [
    async (_entityId) => {
      return [
        makeAction("ask_ai", "Ask AI", "Get AI help with the current page.", "sparkles", "generate", "ai-workspace", undefined, 60, "ai.use", true, 2),
        makeAction("share", "Share", "Share this with colleagues or students.", "share", "create", "collaboration", undefined, 40, undefined, false, 1),
        makeAction("bookmark", "Bookmark", "Save this for later.", "bookmark", "create", "discovery", undefined, 30, undefined, false, 1),
      ];
    },
  ];
}

// ===========================================================================
// Helpers
// ===========================================================================

function makeAction(
  id: string, label: string, description: string, icon: string,
  category: SmartAction["category"], module: string, url: string | undefined,
  priority: number, requiredPermission: string | undefined, aiAssisted: boolean,
  estimatedMinutes: number,
): SmartAction {
  return {
    id, label, description, icon, category, module, url, priority,
    requiredPermission, aiAssisted, estimatedMinutes,
  };
}
