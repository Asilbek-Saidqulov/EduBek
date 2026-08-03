/**
 * EduBek — Curriculum Agent.
 *
 * Phase 4F.6: Owns curriculum-domain tasks:
 *   • Curriculum alignment
 *   • Prerequisite analysis
 *   • Coverage gaps
 *   • Resource recommendations
 *
 * Composes existing services:
 *   • Phase 4F.5 Knowledge Intelligence (concept extraction, curriculum mapping, coverage)
 *   • Phase 4F.5 Prerequisite Discovery
 *   • Phase 4F.5 AI Curriculum Assistant
 */
import { getLogger } from "@/lib/logger";
import {
  computeCoverage,
  listKnowledgeGaps,
  discoverPrerequisites,
  autoMapEntityToStandards,
  answerCurriculumQuestion,
  listFrameworks,
  listStandards,
} from "@/features/knowledge-intelligence";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("curriculum-agent");

export const CURRICULUM_AGENT_DEFINITION: AgentDefinition = {
  type: "curriculum",
  name: "Curriculum Agent",
  description: "Owns curriculum alignment, prerequisite analysis, coverage gaps, and resource recommendations.",
  capabilities: [
    { code: "curriculum_alignment", name: "Curriculum Alignment", nameKey: "educationOs.curriculum.capability.alignment", description: "Map a resource to curriculum standards." },
    { code: "prerequisite_analysis", name: "Prerequisite Analysis", nameKey: "educationOs.curriculum.capability.prerequisites", description: "Discover prerequisites for a concept." },
    { code: "coverage_gaps", name: "Coverage Gaps", nameKey: "educationOs.curriculum.capability.coverageGaps", description: "Identify curriculum coverage gaps." },
    { code: "resource_recommendations", name: "Resource Recommendations", nameKey: "educationOs.curriculum.capability.resourceRecs", description: "Recommend resources for curriculum standards." },
    { code: "ask_question", name: "Ask Question", nameKey: "educationOs.curriculum.capability.ask", description: "Natural-language Q&A about curriculum." },
  ],
  collaborators: ["teacher", "assessment", "analytics"],
};

