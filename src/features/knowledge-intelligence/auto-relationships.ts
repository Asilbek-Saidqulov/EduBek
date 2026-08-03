/**
 * EduBek — Automatic Content Relationships.
 *
 * Phase 4F.5: Automatically creates Knowledge Graph edges between
 * educational entities based on shared concepts, curriculum mappings,
 * and explicit relationships (e.g. a quiz ASSESSES a resource).
 *
 * Edge types created:
 *
 *   • USES         — resource uses a concept
 *   • REFERENCES   — resource references another resource
 *   • RELATED      — resources share concepts
 *   • SIMILAR      — resources with high concept overlap
 *   • PREREQUISITE — resource A is a prerequisite for resource B
 *   • NEXT         — resource B is the natural next step after A
 *   • DERIVED_FROM — resource is derived from another (e.g. AI variant)
 *   • TRANSLATED_FROM — resource is a translation of another
 *   • SUPPLEMENTS  — resource supplements another (additional material)
 *   • REINFORCES   — resource reinforces another (practice problems for a lesson)
 *   • ASSESSES     — quiz/assessment assesses a resource/concept
 *   • EXPLAINS     — resource explains a concept in more depth
 *
 * No manual graph maintenance — every new resource automatically gets
 * connected to the existing graph.
 *
 * Reuses:
 *   • Phase 4F.1 Knowledge Graph (KnowledgeGraphNode + KnowledgeGraphEdge)
 *   • Phase 4F.5 ResourceConcept (concept ↔ entity links)
 *   • Phase 4F.5 ConceptRelationship (concept ↔ concept links)
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import type { EdgeType } from "@/features/discovery/types";

const log = getLogger("auto-relationships");

// ---------------------------------------------------------------------------
// Edge types that can be auto-created
// ---------------------------------------------------------------------------

const AUTO_EDGE_TYPES: EdgeType[] = [
  "USES", "REFERENCES", "RELATED", "SIMILAR", "PREREQUISITE", "NEXT",
  "DERIVED_FROM", "TRANSLATED_FROM", "SUPPLEMENTS", "REINFORCES",
  "ASSESSES", "EXPLAINS",
];

// ---------------------------------------------------------------------------
// Public entry point: auto-link an entity to the rest of the graph
// ---------------------------------------------------------------------------

/**
 * For a given entity, find related entities via shared concepts and
 * create KnowledgeGraphEdge entries. Called whenever a resource is
 * analyzed (concept extraction + indexing).
 *
 * @param entityType 'resource' | 'quiz' | 'assessment' | 'lesson'
 * @param entityId   The entity's ID
 */
export async function autoLinkEntity(input: {
  entityType: string;
  entityId: string;
}): Promise<{ edgesCreated: number; edgesByType: Record<string, number> }> {
  const { entityType, entityId } = input;

  // Fetch this entity's concepts
  const myConcepts = await db.resourceConcept.findMany({
    where: { entityType, entityId },
    select: { conceptId: true, relationship: true, weight: true },
  }).catch(() => []);

  if (myConcepts.length === 0) return { edgesCreated: 0, edgesByType: {} };

  const myConceptIds = new Set(myConcepts.map((c) => c.conceptId));

  // Find other entities that share concepts
  const sharingEntities = await db.resourceConcept.findMany({
    where: {
      conceptId: { in: Array.from(myConceptIds) },
      OR: [
        { entityType: { not: entityType } },
        { entityId: { not: entityId } },
      ],
    },
    select: { entityType: true, entityId: true, conceptId: true, relationship: true, weight: true },
  }).catch(() => []);

  // Group by (entityType, entityId) and compute overlap
  const overlap = new Map<string, { sharedConcepts: number; totalConcepts: number; relationships: Set<string> }>();
  for (const rc of sharingEntities) {
    const key = `${rc.entityType}:${rc.entityId}`;
    const entry = overlap.get(key) ?? { sharedConcepts: 0, totalConcepts: 0, relationships: new Set<string>() };
    entry.sharedConcepts += 1;
    entry.relationships.add(rc.relationship);
    overlap.set(key, entry);
  }

  // Fetch total concept counts for each candidate (to compute Jaccard)
  const candidateKeys = Array.from(overlap.keys());
  for (const key of candidateKeys) {
    const [cEntityType, cEntityId] = key.split(":");
    const count = await db.resourceConcept.count({
      where: { entityType: cEntityType, entityId: cEntityId },
    }).catch(() => 0);
    overlap.get(key)!.totalConcepts = count;
  }

  // Ensure both source + target KnowledgeGraphNodes exist
  const sourceNode = await ensureGraphNode(entityType, entityId);
  if (!sourceNode) return { edgesCreated: 0, edgesByType: {} };

  let edgesCreated = 0;
  const edgesByType: Record<string, number> = {};

  for (const [key, data] of overlap) {
    const [cEntityType, cEntityId] = key.split(":");
    const targetNode = await ensureGraphNode(cEntityType!, cEntityId!);
    if (!targetNode) continue;

    // Compute Jaccard similarity
    const union = myConcepts.length + data.totalConcepts - data.sharedConcepts;
    const jaccard = union > 0 ? data.sharedConcepts / union : 0;

    // Determine edge type(s) to create
    const edgeTypes = determineEdgeTypes(jaccard, data.relationships, entityType, cEntityType!);
    for (const edgeType of edgeTypes) {
      // Skip if not in the auto-create list
      if (!AUTO_EDGE_TYPES.includes(edgeType)) continue;
      const created = await createEdgeOnce(sourceNode, targetNode, edgeType, jaccard);
      if (created) {
        edgesCreated += 1;
        edgesByType[edgeType] = (edgesByType[edgeType] ?? 0) + 1;
      }
    }
  }

  log.info("auto_link.completed", {
    entityType, entityId,
    candidateCount: candidateKeys.length,
    edgesCreated,
    edgesByType,
  });

  return { edgesCreated, edgesByType };
}

