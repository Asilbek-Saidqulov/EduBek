/**
 * EduBek — Duplicate & Similarity Detection.
 *
 * Phase 4F.5: Detects:
 *
 *   • Duplicate quizzes (same questions, same answers)
 *   • Duplicate worksheets (same content)
 *   • Similar lessons (high text overlap)
 *   • Similar marketplace products (high concept overlap)
 *   • Translated copies (same concept set, different language)
 *   • AI-generated variants (high semantic similarity, slightly different wording)
 *
 * Uses two complementary signals:
 *   1. Concept overlap — fraction of shared concepts between two entities
 *   2. Text similarity — Jaccard similarity of word sets (lightweight, no LLM)
 *
 * Reuses:
 *   • Phase 4F.5 ResourceConcept — for concept overlap
 *   • Phase 4F.2 Embeddings — for semantic similarity (when available)
 *   • Phase 4F.1 Knowledge Graph — for SIMILAR / DUPLICATE edges
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { cosineSimilarity, getEmbeddingProvider } from "@/features/semantic-search";
import type { SimilarityClusterDto, SimilarityClusterMember, SimilarityClusterType } from "./types";

const log = getLogger("similarity-detection");

// ---------------------------------------------------------------------------
// Main entry point: find similar entities for a given entity
// ---------------------------------------------------------------------------

export async function findSimilarEntities(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  threshold?: number; // 0-1, default 0.6
  limit?: number; // default 10
}): Promise<Array<{ entity: SimilarityClusterMember; clusterType: SimilarityClusterType }>> {
  const threshold = input.threshold ?? 0.6;
  const limit = input.limit ?? 10;

  // Fetch all other entities of the same type with their concepts
  const candidateResourceConcepts = await db.resourceConcept.findMany({
    where: {
      entityType: input.entityType,
      entityId: { not: input.entityId },
    },
    select: { entityId: true, conceptId: true },
  }).catch(() => []);

  // Group candidates by entityId
  const candidatesByEntity = new Map<string, Set<string>>();
  for (const rc of candidateResourceConcepts) {
    const set = candidatesByEntity.get(rc.entityId) ?? new Set<string>();
    set.add(rc.conceptId);
    candidatesByEntity.set(rc.entityId, set);
  }

  // Fetch the source entity's concepts
  const sourceConcepts = await db.resourceConcept.findMany({
    where: { entityType: input.entityType, entityId: input.entityId },
    select: { conceptId: true },
  }).catch(() => []);
  const sourceConceptSet = new Set(sourceConcepts.map((rc) => rc.conceptId));

  const results: Array<{ entity: SimilarityClusterMember; clusterType: SimilarityClusterType }> = [];

  // Compute concept-overlap similarity for each candidate
  for (const [candidateId, candidateConceptSet] of candidatesByEntity) {
    let intersection = 0;
    for (const c of sourceConceptSet) {
      if (candidateConceptSet.has(c)) intersection += 1;
    }
    const union = sourceConceptSet.size + candidateConceptSet.size - intersection;
    const conceptSimilarity = union > 0 ? intersection / union : 0;

    // Fetch candidate title + content for text similarity
    const candidateContent = await fetchEntityContent(input.entityType, candidateId);
    if (!candidateContent) continue;

    const textSimilarity = jaccardTextSimilarity(input.content, candidateContent.content);

    // Combined similarity: weight concept overlap (0.6) + text similarity (0.4)
    const combinedSimilarity = 0.6 * conceptSimilarity + 0.4 * textSimilarity;

    if (combinedSimilarity < threshold) continue;

    // Determine cluster type
    const clusterType = classifySimilarity(
      combinedSimilarity,
      conceptSimilarity,
      textSimilarity,
      input.title,
      candidateContent.title,
    );

    results.push({
      entity: {
        entityType: input.entityType,
        entityId: candidateId,
        similarity: Math.round(combinedSimilarity * 100) / 100,
      },
      clusterType,
    });
  }

  // Sort by similarity descending
  results.sort((a, b) => b.entity.similarity - a.entity.similarity);
  return results.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Cluster creation
// ---------------------------------------------------------------------------

export async function createSimilarityCluster(input: {
  entityType: string;
  centroidEntityId: string;
  centroidTitle: string;
  members: SimilarityClusterMember[];
  clusterType: SimilarityClusterType;
  threshold: number;
}): Promise<SimilarityClusterDto> {
  const cluster = await repo.createSimilarityCluster({
    name: `${input.clusterType} cluster: ${input.centroidTitle}`,
    entityType: input.entityType,
    members: JSON.stringify(input.members),
    threshold: input.threshold,
    clusterType: input.clusterType,
  });

  log.info("similarity.cluster_created", {
    clusterId: cluster.id,
    clusterType: input.clusterType,
    memberCount: input.members.length,
  });

  return mapCluster(cluster);
}

// ---------------------------------------------------------------------------
// List clusters
// ---------------------------------------------------------------------------

export async function listSimilarityClusters(input: {
  entityType?: string;
  clusterType?: string;
  limit?: number;
}): Promise<SimilarityClusterDto[]> {
  const clusters = await repo.findSimilarityClusters(input);
  return clusters.map(mapCluster);
}

// ---------------------------------------------------------------------------
// Bulk scan: detect all duplicates for a given entity type
// ---------------------------------------------------------------------------

export async function scanForDuplicates(input: {
  entityType: string;
  limit?: number; // max entities to compare; default 100
  threshold?: number; // default 0.8 for duplicates
}): Promise<{ clustersCreated: number; duplicatesFound: number }> {
  const threshold = input.threshold ?? 0.8;
  const limit = input.limit ?? 100;

  // Fetch all entities of this type with their concepts
  const allResourceConcepts = await db.resourceConcept.findMany({
    where: { entityType: input.entityType },
    select: { entityId: true, conceptId: true },
  }).catch(() => []);

  // Group by entity
  const conceptsByEntity = new Map<string, Set<string>>();
  for (const rc of allResourceConcepts) {
    const set = conceptsByEntity.get(rc.entityId) ?? new Set<string>();
    set.add(rc.conceptId);
    conceptsByEntity.set(rc.entityId, set);
  }

  const entityIds = Array.from(conceptsByEntity.keys()).slice(0, limit);
  let clustersCreated = 0;
  let duplicatesFound = 0;
  const processedPairs = new Set<string>();

  for (const entityId of entityIds) {
    const sourceConcepts = conceptsByEntity.get(entityId)!;
    const similarMembers: SimilarityClusterMember[] = [];

    for (const candidateId of entityIds) {
      if (candidateId === entityId) continue;
      const pairKey = [entityId, candidateId].sort().join(":");
      if (processedPairs.has(pairKey)) continue;

      const candidateConcepts = conceptsByEntity.get(candidateId)!;
      let intersection = 0;
      for (const c of sourceConcepts) {
        if (candidateConcepts.has(c)) intersection += 1;
      }
      const union = sourceConcepts.size + candidateConcepts.size - intersection;
      const similarity = union > 0 ? intersection / union : 0;

      if (similarity >= threshold) {
        duplicatesFound += 1;
        similarMembers.push({
          entityType: input.entityType,
          entityId: candidateId,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
      processedPairs.add(pairKey);
    }

    if (similarMembers.length > 0) {
      await createSimilarityCluster({
        entityType: input.entityType,
        centroidEntityId: entityId,
        centroidTitle: entityId,
        members: [
          { entityType: input.entityType, entityId, similarity: 1 },
          ...similarMembers,
        ],
        clusterType: "duplicate",
        threshold,
      });
      clustersCreated += 1;
    }
  }

  log.info("similarity.scan_completed", {
    entityType: input.entityType,
    entitiesScanned: entityIds.length,
    duplicatesFound,
    clustersCreated,
  });

  return { clustersCreated, duplicatesFound };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function jaccardTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection += 1;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function classifySimilarity(
  combined: number,
  conceptOverlap: number,
  textSimilarity: number,
  titleA: string,
  titleB: string,
): SimilarityClusterType {
  // Very high combined + very high text → duplicate
  if (combined >= 0.9 && textSimilarity >= 0.8) return "duplicate";
  // High concept overlap but low text → translated copy (same concepts, different words)
  if (conceptOverlap >= 0.7 && textSimilarity < 0.3) return "translated_copy";
  // Moderate text similarity with different titles → AI variant
  if (textSimilarity >= 0.5 && !titlesSimilar(titleA, titleB)) return "ai_variant";
  return "similar";
}

function titlesSimilar(a: string, b: string): boolean {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  return lowerA.includes(lowerB) || lowerB.includes(lowerA);
}

async function fetchEntityContent(entityType: string, entityId: string): Promise<{ title: string; content: string } | null> {
  try {
    if (entityType === "resource") {
      const r = await db.resource.findUnique({
        where: { id: entityId },
        select: { title: true, content: true },
      });
      if (!r) return null;
      return { title: r.title, content: r.content ?? "" };
    }
    // For other entity types, return null (we'd need entity-specific fetchers)
    return null;
  } catch {
    return null;
  }
}

function mapCluster(c: any): SimilarityClusterDto {
  return {
    id: c.id,
    name: c.name,
    entityType: c.entityType,
    members: safeParseArray<SimilarityClusterMember>(c.members),
    centroidHash: c.centroidHash,
    threshold: c.threshold,
    clusterType: c.clusterType as SimilarityClusterType,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Optional: embedding-based semantic similarity (uses Phase 4F.2 provider)
// ---------------------------------------------------------------------------

export async function computeSemanticSimilarity(textA: string, textB: string): Promise<number> {
  try {
    const provider = getEmbeddingProvider();
    const [embA, embB] = await Promise.all([provider.embed(textA), provider.embed(textB)]);
    return cosineSimilarity(embA.vector, embB.vector);
  } catch {
    // Fall back to text similarity
    return jaccardTextSimilarity(textA, textB);
  }
}
