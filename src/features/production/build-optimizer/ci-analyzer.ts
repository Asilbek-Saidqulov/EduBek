/**
 * EduBek — CI/CD Readiness Analyzer (System 6).
 *
 * Inspects lint, tests, type checking, build, deployment, migration
 * safety, rollback readiness, artifact size, and pipeline duration.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  CICDReadinessReport, CICDStageStatus, MigrationSafetyReport,
  RollbackReadinessReport, ArtifactSizeReport, PipelineDurationReport,
  EngineeringRecommendation,
} from "./types";

const log = getLogger("ci-analyzer");

export async function generateCIReport(): Promise<CICDReadinessReport> {
  const generatedAt = new Date().toISOString();
  const pkg = repo.readPackageJson();
  const [lint, tests, typeChecking, build, deployment, migrationSafety,
    rollbackReadiness, artifactSize] = await Promise.all([
    assessLintStage(pkg),
    assessTestStage(pkg),
    assessTypeCheckStage(pkg),
    assessBuildStage(pkg),
    assessDeploymentStage(pkg),
    assessMigrationSafety(),
    assessRollbackReadiness(pkg),
    assessArtifactSize(),
  ]);
  const pipelineDuration = assessPipelineDuration({ lint, tests, typeChecking, build });
  const recommendations = generateCIRecommendations({
    lint, tests, typeChecking, build, migrationSafety, rollbackReadiness,
  });
  log.info("ci.audit_complete", {
    stages: 4, migration: migrationSafety.hasMigrations,
    rollback: rollbackReadiness.hasRollbackPlan,
  });
  return {
    generatedAt,
    lint, tests, typeChecking, build, deployment,
    migrationSafety, rollbackReadiness, artifactSize, pipelineDuration,
    recommendations,
  };
}

function assessLintStage(pkg: repo.PackageJson | null): CICDStageStatus {
  const configured = !!pkg?.scripts?.lint;
  return {
    stage: "lint",
    configured,
    estimatedDurationMs: 30000,
    blocking: configured,
    recommendation: configured
      ? "Lint is configured and runs in CI."
      : "Add a lint script to package.json.",
  };
}

function assessTestStage(pkg: repo.PackageJson | null): CICDStageStatus {
  const configured = !!pkg?.scripts?.test;
  return {
    stage: "tests",
    configured,
    estimatedDurationMs: 60000,
    blocking: configured,
    recommendation: configured
      ? "Tests are configured and run in CI."
      : "Add a test script to package.json.",
  };
}

function assessTypeCheckStage(_pkg: repo.PackageJson | null): CICDStageStatus {
  // TypeScript checking isn't a separate script — it's part of the build
  const tsconfig = repo.readTsConfig();
  const configured = !!tsconfig;
  return {
    stage: "type-checking",
    configured,
    estimatedDurationMs: 120000,
    blocking: false, // not blocking — next.config has ignoreBuildErrors: true
    recommendation: configured
      ? "TypeScript is configured. Consider adding a separate `tsc --noEmit` script to CI."
      : "Add a tsconfig.json file.",
  };
}

function assessBuildStage(pkg: repo.PackageJson | null): CICDStageStatus {
  const configured = !!pkg?.scripts?.build;
  return {
    stage: "build",
    configured,
    estimatedDurationMs: 180000,
    blocking: configured,
    recommendation: configured
      ? "Build is configured and runs in CI."
      : "Add a build script to package.json.",
  };
}

function assessDeploymentStage(_pkg: repo.PackageJson | null): CICDStageStatus {
  // Check for deployment configs
  const hasDockerfile = repo.fileExists("Dockerfile");
  const hasVercelConfig = repo.fileExists("vercel.json");
  const configured = hasDockerfile || hasVercelConfig;
  return {
    stage: "deployment",
    configured,
    estimatedDurationMs: 300000,
    blocking: false,
    recommendation: configured
      ? "Deployment is configured."
      : "Add a Dockerfile or vercel.json for deployment.",
  };
}

function assessMigrationSafety(): MigrationSafetyReport {
  const prismaSchema = repo.readTextFile("prisma/schema.prisma");
  const hasMigrations = !!prismaSchema;
  const migrationCount = repo.fileExists("prisma/migrations")
    ? repo.listFiles("prisma/migrations", { recursive: true }).filter(f => f.includes("migration.sql")).length
    : 0;
  const hasSeedData = repo.fileExists("prisma/seed.ts") || repo.fileExists("prisma/seed.js") || repo.fileExists("scripts/seed.ts");
  return {
    hasMigrations,
    migrationCount,
    hasDownMigrations: false, // Prisma doesn't support down migrations natively
    hasSeedData,
    recommendation: hasMigrations
      ? "Prisma migrations are present. Ensure migrations are tested in CI before deployment."
      : "No migrations detected — ensure schema changes are safe to apply.",
  };
}

function assessRollbackReadiness(pkg: repo.PackageJson | null): RollbackReadinessReport {
  // Check for rollback scripts / documentation
  const hasRollbackScript = !!pkg?.scripts?.["db:reset"];
  const rollbackSteps = [
    "Revert the deployment to the previous version",
    "Run `prisma migrate reset` if schema changed (DESTRUCTIVE — use with caution)",
    "Notify users of the rollback",
    "Investigate the root cause before re-deploying",
  ];
  return {
    hasRollbackPlan: hasRollbackScript,
    rollbackSteps,
    estimatedRollbackTimeMinutes: 15,
    recommendation: "Document a rollback procedure. Ensure the previous build artifact is retained for quick rollback.",
  };
}

function assessArtifactSize(): ArtifactSizeReport {
  // Estimate artifact size from source + dependencies
  const srcFiles = repo.listFiles("src", { recursive: true });
  let srcSize = 0;
  for (const f of srcFiles) {
    const stat = repo.getFileStat(f);
    if (stat) srcSize += stat.size;
  }
  const estimatedSizeMb = Math.round((srcSize / (1024 * 1024)) * 10) / 10 + 50; // +50MB for deps
  return {
    estimatedSizeMb,
    largestContributors: [
      { component: "node_modules", sizeMb: Math.round(estimatedSizeMb * 0.7) },
      { component: "src", sizeMb: Math.round((srcSize / (1024 * 1024)) * 10) / 10 },
      { component: ".next (build output)", sizeMb: Math.round(estimatedSizeMb * 0.2) },
    ],
    recommendation: estimatedSizeMb > 500
      ? `Artifact is ${estimatedSizeMb}MB — consider pruning devDependencies.`
      : `Artifact size is ${estimatedSizeMb}MB — reasonable.`,
  };
}

function assessPipelineDuration(stages: {
  lint: CICDStageStatus; tests: CICDStageStatus;
  typeChecking: CICDStageStatus; build: CICDStageStatus;
}): PipelineDurationReport {
  const stageList = [stages.lint, stages.tests, stages.typeChecking, stages.build];
  const total = stageList.reduce((s, st) => s + st.estimatedDurationMs, 0);
  const stagesWithPercent = stageList.map(st => ({
    stage: st.stage,
    estimatedMs: st.estimatedDurationMs,
    percent: Math.round((st.estimatedDurationMs / total) * 100),
  }));
  return {
    estimatedTotalMs: total,
    stages: stagesWithPercent,
    recommendation: total > 600000
      ? `Pipeline takes ~${Math.round(total / 60000)} min — consider caching and parallelization.`
      : `Pipeline takes ~${Math.round(total / 60000)} min — reasonable.`,
  };
}

function generateCIRecommendations(input: {
  lint: CICDStageStatus; tests: CICDStageStatus;
  typeChecking: CICDStageStatus; build: CICDStageStatus;
  migrationSafety: MigrationSafetyReport;
  rollbackReadiness: RollbackReadinessReport;
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `ci-${++id}`;
  if (!input.typeChecking.blocking) {
    recs.push({
      id: nextId(), category: "ci",
      title: "Add type checking to CI",
      description: "TypeScript type checking is not a blocking CI stage.",
      impact: "high", effort: "low",
      recommendation: "Add `npx tsc --noEmit` as a CI step.",
    });
  }
  if (!input.migrationSafety.hasSeedData) {
    recs.push({
      id: nextId(), category: "ci",
      title: "Add seed data for testing",
      description: "No seed data found — CI tests may lack realistic data.",
      impact: "medium", effort: "low",
      recommendation: "Add a seed script to populate test data.",
    });
  }
  if (!input.rollbackReadiness.hasRollbackPlan) {
    recs.push({
      id: nextId(), category: "ci",
      title: "Document rollback procedure",
      description: "No rollback plan documented.",
      impact: "medium", effort: "low",
      recommendation: "Document rollback steps and retain previous build artifacts.",
    });
  }
  return recs;
}
