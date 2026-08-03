/**
 * EduBek — Curriculum Mapping Engine.
 *
 * Phase 4F.5: Maps educational resources to curriculum standards
 * across multiple frameworks (Uzbekistan, Cambridge, IB, AP, SAT,
 * GCSE, custom). Each mapping has an alignment score (0-1) and
 * coverage level (introduces / partial / full / reinforces / assesses).
 *
 * Reuses:
 *   • Phase 4F.5 Concept Extraction — to identify concepts in a resource
 *   • Phase 4F.5 Curriculum Standards — to match concepts to standards
 *   • Phase 4F.1 Knowledge Graph — to persist USES / REFERENCES edges
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import { extractConcepts } from "./concept-extraction";
import type {
  CoverageLevel,
  CurriculumFrameworkDto,
  CurriculumMappingDto,
  CurriculumStandardDto,
} from "./types";

const log = getLogger("curriculum-mapping");

// ---------------------------------------------------------------------------
// Frameworks — built-in seed data
// ---------------------------------------------------------------------------

const BUILTIN_FRAMEWORKS: Array<{
  code: string;
  name: string;
  description: string;
  region: string;
  language: string;
}> = [
  {
    code: "uzbekistan",
    name: "Uzbekistan National Curriculum",
    description: "The state-mandated curriculum for general education schools in Uzbekistan.",
    region: "Uzbekistan",
    language: "uz",
  },
  {
    code: "cambridge",
    name: "Cambridge International Curriculum",
    description: "Cambridge Primary, Lower Secondary, IGCSE, and A-Level curriculum.",
    region: "Global",
    language: "en",
  },
  {
    code: "ib",
    name: "International Baccalaureate",
    description: "IB Primary Years, Middle Years, and Diploma Programme.",
    region: "Global",
    language: "en",
  },
  {
    code: "ap",
    name: "Advanced Placement",
    description: "College Board Advanced Placement courses and exams.",
    region: "United States",
    language: "en",
  },
  {
    code: "sat",
    name: "SAT",
    description: "College Board SAT (Scholastic Assessment Test) standards.",
    region: "United States",
    language: "en",
  },
  {
    code: "gcse",
    name: "GCSE",
    description: "General Certificate of Secondary Education (UK).",
    region: "United Kingdom",
    language: "en",
  },
];

// ---------------------------------------------------------------------------
// Seed built-in frameworks (idempotent)
// ---------------------------------------------------------------------------

export async function ensureBuiltinFrameworks(): Promise<void> {
  for (const f of BUILTIN_FRAMEWORKS) {
    const existing = await repo.findFrameworkByCode(f.code);
    if (!existing) {
      await repo.createFramework(f);
      log.info("framework.seeded", { code: f.code });
    }
  }
}

// ---------------------------------------------------------------------------
// Framework CRUD
// ---------------------------------------------------------------------------

export async function listFrameworks(organizationId?: string): Promise<CurriculumFrameworkDto[]> {
  await ensureBuiltinFrameworks();
  const frameworks = await repo.findFrameworks({
    organizationId,
    status: "active",
  });
  return frameworks.map(mapFramework);
}

export async function getFramework(id: string): Promise<CurriculumFrameworkDto | null> {
  const f = await repo.findFramework(id);
  return f ? mapFramework(f) : null;
}

export async function createCustomFramework(input: {
  name: string;
  description?: string;
  region?: string;
  language?: string;
  organizationId: string;
}): Promise<CurriculumFrameworkDto> {
  // Custom frameworks use a unique code derived from the org + name
  const code = `custom-${input.organizationId}-${Date.now()}`;
  const f = await repo.createFramework({
    code,
    name: input.name,
    description: input.description,
    region: input.region,
    language: input.language ?? "en",
    organizationId: input.organizationId,
  });
  return mapFramework(f);
}

// ---------------------------------------------------------------------------
// Standard CRUD
// ---------------------------------------------------------------------------

export async function createStandard(input: {
  frameworkId: string;
  code: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  strand?: string;
  outcomes?: string[];
  bloomLevel?: string;
}): Promise<CurriculumStandardDto> {
  const s = await repo.createStandard({
    frameworkId: input.frameworkId,
    code: input.code,
    title: input.title,
    description: input.description,
    subject: input.subject,
    grade: input.grade,
    strand: input.strand,
    outcomes: JSON.stringify(input.outcomes ?? []),
    bloomLevel: input.bloomLevel,
  });
  return mapStandard(s);
}

export async function listStandards(input: {
  frameworkId?: string;
  subject?: string;
  grade?: string;
  strand?: string;
  limit?: number;
}): Promise<CurriculumStandardDto[]> {
  const standards = await repo.findStandards(input);
  return standards.map(mapStandard);
}

export async function getStandard(id: string): Promise<CurriculumStandardDto | null> {
  const s = await repo.findStandard(id);
  return s ? mapStandard(s) : null;
}

// ---------------------------------------------------------------------------
// Auto-mapping (the core intelligence)
// ---------------------------------------------------------------------------

/**
 * Automatically map an entity (resource / quiz / lesson / assessment)
 * to curriculum standards based on its content and the concepts it teaches.
 *
 * The algorithm:
 *   1. Extract concepts from the entity's content.
 *   2. For each framework standard, compute alignment score by matching
 *      the standard's title + description + outcomes against the extracted
 *      concepts + keywords.
 *   3. Persist CurriculumMapping rows for matches above the threshold.
 */
