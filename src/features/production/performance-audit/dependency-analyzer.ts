/**
 * EduBek — Dependency Analyzer (System 7).
 *
 * Analyzes service, repository, workflow, event, and agent
 * dependencies. Finds circular dependencies, deep chains, high
 * coupling, unused services, dead modules, and duplicate utilities.
 *
 * REUSES Platform Orchestrator's dependency graph — never duplicates
 * the graph construction.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@/lib/logger";
import { getDependencyGraph } from "@/features/platform-orchestrator/dependency-graph";
import * as repo from "./repository";
import type {
  DependencyAnalysisReport, CircularDependency, DependencyChain,
  CouplingMetric, UnusedService, DeadModule, DuplicateUtility,
  OptimizationRecommendation,
} from "./types";

const log = getLogger("dependency-analyzer");

export async function generateDependencyReport(): Promise<DependencyAnalysisReport> {
  const generatedAt = new Date().toISOString();
  const graph = getDependencyGraph();
  const [circular, deepChains, highCoupling, unused, dead, duplicates] = await Promise.all([
    detectCircularDependencies(graph),
    detectDeepChains(graph),
    computeCoupling(graph),
    findUnusedServices(graph),
    findDeadModules(graph),
    findDuplicateUtilities(),
  ]);
  const recommendations = generateDependencyRecommendations({
    circular, deepChains, highCoupling, unused, dead, duplicates,
  });
  log.info("dependency.audit_complete", {
    nodes: graph.totalNodes, edges: graph.totalEdges,
    circular: circular.length, deepChains: deepChains.length,
    unused: unused.length, dead: dead.length,
  });
  return {
    generatedAt,
    circularDependencies: circular, deepChains, highCoupling,
    unusedServices: unused, deadModules: dead, duplicateUtilities: duplicates,
    recommendations,
  };
}

function detectCircularDependencies(graph: ReturnType<typeof getDependencyGraph>): CircularDependency[] {
  // Detect cycles via DFS
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    if (e.relationship === "depends_on" || e.relationship === "calls") {
      adj.get(e.from)?.push(e.to);
    }
  }
  function dfs(node: string) {
    if (stack.has(node)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart).concat(node);
        cycles.push(cycle);
      }
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of adj.get(node) ?? []) dfs(next);
    path.pop();
    stack.delete(node);
  }
  for (const n of graph.nodes) dfs(n.id);
  // Deduplicate cycles
  const seen = new Set<string>();
  const unique = cycles.filter(c => {
    const key = [...c].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, 10).map(cycle => ({
    cycle,
    severity: cycle.length > 5 ? "high" : cycle.length > 3 ? "medium" : "low",
    recommendation: `Circular dependency detected: ${cycle.join(" → ")}. Break the cycle by extracting shared logic into a separate module.`,
  }));
}

function detectDeepChains(graph: ReturnType<typeof getDependencyGraph>): DependencyChain[] {
  // Find the longest paths in the DAG
  const chains: DependencyChain[] = [];
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const e of graph.edges) {
    if (e.relationship === "depends_on" || e.relationship === "calls") {
      adj.get(e.from)?.push(e.to);
    }
  }
  // BFS from each node to find longest path
  for (const start of graph.nodes) {
    const queue: Array<{ node: string; path: string[] }> = [{ node: start.id, path: [start.id] }];
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      const neighbors = adj.get(node) ?? [];
      if (neighbors.length === 0 && path.length > 5) {
        chains.push({
          start: path[0], end: node, length: path.length, path,
          recommendation: `Deep dependency chain (${path.length} hops): ${path.join(" → ")}. Consider flattening the hierarchy.`,
        });
      }
      for (const next of neighbors) {
        if (!path.includes(next)) {
          queue.push({ node: next, path: [...path, next] });
        }
      }
    }
  }
  return chains.sort((a, b) => b.length - a.length).slice(0, 10);
}

function computeCoupling(graph: ReturnType<typeof getDependencyGraph>): CouplingMetric[] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const n of graph.nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  }
  for (const e of graph.edges) {
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  const metrics: CouplingMetric[] = [];
  for (const n of graph.nodes) {
    const inc = incoming.get(n.id) ?? 0;
    const out = outgoing.get(n.id) ?? 0;
    const couplingScore = inc + out;
    if (couplingScore > 10) {
      metrics.push({
        module: n.id,
        incomingDependencies: inc,
        outgoingDependencies: out,
        couplingScore,
        recommendation: `${n.label} has high coupling (${couplingScore} dependencies). Consider splitting the module.`,
      });
    }
  }
  return metrics.sort((a, b) => b.couplingScore - a.couplingScore).slice(0, 15);
}

function findUnusedServices(graph: ReturnType<typeof getDependencyGraph>): UnusedService[] {
  // Services with no incoming dependencies
  const incoming = new Map<string, number>();
  for (const n of graph.nodes) incoming.set(n.id, 0);
  for (const e of graph.edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  const unused: UnusedService[] = [];
  for (const n of graph.nodes) {
    if (n.kind === "service" && (incoming.get(n.id) ?? 0) === 0) {
      unused.push({
        module: n.module,
        service: n.label,
        reason: "No incoming dependencies — this service is not called by any other module.",
        recommendation: "Verify whether this service is still needed. If not, remove it to reduce maintenance burden.",
      });
    }
  }
  return unused.slice(0, 20);
}

function findDeadModules(graph: ReturnType<typeof getDependencyGraph>): DeadModule[] {
  // Modules with no dependencies in or out
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const n of graph.nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  }
  for (const e of graph.edges) {
    outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  const dead: DeadModule[] = [];
  for (const n of graph.nodes) {
    const inc = incoming.get(n.id) ?? 0;
    const out = outgoing.get(n.id) ?? 0;
    if (inc === 0 && out === 0 && n.kind !== "event") { // events can be standalone
      dead.push({
        module: n.label,
        reason: "No dependencies in or out — this module is isolated.",
        recommendation: "Investigate whether this module is referenced anywhere. If not, consider removal.",
      });
    }
  }
  return dead.slice(0, 15);
}

function findDuplicateUtilities(): DuplicateUtility[] {
  // Scan feature modules for functions with similar names
  const functionLocations = new Map<string, string[]>();
  const featuresDir = join(process.cwd(), "src", "features");
  if (!existsSync(featuresDir)) return [];
  try {
    const features = readdirSync(featuresDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
    for (const feature of features) {
      const files = readdirSync(join(featuresDir, feature), { withFileTypes: true })
        .filter(d => d.isFile() && d.name.endsWith(".ts") && !d.name.endsWith(".test.ts"))
        .map(d => d.name);
      for (const file of files) {
        const content = readFileSync(join(featuresDir, feature, file), "utf-8");
        const matches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
        for (const m of matches) {
          const name = m[1];
          if (!functionLocations.has(name)) functionLocations.set(name, []);
          functionLocations.get(name)!.push(`${feature}/${file}`);
        }
      }
    }
  } catch {
    return [];
  }
  const duplicates: DuplicateUtility[] = [];
  for (const [name, locations] of functionLocations) {
    if (locations.length > 1) {
      duplicates.push({
        name, modules: locations,
        recommendation: `Function "${name}" is defined in ${locations.length} modules. Consider extracting to a shared utility.`,
      });
    }
  }
  return duplicates.slice(0, 15);
}

function generateDependencyRecommendations(input: {
  circular: CircularDependency[];
  deepChains: DependencyChain[];
  highCoupling: CouplingMetric[];
  unused: UnusedService[];
  dead: DeadModule[];
  duplicates: DuplicateUtility[];
}): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  let id = 0;
  const nextId = () => `dep-${++id}`;
  if (input.circular.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Break circular dependencies",
      description: `${input.circular.length} circular dependency cycle(s) detected.`,
      impact: "high", effort: "medium",
      recommendation: "Extract shared logic into a separate module to break the cycle.",
    });
  }
  if (input.highCoupling.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Reduce high coupling",
      description: `${input.highCoupling.length} module(s) have high coupling (>10 dependencies).`,
      impact: "medium", effort: "high",
      recommendation: "Split highly-coupled modules into smaller, focused modules.",
    });
  }
  if (input.unused.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Remove unused services",
      description: `${input.unused.length} service(s) have no incoming dependencies.`,
      impact: "low", effort: "low",
      recommendation: "Verify and remove unused services to reduce maintenance burden.",
    });
  }
  if (input.duplicates.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Consolidate duplicate utilities",
      description: `${input.duplicates.length} function(s) are defined in multiple modules.`,
      impact: "low", effort: "medium",
      recommendation: "Extract duplicate functions into a shared utility module.",
    });
  }
  return recs;
}
