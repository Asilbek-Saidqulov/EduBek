/**
 * EduBek — Dependency Hygiene Analyzer (System 4).
 *
 * Analyzes npm packages: unused, duplicate, version inconsistencies,
 * heavy dependencies, transitive size, security updates, and license
 * compatibility.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  DependencyHygieneReport, UnusedPackage, DuplicatePackage,
  VersionInconsistency, HeavyDependency, SecurityUpdate,
  LicenseCompatibility, EngineeringRecommendation,
} from "./types";

const log = getLogger("dependency-hygiene");

export async function generateDependencyReport(): Promise<DependencyHygieneReport> {
  const generatedAt = new Date().toISOString();
  const pkg = repo.readPackageJson();
  if (!pkg) {
    return {
      generatedAt, totalPackages: 0,
      unusedPackages: [], duplicatePackages: [], versionInconsistencies: [],
      heavyDependencies: [], securityUpdates: [], licenseCompatibility: [],
      recommendations: [],
    };
  }
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const totalPackages = Object.keys(allDeps).length;
  const [unused, duplicates, inconsistencies, heavy, security, licenses] = await Promise.all([
    detectUnusedPackages(pkg),
    detectDuplicatePackages(pkg),
    detectVersionInconsistencies(pkg),
    detectHeavyDependencies(allDeps),
    detectSecurityUpdates(allDeps),
    checkLicenseCompatibility(allDeps),
  ]);
  const recommendations = generateDepRecommendations({
    unused, duplicates, heavy, security,
  });
  log.info("dependency.audit_complete", {
    total: totalPackages, unused: unused.length,
    duplicates: duplicates.length, heavy: heavy.length,
  });
  return {
    generatedAt, totalPackages,
    unusedPackages: unused, duplicatePackages: duplicates,
    versionInconsistencies: inconsistencies, heavyDependencies: heavy,
    securityUpdates: security, licenseCompatibility: licenses,
    recommendations,
  };
}

function detectUnusedPackages(pkg: repo.PackageJson): UnusedPackage[] {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const unused: UnusedPackage[] = [];
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const allImports = new Set<string>();
  for (const f of files) {
    const imports = repo.extractImports(f);
    for (const imp of imports) {
      if (repo.isBareImport(imp)) {
        // Get the package name (handle scoped packages)
        const parts = imp.split("/");
        const name = imp.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
        allImports.add(name);
      }
    }
  }
  // Also check scripts and config files for usage
  const configFiles = ["next.config.ts", "vitest.config.ts", "eslint.config.mjs"];
  for (const cf of configFiles) {
    const content = repo.readTextFile(cf);
    if (!content) continue;
    for (const dep of Object.keys(allDeps)) {
      if (content.includes(dep)) allImports.add(dep);
    }
  }
  for (const name of Object.keys(allDeps)) {
    // Skip build tools that are used implicitly
    const implicit = ["typescript", "eslint", "prettier", "prisma", "@prisma/client", "next"];
    if (implicit.includes(name)) continue;
    if (!allImports.has(name)) {
      unused.push({
        name,
        type: name in pkg.dependencies ? "dependency" : "devDependency",
        recommendation: `${name} is not imported anywhere in src/ — consider removing it.`,
      });
    }
  }
  return unused.slice(0, 20);
}

function detectDuplicatePackages(pkg: repo.PackageJson): DuplicatePackage[] {
  const duplicates: DuplicatePackage[] = [];
  for (const name of Object.keys(pkg.dependencies)) {
    if (name in pkg.devDependencies) {
      duplicates.push({
        name,
        versions: [pkg.dependencies[name], pkg.devDependencies[name]],
        estimatedWasteKb: 100,
        recommendation: `${name} appears in both dependencies and devDependencies.`,
      });
    }
  }
  return duplicates;
}

function detectVersionInconsistencies(pkg: repo.PackageJson): VersionInconsistency[] {
  // This would require reading lockfile — we return an empty list as a placeholder
  return [];
}

function detectHeavyDependencies(deps: Record<string, string>): HeavyDependency[] {
  // Known heavy dependencies with rough size estimates
  const knownHeavy: Record<string, { sizeKb: number; transitive: number }> = {
    "@prisma/client": { sizeKb: 1500, transitive: 5 },
    "next": { sizeKb: 5000, transitive: 50 },
    "react": { sizeKb: 150, transitive: 3 },
    "z-ai-web-dev-sdk": { sizeKb: 500, transitive: 10 },
    "socket.io": { sizeKb: 300, transitive: 15 },
    "@dnd-kit/core": { sizeKb: 200, transitive: 5 },
    "@mdxeditor/editor": { sizeKb: 800, transitive: 20 },
  };
  const heavy: HeavyDependency[] = [];
  for (const name of Object.keys(deps)) {
    const info = knownHeavy[name];
    if (info) {
      heavy.push({
        name,
        estimatedSizeKb: info.sizeKb,
        transitiveCount: info.transitive,
        recommendation: info.sizeKb > 1000
          ? `${name} is ~${info.sizeKb}KB with ${info.transitive} transitive deps — consider lazy-loading.`
          : `${name} is ~${info.sizeKb}KB.`,
      });
    }
  }
  return heavy.sort((a, b) => b.estimatedSizeKb - a.estimatedSizeKb);
}

function detectSecurityUpdates(deps: Record<string, string>): SecurityUpdate[] {
  // We can't run `npm audit` programmatically here, but we can flag
  // packages with known major version gaps
  const updates: SecurityUpdate[] = [];
  // Check for very old versions of common packages
  const checks: Array<{ name: string; minMajor: number }> = [
    { name: "next", minMajor: 15 },
    { name: "react", minMajor: 19 },
    { name: "typescript", minMajor: 5 },
  ];
  for (const { name, minMajor } of checks) {
    if (name in deps) {
      const version = deps[name].replace(/[\^~]/, "");
      const major = parseInt(version.split(".")[0] ?? "0", 10);
      if (major < minMajor) {
        updates.push({
          name,
          currentVersion: deps[name],
          recommendedVersion: `^${minMajor}.0.0`,
          severity: "medium",
          recommendation: `Update ${name} from ${deps[name]} to ^${minMajor}.0.0 for security patches.`,
        });
      }
    }
  }
  return updates;
}

function checkLicenseCompatibility(deps: Record<string, string>): LicenseCompatibility[] {
  // Known license-friendly packages
  const compatibleLicenses = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"];
  const results: LicenseCompatibility[] = [];
  // We can't read licenses without node_modules, so we return known-compatible packages
  const knownLicensed: Record<string, string> = {
    "next": "MIT",
    "react": "MIT",
    "react-dom": "MIT",
    "typescript": "Apache-2.0",
    "@prisma/client": "Apache-2.0",
    "prisma": "Apache-2.0",
    "eslint": "MIT",
    "vitest": "MIT",
    "zod": "MIT",
    "jose": "MIT",
  };
  for (const name of Object.keys(deps)) {
    const license = knownLicensed[name];
    if (license) {
      results.push({
        name,
        license,
        compatible: compatibleLicenses.includes(license),
        recommendation: compatibleLicenses.includes(license)
          ? `${name} uses ${license} — compatible.`
          : `${name} uses ${license} — review compatibility.`,
      });
    }
  }
  return results.slice(0, 20);
}

function generateDepRecommendations(input: {
  unused: UnusedPackage[];
  duplicates: DuplicatePackage[];
  heavy: HeavyDependency[];
  security: SecurityUpdate[];
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `dep-${++id}`;
  if (input.unused.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Remove unused packages",
      description: `${input.unused.length} unused package(s) detected.`,
      impact: "low", effort: "low",
      recommendation: "Run `npm uninstall` for unused packages to reduce install time and bundle size.",
    });
  }
  if (input.duplicates.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Resolve duplicate packages",
      description: `${input.duplicates.length} package(s) appear in both dependencies and devDependencies.`,
      impact: "low", effort: "low",
      recommendation: "Move each package to only one section.",
    });
  }
  if (input.security.length > 0) {
    recs.push({
      id: nextId(), category: "dependency",
      title: "Update packages for security",
      description: `${input.security.length} package(s) have security updates available.`,
      impact: "high", effort: "medium",
      recommendation: "Update to the recommended versions.",
    });
  }
  return recs;
}
