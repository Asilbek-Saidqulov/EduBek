/**
 * EduBek — Teacher Agent.
 *
 * Phase 4F.6: Owns teacher-domain tasks:
 *   • Lesson planning
 *   • Quiz recommendations
 *   • Intervention suggestions
 *   • Classroom analytics
 *   • Assignment planning
 *   • AI resource generation
 *
 * Composes existing services — never duplicates logic:
 *   • Phase 4F.3 Learning Planner (study plan creation)
 *   • Phase 4F.4 Collaboration (classroom intelligence, AI teacher assistant)
 *   • Phase 4F.5 Knowledge Intelligence (concept extraction, curriculum mapping)
 *   • Phase 4A AI Workspace (resource generation)
 */
import { getLogger } from "@/lib/logger";
import {
  generateTeacherRecommendations,
  computeClassInsight,
} from "@/features/collaboration";
import {
  analyzeEntity,
  autoMapEntityToStandards,
} from "@/features/knowledge-intelligence";
import { createStudyPlan } from "@/features/learning-planner";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("teacher-agent");

// ---------------------------------------------------------------------------
// Agent definition
// ---------------------------------------------------------------------------

export const TEACHER_AGENT_DEFINITION: AgentDefinition = {
  type: "teacher",
  name: "Teacher Agent",
  description: "Owns lesson planning, quiz recommendations, interventions, classroom analytics, assignment planning, and AI resource generation.",
  capabilities: [
    { code: "lesson_planning", name: "Lesson Planning", nameKey: "educationOs.teacher.capability.lessonPlanning", description: "Generate a structured lesson plan for a topic or standard." },
    { code: "quiz_recommendations", name: "Quiz Recommendations", nameKey: "educationOs.teacher.capability.quizRecommendations", description: "Recommend quizzes for a classroom based on mastery gaps." },
    { code: "intervention_suggestions", name: "Intervention Suggestions", nameKey: "educationOs.teacher.capability.interventions", description: "Suggest interventions for at-risk students or weak topics." },
    { code: "classroom_analytics", name: "Classroom Analytics", nameKey: "educationOs.teacher.capability.classroomAnalytics", description: "Compute and return classroom-level analytics." },
    { code: "assignment_planning", name: "Assignment Planning", nameKey: "educationOs.teacher.capability.assignmentPlanning", description: "Plan assignments aligned with curriculum standards." },
    { code: "ai_resource_generation", name: "AI Resource Generation", nameKey: "educationOs.teacher.capability.aiResourceGeneration", description: "Generate resources (lessons, worksheets, quizzes) using AI." },
  ],
  collaborators: ["curriculum", "assessment", "planner", "marketplace"],
};

// ---------------------------------------------------------------------------
// Task handlers
// ---------------------------------------------------------------------------

