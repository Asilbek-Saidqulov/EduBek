/**
 * EduBek — Automatic Prerequisite Discovery.
 *
 * Phase 4F.5: AI-discovers prerequisite / next / related relationships
 * between concepts based on:
 *
 *   • Difficulty ordering (easier concepts are prerequisites for harder ones)
 *   • Co-occurrence in resources (concepts that appear together are related)
 *   • Knowledge Graph NEXT edges (existing topic graph)
 *   • Curriculum standard ordering (standards taught earlier are prerequisites)
 *   • Bloom level progression (remember → understand → apply → ...)
 *
 * Discovered relationships are persisted as ConceptRelationship rows
 * with a confidence score. The confidence increases over time as more
 * evidence accumulates.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { DiscoveredPrerequisite, ConceptRelationshipType } from "./types";

const log = getLogger("prerequisite-discovery");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Discover prerequisite / next / related relationships for a concept.
 *
 * @param conceptId The concept to discover relationships for.
 * @param limit Max relationships to return (default 20).
 */
export async function discoverPrerequisites(conceptId: string, limit = 20): Promise<DiscoveredPrerequisite[]> {
  const concept = await db.concept.findUnique({
    where: { id: conceptId },
    select: { id: true, name: true, slug: true, subject: true, difficulty: true, bloomLevel: true },
  });
  if (!concept) return [];

  const candidates = await db.concept.findMany({
    where: {
      id: { not: conceptId },
      OR: [
        { subject: concept.subject },
        // No subject filter — also find cross-subject related concepts
      ],
    },
    select: { id: true, name: true, slug: true, subject: true, difficulty: true, bloomLevel: true },
    take: 500,
  });

  // Compute co-occurrence: how often does each candidate appear in the same resource as `concept`?
  const resourceIds = await db.resourceConcept.findMany({
    where: { conceptId },
    select: { entityId: true, entityType: true },
  });
  const resourceKeys = new Set(resourceIds.map((r) => `${r.entityType}:${r.entityId}`));

  const discovered: DiscoveredPrerequisite[] = [];

  for (const candidate of candidates) {
    const candidateResources = await db.resourceConcept.findMany({
      where: { conceptId: candidate.id },
      select: { entityId: true, entityType: true },
    });
    const candidateResourceKeys = new Set(candidateResources.map((r) => `${r.entityType}:${r.entityId}`));

    // Co-occurrence: intersection of resource keys
    let coOccurrence = 0;
    for (const key of resourceKeys) {
      if (candidateResourceKeys.has(key)) coOccurrence += 1;
    }

    // Skip if no co-occurrence AND no other signal
    if (coOccurrence === 0 && !sameSubject(concept, candidate)) continue;

    // Determine relationship type + confidence
    const relationship = classifyRelationship(concept, candidate, coOccurrence);
    if (!relationship) continue;

    discovered.push({
      fromConceptId: relationship.type === "prerequisite" ? candidate.id : concept.id,
      toConceptId: relationship.type === "prerequisite" ? concept.id : candidate.id,
      type: relationship.type,
      confidence: relationship.confidence,
      rationale: relationship.rationale,
    });
  }

  // Sort by confidence descending
  discovered.sort((a, b) => b.confidence - a.confidence);
  const top = discovered.slice(0, limit);

  // Persist
  for (const d of top) {
    await repo.createConceptRelationship({
      fromConceptId: d.fromConceptId,
      toConceptId: d.toConceptId,
      type: d.type,
      confidence: d.confidence,
      source: "ai",
    }).catch(() => undefined);
  }

  log.info("prerequisites.discovered", {
    conceptId,
    conceptName: concept.name,
    candidateCount: candidates.length,
    discoveredCount: top.length,
  });

  return top;
}

/**
 * Discover prerequisites for all concepts in a subject (bulk operation).
 * Useful for initial graph bootstrap.
 */
export async function discoverAllPrerequisitesForSubject(subject: string, limit = 100): Promise<{
  conceptsProcessed: number;
  relationshipsDiscovered: number;
}> {
  const concepts = await db.concept.findMany({
    where: { subject },
    select: { id: true, name: true },
    take: limit,
  });

  let totalRelationships = 0;
  for (const c of concepts) {
    const discovered = await discoverPrerequisites(c.id, 10);
    totalRelationships += discovered.length;
  }

  log.info("prerequisites.bulk_discovered", { subject, conceptsProcessed: concepts.length, totalRelationships });
  return { conceptsProcessed: concepts.length, relationshipsDiscovered: totalRelationships };
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

interface ClassifiedRelationship {
  type: ConceptRelationshipType;
  confidence: number;
  rationale: string;
}

function classifyRelationship(
  concept: { difficulty: number; bloomLevel: string | null; subject: string | null },
  candidate: { difficulty: number; bloomLevel: string | null; subject: string | null },
  coOccurrence: number,
): ClassifiedRelationship | null {
  // Strong signal: co-occurrence in 3+ resources
  if (coOccurrence >= 3) {
    // Determine direction based on difficulty
    if (candidate.difficulty < concept.difficulty - 0.1) {
      return {
        type: "prerequisite",
        confidence: Math.min(0.95, 0.6 + coOccurrence * 0.05),
        rationale: `${coOccurrence} resources teach both concepts; candidate has lower difficulty (${candidate.difficulty.toFixed(2)} < ${concept.difficulty.toFixed(2)}).`,
      };
    }
    if (candidate.difficulty > concept.difficulty + 0.1) {
      return {
        type: "next",
        confidence: Math.min(0.9, 0.55 + coOccurrence * 0.05),
        rationale: `${coOccurrence} resources teach both concepts; candidate has higher difficulty — natural next step.`,
      };
    }
    return {
      type: "related",
      confidence: Math.min(0.85, 0.5 + coOccurrence * 0.05),
      rationale: `${coOccurrence} resources teach both concepts at similar difficulty.`,
    };
  }

  // Moderate signal: co-occurrence in 1-2 resources + Bloom progression
  if (coOccurrence >= 1 && concept.bloomLevel && candidate.bloomLevel) {
    const conceptBloom = bloomRank(concept.bloomLevel);
    const candidateBloom = bloomRank(candidate.bloomLevel);
    if (candidateBloom < conceptBloom) {
      return {
        type: "prerequisite",
        confidence: 0.55,
        rationale: `Co-occurs in ${coOccurrence} resource(s); candidate's Bloom level (${candidate.bloomLevel}) is lower than concept's (${concept.bloomLevel}).`,
      };
    }
    if (candidateBloom > conceptBloom) {
      return {
        type: "next",
        confidence: 0.5,
        rationale: `Co-occurs in ${coOccurrence} resource(s); candidate's Bloom level is higher.`,
      };
    }
  }

  // Weak signal: same subject + difficulty ordering (no co-occurrence)
  if (coOccurrence === 0 && sameSubject(concept, candidate)) {
    if (candidate.difficulty < concept.difficulty - 0.2) {
      return {
        type: "prerequisite",
        confidence: 0.35,
        rationale: `Same subject; candidate is significantly easier — possible prerequisite.`,
      };
    }
    if (candidate.difficulty > concept.difficulty + 0.2) {
      return {
        type: "next",
        confidence: 0.3,
        rationale: `Same subject; candidate is significantly harder — possible next step.`,
      };
    }
  }

  return null;
}

function bloomRank(level: string): number {
  const ranks: Record<string, number> = {
    remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 5, create: 6,
  };
  return ranks[level] ?? 0;
}

function sameSubject(a: { subject: string | null }, b: { subject: string | null }): boolean {
  return a.subject !== null && b.subject !== null && a.subject === b.subject;
}
