/**
 * EduBek — Student Agent.
 *
 * Phase 4F.6: Owns student-domain tasks:
 *   • Personalized study
 *   • Next-step planning
 *   • Motivation
 *   • Review scheduling
 *   • Spaced repetition
 *   • Burnout prevention
 *
 * Composes existing services:
 *   • Phase 4F.3 Learning Planner (study plan, daily agenda, AI coach)
 *   • Phase 4F.2 Semantic Search (recommendations, interest profiles)
 *   • Phase 4F.3 Spaced Repetition + Burnout Detection
 */
import { getLogger } from "@/lib/logger";
import {
  getDailyAgenda,
  detectBurnout,
  computeStreakIntelligence,
  listDueReviews,
  generateCoachRecommendations,
} from "@/features/learning-planner";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("student-agent");

export const STUDENT_AGENT_DEFINITION: AgentDefinition = {
  type: "student",
  name: "Student Agent",
  description: "Owns personalized study, next-step planning, motivation, review scheduling, spaced repetition, and burnout prevention.",
  capabilities: [
    { code: "personalized_study", name: "Personalized Study", nameKey: "educationOs.student.capability.personalizedStudy", description: "Recommend a personalized study session." },
    { code: "next_step_planning", name: "Next Step Planning", nameKey: "educationOs.student.capability.nextStep", description: "Recommend the next best learning action." },
    { code: "motivation", name: "Motivation", nameKey: "educationOs.student.capability.motivation", description: "Generate motivational messages based on streaks and progress." },
    { code: "review_scheduling", name: "Review Scheduling", nameKey: "educationOs.student.capability.reviewScheduling", description: "Schedule spaced-repetition reviews." },
    { code: "burnout_prevention", name: "Burnout Prevention", nameKey: "educationOs.student.capability.burnout", description: "Detect burnout and suggest breaks / lighter content." },
  ],
  collaborators: ["planner", "curriculum", "assessment", "notification"],
};

export async function executeStudentTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("student.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "personalized_study":
      case "next_step_planning": {
        const { userId } = task.params as { userId: string };
        const agenda = await getDailyAgenda(userId, task.locale ?? "en");
        // Compose next-steps from the agenda items + AI Coach recommendations
        const coachRecs = await generateCoachRecommendations({
          userId,
          locale: task.locale ?? "en",
          limit: 5,
        });
        result = {
          agenda,
          nextSteps: agenda.items.slice(0, 3),
          coachRecommendations: coachRecs,
        };
        reasoning = {
          confidence: 0.85,
          reasoning: `Generated a daily agenda with ${agenda.items.length} items and ${coachRecs.length} AI coach recommendations. Energy estimate: ${agenda.energyEstimate}/5. Study minutes remaining: ${agenda.studyMinutesRemaining}.`,
          reasoningKey: "educationOs.student.personalizedStudy.reasoning",
          sources: [{ type: "user", id: userId, title: "User learning profile", relevance: 1.0 }],
          affectedModules: ["learning-planner", "semantic-search", "knowledge-intelligence"],
          recommendedNextActions: [
            { code: "review_scheduling", description: "Schedule reviews for weak topics", descriptionKey: "educationOs.student.nextAction.scheduleReviews", priority: 1 },
          ],
        };
        break;
      }
      case "motivation": {
        const { userId } = task.params as { userId: string };
        const streak = await computeStreakIntelligence(userId);
        const message = streak.dayStreak >= 7
          ? `🔥 You're on a ${streak.dayStreak}-day streak! Keep going!`
          : streak.dayStreak >= 3
            ? `Great work — ${streak.dayStreak} days in a row. Aim for 7!`
            : `Welcome back! Start a 5-minute session today to build a streak.`;
        result = { message, streak, motivationalLevel: streak.dayStreak >= 7 ? "high" : streak.dayStreak >= 3 ? "medium" : "low" };
        reasoning = {
          confidence: 0.75,
          reasoning: `Generated motivational message based on ${streak.dayStreak}-day streak. Quality streak: ${streak.qualityStreak}. Effective streak: ${streak.effectiveStreak}.`,
          reasoningKey: "educationOs.student.motivation.reasoning",
          sources: [{ type: "user", id: userId, title: "User streak intelligence", relevance: 1.0 }],
          affectedModules: ["learning-planner"],
          recommendedNextActions: [
            { code: "personalized_study", description: "Start today's study session", descriptionKey: "educationOs.student.nextAction.startStudy", priority: 1 },
          ],
        };
        break;
      }
      case "review_scheduling": {
        const { userId } = task.params as { userId: string };
        const dueReviews = await listDueReviews(userId, 50);
        result = { dueReviews, totalDue: dueReviews.length };
        reasoning = {
          confidence: 0.9,
          reasoning: `Found ${dueReviews.length} due reviews. The student should complete these before starting new material — spaced repetition is most effective when reviews are done on schedule.`,
          reasoningKey: "educationOs.student.reviewScheduling.reasoning",
          sources: dueReviews.slice(0, 3).map((r) => ({
            type: "concept" as const,
            id: r.entityId,
            title: `${r.entityType}:${r.entityId}`,
            relevance: 1 - r.forgettingScore,
          })),
          affectedModules: ["learning-planner", "semantic-search"],
          recommendedNextActions: [
            { code: "personalized_study", description: "Start with the most urgent review", descriptionKey: "educationOs.student.nextAction.urgentReview", priority: 1 },
          ],
        };
        break;
      }
      case "burnout_prevention": {
        const { userId } = task.params as { userId: string };
        const burnout = await detectBurnout(userId);
        const coachRecs = await generateCoachRecommendations({
          userId,
          locale: task.locale ?? "en",
          burnout,
          limit: 5,
        });
        result = { burnout, recommendations: coachRecs };
        reasoning = {
          confidence: 0.85,
          reasoning: `Burnout severity: ${burnout.severity}. ${burnout.factors.filter((f) => f.triggered).length} of ${burnout.factors.length} factors triggered. ${burnout.recommendations.length} recommendations generated.`,
          reasoningKey: "educationOs.student.burnoutPrevention.reasoning",
          sources: [{ type: "user", id: userId, title: "Burnout analysis", relevance: 1.0 }],
          affectedModules: ["learning-planner", "collaboration"],
          recommendedNextActions: burnout.isBurnout
            ? [{ code: "take_break", description: "Take a 15-minute break now", descriptionKey: "educationOs.student.nextAction.takeBreak", priority: 1 }]
            : [{ code: "personalized_study", description: "Continue with today's plan", descriptionKey: "educationOs.student.nextAction.continue", priority: 2 }],
        };
        break;
      }
      default:
        throw new Error(`Unknown student task: ${task.code}`);
    }

    // Store memory
    await storeMemory({
      scopeType: "user",
      scopeId: (task.params as { userId: string }).userId,
      type: "action",
      summary: `Student agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.6,
      agentType: "student",
    });

    const executionMs = Date.now() - start;
    log.info("student.task_completed", { task: task.code, executionMs });
    return {
      agentType: "student" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("student.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "student" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
