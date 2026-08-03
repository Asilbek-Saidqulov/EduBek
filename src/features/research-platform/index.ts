/** EduBek — Research Platform barrel export. Phase 5D.1. */
export {
  queryResearchAssistant,
  createProject, getProject, listProjects, updateProjectStatus,
  addLiterature, getLiterature, listLiterature, searchLiteratureEntries,
  designExperiment, listExperiments,
  createDataset, getDataset, listDatasets, validateDatasetFairness,
  recordCitation, listCitations, validateCitations,
  assignReview, submitReview, listReviews,
  createPatentWorkspace, getPatent, listPatents, updatePatentStatus,
  createPublication, getPublication, listPublications, updatePublicationStatus,
  generateResearchAnalytics, getResearchAnalytics,
} from "./service";

export type {
  ResearchProjectDto, LiteratureEntryDto, ExperimentDesignDto,
  ResearchDatasetDto, CitationRecordDto, PeerReviewDto,
  PatentWorkspaceDto, PublicationDraftDto, ResearchAnalyticsDto,
  ResearchAssistantResult,
} from "./types";
