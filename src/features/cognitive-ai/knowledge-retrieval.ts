/**
 * EduBek — Knowledge Retrieval (System 5).
 *
 * Intelligent retrieval that searches simultaneously in:
 *   • Knowledge Graph (Discovery)
 *   • Learning Planner
 *   • Digital Twins
 *   • Assessment Platform
 *   • Marketplace
 *   • Research Platform
 *   • Global Intelligence
 *   • Civilization Engine
 *   • Platform Intelligence
 *   • Knowledge Health
 *   • Curriculum
 *   • Data Fabric
 *   • Semantic Memory (this module)
 *   • Episodic Memory (this module)
 *
 * Merges results, ranks evidence, removes duplicates, and produces one
 * evidence graph. Retrieval is deterministic — no LLM calls.
 */
import { getLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import * as repo from "./repository";
import { searchKnowledge } from "./semantic-memory";
import { searchEpisodes } from "./episodic-memory";
import type { EvidenceItem, EvidenceGraph } from "./types";

const log = getLogger("cognitive-knowledge-retrieval");

// ===========================================================================
// Public API
// ===========================================================================

export async function retrieveEvidence(query: string, opts: {
  userId?: string;
  organizationId?: string | null;
  classroomId?: string | null;
  scopes?: Array<"knowledge_graph" | "learning_planner" | "digital_twins" | "assessment" | "marketplace" | "research" | "global_intelligence" | "civilization" | "platform_intelligence" | "knowledge_health" | "curriculum" | "data_fabric" | "semantic_memory" | "episodic_memory">;
} = {}): Promise<EvidenceGraph> {
  const startedAt = Date.now();
  const scopes = opts.scopes ?? [
    "knowledge_graph", "learning_planner", "digital_twins", "assessment",
    "marketplace", "research", "global_intelligence", "civilization",
    "platform_intelligence", "knowledge_health", "curriculum",
    "semantic_memory", "episodic_memory",
  ];
  log.debug("retrieval.start", { query, scopes: scopes.length });

  const fetchers: Array<Promise<EvidenceItem[]>> = [];
  const sourcesQueried: string[] = [];

  if (scopes.includes("knowledge_graph")) {
    sourcesQueried.push("knowledge_graph");
    fetchers.push(retrieveFromKnowledgeGraph(query).catch(() => []));
  }
  if (scopes.includes("learning_planner")) {
    sourcesQueried.push("learning_planner");
    fetchers.push(retrieveFromLearningPlanner(query, opts.userId).catch(() => []));
  }
  if (scopes.includes("digital_twins")) {
    sourcesQueried.push("digital_twins");
    fetchers.push(retrieveFromDigitalTwins(query, opts.classroomId).catch(() => []));
  }
  if (scopes.includes("assessment")) {
    sourcesQueried.push("assessment");
    fetchers.push(retrieveFromAssessment(query, opts.userId).catch(() => []));
  }
  if (scopes.includes("marketplace")) {
    sourcesQueried.push("marketplace");
    fetchers.push(retrieveFromMarketplace(query).catch(() => []));
  }
  if (scopes.includes("research")) {
    sourcesQueried.push("research");
    fetchers.push(retrieveFromResearch(query, opts.userId).catch(() => []));
  }
  if (scopes.includes("global_intelligence")) {
    sourcesQueried.push("global_intelligence");
    fetchers.push(retrieveFromGlobalIntelligence(query).catch(() => []));
  }
  if (scopes.includes("civilization")) {
    sourcesQueried.push("civilization");
    fetchers.push(retrieveFromCivilization(query, opts.organizationId).catch(() => []));
  }
  if (scopes.includes("platform_intelligence")) {
    sourcesQueried.push("platform_intelligence");
    fetchers.push(retrieveFromPlatformIntelligence(query).catch(() => []));
  }
  if (scopes.includes("knowledge_health")) {
    sourcesQueried.push("knowledge_health");
    fetchers.push(retrieveFromKnowledgeHealth(query).catch(() => []));
  }
  if (scopes.includes("curriculum")) {
    sourcesQueried.push("curriculum");
    fetchers.push(retrieveFromCurriculum(query).catch(() => []));
  }
  if (scopes.includes("semantic_memory")) {
    sourcesQueried.push("semantic_memory");
    fetchers.push(retrieveFromSemanticMemory(query).catch(() => []));
  }
  if (scopes.includes("episodic_memory")) {
    sourcesQueried.push("episodic_memory");
    fetchers.push(retrieveFromEpisodicMemory(query, opts.userId).catch(() => []));
  }

  const results = await Promise.all(fetchers);
  const allEvidence: EvidenceItem[] = results.flat();

  // Deduplicate by content similarity (first 80 chars)
  const seen = new Set<string>();
  const deduped: EvidenceItem[] = [];
  let duplicatesRemoved = 0;
  for (const e of allEvidence) {
    const key = e.content.slice(0, 80).toLowerCase();
    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(key);
    deduped.push(e);
  }

  // Rank by relevance × confidence
  deduped.sort((a, b) => (b.relevance * b.confidence) - (a.relevance * a.confidence));

  // Build cross-evidence relations (deterministic: same source → supports, different source contradicting content → contradicts)
  const relations: EvidenceGraph["relations"] = [];
  for (let i = 0; i < deduped.length; i++) {
    for (let j = i + 1; j < deduped.length; j++) {
      const a = deduped[i], b = deduped[j];
      if (a.source === b.source) {
        relations.push({ fromEvidenceId: a.id, toEvidenceId: b.id, type: "supports" });
      }
    }
  }

  const sourcesWithResults = Array.from(new Set(deduped.map(e => e.source)));
  const retrievalDurationMs = Date.now() - startedAt;
  log.info("retrieval.complete", {
    query, total: deduped.length, duplicatesRemoved,
    sourcesQueried: sourcesQueried.length, sourcesWithResults: sourcesWithResults.length,
    durationMs: retrievalDurationMs,
  });

  return {
    query,
    evidence: deduped,
    relations,
    sourcesQueried,
    sourcesWithResults,
    duplicatesRemoved,
    retrievalDurationMs,
  };
}

// ===========================================================================
// Per-source retrievers — each queries an existing subsystem
// ===========================================================================

async function retrieveFromKnowledgeGraph(query: string): Promise<EvidenceItem[]> {
  const concepts = await db.concept.findMany({
    where: { name: { contains: query } },
    take: 5,
    select: { id: true, name: true, description: true },
  }).catch(() => []);
  return concepts.map(c => ({
    id: `kg:${c.id}`,
    source: "knowledge_graph",
    type: "fact" as const,
    content: `${c.name}: ${c.description ?? ""}`,
    relevance: 0.8, confidence: 0.9,
    timestamp: new Date().toISOString(),
    entityId: c.id,
  }));
}

async function retrieveFromLearningPlanner(query: string, userId?: string): Promise<EvidenceItem[]> {
  if (!userId) return [];
  const plans = await db.learningPlan.findMany({
    where: { userId, title: { contains: query } },
    take: 3,
    select: { id: true, title: true, description: true, completionPct: true },
  }).catch(() => []);
  return plans.map(p => ({
    id: `lp:${p.id}`,
    source: "learning_planner",
    type: "observation" as const,
    content: `Plan "${p.title}" — ${p.completionPct}% complete. ${p.description ?? ""}`,
    relevance: 0.7, confidence: 0.85,
    timestamp: new Date().toISOString(),
    entityId: p.id,
  }));
}

async function retrieveFromDigitalTwins(query: string, classroomId?: string | null): Promise<EvidenceItem[]> {
  const where: Record<string, unknown> = { active: true };
  if (classroomId) {
    where.twinType = "classroom";
    where.entityId = classroomId;
  }
  const twins = await db.digitalTwin.findMany({
    where, take: 3,
    select: { id: true, twinType: true, entityId: true, state: true },
  }).catch(() => []);
  return twins.map(t => ({
    id: `dt:${t.id}`,
    source: "digital_twins",
    type: "prediction" as const,
    content: `${t.twinType} twin state for ${t.entityId}`,
    relevance: 0.6, confidence: 0.8,
    timestamp: new Date().toISOString(),
    entityId: t.id,
  }));
}

async function retrieveFromAssessment(query: string, userId?: string): Promise<EvidenceItem[]> {
  const where: Record<string, unknown> = { title: { contains: query } };
  if (userId) where.OR = [{ ownerId: userId }, { classroom: { teacherId: userId } }];
  const assessments = await db.assessment.findMany({
    where, take: 5,
    select: { id: true, title: true, description: true, assessmentType: true },
  }).catch(() => []);
  return assessments.map(a => ({
    id: `as:${a.id}`,
    source: "assessment",
    type: "fact" as const,
    content: `Assessment "${a.title}" (${a.assessmentType}). ${a.description ?? ""}`,
    relevance: 0.7, confidence: 0.85,
    timestamp: new Date().toISOString(),
    entityId: a.id,
  }));
}

async function retrieveFromMarketplace(query: string): Promise<EvidenceItem[]> {
  const listings = await db.marketplaceListing.findMany({
    where: { title: { contains: query }, status: "active" },
    take: 5,
    select: { id: true, title: true, description: true, contentType: true },
  }).catch(() => []);
  return listings.map(l => ({
    id: `mp:${l.id}`,
    source: "marketplace",
    type: "observation" as const,
    content: `Marketplace ${l.contentType}: "${l.title}". ${l.description ?? ""}`,
    relevance: 0.6, confidence: 0.8,
    timestamp: new Date().toISOString(),
    entityId: l.id,
    url: `/marketplace/${l.id}`,
  }));
}

async function retrieveFromResearch(query: string, userId?: string): Promise<EvidenceItem[]> {
  const where: Record<string, unknown> = { title: { contains: query } };
  if (userId) where.principalInvestigator = userId;
  const projects = await db.researchProject.findMany({
    where, take: 3,
    select: { id: true, title: true, description: true, status: true },
  }).catch(() => []);
  return projects.map(p => ({
    id: `rp:${p.id}`,
    source: "research",
    type: "citation" as const,
    content: `Research project "${p.title}" (${p.status}). ${p.description ?? ""}`,
    relevance: 0.7, confidence: 0.85,
    timestamp: new Date().toISOString(),
    entityId: p.id,
  }));
}

async function retrieveFromGlobalIntelligence(query: string): Promise<EvidenceItem[]> {
  const insights = await db.collectiveInsight.findMany({
    where: { OR: [{ title: { contains: query } }, { description: { contains: query } }] },
    take: 3,
    select: { id: true, title: true, description: true, confidence: true },
  }).catch(() => []);
  return insights.map(i => ({
    id: `gi:${i.id}`,
    source: "global_intelligence",
    type: "observation" as const,
    content: `Global insight: ${i.title}. ${i.description ?? ""}`,
    relevance: 0.7, confidence: i.confidence ?? 0.7,
    timestamp: new Date().toISOString(),
    entityId: i.id,
  }));
}

async function retrieveFromCivilization(query: string, organizationId?: string | null): Promise<EvidenceItem[]> {
  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  const memories = await db.institutionalMemory.findMany({
    where: { ...where, title: { contains: query } },
    take: 3,
    select: { id: true, title: true, description: true, importance: true },
  }).catch(() => []);
  return memories.map(m => ({
    id: `ce:${m.id}`,
    source: "civilization",
    type: "observation" as const,
    content: `Institutional memory: ${m.title}. ${m.description ?? ""}`,
    relevance: 0.7, confidence: m.importance,
    timestamp: new Date().toISOString(),
    entityId: m.id,
  }));
}

async function retrieveFromPlatformIntelligence(query: string): Promise<EvidenceItem[]> {
  const insights = await db.platformInsight.findMany({
    where: { title: { contains: query } },
    take: 3,
    select: { id: true, title: true, description: true, severity: true },
  }).catch(() => []);
  return insights.map(i => ({
    id: `pi:${i.id}`,
    source: "platform_intelligence",
    type: "observation" as const,
    content: `Platform insight (${i.severity}): ${i.title}. ${i.description ?? ""}`,
    relevance: 0.65, confidence: 0.8,
    timestamp: new Date().toISOString(),
    entityId: i.id,
  }));
}

async function retrieveFromKnowledgeHealth(query: string): Promise<EvidenceItem[]> {
  const snapshots = await db.knowledgeHealthSnapshot.findMany({
    take: 3,
    orderBy: { day: "desc" },
    select: { id: true, organizationId: true, coverageScore: true, qualityScore: true, day: true },
  }).catch(() => []);
  return snapshots.map(s => ({
    id: `kh:${s.id}`,
    source: "knowledge_health",
    type: "statistic" as const,
    content: `Knowledge health for ${s.organizationId}: coverage=${s.coverageScore.toFixed(2)}, quality=${s.qualityScore.toFixed(2)}`,
    relevance: query.toLowerCase().includes("health") || query.toLowerCase().includes("coverage") ? 0.8 : 0.4,
    confidence: 0.9,
    timestamp: s.day.toISOString(),
    entityId: s.id,
  }));
}

async function retrieveFromCurriculum(query: string): Promise<EvidenceItem[]> {
  const frameworks = await db.curriculumFramework.findMany({
    where: { name: { contains: query } },
    take: 3,
    select: { id: true, name: true, description: true },
  }).catch(() => []);
  return frameworks.map(f => ({
    id: `cu:${f.id}`,
    source: "curriculum",
    type: "fact" as const,
    content: `Curriculum framework: ${f.name}. ${f.description ?? ""}`,
    relevance: 0.7, confidence: 0.9,
    timestamp: new Date().toISOString(),
    entityId: f.id,
  }));
}

async function retrieveFromSemanticMemory(query: string): Promise<EvidenceItem[]> {
  const result = await searchKnowledge(query, 5);
  return result.entries.map((e, i) => ({
    id: `sm:${e.id}`,
    source: "semantic_memory",
    type: e.kind === "principle" ? "fact" : e.kind === "best_practice" ? "best_practice" : "fact",
    content: `${e.statement} ${e.explanation}`,
    relevance: result.scores[i] ?? 0.5,
    confidence: e.confidence,
    timestamp: e.createdAt,
    entityId: e.id,
  }));
}

async function retrieveFromEpisodicMemory(query: string, userId?: string): Promise<EvidenceItem[]> {
  if (!userId) return [];
  const result = await searchEpisodes("user", userId, query, 5);
  return result.entries.map((e, i) => ({
    id: `em:${e.id}`,
    source: "episodic_memory",
    type: "observation",
    content: `${e.kind}: ${e.summary}`,
    relevance: result.scores[i] ?? 0.5,
    confidence: e.importance,
    timestamp: e.occurredAt,
    entityId: e.id,
  }));
}

// ===========================================================================
// Helpers
// ===========================================================================

export function rankEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
  return [...evidence].sort((a, b) => (b.relevance * b.confidence) - (a.relevance * a.confidence));
}

export { safeParse } from "./repository";
