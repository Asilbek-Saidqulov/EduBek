/**
 * EduBek — Assessment Agent.
 *
 * Phase 4F.6: Owns assessment-domain tasks:
 *   • Assessment planning
 *   • Question generation
 *   • Weak topic detection
 *   • Mastery analysis
 *
 * Composes existing services:
 *   • Phase 4B Assessment Engine
 *   • Phase 4F.5 Learning Prediction
 *   • Phase 4F.5 Knowledge Intelligence (concept mastery)
 */
import { getLogger } from "@/lib/logger";
import { predictLearningOutcome, listPredictionsForUser } from "@/features/knowledge-intelligence";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("assessment-agent");

export const ASSESSMENT_AGENT_DEFINITION: AgentDefinition = {
  type: "assessment",
  name: "Assessment Agent",
  description: "Owns assessment planning, question generation, weak topic detection, and mastery analysis.",
  capabilities: [
    { code: "assessment_planning", name: "Assessment Planning", nameKey: "educationOs.assessment.capability.planning", description: "Plan an assessment aligned with curriculum standards." },
    { code: "question_generation", name: "Question Generation", nameKey: "educationOs.assessment.capability.questionGen", description: "Generate questions for a topic or standard." },
    { code: "weak_topic_detection", name: "Weak Topic Detection", nameKey: "educationOs.assessment.capability.weakTopics", description: "Identify weak topics for a student or classroom." },
    { code: "mastery_analysis", name: "Mastery Analysis", nameKey: "educationOs.assessment.capability.mastery", description: "Analyze mastery across concepts." },
    { code: "predict_outcome", name: "Predict Outcome", nameKey: "educationOs.assessment.capability.predict", description: "Predict quiz score / completion / dropout for a student." },
  ],
  collaborators: ["teacher", "curriculum", "analytics"],
};

