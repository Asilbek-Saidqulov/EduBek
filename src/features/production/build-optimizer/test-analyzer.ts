/**
 * EduBek — Test Infrastructure Analyzer (System 5).
 *
 * Measures test runtime, slow tests, duplicate tests, coverage gaps,
 * parallelization opportunities, fixture reuse, and mock reuse.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  TestInfrastructureReport, SlowTest, DuplicateTest, CoverageGap,
  ParallelizationOpportunity, FixtureReuseAnalysis, MockReuseAnalysis,
  EngineeringRecommendation,
} from "./types";

const log = getLogger("test-analyzer");

export async function generateTestReport(): Promise<TestInfrastructureReport> {
  const generatedAt = new Date().toISOString();
  const testFiles = repo.listFiles("tests", { extension: ".ts", recursive: true });
  const [slowTests, duplicateTests, coverageGaps, parallelization,
    fixtureReuse, mockReuse] = await Promise.all([
    detectSlowTests(testFiles),
    detectDuplicateTests(testFiles),
    detectCoverageGaps(),
    detectParallelizationOpportunities(testFiles),
    analyzeFixtureReuse(testFiles),
    analyzeMockReuse(testFiles),
  ]);
  const totalTests = countTotalTests(testFiles);
  const totalRuntimeMs = estimateRuntimeMs(testFiles);
  const recommendations = generateTestRecommendations({
    slowTests, duplicateTests, coverageGaps, fixtureReuse, mockReuse,
  });
  log.info("test.audit_complete", {
    files: testFiles.length, totalTests,
    slow: slowTests.length, duplicates: duplicateTests.length,
  });
  return {
    generatedAt, totalTests, totalRuntimeMs,
    slowTests, duplicateTests, coverageGaps, parallelization,
    fixtureReuse, mockReuse, recommendations,
  };
}

function countTotalTests(files: string[]): number {
  let count = 0;
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    count += (content.match(/\bit\s*\(/g) ?? []).length;
    count += (content.match(/\btest\s*\(/g) ?? []).length;
  }
  return count;
}

function estimateRuntimeMs(files: string[]): number {
  // Rough estimate: 10ms per test + 500ms per file setup
  const testCount = countTotalTests(files);
  return testCount * 10 + files.length * 500;
}

function detectSlowTests(files: string[]): SlowTest[] {
  // We can't actually run tests here, but we can flag tests that are
  // likely slow based on their content (e.g., tests with setTimeout,
  // waitFor, or network calls)
  const slow: SlowTest[] = [];
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    // Find tests that use setTimeout or waitFor
    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g;
    let match: RegExpExecArray | null;
    while ((match = testRegex.exec(content)) !== null) {
      const testName = match[1];
      // Look ahead for slow patterns in the test body
      const afterMatch = content.slice(match.index);
      const hasSetTimeout = afterMatch.includes("setTimeout");
      const hasWaitFor = afterMatch.includes("waitFor");
      const hasNetwork = afterMatch.includes("fetch(") || afterMatch.includes("axios");
      if (hasSetTimeout || hasWaitFor || hasNetwork) {
        slow.push({
          file: f, testName,
          durationMs: hasNetwork ? 5000 : hasSetTimeout ? 1000 : 500,
          recommendation: `${testName} in ${f} likely uses ${hasNetwork ? "network" : hasSetTimeout ? "setTimeout" : "waitFor"} — consider mocking.`,
        });
      }
    }
  }
  return slow.sort((a, b) => b.durationMs - a.durationMs).slice(0, 15);
}

function detectDuplicateTests(files: string[]): DuplicateTest[] {
  const testNameLocations = new Map<string, string[]>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    for (const m of matches) {
      const name = m[1];
      if (!testNameLocations.has(name)) testNameLocations.set(name, []);
      testNameLocations.get(name)!.push(f);
    }
  }
  const duplicates: DuplicateTest[] = [];
  for (const [name, locations] of testNameLocations) {
    if (locations.length > 1) {
      duplicates.push({
        testName: name, files: locations,
        recommendation: `Test "${name}" appears in ${locations.length} files — possible duplicate.`,
      });
    }
  }
  return duplicates.slice(0, 10);
}

function detectCoverageGaps(): CoverageGap[] {
  // Find feature modules with no corresponding test file
  const features = repo.listFiles("src/features", { recursive: false });
  const testFiles = repo.listFiles("tests", { extension: ".ts", recursive: true });
  const testedFeatures = new Set(
    testFiles.map(f => f.match(/tests\/unit\/(.+?)\.test\.ts/)?.[1]).filter(Boolean) as string[],
  );
  const gaps: CoverageGap[] = [];
  for (const feature of features) {
    const featureName = feature.split("/")[0];
    if (!testedFeatures.has(featureName)) {
      const files = repo.listFiles(`src/features/${featureName}`, { extension: ".ts", recursive: true });
      gaps.push({
        module: `src/features/${featureName}`,
        coveragePercent: 0,
        uncoveredFiles: files.slice(0, 10),
        recommendation: `No test file for ${featureName} — add tests/unit/${featureName}.test.ts`,
      });
    }
  }
  return gaps.slice(0, 15);
}

function detectParallelizationOpportunities(files: string[]): ParallelizationOpportunity[] {
  const opportunities: ParallelizationOpportunity[] = [];
  // Check if tests use `describe.serial` (sequential)
  let serialCount = 0;
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    serialCount += (content.match(/describe\.serial/g) ?? []).length;
  }
  if (serialCount > 0) {
    opportunities.push({
      description: `${serialCount} describe.serial block(s) found — tests run sequentially.`,
      estimatedSpeedup: serialCount * 2,
      recommendation: "Remove .serial where tests are independent to enable parallelization.",
    });
  }
  // Check for tests with long timeouts
  let longTimeoutCount = 0;
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/testTimeout\s*[:=]\s*(\d+)/g);
    for (const m of matches) {
      if (parseInt(m[1], 10) > 30000) longTimeoutCount++;
    }
  }
  if (longTimeoutCount > 0) {
    opportunities.push({
      description: `${longTimeoutCount} test(s) with timeout > 30s — likely slow.`,
      estimatedSpeedup: 3,
      recommendation: "Refactor slow tests to use mocks instead of real waits.",
    });
  }
  return opportunities;
}

function analyzeFixtureReuse(files: string[]): FixtureReuseAnalysis {
  // Detect inline fixture data that could be extracted
  let duplicatedFixtures = 0;
  const fixturePatterns = new Map<string, number>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    // Look for inline objects that look like fixtures
    const matches = content.matchAll(/(?:const|let)\s+(\w+)\s*=\s*\{[^}]{50,}\}/g);
    for (const m of matches) {
      const name = m[1];
      fixturePatterns.set(name, (fixturePatterns.get(name) ?? 0) + 1);
    }
  }
  for (const [, count] of fixturePatterns) {
    if (count > 1) duplicatedFixtures++;
  }
  return {
    totalFixtures: fixturePatterns.size,
    duplicatedFixtures,
    recommendation: duplicatedFixtures > 0
      ? `${duplicatedFixtures} fixture(s) appear in multiple tests — extract to a shared fixtures file.`
      : "Fixtures are well-organized.",
  };
}

function analyzeMockReuse(files: string[]): MockReuseAnalysis {
  // Detect duplicated mock setups
  const mockPatterns = new Map<string, number>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/vi\.mock\(\s*['"]([^'"]+)['"]/g);
    for (const m of matches) {
      const name = m[1];
      mockPatterns.set(name, (mockPatterns.get(name) ?? 0) + 1);
    }
  }
  const duplicated = Array.from(mockPatterns.values()).filter(c => c > 1).length;
  return {
    totalMocks: mockPatterns.size,
    duplicatedMocks: duplicated,
    recommendation: duplicated > 0
      ? `${duplicated} mock(s) set up in multiple test files — extract to a shared mock setup.`
      : "Mocks are well-organized.",
  };
}

function generateTestRecommendations(input: {
  slowTests: SlowTest[];
  duplicateTests: DuplicateTest[];
  coverageGaps: CoverageGap[];
  fixtureReuse: FixtureReuseAnalysis;
  mockReuse: MockReuseAnalysis;
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `test-${++id}`;
  if (input.coverageGaps.length > 0) {
    recs.push({
      id: nextId(), category: "test",
      title: "Add tests for untested features",
      description: `${input.coverageGaps.length} feature module(s) have no test file.`,
      impact: "high", effort: "medium",
      recommendation: "Add a test file for each untested feature module.",
    });
  }
  if (input.slowTests.length > 0) {
    recs.push({
      id: nextId(), category: "test",
      title: "Optimize slow tests",
      description: `${input.slowTests.length} test(s) are likely slow.`,
      impact: "medium", effort: "low",
      recommendation: "Mock network calls and reduce setTimeout usage.",
    });
  }
  if (input.duplicateTests.length > 0) {
    recs.push({
      id: nextId(), category: "test",
      title: "Remove duplicate tests",
      description: `${input.duplicateTests.length} test name(s) appear in multiple files.`,
      impact: "low", effort: "low",
      recommendation: "Consolidate duplicate tests or rename them to be specific.",
    });
  }
  return recs;
}
