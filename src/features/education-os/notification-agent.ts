/**
 * EduBek — Notification Agent.
 *
 * Phase 4F.6: Generates intelligent notifications for:
 *   • Teachers ("Students are struggling with Algebra", "Intervention available")
 *   • Students ("Review Newton's Laws today", "You're on a 7-day streak!")
 *   • Marketplace ("A better worksheet is available")
 *   • Organizations ("Curriculum coverage dropped below 82%")
 *
 * Composes existing services:
 *   • Phase 4E Notification infrastructure (notificationService)
 *   • Phase 4F.3 Learning Planner (streaks, burnout)
 *   • Phase 4F.4 Collaboration (classroom intelligence)
 *   • Phase 4F.5 Knowledge Intelligence (coverage changes)
 */
import { getLogger } from "@/lib/logger";
import { notificationService } from "@/infra/notifications";
import { computeStreakIntelligence, detectBurnout, listDueReviews } from "@/features/learning-planner";
import { computeClassInsight } from "@/features/collaboration";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("notification-agent");

export const NOTIFICATION_AGENT_DEFINITION: AgentDefinition = {
  type: "notification",
  name: "Notification Agent",
  description: "Generates intelligent notifications for teachers, students, marketplace, and organizations.",
  capabilities: [
    { code: "teacher_notifications", name: "Teacher Notifications", nameKey: "educationOs.notification.capability.teacher", description: "Generate notifications for teachers about struggling students / interventions." },
    { code: "student_notifications", name: "Student Notifications", nameKey: "educationOs.notification.capability.student", description: "Generate notifications for students about reviews, streaks, motivation." },
    { code: "marketplace_notifications", name: "Marketplace Notifications", nameKey: "educationOs.notification.capability.marketplace", description: "Generate notifications about better marketplace resources." },
    { code: "organization_notifications", name: "Organization Notifications", nameKey: "educationOs.notification.capability.organization", description: "Generate notifications about coverage / engagement changes." },
  ],
  collaborators: ["teacher", "student", "marketplace", "organization"],
};

