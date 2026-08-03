/** EduBek — Research Platform repository. */
import { db } from "@/lib/db";

// Research Projects
export const createProject = (input: any) => db.researchProject.create({ data: input });
export const findProject = (id: string) => db.researchProject.findUnique({ where: { id } });
export const findProjects = (input: any) => { const { limit, ...where } = input; return db.researchProject.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateProject = (id: string, data: any) => db.researchProject.update({ where: { id }, data });

// Literature
export const createLiterature = (input: any) => db.literatureEntry.create({ data: input });
export const findLiterature = (id: string) => db.literatureEntry.findUnique({ where: { id } });
export const findLiteratures = (input: any) => { const { limit, ...where } = input; return db.literatureEntry.findMany({ where, orderBy: { year: "desc" }, take: limit ?? 50 }); };
export const searchLiterature = (query: string, limit: number) => db.literatureEntry.findMany({ where: { OR: [{ title: { contains: query } }, { abstract: { contains: query } }] }, take: limit, orderBy: { influenceScore: "desc" } });

// Experiment Designs
export const createExperiment = (input: any) => db.experimentDesign.create({ data: input });
export const findExperiment = (id: string) => db.experimentDesign.findUnique({ where: { id } });
export const findExperiments = (input: any) => { const { limit, ...where } = input; return db.experimentDesign.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Datasets
export const createDataset = (input: any) => db.researchDataset.create({ data: input });
export const findDataset = (id: string) => db.researchDataset.findUnique({ where: { id } });
export const findDatasets = (input: any) => { const { limit, ...where } = input; return db.researchDataset.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateDataset = (id: string, data: any) => db.researchDataset.update({ where: { id }, data });

// Citations
export const createCitation = (input: any) => db.citationRecord.create({ data: input });
export const findCitations = (input: any) => { const { limit, ...where } = input; return db.citationRecord.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateCitation = (id: string, data: any) => db.citationRecord.update({ where: { id }, data });

// Peer Reviews
export const createReview = (input: any) => db.peerReview.create({ data: input });
export const findReview = (id: string) => db.peerReview.findUnique({ where: { id } });
export const findReviews = (input: any) => { const { limit, ...where } = input; return db.peerReview.findMany({ where, orderBy: { assignedAt: "desc" }, take: limit ?? 50 }); };
export const updateReview = (id: string, data: any) => db.peerReview.update({ where: { id }, data });

// Patents
export const createPatent = (input: any) => db.patentWorkspace.create({ data: input });
export const findPatent = (id: string) => db.patentWorkspace.findUnique({ where: { id } });
export const findPatents = (input: any) => { const { limit, ...where } = input; return db.patentWorkspace.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updatePatent = (id: string, data: any) => db.patentWorkspace.update({ where: { id }, data });

// Publications
export const createPublication = (input: any) => db.publicationDraft.create({ data: input });
export const findPublication = (id: string) => db.publicationDraft.findUnique({ where: { id } });
export const findPublications = (input: any) => { const { limit, ...where } = input; return db.publicationDraft.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updatePublication = (id: string, data: any) => db.publicationDraft.update({ where: { id }, data });

// Analytics
export const upsertAnalytics = (input: any) => db.researchAnalytics.upsert({ where: { organizationId_day: { organizationId: input.organizationId, day: input.day } }, create: input, update: input });
export const findAnalytics = (orgId: string, day?: Date) => day ? db.researchAnalytics.findUnique({ where: { organizationId_day: { organizationId: orgId, day } } }) : db.researchAnalytics.findFirst({ where: { organizationId: orgId }, orderBy: { day: "desc" } });
