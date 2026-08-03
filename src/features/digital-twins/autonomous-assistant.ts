/**
 * EduBek — Autonomous Classroom Assistant.
 *
 * Phase 5A.1: Instead of asking for individual tasks, teachers say:
 *   "Prepare next week's lessons."
 *
 * The assistant autonomously:
 *   1. Checks the academic calendar for upcoming events + holidays
 *   2. Finds unfinished curriculum standards (Phase 4F.5)
 *   3. Generates lessons for missing standards (Phase 4A AI Workspace)
 *   4. Prepares quizzes (Phase 4F.5 Assessment Agent)
 *   5. Prepares homework assignments (Phase 4F.4 Teacher Agent)
 *   6. Schedules reviews (Phase 4F.3 Learning Planner)
 *   7. Recommends marketplace resources (Phase 4F.6 Marketplace Agent)
 *   8. Prepares announcements (Phase 4F.4 Notification Agent)
 *
 * All via the Education OS agent coordinator (Phase 4F.6).
 */
import { getLogger } from "@/lib/logger";
import { execute as coordinatorExecute } from "@/features/education-os/coordinator";
import { getUpcomingEventsForScope, getHolidaysInRange, isWorkingDay } from "./calendar-engine";
import { syncClassroomTwin } from "./classroom-twin";
import type { AcademicWorkflowStep } from "./types";

const log = getLogger("autonomous-assistant");

// ---------------------------------------------------------------------------
// Main entry point: "Prepare next week's lessons"
// ---------------------------------------------------------------------------

