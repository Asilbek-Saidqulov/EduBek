/**
 * EduBek — Configuration Analyzer (System 7).
 *
 * Analyzes tsconfig, eslint, prettier, vitest, next.config, environment
 * variables, feature flags, and configuration duplication.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  ConfigurationReport, ConfigAnalysis, EnvVarAnalysis, FeatureFlagAnalysis,
  ConfigurationDuplication, EngineeringRecommendation,
} from "./types";

const log = getLogger("config-analyzer");

export async function generateConfigReport(): Promise<ConfigurationReport> {
  const generatedAt = new Date().toISOString();
  const [tsconfig, eslint, prettier, vitest, nextConfig, envVars, featureFlags,
    duplication] = await Promise.all([
    analyzeTsConfig(),
    analyzeEslintConfig(),
    analyzePrettierConfig(),
    analyzeVitestConfig(),
    analyzeNextConfig(),
    analyzeEnvVars(),
    analyzeFeatureFlags(),
    detectConfigDuplication(),
  ]);
  const recommendations = generateConfigRecommendations({
    tsconfig, eslint, prettier, vitest, nextConfig, envVars, featureFlags,
  });
  log.info("config.audit_complete", {
    tsconfig: tsconfig.exists, eslint: eslint.exists,
    envVars: envVars.total, flags: featureFlags.totalFlags,
  });
  return {
    generatedAt,
    tsconfig, eslint, prettier, vitest, nextConfig,
    environmentVariables: envVars, featureFlags, configurationDuplication: duplication,
    recommendations,
  };
}

function analyzeTsConfig(): ConfigAnalysis {
  const exists = repo.fileExists("tsconfig.json");
  const content = repo.readTextFile("tsconfig.json");
  const issues: string[] = [];
  if (!exists) {
    issues.push("tsconfig.json not found");
    return { file: "tsconfig.json", exists, issues, recommendation: "Create a tsconfig.json file." };
  }
  const tsconfig = repo.readTsConfig();
  const compilerOptions = tsconfig?.compilerOptions as Record<string, unknown> | undefined;
  if (!compilerOptions?.strict) issues.push("strict mode is not enabled");
  if (!compilerOptions?.incremental) issues.push("incremental builds are not enabled");
  if (!compilerOptions?.skipLibCheck) issues.push("skipLibCheck is not enabled — slows down type checking");
  if (!content?.includes("paths")) issues.push("No path aliases configured");
  return {
    file: "tsconfig.json", exists, issues,
    recommendation: issues.length > 0
      ? `Fix ${issues.length} issue(s): ${issues.join(", ")}.`
      : "tsconfig is well-configured.",
  };
}

function analyzeEslintConfig(): ConfigAnalysis {
  const content = repo.readEslintConfig();
  const exists = !!content;
  const issues: string[] = [];
  if (!exists) {
    issues.push("ESLint config not found");
    return { file: "eslint.config.*", exists, issues, recommendation: "Create an ESLint config." };
  }
  if (content.includes('"off"')) {
    const offCount = (content.match(/"off"/g) ?? []).length;
    if (offCount > 10) issues.push(`${offCount} rules are disabled — consider enabling some`);
  }
  return {
    file: "eslint.config.mjs", exists, issues,
    recommendation: issues.length > 0
      ? `Address ${issues.length} issue(s).`
      : "ESLint config is reasonable.",
  };
}

function analyzePrettierConfig(): ConfigAnalysis {
  const candidates = [".prettierrc", ".prettierrc.json", ".prettierrc.js", "prettier.config.js", "prettier.config.mjs"];
  let exists = false;
  for (const c of candidates) {
    if (repo.fileExists(c)) { exists = true; break; }
  }
  const issues: string[] = [];
  if (!exists) issues.push("No Prettier config found — formatting may be inconsistent");
  return {
    file: ".prettierrc", exists, issues,
    recommendation: exists
      ? "Prettier is configured."
      : "Add a .prettierrc file for consistent formatting.",
  };
}

function analyzeVitestConfig(): ConfigAnalysis {
  const content = repo.readVitestConfig();
  const exists = !!content;
  const issues: string[] = [];
  if (!exists) {
    issues.push("Vitest config not found");
    return { file: "vitest.config.ts", exists, issues, recommendation: "Create a vitest.config.ts file." };
  }
  if (!content.includes("coverage")) issues.push("No coverage configuration");
  if (!content.includes("setupFiles")) issues.push("No setup files configured");
  return {
    file: "vitest.config.ts", exists, issues,
    recommendation: issues.length > 0
      ? `Address ${issues.length} issue(s).`
      : "Vitest config is well-configured.",
  };
}

function analyzeNextConfig(): ConfigAnalysis {
  const content = repo.readNextConfig();
  const exists = !!content;
  const issues: string[] = [];
  if (!exists) {
    issues.push("Next.js config not found");
    return { file: "next.config.*", exists, issues, recommendation: "Create a next.config file." };
  }
  if (content.includes("ignoreBuildErrors: true")) {
    issues.push("ignoreBuildErrors is true — TypeScript errors are not caught at build time");
  }
  if (!content.includes("output:")) issues.push("No output mode configured (standalone recommended for Docker)");
  return {
    file: "next.config.ts", exists, issues,
    recommendation: issues.length > 0
      ? `Address ${issues.length} issue(s).`
      : "Next.js config is well-configured.",
  };
}

function analyzeEnvVars(): EnvVarAnalysis {
  // Scan .env.example and source code for env var usage
  const envExample = repo.readTextFile(".env.example") ?? "";
  const documented = envExample.split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => l.split("=")[0].trim());
  // Scan source for process.env references
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const used = new Set<string>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/process\.env\.(\w+)/g);
    for (const m of matches) used.add(m[1]);
  }
  const undocumented = Array.from(used).filter(v => !documented.includes(v));
  return {
    total: used.size,
    documented: documented.length,
    undocumented: undocumented.slice(0, 20),
    recommendation: undocumented.length > 0
      ? `${undocumented.length} env var(s) used in code but not in .env.example`
      : "All env vars are documented.",
  };
}

function analyzeFeatureFlags(): FeatureFlagAnalysis {
  // Reuse Platform Orchestrator's feature flag table via filesystem scan
  // We check for feature flag references in code
  const files = repo.listFiles("src", { extension: ".ts", recursive: true });
  const flagsInCode = new Set<string>();
  for (const f of files) {
    const content = repo.readTextFile(f);
    if (!content) continue;
    const matches = content.matchAll(/isFeatureEnabled\(\s*['"]([^'"]+)['"]/g);
    for (const m of matches) flagsInCode.add(m[1]);
  }
  return {
    totalFlags: flagsInCode.size,
    documented: 0, // would need a flags documentation file
    flagsInCode: flagsInCode.size,
    recommendation: flagsInCode.size > 0
      ? `${flagsInCode.size} feature flag(s) in use — document them in a flags registry.`
      : "No feature flags detected.",
  };
}

function detectConfigDuplication(): ConfigurationDuplication[] {
  const duplications: ConfigurationDuplication[] = [];
  // Check if tsconfig and jsconfig both exist (duplication)
  if (repo.fileExists("tsconfig.json") && repo.fileExists("jsconfig.json")) {
    duplications.push({
      setting: "path aliases",
      locations: ["tsconfig.json", "jsconfig.json"],
      recommendation: "Remove jsconfig.json — tsconfig.json is sufficient for TypeScript projects.",
    });
  }
  // Check for duplicate eslint configs
  const eslintConfigs = [".eslintrc.js", ".eslintrc.json", ".eslintrc.mjs", "eslint.config.mjs", "eslint.config.js"]
    .filter(c => repo.fileExists(c));
  if (eslintConfigs.length > 1) {
    duplications.push({
      setting: "eslint config",
      locations: eslintConfigs,
      recommendation: "Only one ESLint config file should exist.",
    });
  }
  return duplications;
}

function generateConfigRecommendations(input: {
  tsconfig: ConfigAnalysis; eslint: ConfigAnalysis; prettier: ConfigAnalysis;
  vitest: ConfigAnalysis; nextConfig: ConfigAnalysis;
  envVars: EnvVarAnalysis; featureFlags: FeatureFlagAnalysis;
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `config-${++id}`;
  if (input.tsconfig.issues.length > 0) {
    recs.push({
      id: nextId(), category: "config",
      title: "Fix tsconfig issues",
      description: `${input.tsconfig.issues.length} issue(s) in tsconfig.json.`,
      impact: "medium", effort: "low",
      recommendation: input.tsconfig.recommendation,
    });
  }
  if (input.envVars.undocumented.length > 0) {
    recs.push({
      id: nextId(), category: "config",
      title: "Document environment variables",
      description: `${input.envVars.undocumented.length} env var(s) are not in .env.example.`,
      impact: "medium", effort: "low",
      recommendation: "Add all used env vars to .env.example with descriptions.",
    });
  }
  if (input.nextConfig.issues.length > 0) {
    recs.push({
      id: nextId(), category: "config",
      title: "Fix next.config issues",
      description: `${input.nextConfig.issues.length} issue(s) in next.config.`,
      impact: "medium", effort: "low",
      recommendation: input.nextConfig.recommendation,
    });
  }
  return recs;
}
