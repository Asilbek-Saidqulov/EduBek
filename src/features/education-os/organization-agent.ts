/**
 * EduBek — Organization Agent.
 *
 * Phase 4F.6: Owns organization-domain tasks:
 *   • Organization analytics
 *   • Teacher performance
 *   • Department insights
 *   • Curriculum completion
 *
 * Composes existing services:
 *   • Phase 4F.4 Organization Intelligence
 *   • Phase 4F.5 Knowledge Health
 */
import { getLogger } from "@/lib/logger";
import {
  computeOrganizationInsight,
  getOrganizationInsight,
} from "@/features/collaboration";
import {
  computeKnowledgeHealth,
  getKnowledgeHealth,
} from "@/features/knowledge-intelligence";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("organization-agent");

export const ORGANIZATION_AGENT_DEFINITION: AgentDefinition = {
  type: "organization",
  name: "Organization Agent",
  description: "Owns organization analytics, teacher performance, department insights, and curriculum completion.",
  capabilities: [
    { code: "organization_analytics", name: "Organization Analytics", nameKey: "educationOs.org.capability.analytics", description: "Compute org-wide analytics snapshot." },
    { code: "teacher_performance", name: "Teacher Performance", nameKey: "educationOs.org.capability.teacherPerf", description: "Analyze teacher performance across classrooms." },
    { code: "department_insights", name: "Department Insights", nameKey: "educationOs.org.capability.deptInsights", description: "Generate per-department insights." },
    { code: "curriculum_completion", name: "Curriculum Completion", nameKey: "educationOs.org.capability.completion", description: "Track curriculum completion across the org." },
    { code: "knowledge_health", name: "Knowledge Health", nameKey: "educationOs.org.capability.health", description: "Compute org-wide knowledge health snapshot." },
  ],
  collaborators: ["analytics", "curriculum", "teacher"],
};

