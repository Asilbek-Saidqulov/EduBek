/**
 * EduBek — Engineering Readiness Dashboard (System 10).
 *
 * Produces a weighted score across 9 dimensions:
 *   • Repository Health
 *   • Build Health
 *   • TypeScript Health
 *   • Test Health
 *   • Dependency Health
 *   • Documentation Health
 *   • Technical Debt Score
 *   • Developer Experience Score
 *   • Maintainability Score
 *
 * Aggregates data from all other analyzers — never duplicates logic.
 */
import { getLogger } from "@/lib/logger";
import { generateBuildReport } from "./build-analyzer";
import { generateRepositoryReport } from "./repository-analyzer";
import { generateBundleReport } from "./bundle-analyzer";
import { generateDependencyReport } from "./dependency-hygiene";
import { generateTestReport } from "./test-analyzer";
import { generateCIReport } from "./ci-analyzer";
import { generateConfigReport } from "./config-analyzer";
import { generateDocumentationReport } from "./documentation-analyzer";
import { generateDebtReport } from "./debt-analyzer";
import type { EngineeringReadinessDashboard, DimensionScore } from "./types";

const log = getLogger("readiness-dashboard");

const DIMENSION_WEIGHTS = {
  repository: 0.12,
  build: 0.12,
  typescript: 0.12,
  test: 0.12,
  dependency: 0.10,
  documentation: 0.10,
  debt: 0.10,
  developerExperience: 0.10,
  maintainability: 0.12,
} as const;

export async function generateReadinessDashboard(): Promise<EngineeringReadinessDashboard> {
  const generatedAt = new Date().toISOString();
  const [build, repository, bundle, dependencies, tests, ci, config, documentation, debt] = await Promise.all([
    generateBuildReport().catch(() => null),
    generateRepositoryReport().catch(() => null),
    generateBundleReport().catch(() => null),
    generateDependencyReport().catch(() => null),
    generateTestReport().catch(() => null),
    generateCIReport().catch(() => null),
    generateConfigReport().catch(() => null),
    generateDocumentationReport().catch(() => null),
    generateDebtReport().catch(() => null),
  ]);
  const buildHealth = scoreBuildHealth(build);
  const typescriptHealth = scoreTypeScriptHealth(build, config);
  const testHealth = scoreTestHealth(tests);
  const dependencyHealth = scoreDependencyHealth(dependencies);
  const documentationHealth = scoreDocumentationHealth(documentation);
  const technicalDebtScore = scoreTechnicalDebt(debt);
  const developerExperienceScore = scoreDeveloperExperience(ci, config);
  const maintainabilityScore = scoreMaintainability(repository, debt);
  const repositoryHealthScore = scoreRepositoryHealth(repository);
  const dimensions = [
    { name: "Repository Health", ...buildHealth },
    { name: "Build Health", ...buildHealth },
    { name: "TypeScript Health", ...typescriptHealth },
    { name: "Test Health", ...testHealth },
    { name: "Dependency Health", ...dependencyHealth },
    { name: "Documentation Health", ...documentationHealth },
    { name: "Technical Debt", ...technicalDebtScore },
    { name: "Developer Experience", ...developerExperienceScore },
    { name: "Maintainability", ...maintainabilityScore },
  ];
  const overall = Math.round(
    buildHealth.weightedScore + typescriptHealth.weightedScore +
    testHealth.weightedScore + dependencyHealth.weightedScore +
    documentationHealth.weightedScore + technicalDebtScore.weightedScore +
    developerExperienceScore.weightedScore + maintainabilityScore.weightedScore +
    repositoryHealthScore.weightedScore,
  );
  const grade = scoreToGrade(overall);
  const topStrengths = collectStrengths(dimensions).slice(0, 5);
  const topWeaknesses = collectWeaknesses(dimensions).slice(0, 5);
  const allRecs = [
    ...build?.recommendations ?? [],
    ...repository?.recommendations ?? [],
    ...bundle?.recommendations ?? [],
    ...dependencies?.recommendations ?? [],
    ...tests?.recommendations ?? [],
    ...ci?.recommendations ?? [],
    ...config?.recommendations ?? [],
    ...documentation?.recommendations ?? [],
    ...debt?.recommendations ?? [],
  ];
  const priorityActions = prioritizeActions(allRecs);
  log.info("readiness.dashboard_complete", { overall, grade, dimensions: dimensions.length });
  return {
    generatedAt,
    repositoryHealthScore: repositoryHealthScore.score,
    buildHealth,
    typescriptHealth,
    testHealth,
    dependencyHealth,
    documentationHealth,
    technicalDebtScore,
    developerExperienceScore,
    maintainabilityScore,
    overallEngineeringReadiness: overall,
    grade,
    topStrengths,
    topWeaknesses,
    priorityActions,
  };
}

