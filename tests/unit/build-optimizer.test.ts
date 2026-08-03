/**
 * EduBek — Build Optimizer tests.
 *
 * Phase 6A.2: Verifies the engineering analyzers — build, repository,
 * bundle, dependencies, tests, CI, config, documentation, debt, and
 * readiness dashboard.
 */
import { describe, it, expect } from "vitest";
import { generateBuildReport } from "@/features/production/build-optimizer/build-analyzer";
import { generateRepositoryReport } from "@/features/production/build-optimizer/repository-analyzer";
import { generateBundleReport } from "@/features/production/build-optimizer/bundle-analyzer";
import { generateDependencyReport } from "@/features/production/build-optimizer/dependency-hygiene";
import { generateTestReport } from "@/features/production/build-optimizer/test-analyzer";
import { generateCIReport } from "@/features/production/build-optimizer/ci-analyzer";
import { generateConfigReport } from "@/features/production/build-optimizer/config-analyzer";
import { generateDocumentationReport } from "@/features/production/build-optimizer/documentation-analyzer";
import { generateDebtReport } from "@/features/production/build-optimizer/debt-analyzer";
import { generateReadinessDashboard } from "@/features/production/build-optimizer/readiness-dashboard";
import * as repo from "@/features/production/build-optimizer/repository";

// ===========================================================================
// Repository helpers
// ===========================================================================

describe("Build Optimizer — Repository helpers", () => {
  it("reads package.json", () => {
    const pkg = repo.readPackageJson();
    expect(pkg).not.toBeNull();
    expect(pkg!.name).toBeTruthy();
    expect(pkg!.dependencies).toBeDefined();
    expect(pkg!.devDependencies).toBeDefined();
  });

  it("reads tsconfig.json", () => {
    const tsconfig = repo.readTsConfig();
    expect(tsconfig).not.toBeNull();
    expect(tsconfig!.compilerOptions).toBeDefined();
  });

  it("lists files with extension filter", () => {
    // src/features contains subdirectories — list recursively to find .ts files
    const files = repo.listFiles("src/features", { extension: ".ts", recursive: true });
    expect(files.length).toBeGreaterThan(0);
  });

  it("counts lines in a file", () => {
    const lines = repo.countLines("package.json");
    expect(lines).toBeGreaterThan(0);
  });

  it("extracts imports from a file", () => {
    const imports = repo.extractImports("src/features/production/build-optimizer/index.ts");
    expect(imports.length).toBeGreaterThan(0);
  });

  it("classifies import types", () => {
    expect(repo.isRelativeImport("./foo")).toBe(true);
    expect(repo.isRelativeImport("../bar")).toBe(true);
    expect(repo.isRelativeImport("@/lib/foo")).toBe(false);
    expect(repo.isAliasImport("@/lib/foo")).toBe(true);
    expect(repo.isBareImport("react")).toBe(true);
    expect(repo.isDeepImport("lodash/fp")).toBe(true);
    expect(repo.isDeepImport("react")).toBe(false);
  });
});

// ===========================================================================
// Build Analyzer
// ===========================================================================

