/**
 * EduBek — Knowledge Intelligence main service.
 *
 * Phase 4F.5: Public-facing service functions that combine the
 * sub-modules (concept extraction, curriculum mapping, coverage,
 * prerequisite discovery, learning prediction, resource quality,
 * similarity detection, auto-relationships, AI curriculum assistant,
 * knowledge health) into a unified API surface.
 *
 * Every function in this file is a thin orchestrator — the heavy
 * lifting lives in the sub-modules.
 */
import { getLogger } from "@/lib/logger";
import { extractConcepts, analyzeAndIndexEntity } from "./concept-extraction";
import {
  ensureBuiltinFrameworks,
  listFrameworks,
  getFramework,
  createCustomFramework,
  createStandard,
  listStandards,
  getStandard,
  autoMapEntityToStandards,
  listMappings,
  getMappingsForEntity,
} from "./curriculum-mapping";
import { computeCoverage, getCoverage, listKnowledgeGaps, resolveKnowledgeGap, ignoreKnowledgeGap } from "./coverage-analysis";
import { discoverPrerequisites, discoverAllPrerequisitesForSubject } from "./prerequisite-discovery";
import { predictLearningOutcome, getPrediction, listPredictionsForUser } from "./learning-prediction";
import { analyzeResourceQuality, getResourceQuality } from "./resource-quality";
import { findSimilarEntities, createSimilarityCluster, listSimilarityClusters, scanForDuplicates } from "./similarity-detection";
import { autoLinkEntity, createRelationship } from "./auto-relationships";
import { answerCurriculumQuestion } from "./ai-curriculum-assistant";
import { computeKnowledgeHealth, getKnowledgeHealth } from "./knowledge-health";
import * as conceptRepo from "./repository";

const log = getLogger("knowledge-intelligence");

// ---------------------------------------------------------------------------
// Concept extraction (analyze a resource end-to-end)
// ---------------------------------------------------------------------------

/**
 * Full entity analysis pipeline. Runs:
 *   1. Concept extraction (extracts concepts + creates Concept rows)
 *   2. ResourceConcept linking
 *   3. Auto-curriculum mapping (maps entity to standards)
 *   4. Resource quality analysis (computes 8 sub-scores)
 *   5. Auto-relationships (creates KnowledgeGraphEdge entries)
 *
 * Called by resource creation / update flows. Idempotent — running
 * twice doesn't create duplicates.
 */
export async function analyzeEntity(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  subject?: string;
  frameworkIds?: string[];
}): Promise<{
  extracted: Awaited<ReturnType<typeof extractConcepts>>;
  conceptIds: string[];
  mappings: Awaited<ReturnType<typeof autoMapEntityToStandards>>;
  quality: Awaited<ReturnType<typeof analyzeResourceQuality>>;
  edgesCreated: number;
}> {
  log.info("entity.analysis_started", {
    entityType: input.entityType,
    entityId: input.entityId,
  });

  // Ensure built-in frameworks exist (idempotent)
  await ensureBuiltinFrameworks().catch(() => undefined);

  // Step 1: extract concepts + index
  const { extracted, conceptIds } = await analyzeAndIndexEntity({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    content: input.content,
    subject: input.subject,
  });

  // Step 2: auto-map to standards
  const mappings = await autoMapEntityToStandards({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    content: input.content,
    subject: input.subject,
    frameworkIds: input.frameworkIds,
  }).catch(() => []);

  // Step 3: analyze quality
  const quality = await analyzeResourceQuality({
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    content: input.content,
    subject: input.subject,
  }).catch(() => null);

  // Step 4: auto-link to graph
  const linkResult = await autoLinkEntity({
    entityType: input.entityType,
    entityId: input.entityId,
  }).catch(() => ({ edgesCreated: 0, edgesByType: {} }));

  log.info("entity.analysis_completed", {
    entityType: input.entityType,
    entityId: input.entityId,
    conceptCount: conceptIds.length,
    mappingCount: mappings.length,
    edgesCreated: linkResult.edgesCreated,
  });

  return {
    extracted,
    conceptIds,
    mappings,
    quality: quality as any,
    edgesCreated: linkResult.edgesCreated,
  };
}

// ---------------------------------------------------------------------------
// Concept CRUD
// ---------------------------------------------------------------------------

export async function listConcepts(input: {
  subject?: string;
  bloomLevel?: string;
  language?: string;
  limit?: number;
  offset?: number;
}) {
  const concepts = await conceptRepo.findConcepts(input);
  return concepts.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    subject: c.subject,
    bloomLevel: c.bloomLevel,
    difficulty: c.difficulty,
    estimatedMinutes: c.estimatedMinutes,
    attributes: safeParseRecord(c.attributes),
    language: c.language,
    aiConfidence: c.aiConfidence,
    aliases: (c.aliases ?? []).map((a: any) => a.alias),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getConcept(id: string) {
  const c = await conceptRepo.findConcept(id);
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    subject: c.subject,
    bloomLevel: c.bloomLevel,
    difficulty: c.difficulty,
    estimatedMinutes: c.estimatedMinutes,
    attributes: safeParseRecord(c.attributes),
    language: c.language,
    aiConfidence: c.aiConfidence,
    aliases: (c.aliases ?? []).map((a: any) => a.alias),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function searchConcepts(query: string, limit = 20) {
  const concepts = await conceptRepo.searchConcepts(query, limit);
  return concepts.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    subject: c.subject,
    bloomLevel: c.bloomLevel,
    difficulty: c.difficulty,
    estimatedMinutes: c.estimatedMinutes,
    attributes: safeParseRecord(c.attributes),
    language: c.language,
    aiConfidence: c.aiConfidence,
    aliases: (c.aliases ?? []).map((a: any) => a.alias),
  }));
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Re-exports (so consumers can import everything from one place)
// ---------------------------------------------------------------------------

export {
  // Concept extraction
  extractConcepts,
  analyzeAndIndexEntity,
  // Curriculum mapping
  ensureBuiltinFrameworks,
  listFrameworks,
  getFramework,
  createCustomFramework,
  createStandard,
  listStandards,
  getStandard,
  autoMapEntityToStandards,
  listMappings,
  getMappingsForEntity,
  // Coverage
  computeCoverage,
  getCoverage,
  listKnowledgeGaps,
  resolveKnowledgeGap,
  ignoreKnowledgeGap,
  // Prerequisites
  discoverPrerequisites,
  discoverAllPrerequisitesForSubject,
  // Predictions
  predictLearningOutcome,
  getPrediction,
  listPredictionsForUser,
  // Quality
  analyzeResourceQuality,
  getResourceQuality,
  // Similarity
  findSimilarEntities,
  createSimilarityCluster,
  listSimilarityClusters,
  scanForDuplicates,
  // Auto relationships
  autoLinkEntity,
  createRelationship,
  // AI assistant
  answerCurriculumQuestion,
  // Knowledge health
  computeKnowledgeHealth,
  getKnowledgeHealth,
};