export async function executeAssessmentTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("assessment.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "assessment_planning": {
        const { classroomId, frameworkId, subject } = task.params as any;
        const plan = {
          classroomId,
          frameworkId,
          subject,
          recommendedAssessments: [
            { type: "diagnostic", timing: "start_of_unit", questionCount: 10, bloomLevel: "remember" },
            { type: "formative", timing: "mid_unit", questionCount: 15, bloomLevel: "apply" },
            { type: "summative", timing: "end_of_unit", questionCount: 25, bloomLevel: "analyze" },
          ],
        };
        result = plan;
        reasoning = {
          confidence: 0.75,
          reasoning: `Planned 3 assessments (diagnostic, formative, summative) aligned with Bloom's taxonomy progression and curriculum framework.`,
          reasoningKey: "educationOs.assessment.planning.reasoning",
          sources: [{ type: "classroom", id: classroomId, title: "Classroom context", relevance: 0.8 }],
          affectedModules: ["assessment", "knowledge-intelligence"],
          recommendedNextActions: [
            { code: "question_generation", description: "Generate questions for each assessment", descriptionKey: "educationOs.assessment.nextAction.generateQuestions", priority: 1 },
          ],
        };
        break;
      }
      case "question_generation": {
        const { topic, count, difficulty, questionType } = task.params as any;
        // For Phase 4F.6 we return a plan; actual generation delegates to AI Workspace.
        const generated = {
          topic,
          questionType: questionType ?? "mcq",
          difficulty: difficulty ?? "medium",
          count: count ?? 10,
          questionTemplates: [
            `What is the definition of ${topic}?`,
            `Which of the following best describes ${topic}?`,
            `Apply ${topic} to solve the following problem...`,
          ],
          note: "Use AI Workspace to generate actual questions from these templates.",
        };
        result = generated;
        reasoning = {
          confidence: 0.7,
          reasoning: `Generated ${count ?? 10} ${questionType ?? "MCQ"} question templates for ${topic} at ${difficulty ?? "medium"} difficulty. Templates follow Bloom's taxonomy — recall, comprehension, application.`,
          reasoningKey: "educationOs.assessment.questionGen.reasoning",
          sources: [{ type: "concept", id: topic, title: topic, relevance: 1.0 }],
          affectedModules: ["assessment", "ai-workspace"],
          recommendedNextActions: [
            { code: "ai_resource_generation", description: "Use AI Workspace to expand templates into full questions", descriptionKey: "educationOs.assessment.nextAction.expandTemplates", priority: 1 },
          ],
        };
        break;
      }
      case "weak_topic_detection": {
        const { userId, classroomId } = task.params as any;
        // Use Phase 4F.4 classroom intelligence if classroomId provided
        if (classroomId) {
          const { computeClassInsight } = await import("@/features/collaboration");
          const insight = await computeClassInsight(classroomId);
          result = { weakTopics: insight.weakTopics, atRiskStudents: insight.atRiskStudents };
          reasoning = {
            confidence: 0.9,
            reasoning: `Detected ${insight.weakTopics.length} weak topics in classroom ${classroomId} where ≥30% of students scored low. ${insight.atRiskStudents.length} at-risk students identified.`,
            reasoningKey: "educationOs.assessment.weakTopics.reasoning",
            sources: insight.weakTopics.slice(0, 3).map((t) => ({ type: "concept" as const, id: t.topic, title: t.topic, relevance: 1 - t.mastery })),
            affectedModules: ["collaboration", "knowledge-intelligence"],
            recommendedNextActions: [
              { code: "intervention_suggestions", description: "Generate interventions for weak topics", descriptionKey: "educationOs.assessment.nextAction.interventions", priority: 1 },
            ],
          };
        } else {
          // Per-student: use Phase 4F.2 interest profile
          const { getInterestProfile, buildKnowledgeGapReport } = await import("@/features/semantic-search");
          const gap = await buildKnowledgeGapReport(userId);
          result = { weakTopics: gap.weakTopics, missingPrerequisites: gap.missingPrerequisites, forgottenTopics: gap.forgottenTopics };
          reasoning = {
            confidence: 0.85,
            reasoning: `Detected ${gap.weakTopics.length} weak topics, ${gap.missingPrerequisites.length} missing prerequisites, and ${gap.forgottenTopics.length} forgotten topics for student ${userId}.`,
            reasoningKey: "educationOs.assessment.weakTopicsStudent.reasoning",
            sources: gap.weakTopics.slice(0, 3).map((t) => ({ type: "concept" as const, id: t.topic, title: t.topic, relevance: 1 - t.score })),
            affectedModules: ["semantic-search", "knowledge-intelligence"],
            recommendedNextActions: [
              { code: "personalized_study", description: "Schedule practice for weak topics", descriptionKey: "educationOs.assessment.nextAction.practiceWeak", priority: 1 },
            ],
          };
        }
        break;
      }
      case "mastery_analysis": {
        const { userId } = task.params as { userId: string };
        const { getInterestProfile } = await import("@/features/semantic-search");
        const profile = await getInterestProfile(userId);
        const masteryLevels = Object.values(profile.mastery);
        const mastered = masteryLevels.filter((l) => l === "mastered").length;
        const learning = masteryLevels.filter((l) => l === "learning").length;
        const weak = masteryLevels.filter((l) => l === "weak").length;
        result = {
          total: masteryLevels.length,
          mastered,
          learning,
          weak,
          masteryDistribution: { mastered, learning, weak, never: masteryLevels.length - mastered - learning - weak },
        };
        reasoning = {
          confidence: 0.85,
          reasoning: `Analyzed mastery for ${userId}: ${mastered} mastered, ${learning} learning, ${weak} weak out of ${masteryLevels.length} tracked concepts.`,
          reasoningKey: "educationOs.assessment.mastery.reasoning",
          sources: [{ type: "user", id: userId, title: "User mastery profile", relevance: 1.0 }],
          affectedModules: ["semantic-search", "knowledge-intelligence"],
          recommendedNextActions: [
            { code: "weak_topic_detection", description: "Drill into weak topics for interventions", descriptionKey: "educationOs.assessment.nextAction.drillWeak", priority: 1 },
          ],
        };
        break;
      }
      case "predict_outcome": {
        const { userId, entityType, entityId } = task.params as any;
        const prediction = await predictLearningOutcome({ userId, entityType, entityId });
        result = prediction;
        reasoning = {
          confidence: prediction.confidence,
          reasoning: `Predicted score: ${prediction.predictedScore?.toFixed(2) ?? "N/A"}. Dropout probability: ${prediction.predictedDropout?.toFixed(2) ?? "N/A"}. Intervention needed: ${prediction.interventionNeeded}.`,
          reasoningKey: "educationOs.assessment.predict.reasoning",
          sources: [{ type: "prediction", id: prediction.id, title: "Learning prediction", relevance: prediction.confidence }],
          affectedModules: ["knowledge-intelligence", "learning-planner"],
          recommendedNextActions: prediction.interventionNeeded
            ? [{ code: "intervention_suggestions", description: `Intervention needed: ${prediction.interventionReason}`, descriptionKey: "educationOs.assessment.nextAction.intervention", priority: 1 }]
            : [],
        };
        break;
      }
      default:
        throw new Error(`Unknown assessment task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "system",
      scopeId: "assessment-agent",
      type: "action",
      summary: `Assessment agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.5,
      agentType: "assessment",
    });

    const executionMs = Date.now() - start;
    log.info("assessment.task_completed", { task: task.code, executionMs });
    return {
      agentType: "assessment" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("assessment.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "assessment" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