export async function autoMapEntityToStandards(input: {
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  subject?: string;
  frameworkIds?: string[]; // restrict to specific frameworks; default: all
  threshold?: number; // minimum alignment score (default 0.4)
}): Promise<CurriculumMappingDto[]> {
  const threshold = input.threshold ?? 0.4;

  // Step 1: extract concepts + keywords from the entity
  const extracted = extractConcepts({
    content: input.content,
    subject: input.subject,
    title: input.title,
  });
  const entityKeywords = [
    ...extracted.concepts.map((c) => c.name.toLowerCase()),
    ...(extracted.attributes.keywords ?? []).map((k) => k.toLowerCase()),
  ];

  // Step 2: fetch standards to compare against
  const standardsFilter: Parameters<typeof repo.findStandards>[0] = {
    subject: input.subject,
    limit: 500,
  };
  if (input.frameworkIds && input.frameworkIds.length > 0) {
    // Fetch standards from each specified framework
    const allStandards: Awaited<ReturnType<typeof repo.findStandards>> = [];
    for (const frameworkId of input.frameworkIds) {
      const stds = await repo.findStandards({ frameworkId, subject: input.subject, limit: 500 });
      allStandards.push(...stds);
    }
    return await mapAndPersistStandards(allStandards, input, entityKeywords, extracted.bloomLevel, threshold);
  }
  const standards = await repo.findStandards(standardsFilter);
  return await mapAndPersistStandards(standards, input, entityKeywords, extracted.bloomLevel, threshold);
}

