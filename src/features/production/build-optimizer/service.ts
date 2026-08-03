/**
 * EduBek — Build Optimizer service.
 *
 * Phase 6A.2: Composes every engineering analyzer into a unified API
 * surface. Routes are thin wrappers around the functions exported here.
 */
import { generateBuildReport } from "./build-analyzer";
import { generateRepositoryReport } from "./repository-analyzer";
import { generateBundleReport } from "./bundle-analyzer";
import { generateDependencyReport } from "./dependency-hygiene";
import { generateTestReport } from "./test-analyzer";
import { generateCIReport } from "./ci-analyzer";
import { generateConfigReport } from "./config-analyzer";
import { generateDocumentationReport } from "./documentation-analyzer";
import { generateDebtReport } from "./debt-analyzer";
import { generateReadinessDashboard } from "./readiness-dashboard";

export {
  generateBuildReport,
  generateRepositoryReport,
  generateBundleReport,
  generateDependencyReport,
  generateTestReport,
  generateCIReport,
  generateConfigReport,
  generateDocumentationReport,
  generateDebtReport,
  generateReadinessDashboard,
};

export async function generateFullEngineeringAudit() {
  const generatedAt = new Date().toISOString();
  const [build, repository, bundle, dependencies, tests, ci, config, documentation, debt, readiness] = await Promise.all([
    generateBuildReport().catch(() => null),
    generateRepositoryReport().catch(() => null),
    generateBundleReport().catch(() => null),
    generateDependencyReport().catch(() => null),
    generateTestReport().catch(() => null),
    generateCIReport().catch(() => null),
    generateConfigReport().catch(() => null),
    generateDocumentationReport().catch(() => null),
    generateDebtReport().catch(() => null),
    generateReadinessDashboard().catch(() => null),
  ]);
  return {
    generatedAt,
    build, repository, bundle, dependencies, tests, ci, config, documentation, debt, readiness,
  };
}
