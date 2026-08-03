/**
 * System 5 — Event Correlation Graph.
 *
 * Visual relationship graph tracking traceId, correlationId, causationId,
 * parent, children, event chain. Supports root event, dependency graph,
 * timeline, fan-out, fan-in.
 *
 * NEVER changes events. Visualization only.
 *
 * OpenTelemetry compatible: uses traceId, correlationId, causationId
 * conventions consistent with OpenTelemetry spans.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import {
  storeCorrelationNode, getCorrelationNode, getAllCorrelationNodes,
  storeCorrelationEdge, getAllCorrelationEdges,
  getCorrelationNodesByTrace, getRootEventForTrace,
} from "./repository";
import type {
  CorrelationNode,
  CorrelationEdge,
  CorrelationGraph,
  CorrelationTimeline,
  EventMetadata,
} from "./types";
import type { EventProducer } from "@/features/game-engine/events";

const log = getLogger("event-governance.correlation");

// ===========================================================================
// Node registration
// ===========================================================================

export function registerCorrelationNode(input: {
  eventInstanceId?: string;
  eventType: string;
  traceId?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  parentEventId?: string | null;
  timestamp?: string;
  producer: EventProducer;
  metadata?: EventMetadata;
}): CorrelationNode {
  const eventInstanceId = input.eventInstanceId ?? randomUUID();
  const node: CorrelationNode = {
    eventId: eventInstanceId,
    eventType: input.eventType,
    traceId: input.traceId ?? null,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    parentEventId: input.parentEventId ?? null,
    childEventIds: [],
    timestamp: input.timestamp ?? new Date().toISOString(),
    producer: input.producer,
    metadata: input.metadata ?? {},
  };
  storeCorrelationNode(node);
  // If this node has a parent, add it as a child of the parent
  if (node.parentEventId) {
    const parent = getCorrelationNode(node.parentEventId);
    if (parent) {
      parent.childEventIds.push(node.eventId);
      // Also store an edge
      storeCorrelationEdge({
        fromEventId: node.parentEventId,
        toEventId: node.eventId,
        relationship: "child_of",
        strength: 1.0,
      });
    }
  }
  // If causationId is set, add a "caused_by" edge
  if (node.causationId && node.causationId !== node.parentEventId) {
    storeCorrelationEdge({
      fromEventId: node.eventId,
      toEventId: node.causationId,
      relationship: "caused_by",
      strength: 1.0,
    });
  }
  log.debug("correlation.node.registered", { eventInstanceId, eventType: input.eventType });
  return node;
}

export function getCorrelationNodeById(eventInstanceId: string): CorrelationNode | null {
  return getCorrelationNode(eventInstanceId);
}

// ===========================================================================
// Graph construction
// ===========================================================================

/**
 * Build a correlation graph starting from a root event.
 * Returns the full tree of descendants.
 */
export function buildCorrelationGraph(rootEventId: string): CorrelationGraph {
  const root = getCorrelationNode(rootEventId);
  if (!root) {
    return { rootEventId: null, nodes: [], edges: [], depth: 0, totalEvents: 0, fanOut: 0, fanIn: 0 };
  }
  const nodes: CorrelationNode[] = [];
  const edges: CorrelationEdge[] = [];
  const visited = new Set<string>();
  const queue: Array<{ node: CorrelationNode; depth: number }> = [{ node: root, depth: 0 }];
  let maxDepth = 0;
  let fanOut = 0;
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (visited.has(node.eventId)) continue;
    visited.add(node.eventId);
    nodes.push(node);
    maxDepth = Math.max(maxDepth, depth);
    fanOut = Math.max(fanOut, node.childEventIds.length);
    for (const childId of node.childEventIds) {
      const child = getCorrelationNode(childId);
      if (child) {
        edges.push({
          fromEventId: node.eventId,
          toEventId: childId,
          relationship: "child_of",
          strength: 1.0,
        });
        queue.push({ node: child, depth: depth + 1 });
      }
    }
  }
  // Fan-in: count how many nodes point to the root
  const fanIn = getAllCorrelationEdges().filter(e => e.toEventId === rootEventId).length;
  return {
    rootEventId,
    nodes,
    edges,
    depth: maxDepth,
    totalEvents: nodes.length,
    fanOut,
    fanIn,
  };
}

