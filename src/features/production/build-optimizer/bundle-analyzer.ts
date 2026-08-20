/**
 * EduBek — Bundle Analyzer (System 3).
 *
 * Analyzes bundle size, largest modules, duplicate packages, tree-shaking
 * opportunities, lazy-loading opportunities, and dynamic import candidates.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  BundleAnalysisReport, BundleModule, DuplicatePackage,
  TreeShakingOpportunity, LazyLoadingCandidate, DynamicImportCandidate,
  EngineeringRecommendation,
} from "./types";

const log = getLogger("bundle-analyzer");

export async function generateBundleReport(): Promise<BundleAnalysisReport> {
  const generatedAt = new Date().toISOString();
  const [largestModules, duplicatePackages, treeShaking, lazyLoading, dynamicImports] = await Promise.all([
    detectLargestModules(),
    detectDuplicatePackages(),
    detectTreeShakingOpportunities(),
    detectLazyLoadingCandidates(),
    detectDynamicImportCandidates(),
  ]);
  const estimatedBundleSizeKb = largestModules.reduce((s, m) => s + m.estimatedSizeKb, 0);
  const recommendations = generateBundleRecommendations({
    largestModules, duplicatePackages, treeShaking, lazyLoading,
  });
  log.info("bundle.audit_complete", {
    estimatedKb: estimatedBundleSizeKb,
    largest: largestModules.length, duplicates: duplicatePackages.length,
  });
  return {
    generatedAt,
    estimatedBundleSizeKb,
    largestModules,
    duplicatePackages,
    treeShakingOpportunities: treeShaking,
    lazyLoadingCandidates: lazyLoading,
    dynamicImportCandidates: dynamicImports,
    recommendations,
  };
}

function detectLargestModules(): BundleModule[] {
  // Estimate module sizes from file sizes
  const files = repo.listFiles("src", { extension: ".ts", recursive: true, exclude: ["__tests__", "tests"] });
  const modules: BundleModule[] = [];
  for (const f of files) {
    const stat = repo.getFileStat(f);
    if (!stat) continue;
    const estimatedKb = Math.round(stat.size / 1024);
    if (estimatedKb > 5) {
      modules.push({
        name: f,
        estimatedSizeKb: estimatedKb,
        percent: 0, // computed after sorting
        recommendation: estimatedKb > 50
          ? `${f} is ${estimatedKb}KB — consider code-splitting.`
          : `${f} is ${estimatedKb}KB.`,
      });
    }
  }
  modules.sort((a, b) => b.estimatedSizeKb - a.estimatedSizeKb);
  const top = modules.slice(0, 15);
  const total = top.reduce((s, m) => s + m.estimatedSizeKb, 0);
  for (const m of top) m.percent = Math.round((m.estimatedSizeKb / total) * 100);
  return top;
}

function detectDuplicatePackages(): DuplicatePackage[] {
  // Check package.json for duplicate packages across dependencies/devDependencies
  const pkg = repo.readPackageJson();
  if (!pkg) return [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const byName = new Map<string, string[]>();
  // We can't easily detect transitive duplicates without node_modules analysis
  // but we can flag packages that appear in both deps and devDeps
  for (const name of Object.keys(pkg.dependencies)) {
    if (name in pkg.devDependencies) {
      byName.set(name, [pkg.dependencies[name], pkg.devDependencies[name]]);
    }
  }
  const duplicates: DuplicatePackage[] = [];
  for (const [name, versions] of byName) {
    duplicates.push({
      name, versions,
      estimatedWasteKb: 100, // rough estimate
      recommendation: `${name} appears in both dependencies and devDependencies — move to one only.`,
    });
  }
  return duplicates;
}

function detectTreeShakingOpportunities(): TreeShakingOpportunity[] {
  // Find modules that export many things but import only a few
  const opportunities: TreeShakingOpportunity[] = [];
  const files = repo.listFiles("src/features", { extension: ".ts", recursive: true })
    .filter(f => f.endsWith("index.ts"));
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const exportCount = (content.match(/^export\s/gm) ?? []).length;
    if (exportCount > 20) {
      opportunities.push({
        module: f,
        unusedExports: Math.round(exportCount * 0.3), // estimate ~30% unused
        estimatedSavingsKb: exportCount * 2,
        recommendation: `${f} exports ${exportCount} items — consider splitting into multiple barrels for better tree-shaking.`,
      });
    }
  }
  return opportunities.slice(0, 10);
}

function detectLazyLoadingCandidates(): LazyLoadingCandidate[] {
  // Find heavy pages that could be lazy-loaded
  const candidates: LazyLoadingCandidate[] = [];
  const pages = repo.listFiles("src/app", { extension: ".tsx", recursive: true })
    .filter(f => f.endsWith("page.tsx"));
  for (const p of pages) {
    const stat = repo.getFileStat(p);
    if (!stat) continue;
    const estimatedKb = Math.round(stat.size / 1024);
    if (estimatedKb > 10) {
      candidates.push({
        route: p,
        module: p,
        estimatedSavingsKb: Math.round(estimatedKb * 0.5),
        recommendation: `${p} is ${estimatedKb}KB — consider lazy-loading heavy components.`,
      });
    }
  }
  return candidates.sort((a, b) => b.estimatedSavingsKb - a.estimatedSavingsKb).slice(0, 10);
}

function detectDynamicImportCandidates(): DynamicImportCandidate[] {
  // Find modules that are only used in specific contexts (e.g., heavy AI providers)
  const candidates: DynamicImportCandidate[] = [];
  const heavyModules = [
    { module: "openrouter-sdk", reason: "AI SDK — only needed when AI features are used" },
    { module: "@prisma/client", reason: "Prisma client — can be dynamically imported in serverless" },
    { module: "socket.io", reason: "Socket.IO — only needed for real-time features" },
  ];
  for (const m of heavyModules) {
    // Check if this module is imported in the codebase
    const files = repo.listFiles("src", { extension: ".ts", recursive: true });
    const importers = files.filter(f => {
      const content = repo.readTextFile(f);
      return content?.includes(m.module);
    });
    if (importers.length > 0 && importers.length < 10) {
      candidates.push({
        module: m.module,
        reason: m.reason,
        estimatedSavingsKb: 200,
        recommendation: `Use dynamic import() for ${m.module} in ${importers.length} file(s) to reduce initial bundle.`,
      });
    }
  }
  return candidates;
}

function generateBundleRecommendations(input: {
  largestModules: BundleModule[];
  duplicatePackages: DuplicatePackage[];
  treeShaking: TreeShakingOpportunity[];
  lazyLoading: LazyLoadingCandidate[];
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `bundle-${++id}`;
  if (input.largestModules.length > 0 && input.largestModules[0].estimatedSizeKb > 50) {
    recs.push({
      id: nextId(), category: "bundle",
      title: "Reduce largest bundle modules",
      description: `${input.largestModules.length} modules exceed 50KB.`,
      impact: "medium", effort: "medium",
      recommendation: "Split large modules and use dynamic imports for heavy dependencies.",
    });
  }
  if (input.duplicatePackages.length > 0) {
    recs.push({
      id: nextId(), category: "bundle",
      title: "Remove duplicate packages",
      description: `${input.duplicatePackages.length} package(s) appear in both dependencies and devDependencies.`,
      impact: "low", effort: "low",
      recommendation: "Move packages to only one section of package.json.",
    });
  }
  if (input.lazyLoading.length > 0) {
    recs.push({
      id: nextId(), category: "bundle",
      title: "Lazy-load heavy pages",
      description: `${input.lazyLoading.length} page(s) could benefit from lazy loading.`,
      impact: "medium", effort: "medium",
      recommendation: "Use Next.js dynamic() or React.lazy() for heavy page components.",
    });
  }
  return recs;
}
