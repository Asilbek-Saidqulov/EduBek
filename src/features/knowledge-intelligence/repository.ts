/**
 * EduBek — Knowledge Intelligence repository.
 *
 * Direct Prisma access for all Phase 4F.5 models:
 *   Concept, ConceptAlias, LearningObjective, CurriculumFramework,
 *   CurriculumStandard, CurriculumMapping, ConceptRelationship,
 *   ConceptMastery, ResourceConcept, KnowledgeCoverage, KnowledgeGap,
 *   ResourceQuality, SimilarityCluster, LearningPrediction,
 *   KnowledgeHealthSnapshot.
 *
 * No business logic — pure data access.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export async function createConcept(input: {
  slug: string;
  name: string;
  description?: string;
  subject?: string;
  bloomLevel?: string;
  difficulty?: number;
  estimatedMinutes?: number;
  attributes?: string;
  language?: string;
  aiConfidence?: number;
}) {
  return db.concept.create({ data: input });
}

export async function findConcept(id: string) {
  return db.concept.findUnique({
    where: { id },
    include: { aliases: true },
  });
}

export async function findConceptBySlug(slug: string) {
  return db.concept.findUnique({
    where: { slug },
    include: { aliases: true },
  });
}

export async function findConcepts(input: {
  subject?: string;
  bloomLevel?: string;
  language?: string;
  limit?: number;
  offset?: number;
}) {
  return db.concept.findMany({
    where: input,
    include: { aliases: true },
    orderBy: { name: "asc" },
    take: input.limit ?? 50,
    skip: input.offset ?? 0,
  });
}

export async function updateConcept(id: string, data: Record<string, unknown>) {
  return db.concept.update({ where: { id }, data });
}

export async function searchConcepts(query: string, limit = 20) {
  return db.concept.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { slug: { contains: query } },
        { aliases: { some: { alias: { contains: query } } } },
      ],
    },
    include: { aliases: true },
    take: limit,
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Concept Aliases
// ---------------------------------------------------------------------------

export async function createConceptAlias(input: {
  conceptId: string;
  alias: string;
  language?: string;
  source?: string;
}) {
  return db.conceptAlias.create({ data: input });
}

export async function findConceptAliases(conceptId: string) {
  return db.conceptAlias.findMany({ where: { conceptId } });
}

// ---------------------------------------------------------------------------
// Learning Objectives
// ---------------------------------------------------------------------------

export async function createObjective(input: {
  frameworkId?: string;
  code: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  bloomLevel?: string;
  conceptIds?: string;
}) {
  return db.learningObjective.create({ data: input });
}

export async function findObjective(id: string) {
  return db.learningObjective.findUnique({ where: { id } });
}

export async function findObjectives(input: {
  frameworkId?: string;
  subject?: string;
  grade?: string;
  limit?: number;
}) {
  return db.learningObjective.findMany({
    where: input,
    orderBy: { code: "asc" },
    take: input.limit ?? 100,
  });
}

// ---------------------------------------------------------------------------
// Curriculum Frameworks + Standards
// ---------------------------------------------------------------------------

export async function createFramework(input: {
  code: string;
  name: string;
  description?: string;
  region?: string;
  language?: string;
  organizationId?: string;
}) {
  return db.curriculumFramework.create({ data: input });
}

export async function findFramework(id: string) {
  return db.curriculumFramework.findUnique({ where: { id } });
}

export async function findFrameworkByCode(code: string) {
  return db.curriculumFramework.findUnique({ where: { code } });
}

export async function findFrameworks(input: { organizationId?: string; status?: string }) {
  return db.curriculumFramework.findMany({
    where: input,
    orderBy: { name: "asc" },
  });
}

export async function createStandard(input: {
  frameworkId: string;
  code: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  strand?: string;
  outcomes?: string;
  bloomLevel?: string;
}) {
  return db.curriculumStandard.create({ data: input });
}

export async function findStandard(id: string) {
  return db.curriculumStandard.findUnique({ where: { id } });
}

export async function findStandards(input: {
  frameworkId?: string;
  subject?: string;
  grade?: string;
  strand?: string;
  limit?: number;
}) {
  return db.curriculumStandard.findMany({
    where: input,
    orderBy: { code: "asc" },
    take: input.limit ?? 200,
  });
}

// ---------------------------------------------------------------------------
// Curriculum Mappings
// ---------------------------------------------------------------------------

export async function createMapping(input: {
  standardId: string;
  entityType: string;
  entityId: string;
  alignmentScore?: number;
  coverageLevel?: string;
  rationale?: string;
  source?: string;
}) {
  return db.curriculumMapping.upsert({
    where: {
      standardId_entityType_entityId: {
        standardId: input.standardId,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: input,
    update: {
      alignmentScore: input.alignmentScore,
      coverageLevel: input.coverageLevel,
      rationale: input.rationale,
      source: input.source,
    },
  });
}

export async function findMappings(input: {
  standardId?: string;
  entityType?: string;
  entityId?: string;
  coverageLevel?: string;
  limit?: number;
}) {
  return db.curriculumMapping.findMany({
    where: input,
    orderBy: { alignmentScore: "desc" },
    take: input.limit ?? 100,
  });
}

export async function findMappingsForEntity(entityType: string, entityId: string) {
  return db.curriculumMapping.findMany({
    where: { entityType, entityId },
    include: { standard: true },
  });
}

// ---------------------------------------------------------------------------
// Concept Relationships
// ---------------------------------------------------------------------------

export async function createConceptRelationship(input: {
  fromConceptId: string;
  toConceptId: string;
  type: string;
  confidence?: number;
  source?: string;
}) {
  return db.conceptRelationship.upsert({
    where: {
      fromConceptId_toConceptId_type: {
        fromConceptId: input.fromConceptId,
        toConceptId: input.toConceptId,
        type: input.type,
      },
    },
    create: input,
    update: {
      confidence: input.confidence,
      source: input.source,
    },
  });
}

export async function findConceptRelationships(input: {
  fromConceptId?: string;
  toConceptId?: string;
  type?: string;
  limit?: number;
}) {
  return db.conceptRelationship.findMany({
    where: input,
    take: input.limit ?? 100,
  });
}

// ---------------------------------------------------------------------------
// Concept Mastery
// ---------------------------------------------------------------------------

export async function upsertConceptMastery(input: {
  userId: string;
  conceptId: string;
  mastery?: number;
  level?: string;
  practiceCount?: number;
  lastPracticedAt?: Date;
}) {
  return db.conceptMastery.upsert({
    where: {
      userId_conceptId: { userId: input.userId, conceptId: input.conceptId },
    },
    create: input,
    update: input,
  });
}

export async function findConceptMastery(userId: string, conceptId: string) {
  return db.conceptMastery.findUnique({
    where: { userId_conceptId: { userId, conceptId } },
  });
}

export async function findConceptMasteryByUser(userId: string, limit = 200) {
  return db.conceptMastery.findMany({
    where: { userId },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Resource ↔ Concept
// ---------------------------------------------------------------------------

export async function createResourceConcept(input: {
  conceptId: string;
  entityType: string;
  entityId: string;
  relationship?: string;
  confidence?: number;
  weight?: number;
}) {
  return db.resourceConcept.upsert({
    where: {
      conceptId_entityType_entityId_relationship: {
        conceptId: input.conceptId,
        entityType: input.entityType,
        entityId: input.entityId,
        relationship: input.relationship ?? "teaches",
      },
    },
    create: input,
    update: {
      confidence: input.confidence,
      weight: input.weight,
    },
  });
}

export async function findResourceConcepts(entityType: string, entityId: string) {
  return db.resourceConcept.findMany({
    where: { entityType, entityId },
    include: { concept: true },
  });
}

export async function findResourcesForConcept(conceptId: string, limit = 50) {
  return db.resourceConcept.findMany({
    where: { conceptId },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Knowledge Coverage
// ---------------------------------------------------------------------------

export async function upsertKnowledgeCoverage(input: {
  scopeType: string;
  scopeId: string;
  frameworkId: string;
  totalStandards: number;
  coveredStandards: number;
  uncoveredStandards: number;
  coveragePct: number;
  details?: string;
}) {
  return db.knowledgeCoverage.upsert({
    where: {
      scopeType_scopeId_frameworkId: {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        frameworkId: input.frameworkId,
      },
    },
    create: input,
    update: input,
  });
}

export async function findKnowledgeCoverage(scopeType: string, scopeId: string, frameworkId: string) {
  return db.knowledgeCoverage.findUnique({
    where: {
      scopeType_scopeId_frameworkId: { scopeType, scopeId, frameworkId },
    },
  });
}

// ---------------------------------------------------------------------------
// Knowledge Gaps
// ---------------------------------------------------------------------------

export async function createKnowledgeGap(input: {
  scopeType: string;
  scopeId: string;
  standardId?: string;
  conceptId?: string;
  type: string;
  description: string;
  suggestedAction?: string;
  metadata?: string;
}) {
  return db.knowledgeGap.create({ data: input });
}

export async function findKnowledgeGaps(input: {
  scopeType?: string;
  scopeId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return db.knowledgeGap.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 100,
  });
}

export async function updateKnowledgeGap(id: string, data: Record<string, unknown>) {
  return db.knowledgeGap.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Resource Quality
// ---------------------------------------------------------------------------

export async function upsertResourceQuality(input: {
  entityType: string;
  entityId: string;
  overall?: number;
  clarity?: number;
  depth?: number;
  accuracy?: number;
  difficulty?: number;
  engagement?: number;
  curriculumAlignment?: number;
  assessmentQuality?: number;
  accessibility?: number;
  aiConfidence?: number;
  analysis?: string;
  model?: string;
}) {
  return db.resourceQuality.upsert({
    where: {
      entityType_entityId: {
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: input,
    update: input,
  });
}

export async function findResourceQuality(entityType: string, entityId: string) {
  return db.resourceQuality.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
  });
}

// ---------------------------------------------------------------------------
// Similarity Clusters
// ---------------------------------------------------------------------------

export async function createSimilarityCluster(input: {
  name: string;
  entityType: string;
  members?: string;
  centroidHash?: string;
  threshold?: number;
  clusterType?: string;
}) {
  return db.similarityCluster.create({ data: input });
}

export async function findSimilarityClusters(input: {
  entityType?: string;
  clusterType?: string;
  limit?: number;
}) {
  return db.similarityCluster.findMany({
    where: input,
    orderBy: { updatedAt: "desc" },
    take: input.limit ?? 50,
  });
}

// ---------------------------------------------------------------------------
// Learning Predictions
// ---------------------------------------------------------------------------

export async function upsertLearningPrediction(input: {
  userId: string;
  entityType: string;
  entityId: string;
  predictedScore?: number | null;
  predictedCompletion?: number | null;
  predictedDropout?: number | null;
  predictedMastery?: number | null;
  predictedStudyMinutes?: number | null;
  interventionNeeded?: boolean;
  interventionReason?: string | null;
  metadata?: string;
  confidence?: number;
}) {
  return db.learningPrediction.upsert({
    where: {
      userId_entityType_entityId: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    },
    create: input,
    update: input,
  });
}

export async function findLearningPrediction(userId: string, entityType: string, entityId: string) {
  return db.learningPrediction.findUnique({
    where: {
      userId_entityType_entityId: { userId, entityType, entityId },
    },
  });
}

export async function findLearningPredictionsForUser(userId: string, limit = 50) {
  return db.learningPrediction.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Knowledge Health Snapshots
// ---------------------------------------------------------------------------

export async function upsertKnowledgeHealthSnapshot(input: {
  organizationId: string;
  day: Date;
  coverageScore?: number;
  qualityScore?: number;
  curriculumCompleteness?: number;
  graphDensity?: number;
  resourceFreshness?: number;
  aiReadiness?: number;
  masteryDistribution?: string;
  teacherContributions?: string;
}) {
  return db.knowledgeHealthSnapshot.upsert({
    where: {
      organizationId_day: {
        organizationId: input.organizationId,
        day: input.day,
      },
    },
    create: input,
    update: input,
  });
}

export async function findKnowledgeHealthSnapshot(organizationId: string, day?: Date) {
  if (day) {
    return db.knowledgeHealthSnapshot.findUnique({
      where: { organizationId_day: { organizationId, day } },
    });
  }
  return db.knowledgeHealthSnapshot.findFirst({
    where: { organizationId },
    orderBy: { day: "desc" },
  });
}
