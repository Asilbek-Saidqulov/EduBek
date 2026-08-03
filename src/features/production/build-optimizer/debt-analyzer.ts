/**
 * EduBek — Technical Debt Analyzer (System 9).
 *
 * Detects TODOs, FIXMEs, deprecated APIs, temporary workarounds, unused
 * code, dead branches, duplicate logic, high-complexity functions, large
 * classes, and long files. Generates a prioritized debt backlog.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  TechnicalDebtReport, DebtItem, ComplexityItem, SizeItem,
  PrioritizedDebtItem, EngineeringRecommendation,
} from "./types";

const log = getLogger("debt-analyzer");

export async function generateDebtReport(): Promise<TechnicalDebtReport> {
  const generatedAt = new Date().toISOString();
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const [todos, fixmes, deprecated, workarounds, unused, deadBranches,
    duplicateLogic, highComplexity, largeClasses, longFiles] = await Promise.all([
    scanForAnnotations(files, "TODO"),
    scanForAnnotations(files, "FIXME"),
    scanForDeprecated(files),
    scanForAnnotations(files, "HACK"),
    detectUnusedCode(files),
    detectDeadBranches(files),
    detectDuplicateLogic(files),
    detectHighComplexity(files),
    detectLargeClasses(files),
    detectLongFiles(files),
  ]);
  const debtBacklog = prioritizeDebt([
    ...todos, ...fixmes, ...deprecated, ...workarounds, ...unused,
    ...deadBranches, ...duplicateLogic,
  ], highComplexity, largeClasses, longFiles);
  const recommendations = generateDebtRecommendations({
    todos, fixmes, deprecated, workarounds, unused, highComplexity, longFiles,
  });
  log.info("debt.audit_complete", {
    todos: todos.length, fixmes: fixmes.length,
    deprecated: deprecated.length, backlog: debtBacklog.length,
  });
  return {
    generatedAt,
    todos, fixmes, deprecatedApis: deprecated, temporaryWorkarounds: workarounds,
    unusedCode: unused, deadBranches, duplicateLogic,
    highComplexityFunctions: highComplexity,
    largeClasses, longFiles,
    debtBacklog,
    recommendations,
  };
}

function scanForAnnotations(files: string[], type: "TODO" | "FIXME" | "HACK"): DebtItem[] {
  const items: DebtItem[] = [];
  for (const f of files) {
    const annotations = repo.extractComments(f, type);
    for (const a of annotations) {
      items.push({
        file: f,
        line: a.line,
        description: a.text,
        severity: type === "FIXME" ? "high" : type === "HACK" ? "medium" : "low",
        recommendation: `Address ${type} at ${f}:${a.line}`,
      });
    }
  }
  return items;
}

function scanForDeprecated(files: string[]): DebtItem[] {
  const items: DebtItem[] = [];
  for (const f of files) {
    const annotations = repo.extractComments(f, "DEPRECATED");
    for (const a of annotations) {
      items.push({
        file: f, line: a.line, description: a.text,
        severity: "medium",
        recommendation: `Remove deprecated code at ${f}:${a.line}`,
      });
    }
    // Also check for @deprecated JSDoc tag
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/@deprecated\s*(.*)/g);
    let lineNum = 1;
    for (const m of matches) {
      // Find the line number
      const idx = content.indexOf(m[0]);
      lineNum = content.slice(0, idx).split("\n").length;
      items.push({
        file: f, line: lineNum,
        description: `@deprecated ${m[1].trim()}`,
        severity: "medium",
        recommendation: `Remove deprecated API at ${f}:${lineNum}`,
      });
    }
  }
  return items;
}

function detectUnusedCode(files: string[]): DebtItem[] {
  const items: DebtItem[] = [];
  // Detect exported functions that are never imported
  const exports = new Map<string, string>(); // name → file
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
    for (const m of matches) {
      exports.set(m[1], f);
    }
  }
  // Check which exports are imported elsewhere
  const importedNames = new Set<string>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/import\s+\{([^}]+)\}/g);
    for (const m of matches) {
      const names = m[1].split(",").map(n => n.trim().split(/\s+as\s+/)[0]);
      for (const n of names) importedNames.add(n);
    }
  }
  for (const [name, file] of exports) {
    if (!importedNames.has(name) && !name.startsWith("_")) {
      // Check if it's used in the same file
      const content = repo.readTextFile(file);
      const usageCount = content ? (content.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length : 0;
      if (usageCount <= 1) {
        items.push({
          file, line: 0,
          description: `Exported function "${name}" is not imported anywhere`,
          severity: "low",
          recommendation: `Remove unused export "${name}" from ${file}`,
        });
      }
    }
  }
  return items.slice(0, 20);
}

function detectDeadBranches(files: string[]): DebtItem[] {
  const items: DebtItem[] = [];
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    // Look for `if (false)` or `if (0)` — obvious dead branches
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.match(/if\s*\(\s*(false|0)\s*\)/)) {
        items.push({
          file: f, line: idx + 1,
          description: `Dead branch: ${line.trim()}`,
          severity: "medium",
          recommendation: `Remove dead branch at ${f}:${idx + 1}`,
        });
      }
      // Look for `if (true)` — could be simplified
      if (line.match(/if\s*\(\s*(true|1)\s*\)/)) {
        items.push({
          file: f, line: idx + 1,
          description: `Redundant always-true branch: ${line.trim()}`,
          severity: "low",
          recommendation: `Simplify always-true branch at ${f}:${idx + 1}`,
        });
      }
    });
  }
  return items;
}

function detectDuplicateLogic(files: string[]): DebtItem[] {
  const items: DebtItem[] = [];
  // Find functions with identical names in different files (possible duplication)
  const functionLocations = new Map<string, string[]>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
    for (const m of matches) {
      const name = m[1];
      if (!functionLocations.has(name)) functionLocations.set(name, []);
      functionLocations.get(name)!.push(f);
    }
  }
  for (const [name, locations] of functionLocations) {
    if (locations.length > 1) {
      items.push({
        file: locations[0],
        line: 0,
        description: `Function "${name}" defined in ${locations.length} files: ${locations.join(", ")}`,
        severity: "medium",
        recommendation: `Consolidate duplicate function "${name}" into a shared utility.`,
      });
    }
  }
  return items.slice(0, 15);
}

function detectHighComplexity(files: string[]): ComplexityItem[] {
  const items: ComplexityItem[] = [];
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    // Approximate cyclomatic complexity by counting branching keywords
    const matches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g);
    for (const m of matches) {
      const funcName = m[1];
      const funcStart = m.index ?? 0;
      // Find the function body (simplified — find the next function or EOF)
      const nextFunc = content.indexOf("function ", funcStart + 10);
      const funcBody = content.slice(funcStart, nextFunc === -1 ? undefined : nextFunc);
      const branchingKeywords = (funcBody.match(/\b(if|else|for|while|case|catch|&&|\|\?|switch)\b/g) ?? []).length;
      const lines = funcBody.split("\n").length;
      if (branchingKeywords > 10) {
        items.push({
          file: f,
          function: funcName,
          complexity: branchingKeywords,
          lines,
          recommendation: `${funcName} in ${f} has complexity ${branchingKeywords} — consider refactoring.`,
        });
      }
    }
  }
  return items.sort((a, b) => b.complexity - a.complexity).slice(0, 15);
}

function detectLargeClasses(_files: string[]): SizeItem[] {
  // TypeScript doesn't have classes in this project (functional style)
  // Return empty — this is a placeholder for class-based projects
  return [];
}

function detectLongFiles(files: string[]): SizeItem[] {
  const items: SizeItem[] = [];
  for (const f of files) {
    const lines = repo.countLines(f);
    if (lines > 500) {
      items.push({
        file: f,
        lines,
        threshold: 500,
        recommendation: `${f} is ${lines} lines — consider splitting.`,
      });
    }
  }
  return items.sort((a, b) => b.lines - a.lines).slice(0, 20);
}

function prioritizeDebt(
  debtItems: DebtItem[],
  complexity: ComplexityItem[],
  largeClasses: SizeItem[],
  longFiles: SizeItem[],
): PrioritizedDebtItem[] {
  const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
  const all: Array<{ item: DebtItem | ComplexityItem | SizeItem; priority: number; impact: "low" | "medium" | "high" | "critical"; effort: "low" | "medium" | "high" }> = [];
  for (const item of debtItems) {
    all.push({
      item,
      priority: (severityScore[item.severity] ?? 1) * 3,
      impact: item.severity,
      effort: "low",
    });
  }
  for (const item of complexity) {
    all.push({
      item,
      priority: Math.round(item.complexity / 3),
      impact: item.complexity > 15 ? "high" : "medium",
      effort: "high",
    });
  }
  for (const item of longFiles) {
    all.push({
      item,
      priority: Math.round(item.lines / 100),
      impact: "medium",
      effort: "medium",
    });
  }
  return all.sort((a, b) => b.priority - a.priority).slice(0, 30);
}

function generateDebtRecommendations(input: {
  todos: DebtItem[]; fixmes: DebtItem[]; deprecated: DebtItem[];
  workarounds: DebtItem[]; unused: DebtItem[];
  highComplexity: ComplexityItem[]; longFiles: SizeItem[];
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `debt-${++id}`;
  if (input.fixmes.length > 0) {
    recs.push({
      id: nextId(), category: "debt",
      title: "Address FIXMEs",
      description: `${input.fixmes.length} FIXME(s) need attention.`,
      impact: "high", effort: "medium",
      recommendation: "Review and resolve all FIXMEs — they indicate known bugs.",
    });
  }
  if (input.todos.length > 20) {
    recs.push({
      id: nextId(), category: "debt",
      title: "Reduce TODO count",
      description: `${input.todos.length} TODO(s) accumulated.`,
      impact: "low", effort: "low",
      recommendation: "Schedule time to address TODOs — they indicate incomplete work.",
    });
  }
  if (input.highComplexity.length > 0) {
    recs.push({
      id: nextId(), category: "debt",
      title: "Refactor high-complexity functions",
      description: `${input.highComplexity.length} function(s) have high cyclomatic complexity.`,
      impact: "medium", effort: "high",
      recommendation: "Break down complex functions into smaller, focused helpers.",
    });
  }
  if (input.unused.length > 5) {
    recs.push({
      id: nextId(), category: "debt",
      title: "Remove unused code",
      description: `${input.unused.length} unused export(s) detected.`,
      impact: "low", effort: "low",
      recommendation: "Remove unused exports to reduce bundle size and maintenance burden.",
    });
  }
  return recs;
}
