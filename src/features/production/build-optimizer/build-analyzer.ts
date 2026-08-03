/**
 * EduBek — TypeScript Build Optimizer (System 1).
 *
 * Analyzes the TypeScript build: project references, incremental build,
 * type dependency graph, large modules, slow compilation suspects,
 * circular type dependencies, memory usage, and compiler bottlenecks.
 *
 * Produces recommendations — never rewrites tsconfig automatically.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  BuildOptimizationReport, ProjectReferenceAnalysis, IncrementalBuildAnalysis,
  TypeDependencyGraphSummary, LargeModule, SlowCompilationSuspect,
  CircularTypeDependency, MemoryUsageEstimate, CompilerBottleneck,
  EngineeringRecommendation,
} from "./types";

const log = getLogger("build-analyzer");

// ===========================================================================
// Public API
// ===========================================================================

export async function generateBuildReport(): Promise<BuildOptimizationReport> {
  const generatedAt = new Date().toISOString();
  const [projectRefs, incremental, typeGraph, largeModules, slowComp,
    circularTypes, memory, bottlenecks] = await Promise.all([
    analyzeProjectReferences(),
    analyzeIncrementalBuild(),
    analyzeTypeDependencyGraph(),
    detectLargeModules(),
    detectSlowCompilation(),
    detectCircularTypeDependencies(),
    estimateMemoryUsage(),
    detectCompilerBottlenecks(),
  ]);
  const recommendations = generateBuildRecommendations({
    projectRefs, incremental, largeModules, circularTypes, memory, bottlenecks,
  });
  log.info("build.audit_complete", {
    largeModules: largeModules.length, circular: circularTypes.length,
    memoryMb: memory.estimatedMb, recommendations: recommendations.length,
  });
  return {
    generatedAt,
    projectReferences: projectRefs,
    incrementalBuild: incremental,
    typeDependencyGraph: typeGraph,
    largeModules,
    slowCompilation: slowComp,
    circularTypeDependencies: circularTypes,
    memoryUsage: memory,
    compilerBottlenecks: bottlenecks,
    recommendations,
  };
}

// ===========================================================================
// Analyzers
// ===========================================================================

function analyzeProjectReferences(): ProjectReferenceAnalysis {
  const tsconfig = repo.readTsConfig();
  const refs = tsconfig?.references as unknown[] | undefined;
  const usesProjectReferences = Array.isArray(refs) && refs.length > 0;
  return {
    usesProjectReferences,
    referencedProjectCount: usesProjectReferences ? refs!.length : 0,
    recommendation: usesProjectReferences
      ? "Project references are configured — this speeds up incremental builds."
      : "Consider using TypeScript project references to enable faster incremental builds for large codebases.",
  };
}

function analyzeIncrementalBuild(): IncrementalBuildAnalysis {
  const tsconfig = repo.readTsConfig();
  const compilerOptions = tsconfig?.compilerOptions as Record<string, unknown> | undefined;
  const incremental = compilerOptions?.incremental === true;
  const buildInfoFile = compilerOptions?.tsBuildInfoFile as string | undefined ?? null;
  return {
    incrementalEnabled: incremental,
    buildInfoFile,
    estimatedSavingsPercent: incremental ? 40 : 0,
    recommendation: incremental
      ? "Incremental builds are enabled — subsequent builds will be faster."
      : "Enable `incremental: true` in tsconfig to speed up subsequent type checks by ~40%.",
  };
}

function analyzeTypeDependencyGraph(): TypeDependencyGraphSummary {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const fileImports = new Map<string, number>();
  let totalEdges = 0;
  for (const f of files) {
    const imports = repo.extractImports(f);
    const typeImports = imports.filter(i => repo.isRelativeImport(i) || repo.isAliasImport(i));
    fileImports.set(f, typeImports.length);
    totalEdges += typeImports.length;
  }
  const mostConnected = Array.from(fileImports.entries())
    .map(([file, importCount]) => ({ file, importCount }))
    .sort((a, b) => b.importCount - a.importCount)
    .slice(0, 10);
  return {
    totalTypeFiles: files.length,
    totalTypeEdges: totalEdges,
    averageDependenciesPerFile: files.length > 0 ? Math.round((totalEdges / files.length) * 100) / 100 : 0,
    mostConnectedFiles: mostConnected,
  };
}

function detectLargeModules(): LargeModule[] {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const large: LargeModule[] = [];
  for (const f of files) {
    const lines = repo.countLines(f);
    if (lines > 500) {
      large.push({
        file: f,
        lines,
        estimatedCost: Math.round(lines / 100),
        recommendation: lines > 1000
          ? `${f} has ${lines} lines — consider splitting into smaller modules to speed up type checking.`
          : `${f} has ${lines} lines — monitor for growth.`,
      });
    }
  }
  return large.sort((a, b) => b.lines - a.lines).slice(0, 20);
}

function detectSlowCompilation(): SlowCompilationSuspect[] {
  const suspects: SlowCompilationSuspect[] = [];
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    // Files with complex generics tend to be slow
    const genericCount = (content.match(/<[^>]+>/g) ?? []).length;
    if (genericCount > 50) {
      suspects.push({
        file: f,
        reason: `High generic complexity (${genericCount} generic expressions)`,
        estimatedImpactMs: genericCount,
        recommendation: `${f} has ${genericCount} generic expressions — consider simplifying types or extracting them.`,
      });
    }
    // Files with many union types
    const unionCount = (content.match(/\|/g) ?? []).length;
    if (unionCount > 100) {
      suspects.push({
        file: f,
        reason: `Many union types (${unionCount} '|' occurrences)`,
        estimatedImpactMs: Math.round(unionCount / 2),
        recommendation: `${f} has ${unionCount} union type occurrences — large unions slow down type checking.`,
      });
    }
  }
  return suspects.sort((a, b) => b.estimatedImpactMs - a.estimatedImpactMs).slice(0, 15);
}

function detectCircularTypeDependencies(): CircularTypeDependency[] {
  // Detect circular imports via DFS on the import graph
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const adj = new Map<string, string[]>();
  for (const f of files) {
    const imports = repo.extractImports(f);
    const resolved = imports
      .filter(i => repo.isRelativeImport(i) || repo.isAliasImport(i))
      .map(i => resolveImport(f, i));
    adj.set(f, resolved.filter(r => files.includes(r)));
  }
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];
  function dfs(node: string) {
    if (stack.has(node)) {
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
  for (const f of files) dfs(f);
  // Deduplicate
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
    recommendation: `Circular type dependency: ${cycle.join(" → ")}. Break the cycle by extracting shared types.`,
  }));
}

function estimateMemoryUsage(): MemoryUsageEstimate {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const totalLines = files.reduce((s, f) => s + repo.countLines(f), 0);
  // Rough estimate: ~5KB of compiler memory per 100 lines of TS
  const estimatedMb = Math.round((totalLines / 100) * 5 / 1024);
  return {
    estimatedMb,
    likelyOOM: estimatedMb > 3000,
    recommendation: estimatedMb > 3000
      ? `Estimated compiler memory: ${estimatedMb}MB — likely to OOM on machines with <4GB RAM. Consider splitting the project.`
      : `Estimated compiler memory: ${estimatedMb}MB — within normal range.`,
  };
}

function detectCompilerBottlenecks(): CompilerBottleneck[] {
  const bottlenecks: CompilerBottleneck[] = [];
  const tsconfig = repo.readTsConfig();
  const compilerOptions = tsconfig?.compilerOptions as Record<string, unknown> | undefined;
  // Check for expensive options
  if (compilerOptions?.strict !== true) {
    bottlenecks.push({
      bottleneck: "strict mode disabled",
      description: "TypeScript strict mode is disabled — enabling it catches more errors but increases compile time.",
      estimatedImpactMs: 0,
      recommendation: "Enable strict mode for better type safety (already enabled in EduBek).",
    });
  }
  if (compilerOptions?.skipLibCheck !== true) {
    bottlenecks.push({
      bottleneck: "skipLibCheck disabled",
      description: "skipLibCheck is disabled — type-checking .d.ts files is expensive.",
      estimatedImpactMs: 5000,
      recommendation: "Enable skipLibCheck: true to skip type-checking of declaration files.",
    });
  }
  // Check for project references
  if (!Array.isArray(tsconfig?.references)) {
    bottlenecks.push({
      bottleneck: "no project references",
      description: "Without project references, the entire project is type-checked as one unit.",
      estimatedImpactMs: 10000,
      recommendation: "Consider splitting into project references for faster incremental builds.",
    });
  }
  // Large number of files
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  if (files.length > 500) {
    bottlenecks.push({
      bottleneck: "large file count",
      description: `${files.length} TypeScript files — large projects benefit from project references.`,
      estimatedImpactMs: files.length * 10,
      recommendation: "Consider splitting the project into multiple tsconfig projects.",
    });
  }
  return bottlenecks;
}

// ===========================================================================
// Recommendation generator
// ===========================================================================

function generateBuildRecommendations(input: {
  projectRefs: ProjectReferenceAnalysis;
  incremental: IncrementalBuildAnalysis;
  largeModules: LargeModule[];
  circularTypes: CircularTypeDependency[];
  memory: MemoryUsageEstimate;
  bottlenecks: CompilerBottleneck[];
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `build-${++id}`;
  if (!input.incremental.incrementalEnabled) {
    recs.push({
      id: nextId(), category: "build",
      title: "Enable incremental builds",
      description: "Incremental builds are disabled — enabling them would speed up subsequent builds by ~40%.",
      impact: "high", effort: "low",
      recommendation: "Set `incremental: true` in tsconfig.json compilerOptions.",
    });
  }
  if (!input.projectRefs.usesProjectReferences && input.bottlenecks.some(b => b.bottleneck === "no project references")) {
    recs.push({
      id: nextId(), category: "build",
      title: "Adopt TypeScript project references",
      description: "Project references enable faster incremental builds by splitting the project into independent units.",
      impact: "high", effort: "high",
      recommendation: "Split tsconfig.json into a root config + referenced project configs (e.g., src/features, src/app, src/infra).",
    });
  }
  if (input.largeModules.length > 5) {
    recs.push({
      id: nextId(), category: "build",
      title: "Split large modules",
      description: `${input.largeModules.length} modules exceed 500 lines — large files slow down type checking.`,
      impact: "medium", effort: "medium",
      recommendation: "Split the largest modules into smaller, focused files.",
    });
  }
  if (input.circularTypes.length > 0) {
    recs.push({
      id: nextId(), category: "build",
      title: "Break circular type dependencies",
      description: `${input.circularTypes.length} circular type dependency cycle(s) detected.`,
      impact: "medium", effort: "medium",
      recommendation: "Extract shared types into a separate types.ts file to break cycles.",
    });
  }
  if (input.memory.likelyOOM) {
    recs.push({
      id: nextId(), category: "build",
      title: "Reduce compiler memory usage",
      description: `Estimated compiler memory is ${input.memory.estimatedMb}MB — likely to OOM on small machines.`,
      impact: "critical", effort: "high",
      recommendation: "Split the project into project references or reduce the number of files included in type checking.",
    });
  }
  return recs;
}

// ===========================================================================
// Helpers
// ===========================================================================

function resolveImport(fromFile: string, importPath: string): string {
  if (importPath.startsWith("@/")) {
    return importPath.replace("@/", "src/");
  }
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    const fromDir = repo.getDirname(fromFile);
    const resolved = repo.join(fromDir, importPath);
    return normalizePath(resolved);
  }
  return importPath;
}

function normalizePath(p: string): string {
  return p.split("/").reduce<string[]>((acc, part) => {
    if (part === "..") acc.pop();
    else if (part !== ".") acc.push(part);
    return acc;
  }, []).join("/");
}
