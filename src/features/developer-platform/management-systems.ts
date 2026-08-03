/** Systems 11-16: Validation, Compatibility, Analytics, Publishing, Dashboard, Documentation. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { validatePermissions, listCapabilities } from "./core-systems";
import type { ValidationResult, CompatibilityResult, DeveloperAnalyticsReport, PublishingReport, PublicationInfo, DeveloperDashboard, GeneratedDocumentation, PublicationStatus } from "./types";

const log = getLogger("developer-platform");

// System 11 — Extension Validation
export function validateExtension(input: {
  manifest: { id: string; name: string; version: string; type: string; permissions: string[]; capabilities: string[]; dependencies: Array<{ id: string; version: string }> };
  platformVersion: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  // Manifest validation
  const manifestValid = !!input.manifest.id && !!input.manifest.name && !!input.manifest.version && !!input.manifest.type;
  if (!manifestValid) errors.push("Manifest is missing required fields (id, name, version, type)");
  // Version validation
  const versionValid = /^\d+\.\d+\.\d+$/.test(input.manifest.version);
  if (!versionValid) errors.push(`Version "${input.manifest.version}" is not a valid semver`);
  // Permission validation
  const permResult = validatePermissions(input.manifest.permissions);
  if (!permResult.valid) errors.push(`Invalid permissions: ${permResult.invalid.join(", ")}`);
  // Capability validation
  const validCaps = new Set(listCapabilities().map(c => c.id));
  const invalidCaps = input.manifest.capabilities.filter(c => !validCaps.has(c));
  if (invalidCaps.length > 0) errors.push(`Unknown capabilities: ${invalidCaps.join(", ")}`);
  // Dependency validation
  const dependenciesValid = input.manifest.dependencies.every(d => d.id && d.version);
  if (!dependenciesValid) errors.push("Dependencies must have both id and version");
  // API compatibility
  const apiCompatible = true; // simplified — would check against API version matrix
  // Warnings
  if (input.manifest.permissions.includes("storage.write")) warnings.push("storage.write is a high-risk permission — consider if read-only is sufficient.");
  if (input.manifest.permissions.includes("read.users")) warnings.push("read.users is a high-risk permission — ensure GDPR/FERPA compliance.");
  const valid = errors.length === 0;
  log.info("validation.complete", { valid, errors: errors.length, warnings: warnings.length });
  return { valid, manifestValid, permissionsValid: permResult.valid, dependenciesValid, versionValid, capabilitiesValid: invalidCaps.length === 0, apiCompatible, errors, warnings };
}

// System 12 — Compatibility Analyzer
export async function analyzeCompatibility(input: {
  extensionId: string; extensionVersion: string; platformVersion: string;
}): Promise<CompatibilityResult> {
  const matrix = await repo.fetchCompatibilityMatrix(500);
  const entry = matrix.find(m => m.extensionId === input.extensionId && m.extensionVersion === input.extensionVersion && m.platformVersion === input.platformVersion);
  const status: CompatibilityResult["status"] = entry?.status as CompatibilityResult["status"] ?? "untested";
  const notes = entry?.notes ?? "No compatibility data — extension has not been tested with this platform version.";
  log.info("compatibility.analyzed", { extensionId: input.extensionId, status });
  return { extensionId: input.extensionId, extensionVersion: input.extensionVersion, platformVersion: input.platformVersion, status, notes, featureFlags: [] };
}

// System 13 — Developer Analytics
export async function generateAnalyticsReport(): Promise<DeveloperAnalyticsReport> {
  const [extensions, installs, execs, reviews] = await Promise.all([
    repo.fetchExtensions(200), repo.fetchExtensionInstalls(500),
    repo.fetchExtensionExecutions(500), repo.fetchExtensionReviews(500),
  ]);
  const installMap = new Map<string, number>();
  for (const inst of installs) installMap.set(inst.extensionId, (installMap.get(inst.extensionId) ?? 0) + 1);
  const execMap = new Map<string, { calls: number; errors: number }>();
  for (const exec of execs) {
    const inst = installs.find(i => i.id === exec.extensionInstallId);
    if (inst) {
      const entry = execMap.get(inst.extensionId) ?? { calls: 0, errors: 0 };
      entry.calls++;
      if (exec.status === "failed" || exec.status === "timeout") entry.errors++;
      execMap.set(inst.extensionId, entry);
    }
  }
  const reviewMap = new Map<string, { sum: number; count: number }>();
  for (const rev of reviews) {
    const entry = reviewMap.get(rev.extensionId) ?? { sum: 0, count: 0 };
    entry.sum += rev.rating; entry.count++;
    reviewMap.set(rev.extensionId, entry);
  }
  const byExtension = extensions.map(ext => {
    const execData = execMap.get(ext.id) ?? { calls: 0, errors: 0 };
    const reviewData = reviewMap.get(ext.id);
    return {
      extensionId: ext.id, name: ext.name,
      downloads: installMap.get(ext.id) ?? 0,
      apiCalls: execData.calls, errors: execData.errors,
      rating: reviewData ? Math.round((reviewData.sum / reviewData.count) * 10) / 10 : 0,
      activeInstalls: installs.filter(i => i.extensionId === ext.id && (i.status === "installed" || i.status === "enabled")).length,
    };
  });
  const totalDownloads = byExtension.reduce((s, e) => s + e.downloads, 0);
  const totalApiCalls = byExtension.reduce((s, e) => s + e.apiCalls, 0);
  const totalErrors = byExtension.reduce((s, e) => s + e.errors, 0);
  const allRatings = byExtension.filter(e => e.rating > 0);
  const avgRating = allRatings.length > 0 ? Math.round((allRatings.reduce((s, e) => s + e.rating, 0) / allRatings.length) * 10) / 10 : 0;
  const activeInstallations = installs.filter(i => i.status === "installed" || i.status === "enabled").length;
  log.info("analytics.report_complete", { extensions: byExtension.length, downloads: totalDownloads });
  return { generatedAt: new Date().toISOString(), totalDownloads, totalApiCalls, totalErrors, avgRating, activeInstallations, byExtension };
}

// System 14 — Publishing Workflow
export async function generatePublishingReport(): Promise<PublishingReport> {
  const extensions = await repo.fetchExtensions(200);
  const publications: PublicationInfo[] = extensions.map(ext => ({
    extensionId: ext.id, extensionName: ext.name, version: ext.latestVersion,
    status: ext.status as PublicationStatus,
    submittedAt: ext.createdAt.toISOString(),
    reviewedAt: ext.updatedAt.toISOString(),
    reviewer: null, reviewNotes: null,
  }));
  const inReview = publications.filter(p => p.status === "submitted" || p.status === "review").length;
  const published = publications.filter(p => p.status === "published").length;
  log.info("publishing.report_complete", { total: publications.length, inReview, published });
  return { generatedAt: new Date().toISOString(), publications, total: publications.length, inReview, published };
}

// System 15 — Developer Dashboard
export async function generateDeveloperDashboard(): Promise<DeveloperDashboard> {
  const [extensions, installs, execs, reviews] = await Promise.all([
    repo.fetchExtensions(200), repo.fetchExtensionInstalls(500),
    repo.fetchExtensionExecutions(500), repo.fetchExtensionReviews(500),
  ]);
  const totalDownloads = installs.length;
  const totalApiCalls = execs.length;
  const totalErrors = execs.filter(e => e.status === "failed" || e.status === "timeout").length;
  const activeInstalls = installs.filter(i => i.status === "installed" || i.status === "enabled").length;
  const allRatings = reviews.map(r => r.rating);
  const avgRating = allRatings.length > 0 ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10 : 0;
  const published = extensions.filter(e => e.status === "published");
  const revenue = published.reduce((s, e) => s + e.priceEduTokens, 0);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const installsThisMonth = installs.filter(i => i.createdAt >= monthAgo).length;
  const revenueThisMonth = installsThisMonth * 10; // simplified
  const topExtensions = extensions.slice(0, 5).map(e => ({
    name: e.name,
    downloads: installs.filter(i => i.extensionId === e.id).length,
    rating: reviews.filter(r => r.extensionId === e.id).reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.filter(r => r.extensionId === e.id).length),
  }));
  log.info("dashboard.complete", { extensions: extensions.length, downloads: totalDownloads });
  return {
    generatedAt: new Date().toISOString(),
    extensions: { total: extensions.length, published: published.length, draft: extensions.filter(e => e.status === "draft").length, deprecated: extensions.filter(e => e.status === "deprecated").length },
    downloads: { total: totalDownloads, thisMonth: installsThisMonth },
    usage: { apiCalls: totalApiCalls, activeInstalls, errors: totalErrors },
    versions: { total: extensions.length, latest: extensions[0]?.latestVersion ?? null },
    ratings: { average: avgRating, total: reviews.length },
    revenue: { total: revenue, currency: "EDU", thisMonth: revenueThisMonth },
    topExtensions,
  };
}

// System 16 — Documentation Generator
export async function generateDocumentation(extensionId: string): Promise<GeneratedDocumentation> {
  const ext = await repo.fetchExtension(extensionId);
  if (!ext) {
    return { generatedAt: new Date().toISOString(), extensionId, sections: [{ title: "Error", content: "Extension not found", format: "markdown" }] };
  }
  const versions = await repo.fetchExtensionVersions(extensionId);
  const permissions = repo.safeParse<string[]>(ext.permissions, []);
  const hooks = repo.safeParse<string[]>(ext.hooks, []);
  const categories = repo.safeParse<string[]>(ext.categories, []);
  const sections = [
    { title: "Overview", content: `# ${ext.name}\n\n${ext.description ?? "No description"}\n\n**Type:** ${ext.type}\n**Developer:** ${ext.developerName}\n**Version:** ${ext.latestVersion}\n**Status:** ${ext.status}\n**Pricing:** ${ext.pricingModel} (${ext.priceEduTokens} EDU)`, format: "markdown" as const },
    { title: "Permissions", content: JSON.stringify(permissions, null, 2), format: "json" as const },
    { title: "Hooks", content: JSON.stringify(hooks, null, 2), format: "json" as const },
    { title: "Categories", content: JSON.stringify(categories, null, 2), format: "json" as const },
    { title: "Version History", content: versions.map(v => `- v${v.version} (${v.status}): ${v.changelog ?? "No changelog"}`).join("\n"), format: "markdown" as const },
    { title: "SDK Example (TypeScript)", content: `import { EduBek } from '@edubek/sdk';\nconst client = new EduBek({ apiKey: 'your-api-key' });\nconst ext = await client.extensions.get('${ext.slug}');`, format: "markdown" as const },
    { title: "API Example", content: `GET /api/extensions/${ext.id}\n\nResponse:\n{\n  "id": "${ext.id}",\n  "name": "${ext.name}",\n  "version": "${ext.latestVersion}"\n}`, format: "markdown" as const },
    { title: "Lifecycle", content: `1. Install: POST /api/extensions/${ext.id}/install\n2. Configure: PUT /api/extensions/${ext.id}/config\n3. Enable: POST /api/extensions/${ext.id}/enable\n4. Disable: POST /api/extensions/${ext.id}/disable\n5. Uninstall: DELETE /api/extensions/${ext.id}`, format: "markdown" as const },
  ];
  log.info("documentation.generated", { extensionId, sections: sections.length });
  return { generatedAt: new Date().toISOString(), extensionId, sections };
}