export async function executeCurriculumTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("curriculum.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "curriculum_alignment": {
        const { entityType, entityId, title, content, subject, frameworkIds } = task.params as any;
        const mappings = await autoMapEntityToStandards({
          entityType, entityId, title, content, subject, frameworkIds,
        });
        result = { mappings, total: mappings.length };
        reasoning = {
          confidence: 0.85,
          reasoning: `Mapped entity ${entityType}:${entityId} to ${mappings.length} curriculum standards using AI concept extraction + Jaccard similarity.`,
          reasoningKey: "educationOs.curriculum.alignment.reasoning",
          sources: mappings.slice(0, 3).map((m) => ({ type: "standard" as const, id: m.standardId, title: `${m.coverageLevel} (${Math.round(m.alignmentScore * 100)}%)`, relevance: m.alignmentScore })),
          affectedModules: ["knowledge-intelligence", "discovery"],
          recommendedNextActions: [
            { code: "coverage_gaps", description: "Recompute coverage for affected scopes", descriptionKey: "educationOs.curriculum.nextAction.recomputeCoverage", priority: 1 },
          ],
        };
        break;
      }
      case "prerequisite_analysis": {
        const { conceptId } = task.params as { conceptId: string };
        const discovered = await discoverPrerequisites(conceptId, 20);
        result = { prerequisites: discovered, total: discovered.length };
        reasoning = {
          confidence: discovered.length > 0 ? discovered[0]!.confidence : 0.3,
          reasoning: `Discovered ${discovered.length} prerequisite / next / related concepts using co-occurrence, difficulty ordering, and Bloom level progression.`,
          reasoningKey: "educationOs.curriculum.prerequisites.reasoning",
          sources: discovered.slice(0, 3).map((d) => ({ type: "concept" as const, id: d.fromConceptId, title: `Relationship: ${d.type}`, relevance: d.confidence })),
          affectedModules: ["knowledge-intelligence", "knowledge-graph"],
          recommendedNextActions: [
            { code: "resource_recommendations", description: "Find resources for the prerequisites", descriptionKey: "educationOs.curriculum.nextAction.findResources", priority: 1 },
          ],
        };
        break;
      }
      case "coverage_gaps": {
        const { scopeType, scopeId, frameworkId } = task.params as any;
        const coverage = await computeCoverage({ scopeType, scopeId, frameworkId });
        const gaps = await listKnowledgeGaps({ scopeType, scopeId, status: "open", limit: 20 });
        result = { coverage, gaps, totalGaps: gaps.length };
        reasoning = {
          confidence: 0.9,
          reasoning: `Coverage: ${Math.round(coverage.coveragePct)}% (${coverage.coveredStandards}/${coverage.totalStandards} standards). ${gaps.length} knowledge gaps identified. ${coverage.details.weakAreas.length} weak areas.`,
          reasoningKey: "educationOs.curriculum.coverage.reasoning",
          sources: [{ type: "organization", id: scopeId, title: `Coverage snapshot`, relevance: 1.0 }],
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: [
            { code: "resource_recommendations", description: "Generate resources for uncovered standards", descriptionKey: "educationOs.curriculum.nextAction.generateForGaps", priority: 1 },
          ],
        };
        break;
      }
      case "resource_recommendations": {
        const { standardId, limit } = task.params as { standardId: string; limit?: number };
        // Use Phase 4F.5 CurriculumMapping to find resources mapped to the standard
        const mappings = await import("@/features/knowledge-intelligence").then((m) => m.listMappings({ standardId, limit: limit ?? 20 }));
        result = { recommendations: mappings, total: mappings.length };
        reasoning = {
          confidence: 0.8,
          reasoning: `Found ${mappings.length} resources aligned to standard ${standardId}, sorted by alignment score.`,
          reasoningKey: "educationOs.curriculum.resourceRecs.reasoning",
          sources: mappings.slice(0, 3).map((m) => ({ type: "resource" as const, id: m.entityId, title: `${m.entityType}:${m.entityId}`, relevance: m.alignmentScore })),
          affectedModules: ["knowledge-intelligence", "discovery"],
          recommendedNextActions: [],
        };
        break;
      }
      case "ask_question": {
        const { question, scopeType, scopeId, frameworkId } = task.params as any;
        const answer = await answerCurriculumQuestion({
          question,
          scopeType,
          scopeId,
          frameworkId,
          locale: task.locale ?? "en",
        });
        result = answer;
        reasoning = {
          confidence: answer.confidence,
          reasoning: answer.answer,
          reasoningKey: answer.answerKey,
          sources: answer.evidence.map((e) => ({ type: e.type as any, id: e.id, title: e.title, relevance: e.relevance })),
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: answer.followUps.map((q, i) => ({ code: "ask_question", description: q, priority: i + 1 })),
        };
        break;
      }
      case "list_frameworks": {
        const frameworks = await listFrameworks();
        result = { frameworks, total: frameworks.length };
        reasoning = {
          confidence: 1.0,
          reasoning: `Listed ${frameworks.length} curriculum frameworks (built-in + custom).`,
          reasoningKey: "educationOs.curriculum.listFrameworks.reasoning",
          sources: frameworks.slice(0, 3).map((f) => ({ type: "organization" as const, id: f.id, title: f.name, relevance: 0.5 })),
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: [],
        };
        break;
      }
      case "list_standards": {
        const { frameworkId, subject, grade } = task.params as any;
        const standards = await listStandards({ frameworkId, subject, grade });
        result = { standards, total: standards.length };
        reasoning = {
          confidence: 1.0,
          reasoning: `Listed ${standards.length} curriculum standards.`,
          reasoningKey: "educationOs.curriculum.listStandards.reasoning",
          sources: standards.slice(0, 3).map((s) => ({ type: "standard" as const, id: s.id, title: `${s.code}: ${s.title}`, relevance: 0.5 })),
          affectedModules: ["knowledge-intelligence"],
          recommendedNextActions: [],
        };
        break;
      }
      default:
        throw new Error(`Unknown curriculum task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "system",
      scopeId: "curriculum-agent",
      type: "action",
      summary: `Curriculum agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.5,
      agentType: "curriculum",
    });

    const executionMs = Date.now() - start;
    log.info("curriculum.task_completed", { task: task.code, executionMs });
    return {
      agentType: "curriculum" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("curriculum.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "curriculum" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