// ---------------------------------------------------------------------------
// Manual edge creation API (for tests + admin tools)
// ---------------------------------------------------------------------------

export async function createRelationship(input: {
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  edgeType: EdgeType;
  weight?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const [fromNode, toNode] = await Promise.all([
    ensureGraphNode(input.fromEntityType, input.fromEntityId),
    ensureGraphNode(input.toEntityType, input.toEntityId),
  ]);
  if (!fromNode || !toNode) return;
  await createEdgeOnce(fromNode, toNode, input.edgeType, input.weight ?? 0.5, input.metadata);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function ensureNode(input: {
  entityType: string;
  entityId: string;
  title: string;
}): Promise<{ id: string; created: boolean }> {
  const existing = await db.knowledgeGraphNode.findUnique({
    where: {
      entityType_entityId: { entityType: input.entityType, entityId: input.entityId },
    },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const node = await db.knowledgeGraphNode.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      language: "en",
      payload: "{}",
      availableLanguages: "[]",
      popularity: 0.5,
      quality: 0.5,
    },
  });
  return { id: node.id, created: true };
}

async function ensureGraphNode(entityType: string, entityId: string): Promise<string | null> {
  // Try to fetch a title from the underlying entity
  let title = `${entityType}:${entityId}`;
  try {
    if (entityType === "resource") {
      const r = await db.resource.findUnique({ where: { id: entityId }, select: { title: true } });
      if (r) title = r.title;
    } else if (entityType === "quiz") {
      // Quizzes are stored as resources with resourceType='quiz'
      const r = await db.resource.findUnique({ where: { id: entityId }, select: { title: true } });
      if (r) title = r.title;
    }
  } catch {
    // Use default title
  }
  const result = await ensureNode({ entityType, entityId, title });
  return result.id;
}

async function createEdgeOnce(
  fromNodeId: string,
  toNodeId: string,
  edgeType: EdgeType,
  weight: number,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  try {
    // Idempotent: check first
    const existing = await db.knowledgeGraphEdge.findFirst({
      where: { fromNodeId, toNodeId, edgeType },
    });
    if (existing) {
      // Update weight if higher
      if (weight > existing.weight) {
        await db.knowledgeGraphEdge.update({
          where: { id: existing.id },
          data: { weight, metadata: metadata ? JSON.stringify(metadata) : existing.metadata },
        });
      }
      return false;
    }
    await db.knowledgeGraphEdge.create({
      data: {
        fromNodeId,
        toNodeId,
        edgeType,
        weight,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return true;
  } catch {
    return false;
  }
}

function determineEdgeTypes(
  jaccard: number,
  relationships: Set<string>,
  sourceType: string,
  targetType: string,
): EdgeType[] {
  const edges: EdgeType[] = [];

  // High overlap → SIMILAR
  if (jaccard >= 0.6) edges.push("SIMILAR");

  // Moderate overlap → RELATED
  if (jaccard >= 0.3 && jaccard < 0.6) edges.push("RELATED");

  // If source teaches and target assesses → ASSESSES
  if (relationships.has("assesses") && sourceType === "resource" && targetType === "quiz") {
    edges.push("ASSESSES");
  }

  // If source teaches and target also teaches → REINFORCES (one reinforces the other)
  if (relationships.has("teaches") && jaccard >= 0.4 && jaccard < 0.7) {
    edges.push("REINFORCES");
  }

  // If source teaches and target references → SUPPLEMENTS
  if (relationships.has("references") && jaccard >= 0.2) {
    edges.push("SUPPLEMENTS");
  }

  return edges;
}
