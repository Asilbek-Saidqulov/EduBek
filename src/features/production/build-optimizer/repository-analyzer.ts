/**
 * EduBek — Repository Structure Analyzer (System 2).
 *
 * Analyzes folder depth, module sizes, feature boundaries, barrel
 * exports, shared utilities, duplicated helpers, import patterns, and
 * dependency layering. Detects structure violations.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  RepositoryStructureReport, FolderDepthAnalysis, ModuleSizeAnalysis,
  FeatureBoundaryAnalysis, BarrelExportAnalysis, SharedUtilityAnalysis,
  DuplicatedHelper, ImportPatternAnalysis, DependencyLayeringAnalysis,
  StructureViolation, EngineeringRecommendation,
} from "./types";

const log = getLogger("repository-analyzer");

export async function generateRepositoryReport(): Promise<RepositoryStructureReport> {
  const generatedAt = new Date().toISOString();
  const [folderDepth, moduleSizes, featureBoundaries, barrelExports,
    sharedUtilities, duplicatedHelpers, importPatterns, dependencyLayering] = await Promise.all([
    analyzeFolderDepth(),
    analyzeModuleSizes(),
    analyzeFeatureBoundaries(),
    analyzeBarrelExports(),
    analyzeSharedUtilities(),
    detectDuplicatedHelpers(),
    analyzeImportPatterns(),
    analyzeDependencyLayering(),
  ]);
  const violations = collectViolations({
    folderDepth, featureBoundaries, importPatterns, dependencyLayering,
  });
  const recommendations = generateRepoRecommendations({
    folderDepth, moduleSizes, featureBoundaries, duplicatedHelpers, violations,
  });
  log.info("repository.audit_complete", {
    features: featureBoundaries.featureCount,
    violations: violations.length,
    largestFile: moduleSizes.largestFiles[0]?.lines ?? 0,
  });
  return {
    generatedAt,
    folderDepth, moduleSizes, featureBoundaries, barrelExports,
    sharedUtilities, duplicatedHelpers, importPatterns, dependencyLayering,
    violations, recommendations,
  };
}

function analyzeFolderDepth(): FolderDepthAnalysis {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const depths = files.map(f => repo.getFolderDepth(f));
  const maxDepth = Math.max(...depths, 0);
  const avg = depths.length > 0 ? depths.reduce((s, d) => s + d, 0) / depths.length : 0;
  const deepest = files
    .map(f => ({ path: repo.getDirname(f), depth: repo.getFolderDepth(f) }))
    .sort((a, b) => b.depth - a.depth)
    .slice(0, 10);
  return {
    maxDepth,
    averageDepth: Math.round(avg * 100) / 100,
    deepestFolders: deepest,
    recommendation: maxDepth > 8
      ? `Max folder depth is ${maxDepth} — consider flattening deeply nested directories.`
      : `Folder depth is within normal range (max=${maxDepth}).`,
  };
}

function analyzeModuleSizes(): ModuleSizeAnalysis {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  let totalLines = 0;
  const sizes: Array<{ file: string; lines: number }> = [];
  for (const f of files) {
    const lines = repo.countLines(f);
    totalLines += lines;
    sizes.push({ file: f, lines });
  }
  const largest = sizes.sort((a, b) => b.lines - a.lines).slice(0, 15);
  return {
    totalFiles: files.length,
    totalLines,
    averageLinesPerFile: files.length > 0 ? Math.round(totalLines / files.length) : 0,
    largestFiles: largest,
    recommendation: largest[0] && largest[0].lines > 1000
      ? `Largest file is ${largest[0].file} (${largest[0].lines} lines) — consider splitting.`
      : "Module sizes are within normal range.",
  };
}

function analyzeFeatureBoundaries(): FeatureBoundaryAnalysis {
  // List directories in src/features directly (each directory is a feature)
  const featuresPath = join(process.cwd(), "src", "features");
  let featureNames = new Set<string>();
  try {
    const entries = readdirSync(featuresPath, { withFileTypes: true });
    featureNames = new Set(entries.filter(e => e.isDirectory()).map(e => e.name));
  } catch { /* noop */ }
  let crossFeatureImports = 0;
  const violations: Array<{ from: string; to: string; reason: string }> = [];
  const allFiles = repo.listFiles("src/features", { extension: ".ts", recursive: true });
  for (const f of allFiles) {
    const imports = repo.extractImports(f);
    for (const imp of imports) {
      if (!repo.isRelativeImport(imp) && !repo.isAliasImport(imp)) continue;
      const resolved = resolveWithin(f, imp);
      if (!resolved) continue;
      // f is like "src/features/<feature>/file.ts" — feature is index 2
      const fromFeature = f.split("/")[2];
      const toFeature = resolved.startsWith("src/features/")
        ? resolved.split("/")[2]
        : null;
      if (toFeature && fromFeature && toFeature !== fromFeature) {
        crossFeatureImports++;
        violations.push({
          from: f, to: resolved,
          reason: `${fromFeature} imports from ${toFeature} — features should communicate via events or shared types.`,
        });
      }
    }
  }
  return {
    featureCount: featureNames.size,
    crossFeatureImports,
    violations: violations.slice(0, 20),
    recommendation: crossFeatureImports > 10
      ? `${crossFeatureImports} cross-feature imports detected — consider decoupling features via events.`
      : "Feature boundaries are mostly respected.",
  };
}