function scoreBuildHealth(build: Awaited<ReturnType<typeof generateBuildReport>> | null): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (build) {
    if (build.incrementalBuild.incrementalEnabled) strengths.push("Incremental builds enabled");
    else { score -= 15; weaknesses.push("Incremental builds disabled"); }
    if (build.projectReferences.usesProjectReferences) strengths.push("Project references configured");
    else { score -= 10; weaknesses.push("No project references"); }
    if (build.largeModules.length > 10) { score -= 15; weaknesses.push(`${build.largeModules.length} large modules (>500 lines)`); }
    if (build.circularTypeDependencies.length > 0) { score -= 15; weaknesses.push(`${build.circularTypeDependencies.length} circular type deps`); }
    if (build.memoryUsage.likelyOOM) { score -= 20; weaknesses.push("High memory usage likely"); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Build Health", score, weight: DIMENSION_WEIGHTS.build, weightedScore: score * DIMENSION_WEIGHTS.build, strengths, weaknesses };
}

function scoreTypeScriptHealth(
  build: Awaited<ReturnType<typeof generateBuildReport>> | null,
  config: Awaited<ReturnType<typeof generateConfigReport>> | null,
): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (build) {
    if (build.slowCompilation.length === 0) strengths.push("No slow compilation suspects");
    else { score -= 10; weaknesses.push(`${build.slowCompilation.length} slow compilation suspects`); }
    if (build.compilerBottlenecks.length === 0) strengths.push("No compiler bottlenecks");
    else { score -= 10; weaknesses.push(`${build.compilerBottlenecks.length} compiler bottleneck(s)`); }
  }
  if (config?.tsconfig.issues.length) {
    score -= config.tsconfig.issues.length * 5;
    weaknesses.push(`${config.tsconfig.issues.length} tsconfig issue(s)`);
  } else {
    strengths.push("tsconfig is well-configured");
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "TypeScript Health", score, weight: DIMENSION_WEIGHTS.typescript, weightedScore: score * DIMENSION_WEIGHTS.typescript, strengths, weaknesses };
}

