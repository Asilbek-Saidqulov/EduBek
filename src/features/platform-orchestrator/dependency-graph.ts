/**
 * EduBek — Universal Dependency Graph.
 *
 * Phase 5D.4: Automatically map dependencies between every artifact in
 * the platform — API routes, services, repositories, events, agents,
 * workflows, extensions, knowledge-graph nodes, cloud jobs, cron jobs,
 * webhooks, and feature flags. Allows impact analysis: "If X changes,
 * what else is affected?"
 *
 * The graph is built from static metadata (file paths, event-type
 * imports, route handlers) plus runtime registration by participating
 * modules. It is rebuilt on demand and cached for the lifetime of the
 * process.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { getLogger } from "@/lib/logger";
import type {
  DependencyGraphDto, DependencyNode, DependencyEdge, DependencyNodeKind, ImpactAnalysisDto,
} from "./types";
import { BUILTIN_WORKFLOWS } from "./workflow-registry";

const log = getLogger("dependency-graph");

let cachedGraph: DependencyGraphDto | null = null;
let builtAt: string | null = null;

// ===========================================================================
// Public API
// ===========================================================================

export function getDependencyGraph(): DependencyGraphDto {
  if (cachedGraph) return cachedGraph;
  cachedGraph = buildGraph();
  builtAt = cachedGraph.builtAt;
  return cachedGraph;
}

export function rebuildDependencyGraph(): DependencyGraphDto {
  cachedGraph = buildGraph();
  builtAt = cachedGraph.builtAt;
  return cachedGraph;
}

export function analyzeImpact(sourceId: string): ImpactAnalysisDto | null {
  const graph = getDependencyGraph();
  const source = graph.nodes.find(n => n.id === sourceId);
  if (!source) return null;
  // BFS over edges where source is on the `to` side (i.e., things that depend ON source)
  const directDependents = graph.edges
    .filter(e => e.to === sourceId)
    .map(e => graph.nodes.find(n => n.id === e.from))
    .filter((n): n is DependencyNode => n !== undefined);
  const visited = new Set<string>([sourceId]);
  const transitive: DependencyNode[] = [];
  const queue: string[] = directDependents.map(n => n.id);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = graph.nodes.find(n => n.id === id);
    if (node) transitive.push(node);
    const dependents = graph.edges
      .filter(e => e.to === id)
      .map(e => e.from);
    queue.push(...dependents);
  }
  // Critical path — nodes connected via `depends_on` or `calls` edges
  const criticalPath = transitive.filter(n =>
    graph.edges.some(e => e.from === n.id && e.to === sourceId && (e.relationship === "depends_on" || e.relationship === "calls"))
  );
  const recommendedChecks: string[] = [];
  if (directDependents.some(n => n.kind === "api")) {
    recommendedChecks.push("Run API integration tests for affected routes");
  }
  if (directDependents.some(n => n.kind === "event")) {
    recommendedChecks.push("Verify event subscribers still receive payloads correctly");
  }
  if (directDependents.some(n => n.kind === "workflow")) {
    recommendedChecks.push("Re-run affected workflows to confirm step order");
  }
  if (directDependents.some(n => n.kind === "knowledge_node")) {
    recommendedChecks.push("Recompute knowledge-graph embeddings for affected concepts");
  }
  if (directDependents.some(n => n.kind === "extension")) {
    recommendedChecks.push("Notify extension developers via the developer portal");
  }
  if (recommendedChecks.length === 0) {
    recommendedChecks.push("No specific checks recommended — review changes manually");
  }
  return {
    sourceId,
    directDependents,
    transitiveDependents: transitive,
    blastRadius: transitive.length,
    criticalPath,
    recommendedChecks,
  };
}

export function findNode(id: string): DependencyNode | null {
  return getDependencyGraph().nodes.find(n => n.id === id) ?? null;
}

export function listNodesByKind(kind: DependencyNodeKind): DependencyNode[] {
  return getDependencyGraph().nodes.filter(n => n.kind === kind);
}

export function findPath(fromId: string, toId: string): DependencyNode[] | null {
  const graph = getDependencyGraph();
  if (!graph.nodes.some(n => n.id === fromId) || !graph.nodes.some(n => n.id === toId)) return null;
  const visited = new Set<string>([fromId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];
  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === toId) {
      return path.map(p => graph.nodes.find(n => n.id === p)).filter((n): n is DependencyNode => n !== undefined);
    }
    const neighbors = graph.edges
      .filter(e => e.from === id)
      .map(e => e.to);
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push({ id: n, path: [...path, n] });
      }
    }
  }
  return null;
}

// ===========================================================================
// Graph construction
// ===========================================================================

function buildGraph(): DependencyGraphDto {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];

  // 1. Feature modules — read directories under src/features
  const features = listDirectories("src/features");
  for (const f of features) {
    nodes.push({
      id: `feature:${f}`,
      kind: "service",
      label: f,
      module: f,
      description: `Feature module: ${f}`,
    });
    // Each module's index.ts / service.ts is a service node
    const files = listFiles(`src/features/${f}`);
    for (const file of files) {
      if (file === "index.ts" || file === "service.ts" || file.endsWith(".service.ts")) {
        const nodeId = `service:${f}/${file}`;
        nodes.push({
          id: nodeId,
          kind: "service",
          label: `${f}/${file}`,
          module: f,
          description: `Service entrypoint: ${f}/${file}`,
        });
        edges.push({ from: nodeId, to: `feature:${f}`, relationship: "depends_on", weight: 1 });
      }
      if (file === "repository.ts" || file.endsWith(".repository.ts")) {
        const nodeId = `repository:${f}/${file}`;
        nodes.push({
          id: nodeId,
          kind: "repository",
          label: `${f}/${file}`,
          module: f,
          description: `Repository: ${f}/${file}`,
        });
        edges.push({ from: `feature:${f}`, to: nodeId, relationship: "calls", weight: 1 });
      }
    }
  }

  // 2. API routes — read directories under src/app/api
  const apiDirs = listDirectories("src/app/api");
  for (const dir of apiDirs) {
    const routeFiles = findRouteFiles(`src/app/api/${dir}`);
    for (const route of routeFiles) {
      const nodeId = `api:${dir}/${route.path}`;
      nodes.push({
        id: nodeId,
        kind: "api",
        label: `/api/${dir}${route.path}`,
        module: dir,
        description: `API route: /api/${dir}${route.path}`,
      });
      // The route likely depends on a feature module — try to infer from imports
      const imports = extractImports(route.fullPath);
      for (const imp of imports) {
        const match = imp.match(/@\/features\/([^/"']+)/);
        if (match) {
          const feat = match[1];
          edges.push({ from: nodeId, to: `feature:${feat}`, relationship: "calls", weight: 2 });
        }
      }
    }
  }

  // 3. Events — read event-type constants from the event-bus
  const eventTypes = extractEventTypes();
  for (const evt of eventTypes) {
    nodes.push({
      id: `event:${evt}`,
      kind: "event",
      label: evt,
      module: "event-bus",
      description: `Domain event: ${evt}`,
    });
  }

  // 4. Workflows — from the workflow registry
  for (const w of BUILTIN_WORKFLOWS) {
    const nodeId = `workflow:${w.id}`;
    nodes.push({
      id: nodeId,
      kind: "workflow",
      label: w.name,
      module: "platform-orchestrator",
      description: w.description,
      metadata: { triggers: w.triggers, stepCount: w.steps.length },
    });
    // Workflows consume events
    for (const trigger of w.triggers) {
      edges.push({ from: nodeId, to: `event:${trigger}`, relationship: "consumes", weight: 2 });
    }
    // Workflows call participating modules
    for (const mod of w.participatingModules) {
      if (nodes.some(n => n.id === `feature:${mod}`)) {
        edges.push({ from: nodeId, to: `feature:${mod}`, relationship: "calls", weight: 2 });
      }
    }
  }

  // 5. Agents — from Education OS agent registry
  const agents = extractAgents();
  for (const a of agents) {
    nodes.push({
      id: `agent:${a.id}`,
      kind: "agent",
      label: a.name,
      module: "education-os",
      description: a.description,
    });
    edges.push({ from: `agent:${a.id}`, to: `feature:education-os`, relationship: "extends", weight: 1 });
  }

  // 6. Cron jobs — from ScheduledWorkflow table (lazy; omitted if not available)
  // 7. Knowledge-graph nodes — count only, not individual entries
  // 8. Extensions — from extensions directory if present
  const extensions = listExtensions();
  for (const ext of extensions) {
    nodes.push({
      id: `extension:${ext.id}`,
      kind: "extension",
      label: ext.name,
      module: "platform-sdk",
      description: `Extension: ${ext.name}`,
    });
    edges.push({ from: `extension:${ext.id}`, to: `feature:platform-sdk`, relationship: "extends", weight: 1 });
  }

  log.info("dependency_graph.built", {
    nodes: nodes.length,
    edges: edges.length,
    builtAt: new Date().toISOString(),
  });

  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    builtAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Filesystem helpers
// ===========================================================================

function listDirectories(relPath: string): string[] {
  try {
    const abs = join(process.cwd(), relPath);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .filter(name => !name.startsWith(".") && name !== "__tests__");
  } catch {
    return [];
  }
}

function listFiles(relPath: string): string[] {
  try {
    const abs = join(process.cwd(), relPath);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(name => name.endsWith(".ts") && !name.endsWith(".test.ts"));
  } catch {
    return [];
  }
}

function findRouteFiles(relPath: string): Array<{ path: string; fullPath: string }> {
  const results: Array<{ path: string; fullPath: string }> = [];
  try {
    // Guard against overly-broad directory scans — only allow paths under
    // src/app/api to avoid Turbopack's "matches 13994 files" warning.
    if (!relPath.startsWith("src/app/api/")) return results;
    const abs = join(process.cwd(), relPath);
    if (!existsSync(abs)) return results;
    const entries = readdirSync(abs, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name === "route.ts") {
        results.push({ path: "", fullPath: join(abs, e.name) });
      } else if (e.isDirectory()) {
        const sub = findRouteFiles(join(relPath, e.name));
        for (const s of sub) {
          results.push({ path: `/${e.name}${s.path}`, fullPath: s.fullPath });
        }
      }
    }
  } catch {
    /* noop */
  }
  return results;
}