function analyzeBarrelExports(): BarrelExportAnalysis {
  const barrels = repo.listFiles("src/features", { recursive: true })
    .filter(f => f.endsWith("/index.ts"));
  let sideEffects = 0;
  let missingDefault = 0;
  for (const b of barrels) {
    const content = repo.readTextFile(b);
    if (!content) continue;
    // Check for side effects (imports that execute code)
    const sideEffectImports = content.match(/^import\s+['"][^'"]+['"]/gm);
    if (sideEffectImports && sideEffectImports.length > 0) sideEffects++;
    // Check for default export
    if (!content.includes("export default") && !content.includes("export {")) {
      missingDefault++;
    }
  }
  return {
    barrelsChecked: barrels.length,
    barrelsWithSideEffects: sideEffects,
    barrelsMissingDefaultExport: missingDefault,
    recommendation: sideEffects > 0
      ? `${sideEffects} barrel(s) have side-effect imports — barrels should be pure re-exports.`
      : "Barrel exports are clean.",
  };
}

function analyzeSharedUtilities(): SharedUtilityAnalysis {
  const libFiles = repo.listFiles("src/lib", { extension: ".ts", recursive: true });
  const utilsFiles = repo.listFiles("src/utils", { extension: ".ts", recursive: true });
  const allShared = [...libFiles, ...utilsFiles];
  const categories = new Map<string, number>();
  for (const f of allShared) {
    const category = repo.getDirname(f).split("/")[0] ?? "root";
    categories.set(category, (categories.get(category) ?? 0) + 1);
  }
  const utilitiesByCategory: Record<string, number> = {};
  for (const [cat, count] of categories) utilitiesByCategory[cat] = count;
  return {
    sharedUtilityCount: allShared.length,
    utilitiesByCategory,
    recommendation: allShared.length > 30
      ? `${allShared.length} shared utilities — ensure they are well-documented.`
      : "Shared utility count is reasonable.",
  };
}

function detectDuplicatedHelpers(): DuplicatedHelper[] {
  // Find functions with the same name defined in multiple files
  const functionLocations = new Map<string, string[]>();
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
    for (const m of matches) {
      const name = m[1];
      if (!functionLocations.has(name)) functionLocations.set(name, []);
      functionLocations.get(name)!.push(f);
    }
  }
  const duplicates: DuplicatedHelper[] = [];
  for (const [name, locations] of functionLocations) {
    if (locations.length > 1) {
      duplicates.push({
        name, locations,
        similarity: 0.8,
        recommendation: `Function "${name}" is defined in ${locations.length} files. Consider extracting to a shared utility.`,
      });
    }
  }
  return duplicates.slice(0, 15);
}

function analyzeImportPatterns(): ImportPatternAnalysis {
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  let total = 0, relative = 0, alias = 0, bare = 0, deep = 0;
  for (const f of files) {
    const imports = repo.extractImports(f);
    for (const imp of imports) {
      total++;
      if (repo.isRelativeImport(imp)) relative++;
      else if (repo.isAliasImport(imp)) alias++;
      else if (repo.isBareImport(imp)) bare++;
      if (repo.isDeepImport(imp)) deep++;
    }
  }
  return {
    totalImports: total,
    relativeImports: relative,
    aliasImports: alias,
    bareImports: bare,
    deepImports: deep,
    recommendation: deep > 20
      ? `${deep} deep imports detected — importing from package sub-paths can break tree-shaking.`
      : "Import patterns are clean.",
  };
}