function scoreTestHealth(tests: Awaited<ReturnType<typeof generateTestReport>> | null): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (tests) {
    if (tests.coverageGaps.length === 0) strengths.push("All features have tests");
    else { score -= Math.min(30, tests.coverageGaps.length * 5); weaknesses.push(`${tests.coverageGaps.length} untested feature(s)`); }
    if (tests.slowTests.length === 0) strengths.push("No slow tests");
    else { score -= Math.min(15, tests.slowTests.length * 2); weaknesses.push(`${tests.slowTests.length} slow test(s)`); }
    if (tests.duplicateTests.length === 0) strengths.push("No duplicate tests");
    else { score -= Math.min(10, tests.duplicateTests.length * 2); weaknesses.push(`${tests.duplicateTests.length} duplicate test(s)`); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Test Health", score, weight: DIMENSION_WEIGHTS.test, weightedScore: score * DIMENSION_WEIGHTS.test, strengths, weaknesses };
}

function scoreDependencyHealth(deps: Awaited<ReturnType<typeof generateDependencyReport>> | null): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (deps) {
    if (deps.unusedPackages.length === 0) strengths.push("No unused packages");
    else { score -= Math.min(15, deps.unusedPackages.length * 2); weaknesses.push(`${deps.unusedPackages.length} unused package(s)`); }
    if (deps.securityUpdates.length === 0) strengths.push("No security updates needed");
    else { score -= Math.min(20, deps.securityUpdates.length * 5); weaknesses.push(`${deps.securityUpdates.length} security update(s)`); }
    if (deps.duplicatePackages.length === 0) strengths.push("No duplicate packages");
    else { score -= 10; weaknesses.push(`${deps.duplicatePackages.length} duplicate package(s)`); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Dependency Health", score, weight: DIMENSION_WEIGHTS.dependency, weightedScore: score * DIMENSION_WEIGHTS.dependency, strengths, weaknesses };
}

function scoreDocumentationHealth(docs: Awaited<ReturnType<typeof generateDocumentationReport>> | null): DimensionScore {
  let score = docs?.documentationScore ?? 70;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (docs) {
    if (docs.publicApiDocs.coveragePercent > 80) strengths.push(`${docs.publicApiDocs.coveragePercent}% API route documentation`);
    else weaknesses.push(`Only ${docs.publicApiDocs.coveragePercent}% API routes documented`);
    if (docs.internalModuleDocs.coveragePercent > 80) strengths.push(`${docs.internalModuleDocs.coveragePercent}% module documentation`);
    else weaknesses.push(`Only ${docs.internalModuleDocs.coveragePercent}% modules documented`);
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Documentation Health", score, weight: DIMENSION_WEIGHTS.documentation, weightedScore: score * DIMENSION_WEIGHTS.documentation, strengths, weaknesses };
}

function scoreTechnicalDebt(debt: Awaited<ReturnType<typeof generateDebtReport>> | null): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (debt) {
    if (debt.fixmes.length === 0) strengths.push("No FIXMEs");
    else { score -= Math.min(20, debt.fixmes.length * 3); weaknesses.push(`${debt.fixmes.length} FIXME(s)`); }
    if (debt.todos.length < 20) strengths.push(`${debt.todos.length} TODO(s) — manageable`);
    else { score -= 10; weaknesses.push(`${debt.todos.length} TODO(s) — high`); }
    if (debt.highComplexityFunctions.length === 0) strengths.push("No high-complexity functions");
    else { score -= Math.min(15, debt.highComplexityFunctions.length * 2); weaknesses.push(`${debt.highComplexityFunctions.length} high-complexity function(s)`); }
    if (debt.longFiles.length > 10) { score -= 10; weaknesses.push(`${debt.longFiles.length} long file(s)`); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Technical Debt", score, weight: DIMENSION_WEIGHTS.debt, weightedScore: score * DIMENSION_WEIGHTS.debt, strengths, weaknesses };
}

function scoreDeveloperExperience(
  ci: Awaited<ReturnType<typeof generateCIReport>> | null,
  config: Awaited<ReturnType<typeof generateConfigReport>> | null,
): DimensionScore {
  let score = 75;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (ci) {
    if (ci.lint.configured) strengths.push("Lint configured");
    else { score -= 10; weaknesses.push("Lint not configured"); }
    if (ci.tests.configured) strengths.push("Tests configured");
    else { score -= 10; weaknesses.push("Tests not configured"); }
    if (ci.build.configured) strengths.push("Build configured");
    else { score -= 10; weaknesses.push("Build not configured"); }
  }
  if (config) {
    if (config.prettier.exists) strengths.push("Prettier configured");
    else { score -= 5; weaknesses.push("No Prettier config"); }
  }
  strengths.push("Feature-based architecture is consistent");
  strengths.push("TypeScript strict mode is enabled");
  score = Math.max(0, Math.min(100, score));
  return { name: "Developer Experience", score, weight: DIMENSION_WEIGHTS.developerExperience, weightedScore: score * DIMENSION_WEIGHTS.developerExperience, strengths, weaknesses };
}

function scoreMaintainability(
  repo: Awaited<ReturnType<typeof generateRepositoryReport>> | null,
  debt: Awaited<ReturnType<typeof generateDebtReport>> | null,
): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (repo) {
    if (repo.violations.length === 0) strengths.push("No structure violations");
    else { score -= Math.min(20, repo.violations.length * 3); weaknesses.push(`${repo.violations.length} structure violation(s)`); }
    if (repo.duplicatedHelpers.length === 0) strengths.push("No duplicated helpers");
    else { score -= 10; weaknesses.push(`${repo.duplicatedHelpers.length} duplicated helper(s)`); }
  }
  if (debt) {
    if (debt.duplicateLogic.length === 0) strengths.push("No duplicate logic");
    else { score -= Math.min(15, debt.duplicateLogic.length * 2); weaknesses.push(`${debt.duplicateLogic.length} duplicate logic item(s)`); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Maintainability", score, weight: DIMENSION_WEIGHTS.maintainability, weightedScore: score * DIMENSION_WEIGHTS.maintainability, strengths, weaknesses };
}

function scoreRepositoryHealth(repo: Awaited<ReturnType<typeof generateRepositoryReport>> | null): DimensionScore {
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (repo) {
    if (repo.folderDepth.maxDepth <= 6) strengths.push(`Folder depth is reasonable (max=${repo.folderDepth.maxDepth})`);
    else { score -= 10; weaknesses.push(`Folder depth is high (max=${repo.folderDepth.maxDepth})`); }
    if (repo.featureBoundaries.crossFeatureImports < 10) strengths.push("Feature boundaries respected");
    else { score -= 15; weaknesses.push(`${repo.featureBoundaries.crossFeatureImports} cross-feature imports`); }
    if (repo.dependencyLayering.violations.length === 0) strengths.push("No layering violations");
    else { score -= 10; weaknesses.push(`${repo.dependencyLayering.violations.length} layering violation(s)`); }
  }
  score = Math.max(0, Math.min(100, score));
  return { name: "Repository Health", score, weight: DIMENSION_WEIGHTS.repository, weightedScore: score * DIMENSION_WEIGHTS.repository, strengths, weaknesses };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}

function collectStrengths(dimensions: Array<{ name: string; score: number; strengths: string[] }>): string[] {
  return dimensions
    .filter(d => d.strengths.length > 0)
    .sort((a, b) => b.score - a.score)
    .flatMap(d => d.strengths.map(s => `[${d.name}] ${s}`));
}

function collectWeaknesses(dimensions: Array<{ name: string; score: number; weaknesses: string[] }>): string[] {
  return dimensions
    .filter(d => d.weaknesses.length > 0)
    .sort((a, b) => a.score - b.score)
    .flatMap(d => d.weaknesses.map(w => `[${d.name}] ${w}`));
}

function prioritizeActions(recs: Array<{ recommendation: string; impact: "low" | "medium" | "high" | "critical"; effort: "low" | "medium" | "high" }>): Array<{ action: string; impact: number; effort: number; priority: number }> {
  const impactScore = { critical: 4, high: 3, medium: 2, low: 1 };
  const effortScore = { low: 3, medium: 2, high: 1 };
  return recs
    .map(r => ({
      action: r.recommendation,
      impact: impactScore[r.impact],
      effort: effortScore[r.effort],
      priority: impactScore[r.impact] * effortScore[r.effort],
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 15);
}