describe("Build Optimizer — Build Analyzer", () => {
  it("generates a build optimization report", async () => {
    const report = await generateBuildReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("projectReferences");
    expect(report).toHaveProperty("incrementalBuild");
    expect(report).toHaveProperty("typeDependencyGraph");
    expect(report).toHaveProperty("largeModules");
    expect(report).toHaveProperty("circularTypeDependencies");
    expect(report).toHaveProperty("memoryUsage");
    expect(report).toHaveProperty("compilerBottlenecks");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects incremental build status", async () => {
    const report = await generateBuildReport();
    expect(report.incrementalBuild.incrementalEnabled).toBe(true); // tsconfig has incremental: true
  });

  it("detects large modules", async () => {
    const report = await generateBuildReport();
    // EduBek has many large modules
    expect(report.largeModules.length).toBeGreaterThan(0);
  });

  it("estimates memory usage", async () => {
    const report = await generateBuildReport();
    expect(report.memoryUsage.estimatedMb).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Repository Analyzer
// ===========================================================================

describe("Build Optimizer — Repository Analyzer", () => {
  it("generates a repository structure report", async () => {
    const report = await generateRepositoryReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("folderDepth");
    expect(report).toHaveProperty("moduleSizes");
    expect(report).toHaveProperty("featureBoundaries");
    expect(report).toHaveProperty("barrelExports");
    expect(report).toHaveProperty("importPatterns");
    expect(report).toHaveProperty("dependencyLayering");
    expect(report).toHaveProperty("violations");
    expect(report).toHaveProperty("recommendations");
  });

  it("counts feature modules", async () => {
    const report = await generateRepositoryReport();
    expect(report.featureBoundaries.featureCount).toBeGreaterThan(50);
  });

  it("analyzes import patterns", async () => {
    const report = await generateRepositoryReport();
    expect(report.importPatterns.totalImports).toBeGreaterThan(0);
    expect(report.importPatterns.aliasImports).toBeGreaterThan(0); // @/ imports
  });
});

// ===========================================================================
// Bundle Analyzer
// ===========================================================================

describe("Build Optimizer — Bundle Analyzer", () => {
  it("generates a bundle analysis report", async () => {
    const report = await generateBundleReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("estimatedBundleSizeKb");
    expect(report).toHaveProperty("largestModules");
    expect(report).toHaveProperty("duplicatePackages");
    expect(report).toHaveProperty("treeShakingOpportunities");
    expect(report).toHaveProperty("lazyLoadingCandidates");
    expect(report).toHaveProperty("dynamicImportCandidates");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects largest modules", async () => {
    const report = await generateBundleReport();
    expect(report.largestModules.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Dependency Hygiene
// ===========================================================================

describe("Build Optimizer — Dependency Hygiene", () => {
  it("generates a dependency hygiene report", async () => {
    const report = await generateDependencyReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("totalPackages");
    expect(report).toHaveProperty("unusedPackages");
    expect(report).toHaveProperty("heavyDependencies");
    expect(report).toHaveProperty("securityUpdates");
    expect(report).toHaveProperty("licenseCompatibility");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects total packages", async () => {
    const report = await generateDependencyReport();
    expect(report.totalPackages).toBeGreaterThan(50);
  });
});

// ===========================================================================
// Test Analyzer
// ===========================================================================

describe("Build Optimizer — Test Analyzer", () => {
  it("generates a test infrastructure report", async () => {
    const report = await generateTestReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("totalTests");
    expect(report).toHaveProperty("slowTests");
    expect(report).toHaveProperty("duplicateTests");
    expect(report).toHaveProperty("coverageGaps");
    expect(report).toHaveProperty("fixtureReuse");
    expect(report).toHaveProperty("mockReuse");
    expect(report).toHaveProperty("recommendations");
  });

  it("counts total tests", async () => {
    const report = await generateTestReport();
    expect(report.totalTests).toBeGreaterThan(400);
  });
});

// ===========================================================================
// CI Analyzer
// ===========================================================================

describe("Build Optimizer — CI Analyzer", () => {
  it("generates a CI/CD readiness report", async () => {
    const report = await generateCIReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("lint");
    expect(report).toHaveProperty("tests");
    expect(report).toHaveProperty("typeChecking");
    expect(report).toHaveProperty("build");
    expect(report).toHaveProperty("migrationSafety");
    expect(report).toHaveProperty("rollbackReadiness");
    expect(report).toHaveProperty("artifactSize");
    expect(report).toHaveProperty("pipelineDuration");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects configured CI stages", async () => {
    const report = await generateCIReport();
    expect(report.lint.configured).toBe(true);
    expect(report.tests.configured).toBe(true);
    expect(report.build.configured).toBe(true);
  });

  it("estimates pipeline duration", async () => {
    const report = await generateCIReport();
    expect(report.pipelineDuration.estimatedTotalMs).toBeGreaterThan(0);
    expect(report.pipelineDuration.stages.length).toBe(4);
  });
});

// ===========================================================================
// Config Analyzer
// ===========================================================================

describe("Build Optimizer — Config Analyzer", () => {
  it("generates a configuration report", async () => {
    const report = await generateConfigReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("tsconfig");
    expect(report).toHaveProperty("eslint");
    expect(report).toHaveProperty("prettier");
    expect(report).toHaveProperty("vitest");
    expect(report).toHaveProperty("nextConfig");
    expect(report).toHaveProperty("environmentVariables");
    expect(report).toHaveProperty("featureFlags");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects tsconfig existence", async () => {
    const report = await generateConfigReport();
    expect(report.tsconfig.exists).toBe(true);
  });
});

// ===========================================================================
// Documentation Analyzer
// ===========================================================================

describe("Build Optimizer — Documentation Analyzer", () => {
  it("generates a documentation coverage report", async () => {
    const report = await generateDocumentationReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("publicApiDocs");
    expect(report).toHaveProperty("internalModuleDocs");
    expect(report).toHaveProperty("readmeCoverage");
    expect(report).toHaveProperty("architectureDocs");
    expect(report).toHaveProperty("endpointDocs");
    expect(report).toHaveProperty("documentationScore");
    expect(report).toHaveProperty("recommendations");
  });

  it("computes a documentation score", async () => {
    const report = await generateDocumentationReport();
    expect(report.documentationScore).toBeGreaterThanOrEqual(0);
    expect(report.documentationScore).toBeLessThanOrEqual(100);
  });
});

// ===========================================================================
// Debt Analyzer
// ===========================================================================

describe("Build Optimizer — Debt Analyzer", () => {
  it("generates a technical debt report", async () => {
    const report = await generateDebtReport();
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("todos");
    expect(report).toHaveProperty("fixmes");
    expect(report).toHaveProperty("deprecatedApis");
    expect(report).toHaveProperty("temporaryWorkarounds");
    expect(report).toHaveProperty("unusedCode");
    expect(report).toHaveProperty("highComplexityFunctions");
    expect(report).toHaveProperty("longFiles");
    expect(report).toHaveProperty("debtBacklog");
    expect(report).toHaveProperty("recommendations");
  });

  it("detects long files", async () => {
    const report = await generateDebtReport();
    expect(report.longFiles.length).toBeGreaterThan(0); // EduBek has many long files
  });

  it("prioritizes debt backlog", async () => {
    const report = await generateDebtReport();
    for (let i = 1; i < report.debtBacklog.length; i++) {
      expect(report.debtBacklog[i].priority)
        .toBeLessThanOrEqual(report.debtBacklog[i - 1].priority);
    }
  });
});

// ===========================================================================
// Readiness Dashboard
// ===========================================================================

describe("Build Optimizer — Readiness Dashboard", () => {
  it("generates an engineering readiness dashboard", async () => {
    const dashboard = await generateReadinessDashboard();
    expect(dashboard).toHaveProperty("generatedAt");
    expect(dashboard).toHaveProperty("repositoryHealthScore");
    expect(dashboard).toHaveProperty("buildHealth");
    expect(dashboard).toHaveProperty("typescriptHealth");
    expect(dashboard).toHaveProperty("testHealth");
    expect(dashboard).toHaveProperty("dependencyHealth");
    expect(dashboard).toHaveProperty("documentationHealth");
    expect(dashboard).toHaveProperty("technicalDebtScore");
    expect(dashboard).toHaveProperty("developerExperienceScore");
    expect(dashboard).toHaveProperty("maintainabilityScore");
    expect(dashboard).toHaveProperty("overallEngineeringReadiness");
    expect(dashboard).toHaveProperty("grade");
    expect(dashboard).toHaveProperty("topStrengths");
    expect(dashboard).toHaveProperty("topWeaknesses");
    expect(dashboard).toHaveProperty("priorityActions");
  });

  it("computes an overall readiness score", async () => {
    const dashboard = await generateReadinessDashboard();
    expect(dashboard.overallEngineeringReadiness).toBeGreaterThanOrEqual(0);
    expect(dashboard.overallEngineeringReadiness).toBeLessThanOrEqual(100);
    expect(dashboard.grade).toMatch(/^[A-F][+-]?$/);
  });

  it("dimension scores have weights", async () => {
    const dashboard = await generateReadinessDashboard();
    const dimensions = [
      dashboard.buildHealth, dashboard.typescriptHealth, dashboard.testHealth,
      dashboard.dependencyHealth, dashboard.documentationHealth,
      dashboard.technicalDebtScore, dashboard.developerExperienceScore,
      dashboard.maintainabilityScore,
    ];
    for (const d of dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.weight).toBeGreaterThan(0);
      expect(d.weightedScore).toBeCloseTo(d.score * d.weight, 2);
    }
  });

  it("priority actions are sorted by priority", async () => {
    const dashboard = await generateReadinessDashboard();
    for (let i = 1; i < dashboard.priorityActions.length; i++) {
      expect(dashboard.priorityActions[i].priority)
        .toBeLessThanOrEqual(dashboard.priorityActions[i - 1].priority);
    }
  });
});
