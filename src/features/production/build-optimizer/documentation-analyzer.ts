/**
 * EduBek — Documentation Coverage Analyzer (System 8).
 *
 * Measures public API documentation, internal module documentation,
 * README coverage, architecture documentation, endpoint documentation,
 * and missing examples. Generates a documentation score.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  DocumentationCoverageReport, DocumentationMetric,
  EngineeringRecommendation,
} from "./types";

const log = getLogger("documentation-analyzer");

export async function generateDocumentationReport(): Promise<DocumentationCoverageReport> {
  const generatedAt = new Date().toISOString();
  const [publicApi, internalModules, readme, architecture, endpoints] = await Promise.all([
    assessPublicApiDocs(),
    assessInternalModuleDocs(),
    assessReadmeCoverage(),
    assessArchitectureDocs(),
    assessEndpointDocs(),
  ]);
  const missingExamples = findMissingExamples();
  const documentationScore = computeScore([publicApi, internalModules, readme, architecture, endpoints]);
  const recommendations = generateDocRecommendations({
    publicApi, internalModules, readme, architecture, endpoints,
  });
  log.info("doc.audit_complete", { score: documentationScore, missing: missingExamples.length });
  return {
    generatedAt,
    publicApiDocs: publicApi,
    internalModuleDocs: internalModules,
    readmeCoverage: readme,
    architectureDocs: architecture,
    endpointDocs: endpoints,
    missingExamples,
    documentationScore,
    recommendations,
  };
}

function assessPublicApiDocs(): DocumentationMetric {
  // Check API route files for JSDoc comments
  const routes = repo.listFiles("src/app/api", { extension: ".ts", recursive: true })
    .filter(f => f.endsWith("route.ts"));
  let documented = 0;
  const missing: string[] = [];
  for (const r of routes) {
    const content = repo.readTextFile(r);
    if (!content) continue;
    // Check for JSDoc comment at the top
    if (content.startsWith("/**") || content.includes("/** GET") || content.includes("/** POST")) {
      documented++;
    } else {
      missing.push(r);
    }
  }
  return {
    total: routes.length,
    documented,
    coveragePercent: routes.length > 0 ? Math.round((documented / routes.length) * 100) : 100,
    missing: missing.slice(0, 20),
    recommendation: missing.length > 0
      ? `${missing.length} API route(s) lack JSDoc documentation.`
      : "All API routes are documented.",
  };
}

function assessInternalModuleDocs(): DocumentationMetric {
  // Check feature modules for barrel-export documentation
  const barrels = repo.listFiles("src/features", { recursive: true })
    .filter(f => f.endsWith("index.ts"));
  let documented = 0;
  const missing: string[] = [];
  for (const b of barrels) {
    const content = repo.readTextFile(b);
    if (!content) continue;
    // Check for a header comment block
    if (content.includes("/**")) {
      documented++;
    } else {
      missing.push(b);
    }
  }
  return {
    total: barrels.length,
    documented,
    coveragePercent: barrels.length > 0 ? Math.round((documented / barrels.length) * 100) : 100,
    missing: missing.slice(0, 20),
    recommendation: missing.length > 0
      ? `${missing.length} barrel export(s) lack header documentation.`
      : "All barrel exports are documented.",
  };
}

function assessReadmeCoverage(): DocumentationMetric {
  const readmeFiles = [
    "README.md", "docs/README.md",
    "src/features/README.md",
  ];
  const existing = readmeFiles.filter(f => repo.fileExists(f));
  return {
    total: readmeFiles.length,
    documented: existing.length,
    coveragePercent: Math.round((existing.length / readmeFiles.length) * 100),
    missing: readmeFiles.filter(f => !repo.fileExists(f)),
    recommendation: existing.length < readmeFiles.length
      ? `${readmeFiles.length - existing.length} README file(s) missing.`
      : "README coverage is complete.",
  };
}

function assessArchitectureDocs(): DocumentationMetric {
  const archDocs = [
    "ARCHITECTURE.md",
    "docs/architecture.md",
    "docs/ADR.md",
    "CONTRIBUTING.md",
  ];
  const existing = archDocs.filter(f => repo.fileExists(f));
  return {
    total: archDocs.length,
    documented: existing.length,
    coveragePercent: Math.round((existing.length / archDocs.length) * 100),
    missing: archDocs.filter(f => !repo.fileExists(f)),
    recommendation: existing.length < archDocs.length
      ? `${archDocs.length - existing.length} architecture doc(s) missing.`
      : "Architecture documentation is complete.",
  };
}

function assessEndpointDocs(): DocumentationMetric {
  // Check if there's an OpenAPI/Swagger spec
  const specs = ["openapi.json", "openapi.yaml", "swagger.json", "docs/api.md"];
  const existing = specs.filter(f => repo.fileExists(f));
  return {
    total: specs.length,
    documented: existing.length,
    coveragePercent: Math.round((existing.length / specs.length) * 100),
    missing: specs.filter(f => !repo.fileExists(f)),
    recommendation: existing.length === 0
      ? "No OpenAPI/Swagger spec found — consider auto-generating one."
      : "API spec exists.",
  };
}

function findMissingExamples(): string[] {
  // Find feature modules without example files
  const features = repo.listFiles("src/features", { recursive: false });
  const missing: string[] = [];
  for (const f of features) {
    const featureName = f.split("/")[0];
    const examplePath = `examples/${featureName}.ts`;
    if (!repo.fileExists(examplePath)) {
      missing.push(`examples/${featureName}.ts`);
    }
  }
  return missing.slice(0, 15);
}

function computeScore(metrics: DocumentationMetric[]): number {
  if (metrics.length === 0) return 0;
  const avg = metrics.reduce((s, m) => s + m.coveragePercent, 0) / metrics.length;
  return Math.round(avg);
}

function generateDocRecommendations(input: {
  publicApi: DocumentationMetric;
  internalModules: DocumentationMetric;
  readme: DocumentationMetric;
  architecture: DocumentationMetric;
  endpoints: DocumentationMetric;
}): EngineeringRecommendation[] {
  const recs: EngineeringRecommendation[] = [];
  let id = 0;
  const nextId = () => `doc-${++id}`;
  if (input.publicApi.missing.length > 0) {
    recs.push({
      id: nextId(), category: "documentation",
      title: "Document API routes",
      description: `${input.publicApi.missing.length} API route(s) lack JSDoc.`,
      impact: "medium", effort: "low",
      recommendation: "Add JSDoc comments to each route handler.",
    });
  }
  if (input.endpoints.missing.length > 0) {
    recs.push({
      id: nextId(), category: "documentation",
      title: "Generate OpenAPI spec",
      description: "No API spec found.",
      impact: "medium", effort: "medium",
      recommendation: "Auto-generate an OpenAPI spec from the route handlers.",
    });
  }
  if (input.architecture.missing.length > 0) {
    recs.push({
      id: nextId(), category: "documentation",
      title: "Add architecture documentation",
      description: `${input.architecture.missing.length} architecture doc(s) missing.`,
      impact: "low", effort: "medium",
      recommendation: "Add ARCHITECTURE.md and CONTRIBUTING.md.",
    });
  }
  return recs;
}
