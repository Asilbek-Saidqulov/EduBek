/**
 * EduBek — Planner Agent.
 *
 * Phase 4F.6: Owns long-term + weekly + daily planning tasks:
 *   • Long-term learning plans (goal → multi-week plan)
 *   • Weekly plans (this week's sessions)
 *   • Daily agendas (today's tasks)
 *
 * Composes existing services:
 *   • Phase 4F.3 Learning Planner (createStudyPlan, getDailyAgenda, estimateCompletion)
 *   • Phase 4F.3 Spaced Repetition (review scheduling)
 */
import { getLogger } from "@/lib/logger";
import {
  createStudyPlan,
  getDailyAgenda,
  estimateCompletion,
  generateWeeklyReport,
} from "@/features/learning-planner";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("planner-agent");

export const PLANNER_AGENT_DEFINITION: AgentDefinition = {
  type: "planner",
  name: "Planner Agent",
  description: "Owns long-term learning plans, weekly plans, and daily agendas.",
  capabilities: [
    { code: "long_term_plan", name: "Long-Term Plan", nameKey: "educationOs.planner.capability.longTerm", description: "Generate a multi-week study plan for a long-term goal." },
    { code: "weekly_plan", name: "Weekly Plan", nameKey: "educationOs.planner.capability.weekly", description: "Generate this week's learning plan." },
    { code: "daily_agenda", name: "Daily Agenda", nameKey: "educationOs.planner.capability.daily", description: "Generate today's learning agenda." },
    { code: "estimate_completion", name: "Estimate Completion", nameKey: "educationOs.planner.capability.estimate", description: "Estimate when a plan will be completed." },
    { code: "weekly_report", name: "Weekly Report", nameKey: "educationOs.planner.capability.report", description: "Generate a weekly progress report." },
  ],
  collaborators: ["student", "teacher", "assessment", "notification"],
};

export async function executePlannerTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("planner.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "long_term_plan": {
        const { userId, title, dailyMinutes, targetDate, goalId } = task.params as any;
        const plan = await createStudyPlan({
          userId,
          goalId,
          title,
          dailyMinutes,
          targetDate,
          startingDifficulty: "medium",
          locale: task.locale ?? "en",
        });
        result = plan;
        reasoning = {
          confidence: 0.85,
          reasoning: `Generated long-term study plan with ${plan.items?.length ?? 0} items spanning ${plan.metadata.weeklySchedule?.length ?? 0} weeks. Estimated total: ${plan.metadata.estimatedTotalMinutes ?? 0} minutes.`,
          reasoningKey: "educationOs.planner.longTerm.reasoning",
          sources: [{ type: "user", id: userId, title: "User learning profile", relevance: 1.0 }],
          affectedModules: ["learning-planner", "knowledge-intelligence", "knowledge-graph"],
          recommendedNextActions: [
            { code: "daily_agenda", description: "Get today's agenda from the plan", priority: 1 },
          ],
        };
        break;
      }
      case "weekly_plan": {
        const { userId } = task.params as { userId: string };
        const report = await generateWeeklyReport(userId, task.locale ?? "en");
        result = report;
        reasoning = {
          confidence: 0.85,
          reasoning: `Generated weekly report: ${report.topicsLearned.length} topics learned, ${Math.round(report.timeSpentMs / 60_000)} min studied, ${report.recommendations.length} recommendations for next week.`,
          reasoningKey: "educationOs.planner.weekly.reasoning",
          sources: [{ type: "user", id: userId, title: "Weekly report", relevance: 1.0 }],
          affectedModules: ["learning-planner"],
          recommendedNextActions: [
            { code: "long_term_plan", description: "Adjust long-term plan based on weekly progress", priority: 1 },
          ],
        };
        break;
      }
      case "daily_agenda": {
        const { userId } = task.params as { userId: string };
        const agenda = await getDailyAgenda(userId, task.locale ?? "en");
        result = agenda;
        reasoning = {
          confidence: 0.9,
          reasoning: `Generated daily agenda with ${agenda.items.length} items. ${agenda.reviewsDue} reviews due. ${agenda.studyMinutesRemaining} minutes remaining today. Energy: ${agenda.energyEstimate}/5.`,
          reasoningKey: "educationOs.planner.daily.reasoning",
          sources: [{ type: "user", id: userId, title: "Daily agenda", relevance: 1.0 }],
          affectedModules: ["learning-planner", "semantic-search"],
          recommendedNextActions: [
            { code: "personalized_study", description: "Start the top-priority agenda item", priority: 1 },
          ],
        };
        break;
      }
      case "estimate_completion": {
        const { planId } = task.params as { planId: string };
        const estimate = await estimateCompletion(planId);
        result = estimate;
        reasoning = {
          confidence: estimate.confidence,
          reasoning: `Estimated completion: ${estimate.estimatedFinishDate} (${estimate.daysRemaining} days at ${estimate.velocity} min/day). ${estimate.remainingMinutes} minutes of content remaining.`,
          reasoningKey: "educationOs.planner.estimate.reasoning",
          sources: [{ type: "classroom", id: planId, title: "Plan estimate", relevance: 1.0 }],
          affectedModules: ["learning-planner"],
          recommendedNextActions: [],
        };
        break;
      }
      case "weekly_report": {
        const { userId } = task.params as { userId: string };
        const report = await generateWeeklyReport(userId, task.locale ?? "en");
        result = report;
        reasoning = {
          confidence: 0.85,
          reasoning: `Generated weekly report covering ${report.topicsLearned.length} topics, ${Math.round(report.timeSpentMs / 60_000)} minutes studied, ${report.milestonesThisWeek.length} milestones achieved.`,
          reasoningKey: "educationOs.planner.report.reasoning",
          sources: [{ type: "user", id: userId, title: "Weekly report", relevance: 1.0 }],
          affectedModules: ["learning-planner"],
          recommendedNextActions: [],
        };
        break;
      }
      default:
        throw new Error(`Unknown planner task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "user",
      scopeId: (task.params as { userId?: string }).userId ?? "system",
      type: "action",
      summary: `Planner agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.6,
      agentType: "planner",
    });

    const executionMs = Date.now() - start;
    log.info("planner.task_completed", { task: task.code, executionMs });
    return {
      agentType: "planner" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("planner.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "planner" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
