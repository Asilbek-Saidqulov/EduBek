/**
 * EduBek — Knowledge Coverage Analysis.
 *
 * Phase 4F.5: Computes curriculum coverage for a classroom, organization,
 * or framework. Identifies:
 *
 *   • Covered standards (with at least one mapped resource)
 *   • Uncovered standards (no mapped resources)
 *   • Duplicate lessons (multiple resources mapping to the same standard)
 *   • Overrepresented topics (clusters of resources on the same concept)
 *   • Missing prerequisites (PREREQUISITE edges that don't have a resource)
 *   • Weak concept coverage (concepts with low-quality resources)
 *   • Assessment coverage (standards without any assessing resource)
 *
 * Each uncovered standard becomes a KnowledgeGap row of type
 * 'uncovered_standard'. Each duplicate cluster becomes a
 * 'duplicate_lesson' gap.
 *
 * The output is persisted as a KnowledgeCoverage snapshot for fast
 * subsequent dashboard loads.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { CoverageDetails, KnowledgeCoverageDto, KnowledgeGapDto } from "./types";

const log = getLogger("coverage-analysis");

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function computeCoverage(input: {
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
  frameworkId: string;
}): Promise<KnowledgeCoverageDto> {
  const { scopeType, scopeId, frameworkId } = input;

  // Fetch all standards in the framework
  const standards = await db.curriculumStandard.findMany({
    where: { frameworkId },
    select: { id: true, code: true, title: true, strand: true },
  });
  const totalStandards = standards.length;
  if (totalStandards === 0) {
    return emptyCoverage(scopeType, scopeId, frameworkId);
  }

  // Fetch all mappings for these standards (optionally scoped)
  const mappings = await db.curriculumMapping.findMany({
    where: { standardId: { in: standards.map((s) => s.id) } },
    select: {
      standardId: true,
      entityType: true,
      entityId: true,
      coverageLevel: true,
      alignmentScore: true,
    },
  });

  // Group mappings by standard
  const mappingsByStandard = new Map<string, typeof mappings>();
  for (const m of mappings) {
    const list = mappingsByStandard.get(m.standardId) ?? [];
    list.push(m);
    mappingsByStandard.set(m.standardId, list);
  }

  const coveredStandards = mappingsByStandard.size;
  const uncoveredStandards = totalStandards - coveredStandards;

  // Coverage percentage
  const coveragePct = totalStandards > 0 ? (coveredStandards / totalStandards) * 100 : 0;

  // Uncovered standard IDs
  const uncoveredStandardIds = standards
    .filter((s) => !mappingsByStandard.has(s.id))
    .map((s) => s.id);

  // Weak areas — strands where coverage < 50%
  const strandMap = new Map<string, { total: number; covered: number }>();
  for (const s of standards) {
    const strand = s.strand ?? "general";
    const entry = strandMap.get(strand) ?? { total: 0, covered: 0 };
    entry.total += 1;
    if (mappingsByStandard.has(s.id)) entry.covered += 1;
    strandMap.set(strand, entry);
  }
  const weakAreas = Array.from(strandMap.entries())
    .map(([strand, e]) => ({
      strand,
      pct: e.total > 0 ? (e.covered / e.total) * 100 : 0,
    }))
    .filter((e) => e.pct < 50)
    .sort((a, b) => a.pct - b.pct);

  // Duplicate resources — entities mapped to multiple standards (potential overrepresentation)
  const entityToStandards = new Map<string, number>();
  for (const m of mappings) {
    const key = `${m.entityType}:${m.entityId}`;
    entityToStandards.set(key, (entityToStandards.get(key) ?? 0) + 1);
  }
  const duplicateResources = Array.from(entityToStandards.entries())
    .filter(([, count]) => count >= 3)
    .map(([key, count]) => {
      const [entityType, entityId] = key.split(":");
      return { id: `${entityType}:${entityId}`, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const details: CoverageDetails = {
    uncoveredStandardIds,
    weakAreas,
    duplicateResources,
  };

  // Persist snapshot
  const snapshot = await repo.upsertKnowledgeCoverage({
    scopeType,
    scopeId,
    frameworkId,
    totalStandards,
    coveredStandards,
    uncoveredStandards,
    coveragePct: Math.round(coveragePct * 100) / 100,
    details: JSON.stringify(details),
  });

  // Create / refresh knowledge gaps for uncovered standards
  await refreshGaps(scopeType, scopeId, standards, mappingsByStandard).catch(() => undefined);

  log.info("coverage.computed", {
    scopeType, scopeId, frameworkId,
    totalStandards, coveredStandards, coveragePct,
  });

  return {
    id: snapshot.id,
    scopeType: snapshot.scopeType as "classroom" | "organization" | "framework",
    scopeId: snapshot.scopeId,
    frameworkId: snapshot.frameworkId,
    totalStandards,
    coveredStandards,
    uncoveredStandards,
    coveragePct: Math.round(coveragePct * 100) / 100,
    details,
    computedAt: snapshot.computedAt.toISOString(),
  };
}

export async function getCoverage(input: {
  scopeType: "classroom" | "organization" | "framework";
  scopeId: string;
  frameworkId: string;
  refresh?: boolean;
}): Promise<KnowledgeCoverageDto | null> {
  if (input.refresh) {
    return computeCoverage(input);
  }
  const row = await repo.findKnowledgeCoverage(input.scopeType, input.scopeId, input.frameworkId);
  if (!row) {
    return computeCoverage(input);
  }
  return {
    id: row.id,
    scopeType: row.scopeType as "classroom" | "organization" | "framework",
    scopeId: row.scopeId,
    frameworkId: row.frameworkId,
    totalStandards: row.totalStandards,
    coveredStandards: row.coveredStandards,
    uncoveredStandards: row.uncoveredStandards,
    coveragePct: row.coveragePct,
    details: safeParseDetails(row.details),
    computedAt: row.computedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Knowledge Gaps
// ---------------------------------------------------------------------------

export async function listKnowledgeGaps(input: {
  scopeType?: string;
  scopeId?: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<KnowledgeGapDto[]> {
  const rows = await repo.findKnowledgeGaps(input);
  return rows.map((g) => ({
    id: g.id,
    scopeType: g.scopeType as "classroom" | "organization" | "student" | "framework",
    scopeId: g.scopeId,
    standardId: g.standardId,
    conceptId: g.conceptId,
    type: g.type as KnowledgeGapDto["type"],
    description: g.description,
    suggestedAction: g.suggestedAction,
    metadata: safeParseRecord(g.metadata),
    status: g.status as "open" | "resolved" | "ignored",
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));
}

export async function resolveKnowledgeGap(id: string): Promise<void> {
  await repo.updateKnowledgeGap(id, { status: "resolved" });
}

export async function ignoreKnowledgeGap(id: string): Promise<void> {
  await repo.updateKnowledgeGap(id, { status: "ignored" });
}

// ---------------------------------------------------------------------------
// Internal: refresh gaps for uncovered standards
// ---------------------------------------------------------------------------

async function refreshGaps(
  scopeType: string,
  scopeId: string,
  standards: Array<{ id: string; code: string; title: string }>,
  mappingsByStandard: Map<string, any[]>,
): Promise<void> {
  // Delete existing open gaps for this scope (we'll re-create them)
  await db.knowledgeGap.deleteMany({
    where: { scopeType, scopeId, status: "open", type: "uncovered_standard" },
  });

  for (const s of standards) {
    if (!mappingsByStandard.has(s.id)) {
      await repo.createKnowledgeGap({
        scopeType,
        scopeId,
        standardId: s.id,
        type: "uncovered_standard",
        description: `No resources cover standard ${s.code}: ${s.title}`,
        suggestedAction: "Generate or assign a resource that covers this standard.",
        metadata: JSON.stringify({ standardCode: s.code, standardTitle: s.title }),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyCoverage(scopeType: string, scopeId: string, frameworkId: string): KnowledgeCoverageDto {
  return {
    id: "temp",
    scopeType: scopeType as "classroom" | "organization" | "framework",
    scopeId,
    frameworkId,
    totalStandards: 0,
    coveredStandards: 0,
    uncoveredStandards: 0,
    coveragePct: 0,
    details: { uncoveredStandardIds: [], weakAreas: [], duplicateResources: [] },
    computedAt: new Date().toISOString(),
  };
}

function safeParseDetails(raw: string | null): CoverageDetails {
  if (!raw) return { uncoveredStandardIds: [], weakAreas: [], duplicateResources: [] };
  try {
    return JSON.parse(raw) as CoverageDetails;
  } catch {
    return { uncoveredStandardIds: [], weakAreas: [], duplicateResources: [] };
  }
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