export async function executeNotificationTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("notification.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];
    let notificationsSent = 0;

    switch (task.code) {
      case "teacher_notifications": {
        const { teacherId, classroomId } = task.params as { teacherId: string; classroomId: string };
        const insight = await computeClassInsight(classroomId).catch(() => null);
        if (insight && insight.atRiskStudents.length > 0) {
          await notificationService.send({
            userId: teacherId,
            type: "education_os.teacher.at_risk_students",
            title: `${insight.atRiskStudents.length} students at risk in your classroom`,
            body: `${insight.atRiskStudents.length} students are showing risk signals (low accuracy, low engagement, missed assignments). Suggested interventions are available.`,
            data: { classroomId, atRiskCount: insight.atRiskStudents.length },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        if (insight && insight.weakTopics.length > 0) {
          await notificationService.send({
            userId: teacherId,
            type: "education_os.teacher.weak_topics",
            title: `${insight.weakTopics.length} weak topics detected`,
            body: `Students are struggling with: ${insight.weakTopics.slice(0, 3).map((t) => t.topic).join(", ")}. Consider a review session.`,
            data: { classroomId, weakTopics: insight.weakTopics.slice(0, 5) },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        result = { notificationsSent, classroomInsight: insight };
        reasoning = {
          confidence: 0.85,
          reasoning: `Sent ${notificationsSent} notifications to teacher ${teacherId} about classroom ${classroomId}: at-risk students + weak topics.`,
          reasoningKey: "educationOs.notification.teacher.reasoning",
          sources: [{ type: "classroom", id: classroomId, title: "Classroom intelligence", relevance: 1.0 }],
          affectedModules: ["collaboration", "notifications"],
          recommendedNextActions: [
            { code: "intervention_suggestions", description: "Generate interventions for the at-risk students", priority: 1 },
          ],
        };
        break;
      }
      case "student_notifications": {
        const { userId } = task.params as { userId: string };
        const [streak, burnout, dueReviews] = await Promise.all([
          computeStreakIntelligence(userId),
          detectBurnout(userId),
          listDueReviews(userId, 10),
        ]);

        // Streak notification
        if (streak.dayStreak >= 7) {
          await notificationService.send({
            userId,
            type: "education_os.student.streak",
            title: `🔥 ${streak.dayStreak}-day streak!`,
            body: `You're on a ${streak.dayStreak}-day learning streak. Keep it up!`,
            data: { streak: streak.dayStreak },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        // Due reviews notification
        if (dueReviews.length > 0) {
          await notificationService.send({
            userId,
            type: "education_os.student.reviews_due",
            title: `${dueReviews.length} reviews due`,
            body: `You have ${dueReviews.length} spaced-repetition reviews due. Complete them to retain what you've learned.`,
            data: { reviewCount: dueReviews.length },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        // Burnout notification
        if (burnout.isBurnout) {
          await notificationService.send({
            userId,
            type: "education_os.student.burnout",
            title: "Time for a break?",
            body: `You've been studying intensely. Consider a 15-minute break or lighter content today.`,
            data: { severity: burnout.severity },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        result = { notificationsSent, streak, burnout, dueReviewsCount: dueReviews.length };
        reasoning = {
          confidence: 0.85,
          reasoning: `Sent ${notificationsSent} notifications to student ${userId}: streak (${streak.dayStreak} days), ${dueReviews.length} reviews due, burnout severity: ${burnout.severity}.`,
          reasoningKey: "educationOs.notification.student.reasoning",
          sources: [{ type: "user", id: userId, title: "Student learning state", relevance: 1.0 }],
          affectedModules: ["learning-planner", "notifications"],
          recommendedNextActions: [],
        };
        break;
      }
      case "marketplace_notifications": {
        const { userId, topic } = task.params as { userId: string; topic: string };
        const { search } = await import("@/features/discovery");
        const results = await search({
          query: topic,
          isMarketplace: true,
          page: 1,
          pageSize: 1,
        });
        if (results.results.length > 0) {
          const top = results.results[0]!;
          await notificationService.send({
            userId,
            type: "education_os.marketplace.better_resource",
            title: `A marketplace resource for ${topic} is available`,
            body: `"${top.title}" might help with your study of ${topic}. Quality: ${Math.round(top.quality * 100)}%.`,
            data: { resourceId: top.entityId, topic },
          }).catch(() => undefined);
          notificationsSent += 1;
        }
        result = { notificationsSent, topResult: results.results[0] ?? null };
        reasoning = {
          confidence: 0.7,
          reasoning: `Searched marketplace for "${topic}" and ${notificationsSent > 0 ? "sent a notification about a matching resource" : "found no matching resources"}.`,
          reasoningKey: "educationOs.notification.marketplace.reasoning",
          sources: results.results.slice(0, 1).map((r) => ({ type: "resource" as const, id: r.entityId, title: r.title, relevance: r.score })),
          affectedModules: ["discovery", "marketplace", "notifications"],
          recommendedNextActions: [],
        };
        break;
      }
      case "organization_notifications": {
        const { organizationId, threshold = 0.82 } = task.params as { organizationId: string; threshold?: number };
        const { getKnowledgeHealth } = await import("@/features/knowledge-intelligence");
        const health = await getKnowledgeHealth(organizationId);
        if (health && health.coverageScore < threshold) {
          // Notify all org admins (best-effort)
          const { db } = await import("@/lib/db");
          const admins = await db.organizationMembership.findMany({
            where: { orgId: organizationId, status: "active" },
            select: { userId: true },
          }).catch(() => []);
          for (const admin of admins) {
            await notificationService.send({
              userId: admin.userId,
              type: "education_os.organization.coverage_dropped",
              title: `Curriculum coverage dropped below ${Math.round(threshold * 100)}%`,
              body: `Organization coverage is currently ${Math.round(health.coverageScore * 100)}%. Review the curriculum gaps dashboard for details.`,
              data: { organizationId, coverageScore: health.coverageScore },
            }).catch(() => undefined);
            notificationsSent += 1;
          }
        }
        result = { notificationsSent, coverageScore: health?.coverageScore ?? null };
        reasoning = {
          confidence: 0.85,
          reasoning: `Checked organization ${organizationId} coverage (${Math.round((health?.coverageScore ?? 0) * 100)}%) against threshold (${Math.round(threshold * 100)}%). Sent ${notificationsSent} notifications.`,
          reasoningKey: "educationOs.notification.organization.reasoning",
          sources: [{ type: "organization", id: organizationId, title: "Knowledge health snapshot", relevance: 1.0 }],
          affectedModules: ["knowledge-intelligence", "notifications"],
          recommendedNextActions: [],
        };
        break;
      }
      default:
        throw new Error(`Unknown notification task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "system",
      scopeId: "notification-agent",
      type: "action",
      summary: `Notification agent executed task: ${task.code} (${notificationsSent} sent)`,
      payload: { task: task.code, notificationsSent },
      importance: 0.6,
      agentType: "notification",
    });

    const executionMs = Date.now() - start;
    log.info("notification.task_completed", { task: task.code, executionMs, notificationsSent });
    return {
      agentType: "notification" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("notification.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "notification" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