/**
 * Build a correlation graph for an entire trace.
 */
export function buildTraceGraph(traceId: string): CorrelationGraph {
  const traceNodes = getCorrelationNodesByTrace(traceId);
  if (traceNodes.length === 0) {
    return { rootEventId: null, nodes: [], edges: [], depth: 0, totalEvents: 0, fanOut: 0, fanIn: 0 };
  }
  const rootId = getRootEventForTrace(traceId) ?? traceNodes[0].eventId;
  return buildCorrelationGraph(rootId);
}

/**
 * Build a timeline of events for a trace.
 */
export function buildTimeline(traceId: string): CorrelationTimeline {
  const traceNodes = getCorrelationNodesByTrace(traceId);
  const sorted = [...traceNodes].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const rootId = getRootEventForTrace(traceId) ?? sorted[0]?.eventId ?? null;
  // Compute depth for each node
  const depthMap = new Map<string, number>();
  for (const node of sorted) {
    if (node.parentEventId && depthMap.has(node.parentEventId)) {
      depthMap.set(node.eventId, (depthMap.get(node.parentEventId) ?? 0) + 1);
    } else {
      depthMap.set(node.eventId, 0);
    }
  }
  const events = sorted.map(n => ({
    eventId: n.eventId,
    eventType: n.eventType,
    timestamp: n.timestamp,
    depth: depthMap.get(n.eventId) ?? 0,
    producer: n.producer,
  }));
  const duration = sorted.length > 1
    ? new Date(sorted[sorted.length - 1].timestamp).getTime() - new Date(sorted[0].timestamp).getTime()
    : 0;
  return { events, duration, rootEventId: rootId };
}

// ===========================================================================
// Graph queries
// ===========================================================================

export function getChildren(eventInstanceId: string): CorrelationNode[] {
  const node = getCorrelationNode(eventInstanceId);
  if (!node) return [];
  return node.childEventIds.map(id => getCorrelationNode(id)).filter(Boolean) as CorrelationNode[];
}

export function getParent(eventInstanceId: string): CorrelationNode | null {
  const node = getCorrelationNode(eventInstanceId);
  if (!node || !node.parentEventId) return null;
  return getCorrelationNode(node.parentEventId);
}

export function getEventChain(eventInstanceId: string): CorrelationNode[] {
  const chain: CorrelationNode[] = [];
  let current = getCorrelationNode(eventInstanceId);
  while (current) {
    chain.unshift(current);
    current = current.parentEventId ? getCorrelationNode(current.parentEventId) : null;
  }
  return chain;
}

export function getAllEdges(): CorrelationEdge[] {
  return getAllCorrelationEdges();
}

export function getAllNodes(): CorrelationNode[] {
  return getAllCorrelationNodes();
}

// ===========================================================================
// Graph statistics
// ===========================================================================

export function getCorrelationStats(): {
  totalNodes: number;
  totalEdges: number;
  totalTraces: number;
  avgChainLength: number;
  maxFanOut: number;
  maxFanIn: number;
} {
  const nodes = getAllCorrelationNodes();
  const edges = getAllCorrelationEdges();
  const traces = new Set(nodes.map(n => n.traceId).filter(Boolean));
  const chainLengths = nodes.map(n => getEventChain(n.eventId).length);
  const avgChain = chainLengths.length > 0
    ? Math.round(chainLengths.reduce((s, l) => s + l, 0) / chainLengths.length * 100) / 100
    : 0;
  const maxFanOut = Math.max(0, ...nodes.map(n => n.childEventIds.length));
  const maxFanIn = Math.max(0, ...nodes.map(n => edges.filter(e => e.toEventId === n.eventId).length));
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalTraces: traces.size,
    avgChainLength: avgChain,
    maxFanOut,
    maxFanIn,
  };
}