async function mapAndPersistStandards(
  standards: Awaited<ReturnType<typeof repo.findStandards>>,
  input: { entityType: string; entityId: string; title: string; content: string; subject?: string },
  entityKeywords: string[],
  bloomLevel: string | null,
  threshold: number,
): Promise<CurriculumMappingDto[]> {
  const mappings: CurriculumMappingDto[] = [];

  for (const standard of standards) {
    const standardText = `${standard.title} ${standard.description ?? ""} ${standard.outcomes ?? ""}`.toLowerCase();
    const standardWords = standardText.split(/\s+/).filter((w) => w.length > 3);

    // Compute alignment score
    let matchedKeywords = 0;
    for (const keyword of entityKeywords) {
      if (standardText.includes(keyword)) matchedKeywords += 1;
    }

    // Jaccard-like similarity between standard words and entity keywords
    const entityWordSet = new Set(entityKeywords.flatMap((k) => k.split(/\s+/)));
    const standardWordSet = new Set(standardWords);
    let intersection = 0;
    for (const w of entityWordSet) {
      if (standardWordSet.has(w)) intersection += 1;
    }
    const union = entityWordSet.size + standardWordSet.size - intersection;
    const jaccard = union > 0 ? intersection / union : 0;

    // Final alignment: weighted blend of keyword match ratio and Jaccard
    const keywordRatio = entityKeywords.length > 0 ? matchedKeywords / entityKeywords.length : 0;
    const alignmentScore = Math.min(1, 0.6 * keywordRatio + 0.4 * jaccard);

    if (alignmentScore < threshold) continue;

    // Determine coverage level
    const coverageLevel = determineCoverageLevel(alignmentScore, bloomLevel, standard.bloomLevel);

    // Persist mapping
    const mapping = await repo.createMapping({
      standardId: standard.id,
      entityType: input.entityType,
      entityId: input.entityId,
      alignmentScore,
      coverageLevel,
      rationale: `AI mapped based on ${matchedKeywords} shared keywords (alignment ${Math.round(alignmentScore * 100)}%).`,
      source: "ai",
    });

    mappings.push({
      id: mapping.id,
      standardId: mapping.standardId,
      entityType: mapping.entityType,
      entityId: mapping.entityId,
      alignmentScore: mapping.alignmentScore,
      coverageLevel: mapping.coverageLevel as CoverageLevel,
      rationale: mapping.rationale,
      source: mapping.source,
      createdAt: mapping.createdAt.toISOString(),
      updatedAt: mapping.updatedAt.toISOString(),
    });
  }

  log.info("auto_map.completed", {
    entityType: input.entityType,
    entityId: input.entityId,
    standardsChecked: standards.length,
    mappingsCreated: mappings.length,
  });

  return mappings.sort((a, b) => b.alignmentScore - a.alignmentScore);
}

function determineCoverageLevel(
  alignmentScore: number,
  entityBloom: string | null,
  standardBloom: string | null,
): CoverageLevel {
  if (alignmentScore >= 0.8) return "full";
  if (alignmentScore >= 0.6) {
    // If entity's Bloom level is higher than standard's, it assesses;
    // otherwise it reinforces.
    if (entityBloom && standardBloom && bloomRank(entityBloom) > bloomRank(standardBloom)) {
      return "assesses";
    }
    return "reinforces";
  }
  if (alignmentScore >= 0.4) return "partial";
  return "introduces";
}

function bloomRank(level: string): number {
  const ranks: Record<string, number> = {
    remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 5, create: 6,
  };
  return ranks[level] ?? 0;
}

// ---------------------------------------------------------------------------
// Query mappings
// ---------------------------------------------------------------------------

export async function listMappings(input: {
  standardId?: string;
  entityType?: string;
  entityId?: string;
  coverageLevel?: string;
  limit?: number;
}): Promise<CurriculumMappingDto[]> {
  const mappings = await repo.findMappings(input);
  return mappings.map((m) => ({
    id: m.id,
    standardId: m.standardId,
    entityType: m.entityType,
    entityId: m.entityId,
    alignmentScore: m.alignmentScore,
    coverageLevel: m.coverageLevel as CoverageLevel,
    rationale: m.rationale,
    source: m.source,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));
}

export async function getMappingsForEntity(entityType: string, entityId: string) {
  const mappings = await repo.findMappingsForEntity(entityType, entityId);
  return mappings.map((m) => ({
    id: m.id,
    standardId: m.standardId,
    standard: m.standard ? mapStandard(m.standard) : null,
    entityType: m.entityType,
    entityId: m.entityId,
    alignmentScore: m.alignmentScore,
    coverageLevel: m.coverageLevel as CoverageLevel,
    rationale: m.rationale,
    source: m.source,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapFramework(f: any): CurriculumFrameworkDto {
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    description: f.description,
    region: f.region,
    language: f.language,
    organizationId: f.organizationId,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

function mapStandard(s: any): CurriculumStandardDto {
  return {
    id: s.id,
    frameworkId: s.frameworkId,
    code: s.code,
    title: s.title,
    description: s.description,
    subject: s.subject,
    grade: s.grade,
    strand: s.strand,
    outcomes: safeParseArray<string>(s.outcomes),
    bloomLevel: s.bloomLevel,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