export async function executeOrganizationTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("organization.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "organization_analytics": {
        const { organizationId, refresh } = task.params as { organizationId: string; refresh?: boolean };
        const insight = refresh
          ? await computeOrganizationInsight(organizationId)
          : await getOrganizationInsight(organizationId) ?? await computeOrganizationInsight(organizationId);
        result = insight;
        reasoning = {
          confidence: 0.9,
          reasoning: `Computed organization analytics: ${insight.totalMembers} members (${insight.activeMembers} active), ${insight.teacherAnalytics.length} teachers, ${insight.classComparison.length} classrooms. AI usage: ${insight.aiUsage.totalSessions} sessions.`,
          reasoningKey: "educationOs.org.analytics.reasoning",
          sources: [{ type: "organization", id: organizationId, title: "Organization insight", relevance: 1.0 }],
          affectedModules: ["collaboration"],
          recommendedNextActions: [
            { code: "knowledge_health", description: "Compute knowledge health for the org", descriptionKey: "educationOs.org.nextAction.health", priority: 1 },
          ],
        };
        break;
      }
      case "teacher_performance": {
        const { organizationId } = task.params as { organizationId: string };
        const insight = await getOrganizationInsight(organizationId) ?? await computeOrganizationInsight(organizationId);
        const teachers = insight.teacherAnalytics.map((t) => ({
          teacherId: t.teacherId,
          name: t.name,
          classroomCount: t.classroomCount,
          studentCount: t.studentCount,
          avgMastery: t.avgMastery,
          performanceScore: t.avgMastery * 0.7 + (t.studentCount > 0 ? 0.3 : 0),
        })).sort((a, b) => b.performanceScore - a.performanceScore);
        result = { teachers, total: teachers.length };
        reasoning = {
          confidence: 0.85,
          reasoning: `Ranked ${teachers.length} teachers by performance (mastery × engagement). Top performer: ${teachers[0]?.name ?? "N/A"} (${teachers[0]?.classroomCount ?? 0} classrooms, ${Math.round((teachers[0]?.avgMastery ?? 0) * 100)}% avg mastery).`,
          reasoningKey: "educationOs.org.teacherPerf.reasoning",
          sources: teachers.slice(0, 3).map((t) => ({ type: "user" as const, id: t.teacherId, title: t.name ?? "Teacher", relevance: t.performanceScore })),
          affectedModules: ["collaboration"],
          recommendedNextActions: [],
        };
        break;
      }
      case "department_insights": {
        const { organizationId } = task.params as { organizationId: string };
        const insight = await getOrganizationInsight(organizationId) ?? await computeOrganizationInsight(organizationId);
        const departments = Object.entries(insight.departmentAnalytics).map(([dept, metrics]) => ({
          department: dept,
          ...metrics,
        }));
        result = { departments, total: departments.length };
        reasoning = {
          confidence: 0.8,
          reasoning: `Generated insights for ${departments.length} departments. Each department's metrics include student count, avg mastery, and engagement rate.`,
          reasoningKey: "educationOs.org.deptInsights.reasoning",
          sources: departments.slice(0, 3).map((d) => ({ type: "organization" as const, id: organizationId, title: `Department: ${d.department}`, relevance: d.avgMastery })),
          affectedModules: ["collaboration"],
          recommendedNextActions: [],
        };
        break;
      }
      case "curriculum_completion": {
        const { organizationId } = task.params as { organizationId: string };
        const health = await getKnowledgeHealth(organizationId) ?? await computeKnowledgeHealth(organizationId);
        result = {
          curriculumCompleteness: health.curriculumCompleteness,
          coverageScore: health.coverageScore,
          masteryDistribution: health.masteryDistribution,
        };
        reasoning = {
          confidence: 0.9,
          reasoning: `Curriculum completion: ${Math.round(health.curriculumCompleteness * 100)}%. Coverage score: ${Math.round(health.coverageScore * 100)}%. Mastery distribution: ${health.masteryDistribution.mastered} mastered, ${health.masteryDistribution.learning} learning, ${health.masteryDistribution.weak} weak.`,
          reasoningKey: "educationOs.org.completion.reasoning",
          sources: [{ type: "organization", id: organizationId, title: "Knowledge health snapshot", relevance: 1.0 }],
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: [
            { code: "coverage_gaps", description: "Drill into coverage gaps", descriptionKey: "educationOs.org.nextAction.coverageGaps", priority: 1 },
          ],
        };
        break;
      }
      case "knowledge_health": {
        const { organizationId, refresh } = task.params as { organizationId: string; refresh?: boolean };
        const health = refresh
          ? await computeKnowledgeHealth(organizationId)
          : await getKnowledgeHealth(organizationId) ?? await computeKnowledgeHealth(organizationId);
        result = health;
        reasoning = {
          confidence: 0.9,
          reasoning: `Knowledge health — Coverage: ${Math.round(health.coverageScore * 100)}%. Quality: ${Math.round(health.qualityScore * 100)}%. Graph density: ${Math.round(health.graphDensity * 100)}%. AI readiness: ${Math.round(health.aiReadiness * 100)}%. Resource freshness: ${Math.round(health.resourceFreshness * 100)}%.`,
          reasoningKey: "educationOs.org.health.reasoning",
          sources: [{ type: "organization", id: organizationId, title: "Knowledge health snapshot", relevance: 1.0 }],
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: [
            { code: "curriculum_completion", description: "View curriculum completion breakdown", descriptionKey: "educationOs.org.nextAction.completion", priority: 1 },
          ],
        };
        break;
      }
      default:
        throw new Error(`Unknown organization task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "system",
      scopeId: "organization-agent",
      type: "action",
      summary: `Organization agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.6,
      agentType: "organization",
    });

    const executionMs = Date.now() - start;
    log.info("organization.task_completed", { task: task.code, executionMs });
    return {
      agentType: "organization" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("organization.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "organization" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
