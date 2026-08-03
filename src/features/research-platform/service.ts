/**
 * EduBek — Research Platform service.
 *
 * Phase 5D.1: AI Research Assistant, Scientific Literature Intelligence,
 * Research Project Workspace, Experiment Designer, Dataset Intelligence,
 * Citation & Evidence Engine, Peer Review Platform, Innovation & Patent
 * Workspace, Scientific Knowledge Graph, Research Analytics.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  CitationRecordDto, ExperimentDesignDto, LiteratureEntryDto,
  PatentWorkspaceDto, PeerReviewDto, PublicationDraftDto,
  ResearchAnalyticsDto, ResearchAssistantResult, ResearchDatasetDto,
  ResearchProjectDto,
} from "./types";

const log = getLogger("research-platform");
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ===========================================================================
// 1. AI Research Assistant
// ===========================================================================

export async function queryResearchAssistant(input: {
  query: string; projectId?: string; organizationId?: string; locale?: string;
}): Promise<ResearchAssistantResult> {
  const { query } = input;

  // Search literature for relevant entries
  const literature = await repo.searchLiterature(query, 5).catch(() => []);

  // Generate a research-oriented response (deterministic for Phase 5D.1)
  const response = `Based on your query "${query}", I found ${literature.length} relevant literature entries. ` +
    (literature.length > 0
      ? `The most influential work is "${literature[0]!.title}" (${literature[0]!.year}) with ${literature[0]!.citationCount} citations. `
      : `No direct matches found — consider refining your search terms. `) +
    `I can help with: literature review, hypothesis generation, experiment planning, methodology suggestions, citation assistance, statistical recommendations, result interpretation, and publication drafting.`;

  const citations = literature.map((l: any) => ({
    literatureId: l.id,
    reference: `${l.title} (${l.year})`,
    relevance: l.influenceScore,
  }));

  const suggestions = [
    "Generate a hypothesis based on these findings",
    "Design an experiment to test this",
    "Find contradicting evidence",
    "Draft a literature review section",
    "Check citation formatting",
  ];

  return {
    query, response, citations,
    suggestions,
    confidence: literature.length > 0 ? 0.75 : 0.4,
  };
}

// ===========================================================================
// 2. Research Project Workspace
// ===========================================================================

export async function createProject(input: {
  title: string; description?: string; researchType?: string; field?: string;
  principalInvestigator: string; teamMembers?: string[];
  organizationId?: string; objectives?: Array<{ id: string; objective: string; status: string }>;
  milestones?: Array<{ id: string; name: string; dueDate: string; status: string }>;
  funding?: Record<string, unknown>; ethicsApproved?: boolean;
}): Promise<ResearchProjectDto> {
  const row = await repo.createProject({
    title: input.title, description: input.description,
    researchType: input.researchType ?? "applied", field: input.field,
    status: "proposal",
    objectives: JSON.stringify(input.objectives ?? []),
    milestones: JSON.stringify(input.milestones ?? []),
    principalInvestigator: input.principalInvestigator,
    teamMembers: JSON.stringify(input.teamMembers ?? []),
    organizationId: input.organizationId,
    experimentIds: "[]", datasetIds: "[]", publicationIds: "[]",
    assistantState: "{}", funding: JSON.stringify(input.funding ?? {}),
    ethicsApproved: input.ethicsApproved ?? false,
  });
  log.info("project.created", { id: row.id, title: input.title });
  return mapProject(row);
}

export async function getProject(id: string): Promise<ResearchProjectDto | null> {
  const row = await repo.findProject(id);
  return row ? mapProject(row) : null;
}

export async function listProjects(input: { status?: string; principalInvestigator?: string; organizationId?: string; field?: string; limit?: number }): Promise<ResearchProjectDto[]> {
  const rows = await repo.findProjects(input);
  return rows.map(mapProject);
}

export async function updateProjectStatus(id: string, status: string): Promise<ResearchProjectDto> {
  const row = await repo.updateProject(id, { status });
  return mapProject(row);
}

// ===========================================================================
// 3. Scientific Literature Intelligence
// ===========================================================================

export async function addLiterature(input: {
  type: string; title: string; authors?: Array<{ name: string; affiliation?: string; orcid?: string }>;
  abstract?: string; year?: number; venue?: string; doi?: string; url?: string;
  keywords?: string[]; concepts?: string[]; methodologies?: string[];
  fullTextUrl?: string; organizationId?: string;
}): Promise<LiteratureEntryDto> {
  const row = await repo.createLiterature({
    type: input.type, title: input.title,
    authors: JSON.stringify(input.authors ?? []),
    abstract: input.abstract, year: input.year, venue: input.venue,
    doi: input.doi, url: input.url,
    keywords: JSON.stringify(input.keywords ?? []),
    concepts: JSON.stringify(input.concepts ?? []),
    methodologies: JSON.stringify(input.methodologies ?? []),
    fullTextUrl: input.fullTextUrl, organizationId: input.organizationId,
  });
  log.info("literature.added", { id: row.id, title: input.title });
  return mapLiterature(row);
}

export async function getLiterature(id: string): Promise<LiteratureEntryDto | null> {
  const row = await repo.findLiterature(id);
  return row ? mapLiterature(row) : null;
}

export async function listLiterature(input: { type?: string; year?: number; organizationId?: string; limit?: number }): Promise<LiteratureEntryDto[]> {
  const rows = await repo.findLiteratures(input);
  return rows.map(mapLiterature);
}

export async function searchLiteratureEntries(query: string, limit = 20): Promise<LiteratureEntryDto[]> {
  const rows = await repo.searchLiterature(query, limit);
  return rows.map(mapLiterature);
}

// ===========================================================================
// 4. Experiment Designer
// ===========================================================================

export async function designExperiment(input: {
  projectId?: string; title: string; description?: string;
  experimentType?: string; hypothesis?: string;
  variables?: { independent: Array<{ name: string; type: string; levels: string[] }>; dependent: Array<{ name: string; type: string; measurement: string }>; control: Array<{ name: string; value: string }> };
  sampleSize?: number; sampleSizeJustification?: string;
  measurements?: Array<{ name: string; instrument: string; frequency: string; unit: string }>;
  analysisPlan?: Record<string, unknown>;
  risks?: Array<{ risk: string; severity: string; mitigation: string }>;
  reproducibility?: Array<{ item: string; status: string; notes?: string }>;
  aiGenerated?: boolean;
}): Promise<ExperimentDesignDto> {
  const row = await repo.createExperiment({
    projectId: input.projectId, title: input.title, description: input.description,
    experimentType: input.experimentType ?? "controlled",
    hypothesis: input.hypothesis,
    variables: JSON.stringify(input.variables ?? { independent: [], dependent: [], control: [] }),
    sampleSize: input.sampleSize, sampleSizeJustification: input.sampleSizeJustification,
    measurements: JSON.stringify(input.measurements ?? []),
    analysisPlan: JSON.stringify(input.analysisPlan ?? {}),
    risks: JSON.stringify(input.risks ?? []),
    reproducibility: JSON.stringify(input.reproducibility ?? [
      { item: "Code repository linked", status: "pending" },
      { item: "Data available", status: "pending" },
      { item: "Random seed documented", status: "pending" },
      { item: "Environment specified", status: "pending" },
    ]),
    aiGenerated: input.aiGenerated ?? false, status: "draft",
  });
  log.info("experiment.designed", { id: row.id, title: input.title });
  return mapExperiment(row);
}

export async function listExperiments(input: { projectId?: string; experimentType?: string; status?: string; limit?: number }): Promise<ExperimentDesignDto[]> {
  const rows = await repo.findExperiments(input);
  return rows.map(mapExperiment);
}

// ===========================================================================
// 5. Dataset Intelligence
// ===========================================================================

export async function createDataset(input: {
  projectId?: string; name: string; description?: string;
  schema?: Array<{ name: string; type: string; unit?: string; required: boolean; description?: string }>;
  data?: Record<string, unknown>[]; fileUrl?: string; format?: string;
  organizationId?: string;
}): Promise<ResearchDatasetDto> {
  const rowCount = input.data?.length ?? 0;
  const sizeBytes = JSON.stringify(input.data ?? []).length;
  const row = await repo.createDataset({
    projectId: input.projectId, name: input.name, description: input.description,
    schema: JSON.stringify(input.schema ?? []),
    data: JSON.stringify(input.data ?? []),
    fileUrl: input.fileUrl, format: input.format ?? "json",
    version: 1,
    provenance: JSON.stringify([{ source: "user_upload", timestamp: new Date().toISOString(), operation: "create", actor: "system" }]),
    qualityScore: 0.5,
    fairCompliance: JSON.stringify({ findable: true, accessible: true, interoperable: false, reusable: false, score: 0.5 }),
    anonymized: false, rowCount, sizeBytes, organizationId: input.organizationId,
  });
  log.info("dataset.created", { id: row.id, name: input.name, rowCount });
  return mapDataset(row);
}

export async function getDataset(id: string): Promise<ResearchDatasetDto | null> {
  const row = await repo.findDataset(id);
  return row ? mapDataset(row) : null;
}

export async function listDatasets(input: { projectId?: string; organizationId?: string; limit?: number }): Promise<ResearchDatasetDto[]> {
  const rows = await repo.findDatasets(input);
  return rows.map(mapDataset);
}

export async function validateDatasetFairness(id: string): Promise<{ findable: boolean; accessible: boolean; interoperable: boolean; reusable: boolean; score: number }> {
  const ds = await repo.findDataset(id);
  if (!ds) throw new Error("Dataset not found");
  const schema = safeParse<Array<{ name: string; type: string }>>(ds.schema, []);
  const fair = {
    findable: true,
    accessible: ds.fileUrl !== null || ds.data !== "[]",
    interoperable: schema.length > 0 && ds.format !== "custom",
    reusable: ds.description !== null && ds.provenance !== "[]",
  };
  const score = Object.values(fair).filter(Boolean).length / 4;
  await repo.updateDataset(id, {
    fairCompliance: JSON.stringify({ ...fair, score }),
    qualityScore: Math.max(ds.qualityScore, score),
  });
  return { ...fair, score };
}

// ===========================================================================
// 6. Citation & Evidence Engine
// ===========================================================================

export async function recordCitation(input: {
  sourceType: string; sourceId: string;
  literatureId?: string; rawCitation?: string;
  citationType?: string; context?: string;
  citationStyle?: string;
}): Promise<CitationRecordDto> {
  let formattedCitation: string | undefined;
  let validationStatus = "unverified";

  if (input.literatureId) {
    const lit = await repo.findLiterature(input.literatureId);
    if (lit) {
      const authors = safeParse<Array<{ name: string }>>(lit.authors, []);
      const firstAuthor = authors[0]?.name ?? "Unknown";
      const style = input.citationStyle ?? "apa";
      formattedCitation = style === "apa"
        ? `${firstAuthor} (${lit.year ?? "n.d."}). ${lit.title}. ${lit.venue ?? ""}.`
        : `${firstAuthor}. ${lit.title}. ${lit.year ?? "n.d."}.`;
      validationStatus = "verified";
    }
  }

  const row = await repo.createCitation({
    sourceType: input.sourceType, sourceId: input.sourceId,
    literatureId: input.literatureId, rawCitation: input.rawCitation,
    citationType: input.citationType ?? "cites", context: input.context,
    validationStatus, formattedCitation, citationStyle: input.citationStyle ?? "apa",
  });
  return mapCitation(row);
}

export async function listCitations(input: { sourceType?: string; sourceId?: string; literatureId?: string; validationStatus?: string; limit?: number }): Promise<CitationRecordDto[]> {
  const rows = await repo.findCitations(input);
  return rows.map(mapCitation);
}

export async function validateCitations(sourceType: string, sourceId: string): Promise<{ total: number; verified: number; unverified: number; mismatch: number; broken: number }> {
  const citations = await repo.findCitations({ sourceType, sourceId, limit: 1000 });
  let verified = 0, unverified = 0, mismatch = 0, broken = 0;
  for (const c of citations) {
    if (c.validationStatus === "verified") verified += 1;
    else if (c.validationStatus === "unverified") unverified += 1;
    else if (c.validationStatus === "mismatch") mismatch += 1;
    else if (c.validationStatus === "broken") broken += 1;
  }
  return { total: citations.length, verified, unverified, mismatch, broken };
}

// ===========================================================================
// 7. Peer Review Platform
// ===========================================================================

export async function assignReview(input: {
  entityType: string; entityId: string;
  reviewerId: string; reviewerName: string;
  reviewType?: string;
}): Promise<PeerReviewDto> {
  const row = await repo.createReview({
    entityType: input.entityType, entityId: input.entityId,
    reviewerId: input.reviewerId, reviewerName: input.reviewerName,
    reviewType: input.reviewType ?? "double_blind",
    status: "assigned", rubricEvaluation: "[]", revisionRound: 1,
  });
  log.info("review.assigned", { id: row.id, entityType: input.entityType, entityId: input.entityId });
  return mapReview(row);
}

export async function submitReview(input: {
  reviewId: string;
  rubricEvaluation?: Array<{ criterion: string; score: number; feedback: string }>;
  overallScore?: number; recommendation?: string;
  reviewText?: string; confidentialComments?: string;
  readinessScore?: number;
}): Promise<PeerReviewDto> {
  const row = await repo.updateReview(input.reviewId, {
    status: "submitted",
    rubricEvaluation: JSON.stringify(input.rubricEvaluation ?? []),
    overallScore: input.overallScore,
    recommendation: input.recommendation,
    reviewText: input.reviewText,
    confidentialComments: input.confidentialComments,
    readinessScore: input.readinessScore,
    submittedAt: new Date(),
  });
  return mapReview(row);
}

export async function listReviews(input: { entityType?: string; entityId?: string; reviewerId?: string; status?: string; limit?: number }): Promise<PeerReviewDto[]> {
  const rows = await repo.findReviews(input);
  return rows.map(mapReview);
}

// ===========================================================================
// 8. Innovation & Patent Workspace
// ===========================================================================

export async function createPatentWorkspace(input: {
  title: string; description?: string; disclosure?: string;
  inventors?: string[]; organizationId?: string;
}): Promise<PatentWorkspaceDto> {
  const row = await repo.createPatent({
    title: input.title, description: input.description,
    disclosure: input.disclosure,
    noveltyAnalysis: "[]", priorArt: "[]", draftSections: "[]",
    commercialization: "{}",
    inventors: JSON.stringify(input.inventors ?? []),
    organizationId: input.organizationId,
    status: "disclosure",
  });
  log.info("patent.created", { id: row.id, title: input.title });
  return mapPatent(row);
}

export async function getPatent(id: string): Promise<PatentWorkspaceDto | null> {
  const row = await repo.findPatent(id);
  return row ? mapPatent(row) : null;
}

export async function listPatents(input: { organizationId?: string; status?: string; limit?: number }): Promise<PatentWorkspaceDto[]> {
  const rows = await repo.findPatents(input);
  return rows.map(mapPatent);
}

export async function updatePatentStatus(id: string, status: string, patentNumber?: string): Promise<PatentWorkspaceDto> {
  const data: Record<string, unknown> = { status };
  if (status === "filed") data.filedAt = new Date();
  if (status === "granted") { data.grantedAt = new Date(); if (patentNumber) data.patentNumber = patentNumber; }
  const row = await repo.updatePatent(id, data);
  return mapPatent(row);
}

// ===========================================================================
// 9. Publication Drafts
// ===========================================================================

export async function createPublication(input: {
  projectId?: string; title: string; abstract?: string;
  sections?: Array<{ id: string; name: string; content: string; wordCount: number; status: string }>;
  authors?: Array<{ name: string; affiliation?: string; orcid?: string; corresponding: boolean }>;
  keywords?: string[]; targetVenue?: string;
  publicationType?: string; citationStyle?: string;
  organizationId?: string;
}): Promise<PublicationDraftDto> {
  const wordCount = (input.sections ?? []).reduce((s, sec) => s + sec.wordCount, 0);
  const row = await repo.createPublication({
    projectId: input.projectId, title: input.title, abstract: input.abstract,
    sections: JSON.stringify(input.sections ?? []),
    authors: JSON.stringify(input.authors ?? []),
    keywords: JSON.stringify(input.keywords ?? []),
    targetVenue: input.targetVenue,
    publicationType: input.publicationType ?? "journal_article",
    citationStyle: input.citationStyle ?? "apa",
    bibliography: "[]", aiGenerated: false,
    status: "draft", wordCount, reviewIds: "[]",
    organizationId: input.organizationId,
  });
  log.info("publication.created", { id: row.id, title: input.title, wordCount });
  return mapPublication(row);
}

export async function getPublication(id: string): Promise<PublicationDraftDto | null> {
  const row = await repo.findPublication(id);
  return row ? mapPublication(row) : null;
}

export async function listPublications(input: { projectId?: string; status?: string; organizationId?: string; limit?: number }): Promise<PublicationDraftDto[]> {
  const rows = await repo.findPublications(input);
  return rows.map(mapPublication);
}

export async function updatePublicationStatus(id: string, status: string, doi?: string, publishedUrl?: string): Promise<PublicationDraftDto> {
  const data: Record<string, unknown> = { status };
  if (doi) data.doi = doi;
  if (publishedUrl) data.publishedUrl = publishedUrl;
  const row = await repo.updatePublication(id, data);
  return mapPublication(row);
}

// ===========================================================================
// 10. Research Analytics
// ===========================================================================

export async function generateResearchAnalytics(organizationId: string): Promise<ResearchAnalyticsDto> {
  const [projects, publications, patents, literature] = await Promise.all([
    repo.findProjects({ organizationId, limit: 1000 }).catch(() => []),
    repo.findPublications({ organizationId, limit: 1000 }).catch(() => []),
    repo.findPatents({ organizationId, limit: 1000 }).catch(() => []),
    repo.findLiteratures({ organizationId, limit: 1000 }).catch(() => []),
  ]);

  const publishedPubs = publications.filter((p: any) => p.status === "published");
  const totalCitations = literature.reduce((s: number, l: any) => s + l.citationCount, 0);
  const filedPatents = patents.filter((p: any) => p.status === "filed" || p.status === "granted").length;
  const grantedPatents = patents.filter((p: any) => p.status === "granted").length;

  const publicationMetrics = {
    totalPapers: publishedPubs.length,
    totalCitations,
    hIndex: Math.floor(Math.sqrt(publishedPubs.length)),
    i10Index: Math.floor(publishedPubs.length * 0.3),
  };

  const collaborationNetwork = {
    nodes: projects.flatMap((p: any) => safeParse<string[]>(p.teamMembers, [])).length,
    edges: projects.length,
    density: projects.length > 0 ? 0.3 : 0,
  };

  const funding = safeParse<Record<string, unknown>>(projects[0]?.funding ?? "{}", {});
  const trends = [{ field: "AI in Education", direction: "up", growthRate: 0.25 }];
  const interdisciplinary = [{ fieldA: "Computer Science", fieldB: "Education", strength: 0.8 }];
  const innovationMetrics = { patentsFiled: filedPatents, patentsGranted: grantedPatents, commercialization: 0 };

  const aiSummary = `Research analytics for organization: ${publishedPubs.length} published papers, ${totalCitations} total citations, h-index ${publicationMetrics.hIndex}. ${filedPatents} patents filed, ${grantedPatents} granted. ${projects.length} active research projects.`;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const row = await repo.upsertAnalytics({
    organizationId, day: today,
    publicationMetrics: JSON.stringify(publicationMetrics),
    collaborationNetwork: JSON.stringify(collaborationNetwork),
    funding: JSON.stringify(funding),
    trends: JSON.stringify(trends),
    interdisciplinary: JSON.stringify(interdisciplinary),
    innovationMetrics: JSON.stringify(innovationMetrics),
    aiSummary,
  });

  log.info("analytics.generated", { organizationId, papers: publishedPubs.length, citations: totalCitations });
  return mapAnalytics(row);
}

export async function getResearchAnalytics(organizationId: string, refresh = false): Promise<ResearchAnalyticsDto | null> {
  if (refresh) return generateResearchAnalytics(organizationId);
  const row = await repo.findAnalytics(organizationId);
  if (!row) return generateResearchAnalytics(organizationId);
  return mapAnalytics(row);
}

// ===========================================================================
// Mappers
// ===========================================================================

function mapProject(row: any): ResearchProjectDto {
  return {
    id: row.id, title: row.title, description: row.description, status: row.status,
    researchType: row.researchType, field: row.field,
    objectives: safeParse(row.objectives, []),
    milestones: safeParse(row.milestones, []),
    principalInvestigator: row.principalInvestigator,
    teamMembers: safeParse<string[]>(row.teamMembers, []),
    organizationId: row.organizationId,
    experimentIds: safeParse<string[]>(row.experimentIds, []),
    datasetIds: safeParse<string[]>(row.datasetIds, []),
    publicationIds: safeParse<string[]>(row.publicationIds, []),
    assistantState: safeParse(row.assistantState, {}),
    funding: safeParse(row.funding, {}),
    ethicsApproved: row.ethicsApproved, ethicsNotes: row.ethicsNotes,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function mapLiterature(row: any): LiteratureEntryDto {
  return {
    id: row.id, type: row.type, title: row.title,
    authors: safeParse(row.authors, []),
    abstract: row.abstract, year: row.year, venue: row.venue,
    doi: row.doi, url: row.url,
    keywords: safeParse<string[]>(row.keywords, []),
    concepts: safeParse<string[]>(row.concepts, []),
    methodologies: safeParse<string[]>(row.methodologies, []),
    citationCount: row.citationCount, influenceScore: row.influenceScore,
    evidenceStrength: row.evidenceStrength,
    contradictions: safeParse(row.contradictions, []),
    fullTextUrl: row.fullTextUrl, organizationId: row.organizationId,
  };
}

function mapExperiment(row: any): ExperimentDesignDto {
  return {
    id: row.id, projectId: row.projectId, title: row.title, description: row.description,
    experimentType: row.experimentType, hypothesis: row.hypothesis,
    variables: safeParse(row.variables, { independent: [], dependent: [], control: [] }),
    sampleSize: row.sampleSize, sampleSizeJustification: row.sampleSizeJustification,
    measurements: safeParse(row.measurements, []),
    analysisPlan: safeParse(row.analysisPlan, {}),
    risks: safeParse(row.risks, []),
    reproducibility: safeParse(row.reproducibility, []),
    aiGenerated: row.aiGenerated, status: row.status,
  };
}

function mapDataset(row: any): ResearchDatasetDto {
  return {
    id: row.id, projectId: row.projectId, name: row.name, description: row.description,
    schema: safeParse(row.schema, []),
    data: safeParse<Record<string, unknown>[]>(row.data, []),
    fileUrl: row.fileUrl, format: row.format, version: row.version,
    provenance: safeParse(row.provenance, []),
    qualityScore: row.qualityScore,
    fairCompliance: safeParse(row.fairCompliance, {}),
    anonymized: row.anonymized, anonymizationMethod: row.anonymizationMethod,
    rowCount: row.rowCount, sizeBytes: row.sizeBytes, organizationId: row.organizationId,
  };
}

function mapCitation(row: any): CitationRecordDto {
  return {
    id: row.id, sourceType: row.sourceType, sourceId: row.sourceId,
    literatureId: row.literatureId, rawCitation: row.rawCitation,
    citationType: row.citationType, context: row.context,
    validationStatus: row.validationStatus, validationNotes: row.validationNotes,
    formattedCitation: row.formattedCitation, citationStyle: row.citationStyle,
  };
}

function mapReview(row: any): PeerReviewDto {
  return {
    id: row.id, entityType: row.entityType, entityId: row.entityId,
    reviewerId: row.reviewerId, reviewerName: row.reviewerName, reviewType: row.reviewType,
    status: row.status,
    rubricEvaluation: safeParse(row.rubricEvaluation, []),
    overallScore: row.overallScore, recommendation: row.recommendation,
    reviewText: row.reviewText, confidentialComments: row.confidentialComments,
    revisionRound: row.revisionRound, readinessScore: row.readinessScore,
    assignedAt: row.assignedAt.toISOString(), submittedAt: row.submittedAt?.toISOString() ?? null,
  };
}

function mapPatent(row: any): PatentWorkspaceDto {
  return {
    id: row.id, title: row.title, description: row.description,
    disclosure: row.disclosure,
    noveltyAnalysis: safeParse(row.noveltyAnalysis, []),
    priorArt: safeParse(row.priorArt, []),
    draftSections: safeParse(row.draftSections, []),
    commercialization: safeParse(row.commercialization, {}),
    inventors: safeParse<string[]>(row.inventors, []),
    organizationId: row.organizationId, status: row.status,
    patentNumber: row.patentNumber,
    filedAt: row.filedAt?.toISOString() ?? null,
    grantedAt: row.grantedAt?.toISOString() ?? null,
  };
}

function mapPublication(row: any): PublicationDraftDto {
  return {
    id: row.id, projectId: row.projectId, title: row.title, abstract: row.abstract,
    sections: safeParse(row.sections, []),
    authors: safeParse(row.authors, []),
    keywords: safeParse<string[]>(row.keywords, []),
    targetVenue: row.targetVenue,
    publicationType: row.publicationType, citationStyle: row.citationStyle,
    bibliography: safeParse(row.bibliography, []),
    aiGenerated: row.aiGenerated, status: row.status, wordCount: row.wordCount,
    reviewIds: safeParse<string[]>(row.reviewIds, []),
    doi: row.doi, publishedUrl: row.publishedUrl, organizationId: row.organizationId,
  };
}

function mapAnalytics(row: any): ResearchAnalyticsDto {
  return {
    id: row.id, organizationId: row.organizationId, day: row.day.toISOString(),
    publicationMetrics: safeParse(row.publicationMetrics, {}),
    collaborationNetwork: safeParse(row.collaborationNetwork, {}),
    funding: safeParse(row.funding, {}),
    trends: safeParse(row.trends, []),
    interdisciplinary: safeParse(row.interdisciplinary, []),
    innovationMetrics: safeParse(row.innovationMetrics, {}),
    aiSummary: row.aiSummary,
  };
}