export async function prepareNextWeek(input: {
  classroomId: string;
  teacherId: string;
  locale?: string;
}): Promise<{
  plan: {
    workingDays: string[];
    upcomingEvents: Array<{ type: string; title: string; date: string }>;
    lessonsToGenerate: Array<{ standardCode: string; title: string; priority: number }>;
    quizzesToPrepare: Array<{ topic: string; questionCount: number }>;
    homeworkToAssign: Array<{ title: string; dueDate: string }>;
    reviewsToSchedule: Array<{ topic: string; date: string }>;
    marketplaceRecommendations: Array<{ title: string; resourceId: string }>;
    announcementsToPrepare: Array<{ title: string; body: string }>;
  };
  executionMs: number;
  twinUpdated: boolean;
}> {
  const start = Date.now();
  const { classroomId, teacherId, locale = "en" } = input;

  log.info("autonomous_assistant.prepare_next_week", { classroomId, teacherId });

  // 1. Check calendar for upcoming events + holidays
  const upcomingEvents = await getUpcomingEventsForScope({
    scopeType: "classroom",
    scopeId: classroomId,
    daysAhead: 7,
  }).catch(() => []);

  const holidays = await getHolidaysInRange({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).catch(() => []);

  // Compute working days (excluding weekends + holidays)
  const workingDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    if (isWorkingDay(date, holidays)) {
      workingDays.push(date.toISOString().slice(0, 10));
    }
  }

  // 2. Find unfinished curriculum standards via coordinator
  const curriculumResult = await coordinatorExecute({
    instruction: `Find unfinished curriculum standards for classroom ${classroomId}`,
    task: {
      code: "coverage_gaps",
      params: { scopeType: "classroom", scopeId: classroomId },
      locale,
    },
    scopeType: "classroom",
    scopeId: classroomId,
    locale,
  }).catch(() => null);

  const gapData = curriculumResult?.unifiedResult as any;
  const lessonsToGenerate = (gapData?.gaps ?? []).slice(0, 5).map((g: any) => ({
    standardCode: g.standardId ?? "unknown",
    title: g.description ?? "Unfinished standard",
    priority: g.type === "uncovered_standard" ? 1 : 2,
  }));

  // 3. Prepare quizzes
  const quizResult = await coordinatorExecute({
    instruction: `Recommend quizzes for classroom ${classroomId}`,
    task: {
      code: "quiz_recommendations",
      params: { classroomId },
      locale,
    },
    scopeType: "classroom",
    scopeId: classroomId,
    locale,
  }).catch(() => null);

  const quizData = quizResult?.unifiedResult as any;
  const quizzesToPrepare = (quizData?.recommendations ?? []).slice(0, 3).map((r: any) => ({
    topic: r.topic,
    questionCount: r.recommendedQuizType === "diagnostic" ? 10 : 15,
  }));

  // 4. Prepare homework
  const homeworkResult = await coordinatorExecute({
    instruction: `Plan homework assignments for classroom ${classroomId}`,
    task: {
      code: "assignment_planning",
      params: { classroomId },
      locale,
    },
    scopeType: "classroom",
    scopeId: classroomId,
    locale,
  }).catch(() => null);

  const homeworkData = homeworkResult?.unifiedResult as any;
  const homeworkToAssign = (homeworkData?.suggestedAssignments ?? []).slice(0, 3).map((a: any, i: number) => ({
    title: a.title,
    dueDate: workingDays[Math.min(i + 2, workingDays.length - 1)] ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  // 5. Schedule reviews
  const reviewsToSchedule = (gapData?.gaps ?? [])
    .filter((g: any) => g.type === "uncovered_standard")
    .slice(0, 3)
    .map((g: any, i: number) => ({
      topic: g.description?.slice(0, 50) ?? "Review",
      date: workingDays[Math.min(i, workingDays.length - 1)] ?? new Date().toISOString(),
    }));

  // 6. Marketplace recommendations
  const marketplaceResult = await coordinatorExecute({
    instruction: `Recommend marketplace resources for classroom ${classroomId}`,
    task: {
      code: "recommend_resources",
      params: { query: lessonsToGenerate[0]?.title ?? "math" },
      locale,
    },
    scopeType: "classroom",
    scopeId: classroomId,
    locale,
  }).catch(() => null);

  const marketplaceData = marketplaceResult?.unifiedResult as any;
  const marketplaceRecommendations = (marketplaceData?.recommendations ?? []).slice(0, 3).map((r: any) => ({
    title: r.title,
    resourceId: r.entityId,
  }));

  // 7. Prepare announcements
  const announcementsToPrepare = [
    {
      title: "Upcoming Quiz",
      body: `A quiz on ${quizzesToPrepare[0]?.topic ?? "this week's topics"} will be held this week. Please review the materials.`,
    },
    ...(upcomingEvents.length > 0
      ? [{
          title: `Upcoming: ${upcomingEvents[0]!.title}`,
          body: upcomingEvents[0]!.description ?? `Reminder: ${upcomingEvents[0]!.title} on ${upcomingEvents[0]!.startDate.slice(0, 10)}.`,
        }]
      : []),
  ];

  // 8. Update the classroom twin
  let twinUpdated = false;
  try {
    await syncClassroomTwin(classroomId);
    twinUpdated = true;
  } catch {
    // best-effort
  }

  const executionMs = Date.now() - start;
  log.info("autonomous_assistant.completed", {
    classroomId,
    executionMs,
    lessonsToGenerate: lessonsToGenerate.length,
    quizzesToPrepare: quizzesToPrepare.length,
    homeworkToAssign: homeworkToAssign.length,
  });

  return {
    plan: {
      workingDays,
      upcomingEvents: upcomingEvents.map((e) => ({
        type: e.type,
        title: e.title,
        date: e.startDate,
      })),
      lessonsToGenerate,
      quizzesToPrepare,
      homeworkToAssign,
      reviewsToSchedule,
      marketplaceRecommendations,
      announcementsToPrepare,
    },
    executionMs,
    twinUpdated,
  };
}

/**
 * Generic autonomous instruction — any natural-language instruction
 * that the teacher wants the AI to execute autonomously.
 */
export async function executeAutonomousInstruction(input: {
  instruction: string;
  classroomId?: string;
  teacherId?: string;
  studentId?: string;
  organizationId?: string;
  locale?: string;
}): Promise<{
  instruction: string;
  result: unknown;
  executionMs: number;
}> {
  const start = Date.now();
  const scopeType = input.classroomId ? "classroom" : input.studentId ? "user" : input.organizationId ? "organization" : "system";
  const scopeId = input.classroomId ?? input.studentId ?? input.organizationId ?? "system";

  const execution = await coordinatorExecute({
    instruction: input.instruction,
    scopeType: scopeType as any,
    scopeId,
    locale: input.locale ?? "en",
  });

  return {
    instruction: input.instruction,
    result: execution.unifiedResult,
    executionMs: Date.now() - start,
  };
}