function extractImports(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, "utf-8");
    const matches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
    return Array.from(matches).map(m => m[1]);
  } catch {
    return [];
  }
}

function extractEventTypes(): string[] {
  // Hardcoded list — keep in sync with src/infra/event-bus/events.ts
  // We avoid importing the file directly because the events file is large
  // and we want the graph builder to be side-effect free.
  return [
    "user.registered", "user.logged_in", "user.logged_out",
    "resource.created", "resource.updated", "resource.archived",
    "ai.generation_started", "ai.generation_completed", "ai.generation_failed",
    "listing.published", "review.created",
    "subscription.started", "subscription.renewed",
    "classroom.created", "student.joined_class",
    "assignment.published", "assignment.submitted",
    "submission.graded", "assessment.published", "assessment.submitted",
    "assessment.auto_graded", "certificate.issued",
    "learning.session_completed", "progress.updated",
    "live.session_finished", "plagiarism.flagged",
    "billing.invoice_paid",
  ];
}

function extractAgents(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: "teacher", name: "Teacher Agent", description: "Pedagogical design & instruction" },
    { id: "student", name: "Student Agent", description: "Learner model & study assistance" },
    { id: "curriculum", name: "Curriculum Agent", description: "Curriculum alignment & coverage" },
    { id: "assessment", name: "Assessment Agent", description: "Question & rubric authoring" },
    { id: "organization", name: "Organization Agent", description: "Institutional operations" },
    { id: "marketplace", name: "Marketplace Agent", description: "Listing & pricing intelligence" },
    { id: "planner", name: "Planner Agent", description: "Adaptive learning plans" },
    { id: "notification", name: "Notification Agent", description: "Multichannel delivery" },
    { id: "analytics", name: "Analytics Agent", description: "Insight generation" },
  ];
}

function listExtensions(): Array<{ id: string; name: string }> {
  // For Phase 5D.4, we return an empty list — extensions are registered at runtime
  // by the platform-sdk module. This is a stub for static analysis.
  return [];
}

// ===========================================================================
// Graph utilities
// ===========================================================================

export function getGraphStats() {
  const g = getDependencyGraph();
  const byKind: Record<string, number> = {};
  for (const n of g.nodes) {
    byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  }
  const byRelationship: Record<string, number> = {};
  for (const e of g.edges) {
    byRelationship[e.relationship] = (byRelationship[e.relationship] ?? 0) + 1;
  }
  return {
    totalNodes: g.totalNodes,
    totalEdges: g.totalEdges,
    byKind,
    byRelationship,
    builtAt: g.builtAt,
  };
}
