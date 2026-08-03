/**
 * EduBek — Learning Network Graph.
 *
 * Phase 4F.4: Adds 10 new edge types to the existing Knowledge Graph
 * (Phase 4F.1) so every collaborative relationship in EduBek becomes
 * first-class graph data:
 *
 *   MENTORS, COLLABORATES_WITH, MEMBER_OF, TEACHES, STUDIES_WITH,
 *   RECOMMENDED_FOR, ASSIGNED_TO, REVIEWS, DISCUSSES, HELPS
 *
 * The graph reuses the existing `KnowledgeGraphNode` + `KnowledgeGraphEdge`
 * tables — no new tables needed. Each new edge type is just a string
 * value on `edgeType`. This means all existing graph queries
 * (traversal, related content, recommendations) automatically include
 * the new edges.
 *
 * Whenever a study group is created, a member joins, a discussion
 * starts, an assignment is given, or a mentorship begins, this module
 * is called to add the corresponding graph edge. This is what binds
 * the collaboration layer to the rest of EduBek's intelligence.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import type { CollaborationEdgeType, NetworkGraphDto, NetworkEdgeDto, NetworkNodeDto } from "./types";

const log = getLogger("network-graph");

// ---------------------------------------------------------------------------
// Helpers — fetch or create a KnowledgeGraphNode for an entity
// ---------------------------------------------------------------------------

async function ensureNode(input: {
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  language?: string;
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
      description: input.description ?? null,
      language: input.language ?? "en",
      payload: "{}",
      availableLanguages: "[]",
      popularity: 0.5,
      quality: 0.5,
    },
  });
  return { id: node.id, created: true };
}

// ---------------------------------------------------------------------------
// Edge creation
// ---------------------------------------------------------------------------

export async function addCollaborationEdge(input: {
  fromEntityType: string;
  fromEntityId: string;
  fromTitle: string;
  toEntityType: string;
  toEntityId: string;
  toTitle: string;
  edgeType: CollaborationEdgeType;
  weight?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ edgeId: string; fromNodeId: string; toNodeId: string }> {
  // Ensure both nodes exist
  const [fromNode, toNode] = await Promise.all([
    ensureNode({
      entityType: input.fromEntityType,
      entityId: input.fromEntityId,
      title: input.fromTitle,
    }),
    ensureNode({
      entityType: input.toEntityType,
      entityId: input.toEntityId,
      title: input.toTitle,
    }),
  ]);

  // Check if the edge already exists (idempotent) — if so, update the weight.
  const existingEdge = await db.knowledgeGraphEdge.findFirst({
    where: {
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      edgeType: input.edgeType,
    },
  });

  if (existingEdge) {
    await db.knowledgeGraphEdge.update({
      where: { id: existingEdge.id },
      data: {
        weight: input.weight ?? existingEdge.weight,
        metadata: input.metadata ? JSON.stringify(input.metadata) : existingEdge.metadata,
      },
    });
    log.debug("network.edge.updated", {
      edgeType: input.edgeType,
      from: input.fromEntityType,
      to: input.toEntityType,
    });
    return { edgeId: existingEdge.id, fromNodeId: fromNode.id, toNodeId: toNode.id };
  }

  const edge = await db.knowledgeGraphEdge.create({
    data: {
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      edgeType: input.edgeType,
      weight: input.weight ?? 1,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  log.info("network.edge.added", {
    edgeType: input.edgeType,
    from: `${input.fromEntityType}:${input.fromEntityId}`,
    to: `${input.toEntityType}:${input.toEntityId}`,
  });

  return { edgeId: edge.id, fromNodeId: fromNode.id, toNodeId: toNode.id };
}

// ---------------------------------------------------------------------------
// Edge removal
// ---------------------------------------------------------------------------

export async function removeCollaborationEdge(input: {
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  edgeType: CollaborationEdgeType;
}): Promise<number> {
  // Find both nodes
  const [fromNode, toNode] = await Promise.all([
    db.knowledgeGraphNode.findUnique({
      where: {
        entityType_entityId: { entityType: input.fromEntityType, entityId: input.fromEntityId },
      },
      select: { id: true },
    }),
    db.knowledgeGraphNode.findUnique({
      where: {
        entityType_entityId: { entityType: input.toEntityType, entityId: input.toEntityId },
      },
      select: { id: true },
    }),
  ]);

  if (!fromNode || !toNode) return 0;

  const result = await db.knowledgeGraphEdge.deleteMany({
    where: {
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      edgeType: input.edgeType,
    },
  });

  log.info("network.edge.removed", {
    edgeType: input.edgeType,
    from: `${input.fromEntityType}:${input.fromEntityId}`,
    to: `${input.toEntityType}:${input.toEntityId}`,
    count: result.count,
  });

  return result.count;
}

// ---------------------------------------------------------------------------
// Graph queries
// ---------------------------------------------------------------------------

/**
 * Fetch the collaboration neighborhood of an entity — all nodes
 * directly connected via any of the 10 collaboration edge types.
 */