function analyzeDependencyLayering(): DependencyLayeringAnalysis {
  const layers = [
    { name: "routes", moduleCount: repo.listFiles("src/app", { extension: ".ts", recursive: true }).length, allowedDependencies: ["features", "lib", "infra"] },
    { name: "features", moduleCount: repo.listFiles("src/features", { extension: ".ts", recursive: true }).length, allowedDependencies: ["lib", "infra"] },
    { name: "infra", moduleCount: repo.listFiles("src/infra", { extension: ".ts", recursive: true }).length, allowedDependencies: ["lib"] },
    { name: "lib", moduleCount: repo.listFiles("src/lib", { extension: ".ts", recursive: true }).length, allowedDependencies: [] },
  ];
  const violations: Array<{ from: string; to: string; reason: string }> = [];
  // Check that features don't import from app/
  const featureFiles = repo.listFiles("src/features", { extension: ".ts", recursive: true });
  for (const f of featureFiles) {
    const imports = repo.extractImports(f);
    for (const imp of imports) {
      if (imp.includes("@/app/") || imp.includes("../app/")) {
        violations.push({
          from: f, to: imp,
          reason: "Features should not import from app/ — this violates layered architecture.",
        });
      }
    }
  }
  return {
    layers,
    violations: violations.slice(0, 15),
    recommendation: violations.length > 0
      ? `${violations.length} layering violations detected — features should not import from app/.`
      : "Dependency layering is respected.",
  };
}

function collectViolations(input: {
  folderDepth: FolderDepthAnalysis;
  featureBoundaries: FeatureBoundaryAnalysis;
  importPatterns: ImportPatternAnalysis;
  dependencyLayering: DependencyLayeringAnalysis;
}): StructureViolation[] {
  const violations: StructureViolation[] = [];
  if (input.folderDepth.maxDepth > 8) {
    violations.push({
      type: "deep_nesting",
      description: `Max folder depth is ${input.folderDepth.maxDepth}`,
      severity: "medium",
      location: input.folderDepth.deepestFolders[0]?.path ?? "",
      recommendation: "Flatten deeply nested directories.",
    });
  }
  for (const v of input.featureBoundaries.violations) {
    violations.push({
      type: "cross_feature",
      description: v.reason,
      severity: "medium",
      location: v.from,
      recommendation: "Decouple features via events or shared types.",
    });
  }
  if (input.importPatterns.deepImports > 20) {
    violations.push({
      type: "deep_import",
      description: `${input.importPatterns.deepImports} deep imports detected`,
      severity: "low",
      location: "(multiple)",
      recommendation: "Avoid importing from package sub-paths.",
    });
  }
  for (const v of input.dependencyLayering.violations) {
    violations.push({
      type: "cross_feature",
      description: v.reason,
      severity: "high",
      location: v.from,
      recommendation: "Features should not import from app/.",
    });
  }
  return violations.slice(0, 30);
}

function generateRepoRecommendations(input: {
  folderDepth: FolderDepthAnalysis;
  moduleSizes: ModuleSizeAnalysis;
  featureBoundaries: FeatureBoundaryAnalysis;
  duplicatedHelpers: DuplicatedHelper[];
  violations: StructureViolation[];
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `repo-${++id}`;
  if (input.featureBoundaries.crossFeatureImports > 10) {
    recs.push({
      id: nextId(), category: "repository",
      title: "Reduce cross-feature imports",
      description: `${input.featureBoundaries.crossFeatureImports} cross-feature imports detected.`,
      impact: "medium", effort: "high",
      recommendation: "Decouple features via the Event Bus or shared types.",
    });
  }
  if (input.duplicatedHelpers.length > 0) {
    recs.push({
      id: nextId(), category: "repository",
      title: "Consolidate duplicated helpers",
      description: `${input.duplicatedHelpers.length} duplicated helper function(s) found.`,
      impact: "low", effort: "medium",
      recommendation: "Extract duplicated functions into a shared utility module.",
    });
  }
  const highViolations = input.violations.filter(v => v.severity === "high");
  if (highViolations.length > 0) {
    recs.push({
      id: nextId(), category: "repository",
      title: "Fix high-severity structure violations",
      description: `${highViolations.length} high-severity violation(s) detected.`,
      impact: "high", effort: "medium",
      recommendation: "Address layering violations — features should not import from app/.",
    });
  }
  return recs;
}

function resolveWithin(fromFile: string, importPath: string): string | null {
  if (importPath.startsWith("@/")) {
    return importPath.replace("@/", "src/");
  }
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    const fromDir = repo.getDirname(fromFile);
    const resolved = repo.join(fromDir, importPath);
    return normalizePath(resolved);
  }
  return null;
}

function normalizePath(p: string): string {
  return p.split("/").reduce<string[]>((acc, part) => {
    if (part === "..") acc.pop();
    else if (part !== ".") acc.push(part);
    return acc;
  }, []).join("/");
}