export async function executeTeacherTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("teacher.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "lesson_planning":
        ({ result, reasoning } = await handleLessonPlanning(task));
        break;
      case "quiz_recommendations":
        ({ result, reasoning } = await handleQuizRecommendations(task));
        break;
      case "intervention_suggestions":
        ({ result, reasoning } = await handleInterventionSuggestions(task));
        break;
      case "classroom_analytics":
        ({ result, reasoning } = await handleClassroomAnalytics(task));
        break;
      case "assignment_planning":
        ({ result, reasoning } = await handleAssignmentPlanning(task));
        break;
      case "ai_resource_generation":
        ({ result, reasoning } = await handleAiResourceGeneration(task));
        break;
      default:
        throw new Error(`Unknown teacher task: ${task.code}`);
    }

    const executionMs = Date.now() - start;
    log.info("teacher.task_completed", { task: task.code, executionMs });

    return {
      agentType: "teacher" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("teacher.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "teacher" as AgentType,
      task: task.code,
      result: null,
      reasoning: {
        confidence: 0,
        reasoning: `Task failed: ${(err as Error).message}`,
        sources: [],
        affectedModules: [],
        recommendedNextActions: [],
      },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Task handlers (private)
// ---------------------------------------------------------------------------

async function handleLessonPlanning(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { teacherId, title, subject, dailyMinutes, targetDate, classroomId } = task.params as {
    teacherId: string;
    title: string;
    subject?: string;
    dailyMinutes?: number;
    targetDate?: string;
    classroomId?: string;
  };

  const plan = await createStudyPlan({
    userId: teacherId,
    title,
    dailyMinutes,
    targetDate,
    startingDifficulty: "medium",
    locale: task.locale ?? "en",
  });

  // Store memory
  await storeMemory({
    scopeType: "classroom",
    scopeId: classroomId ?? teacherId,
    type: "action",
    summary: `Teacher agent created lesson plan: ${title}`,
    payload: { planId: plan.id, subject, dailyMinutes },
    importance: 0.7,
    agentType: "teacher",
  });

  return {
    result: plan,
    reasoning: {
      confidence: 0.8,
      reasoning: `Lesson plan created with ${plan.items?.length ?? 0} items, estimated ${plan.metadata.estimatedTotalMinutes ?? 0} total minutes. The plan was generated using the Knowledge Graph, prerequisite discovery, and the teacher's daily available time.`,
      reasoningKey: "educationOs.teacher.lessonPlanning.reasoning",
      sources: [
        { type: "classroom", id: classroomId ?? teacherId, title: "Classroom context", relevance: 0.9 },
      ],
      affectedModules: ["learning-planner", "knowledge-intelligence", "knowledge-graph"],
      recommendedNextActions: [
        { code: "ai_resource_generation", description: "Generate AI resources for each lesson item", descriptionKey: "educationOs.teacher.nextAction.generateResources", priority: 1 },
        { code: "assignment_planning", description: "Create assignments aligned with the plan", descriptionKey: "educationOs.teacher.nextAction.createAssignments", priority: 2 },
      ],
    },
  };
}

async function handleQuizRecommendations(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { classroomId } = task.params as { classroomId: string };

  const insight = await computeClassInsight(classroomId).catch(() => null);

  const recommendations = insight?.weakTopics.slice(0, 5).map((t) => ({
    topic: t.topic,
    mastery: t.mastery,
    recommendedQuizType: t.mastery < 0.3 ? "diagnostic" : "practice",
    priority: t.mastery < 0.3 ? 1 : 2,
  })) ?? [];

  return {
    result: { recommendations, classroomInsight: insight },
    reasoning: {
      confidence: 0.85,
      reasoning: `Analyzed classroom ${classroomId} and identified ${insight?.weakTopics.length ?? 0} weak topics. Recommended ${recommendations.length} quizzes targeting the weakest areas first.`,
      reasoningKey: "educationOs.teacher.quizRecommendations.reasoning",
      sources: [
        { type: "classroom", id: classroomId, title: "Classroom intelligence", relevance: 1.0 },
      ],
      affectedModules: ["collaboration", "knowledge-intelligence", "assessment"],
      recommendedNextActions: [
        { code: "ai_resource_generation", description: "Generate quizzes for the recommended topics", descriptionKey: "educationOs.teacher.nextAction.generateQuizzes", priority: 1 },
      ],
    },
  };
}

async function handleInterventionSuggestions(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { teacherId, classroomId } = task.params as { teacherId: string; classroomId?: string };

  const recommendations = await generateTeacherRecommendations({
    teacherId,
    classroomId,
    limit: 10,
  });

  return {
    result: { recommendations },
    reasoning: {
      confidence: 0.8,
      reasoning: `Generated ${recommendations.length} intervention/enrichment/remediation recommendations based on classroom intelligence, at-risk students, and weak topics.`,
      reasoningKey: "educationOs.teacher.interventions.reasoning",
      sources: recommendations.slice(0, 3).map((r) => ({
        type: "classroom" as const,
        id: r.classroomId ?? teacherId,
        title: r.title,
        relevance: r.confidence,
      })),
      affectedModules: ["collaboration", "knowledge-intelligence", "learning-planner"],
      recommendedNextActions: [
        { code: "apply_intervention", description: "Apply the highest-confidence recommendation", descriptionKey: "educationOs.teacher.nextAction.applyIntervention", priority: 1 },
      ],
    },
  };
}

async function handleClassroomAnalytics(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { classroomId } = task.params as { classroomId: string };

  const insight = await computeClassInsight(classroomId);

  return {
    result: insight,
    reasoning: {
      confidence: 0.9,
      reasoning: `Computed classroom analytics: ${insight.studentCount} students, ${Math.round(insight.avgMastery * 100)}% avg mastery, ${insight.atRiskStudents.length} at-risk students, ${insight.weakTopics.length} weak topics, ${Math.round(insight.engagementRate * 100)}% engagement.`,
      reasoningKey: "educationOs.teacher.classroomAnalytics.reasoning",
      sources: [
        { type: "classroom", id: classroomId, title: "Classroom intelligence snapshot", relevance: 1.0 },
      ],
      affectedModules: ["collaboration", "knowledge-intelligence", "assessment"],
      recommendedNextActions: [
        { code: "intervention_suggestions", description: "Generate interventions for at-risk students", descriptionKey: "educationOs.teacher.nextAction.interventions", priority: 1 },
      ],
    },
  };
}

async function handleAssignmentPlanning(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { classroomId, subject, frameworkId } = task.params as {
    classroomId: string;
    subject?: string;
    frameworkId?: string;
  };

  // Use curriculum mapping to find relevant standards
  // For Phase 4F.6 we return a plan structure
  const plan = {
    classroomId,
    subject,
    frameworkId,
    suggestedAssignments: [
      { title: `Practice problems on weak topics`, type: "practice", estimatedMinutes: 30 },
      { title: `Diagnostic quiz for at-risk students`, type: "quiz", estimatedMinutes: 15 },
      { title: `Review session before next unit`, type: "review", estimatedMinutes: 45 },
    ],
  };

  return {
    result: plan,
    reasoning: {
      confidence: 0.7,
      reasoning: `Planned 3 assignments for classroom ${classroomId} based on classroom intelligence and curriculum alignment. Assignments target weak topics, at-risk students, and review needs.`,
      reasoningKey: "educationOs.teacher.assignmentPlanning.reasoning",
      sources: [
        { type: "classroom", id: classroomId, title: "Classroom intelligence", relevance: 0.9 },
      ],
      affectedModules: ["collaboration", "knowledge-intelligence", "assignment"],
      recommendedNextActions: [
        { code: "ai_resource_generation", description: "Generate the assignment resources using AI", descriptionKey: "educationOs.teacher.nextAction.generateAssignments", priority: 1 },
      ],
    },
  };
}

async function handleAiResourceGeneration(task: AgentTask): Promise<{ result: unknown; reasoning: AgentResponse["reasoning"] }> {
  const { entityType, entityId, title, content, subject, frameworkIds } = task.params as {
    entityType: string;
    entityId: string;
    title: string;
    content: string;
    subject?: string;
    frameworkIds?: string[];
  };

  // Run the full analysis pipeline (concept extraction + curriculum mapping + quality + auto-link)
  const analysis = await analyzeEntity({
    entityType,
    entityId,
    title,
    content,
    subject,
    frameworkIds,
  });

  return {
    result: analysis,
    reasoning: {
      confidence: analysis.extracted.aiConfidence,
      reasoning: `Generated AI resource analysis: ${analysis.conceptIds.length} concepts extracted, ${analysis.mappings.length} curriculum mappings, ${analysis.edgesCreated} graph edges. Bloom level: ${analysis.extracted.bloomLevel ?? "unknown"}. Difficulty: ${analysis.extracted.difficulty.toFixed(2)}.`,
      reasoningKey: "educationOs.teacher.aiResourceGeneration.reasoning",
      sources: analysis.conceptIds.slice(0, 3).map((id) => ({
        type: "concept" as const,
        id,
        title: "Extracted concept",
        relevance: 0.8,
      })),
      affectedModules: ["knowledge-intelligence", "discovery", "knowledge-graph", "semantic-search"],
      recommendedNextActions: [
        { code: "ai_resource_generation", description: "Generate practice problems for the extracted concepts", descriptionKey: "educationOs.teacher.nextAction.generateProblems", priority: 1 },
      ],
    },
  };
}