export async function getCollaborationNeighborhood(input: {
  entityType: string;
  entityId: string;
  edgeTypes?: CollaborationEdgeType[];
  limit?: number;
}): Promise<NetworkGraphDto> {
  const node = await db.knowledgeGraphNode.findUnique({
    where: {
      entityType_entityId: { entityType: input.entityType, entityId: input.entityId },
    },
    select: { id: true, entityType: true, entityId: true, title: true, description: true },
  });

  if (!node) {
    return { nodes: [], edges: [], totalCount: 0 };
  }

  const edgeTypes = input.edgeTypes ?? [
    "MENTORS", "COLLABORATES_WITH", "MEMBER_OF", "TEACHES", "STUDIES_WITH",
    "RECOMMENDED_FOR", "ASSIGNED_TO", "REVIEWS", "DISCUSSES", "HELPS",
  ];

  const limit = input.limit ?? 50;

  // Outgoing edges
  const outEdges = await db.knowledgeGraphEdge.findMany({
    where: { fromNodeId: node.id, edgeType: { in: edgeTypes } },
    take: limit,
  });

  // Incoming edges
  const inEdges = await db.knowledgeGraphEdge.findMany({
    where: { toNodeId: node.id, edgeType: { in: edgeTypes } },
    take: limit,
  });

  const allEdges = [...outEdges, ...inEdges];
  const neighborIds = new Set<string>();
  for (const e of allEdges) {
    if (e.fromNodeId !== node.id) neighborIds.add(e.fromNodeId);
    if (e.toNodeId !== node.id) neighborIds.add(e.toNodeId);
  }

  const neighborNodes = neighborIds.size > 0
    ? await db.knowledgeGraphNode.findMany({
        where: { id: { in: Array.from(neighborIds) } },
        select: { id: true, entityType: true, entityId: true, title: true, description: true },
      })
    : [];

  const nodes: NetworkNodeDto[] = [
    {
      id: node.id,
      entityType: node.entityType,
      entityId: node.entityId,
      title: node.title,
      description: node.description,
    },
    ...neighborNodes.map((n) => ({
      id: n.id,
      entityType: n.entityType,
      entityId: n.entityId,
      title: n.title,
      description: n.description,
    })),
  ];

  const edges: NetworkEdgeDto[] = allEdges.map((e) => ({
    id: e.id,
    fromNodeId: e.fromNodeId,
    toNodeId: e.toNodeId,
    edgeType: e.edgeType as CollaborationEdgeType,
    weight: e.weight,
    metadata: e.metadata ? safeParse(e.metadata, null) : null,
    createdAt: e.createdAt.toISOString(),
  }));

  return { nodes, edges, totalCount: edges.length };
}

/**
 * Find users who teach a specific topic (via TEACHES edges from the
 * topic node to user nodes).
 */
export async function findTeachersForTopic(topicId: string, limit = 20): Promise<NetworkNodeDto[]> {
  const edges = await db.knowledgeGraphEdge.findMany({
    where: {
      edgeType: "TEACHES",
      OR: [
        { fromNode: { entityType: "topic", entityId: topicId } },
        { toNode: { entityType: "topic", entityId: topicId } },
      ],
    },
    take: limit,
    include: { fromNode: true, toNode: true },
  });

  const teachers: NetworkNodeDto[] = [];
  for (const edge of edges) {
    const teacher = edge.fromNode.entityType === "user" ? edge.fromNode : edge.toNode;
    teachers.push({
      id: teacher.id,
      entityType: teacher.entityType,
      entityId: teacher.entityId,
      title: teacher.title,
      description: teacher.description,
    });
  }
  return teachers;
}

/**
 * Find all study groups a user is a member of (via MEMBER_OF edges
 * from the user node to study_group nodes).
 */
export async function findUserStudyGroups(userId: string): Promise<NetworkNodeDto[]> {
  const edges = await db.knowledgeGraphEdge.findMany({
    where: {
      edgeType: "MEMBER_OF",
      fromNode: { entityType: "user", entityId: userId },
    },
    include: { toNode: true },
  });

  return edges.map((e) => ({
    id: e.toNode.id,
    entityType: e.toNode.entityType,
    entityId: e.toNode.entityId,
    title: e.toNode.title,
    description: e.toNode.description,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse(raw: string | null, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
