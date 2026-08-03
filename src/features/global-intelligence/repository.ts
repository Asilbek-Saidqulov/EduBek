/** EduBek — Global Intelligence repository. */
import { db } from "@/lib/db";

// Foundation Models
export const createModel = (input: any) => db.foundationModel.create({ data: input });
export const findModel = (id: string) => db.foundationModel.findUnique({ where: { id } });
export const findModels = (input: any) => { const { limit, ...where } = input; return db.foundationModel.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateModel = (id: string, data: any) => db.foundationModel.update({ where: { id }, data });

// Curriculum Equivalences
export const createEquivalence = (input: any) => db.curriculumEquivalence.create({ data: input });
export const findEquivalences = (input: any) => { const { limit, ...where } = input; return db.curriculumEquivalence.findMany({ where, take: limit ?? 100 }); };

// Educational Patterns
export const createPattern = (input: any) => db.educationalPattern.create({ data: input });
export const findPatterns = (input: any) => { const { limit, ...where } = input; return db.educationalPattern.findMany({ where, orderBy: { confidence: "desc" }, take: limit ?? 50 }); };

// Synthetic Datasets
export const createSynthetic = (input: any) => db.syntheticDataset.create({ data: input });
export const findSynthetic = (id: string) => db.syntheticDataset.findUnique({ where: { id } });
export const findSynthetics = (input: any) => { const { limit, ...where } = input; return db.syntheticDataset.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Global Benchmarks
export const createBenchmark = (input: any) => db.globalBenchmark.create({ data: input });
export const findBenchmarks = (input: any) => { const { limit, ...where } = input; return db.globalBenchmark.findMany({ where, orderBy: { periodStart: "desc" }, take: limit ?? 50 }); };

// Reasoning Chains
export const createReasoning = (input: any) => db.reasoningChain.create({ data: input });
export const findReasoning = (id: string) => db.reasoningChain.findUnique({ where: { id } });
export const findReasonings = (input: any) => { const { limit, ...where } = input; return db.reasoningChain.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Knowledge Evolution
export const createEvolution = (input: any) => db.knowledgeEvolution.create({ data: input });
export const findEvolutions = (input: any) => { const { limit, ...where } = input; return db.knowledgeEvolution.findMany({ where, orderBy: { detectedAt: "desc" }, take: limit ?? 50 }); };

// Global Observatory
export const createObservatory = (input: any) => db.globalObservatorySnapshot.create({ data: input });
export const findObservatory = (day?: Date) => day ? db.globalObservatorySnapshot.findUnique({ where: { day } }) : db.globalObservatorySnapshot.findFirst({ orderBy: { day: "desc" } });
export const findObservatories = (input: any) => { const { limit, ...where } = input; return db.globalObservatorySnapshot.findMany({ where, orderBy: { day: "desc" }, take: limit ?? 30 }); };

// Foundation API Calls
export const createApiCall = (input: any) => db.foundationApiCall.create({ data: input });
export const findApiCalls = (input: any) => { const { limit, ...where } = input; return db.foundationApiCall.findMany({ where, orderBy: { occurredAt: "desc" }, take: limit ?? 100 }); };

// Collective Insights
export const createInsight = (input: any) => db.collectiveInsight.create({ data: input });
export const findInsights = (input: any) => { const { limit, ...where } = input; return db.collectiveInsight.findMany({ where, orderBy: { confidence: "desc" }, take: limit ?? 50 }); };

// Multilingual Alignments
export const createAlignment = (input: any) => db.multilingualAlignment.create({ data: input });
export const findAlignments = (input: any) => { const { limit, ...where } = input; return db.multilingualAlignment.findMany({ where, take: limit ?? 100 }); };

// Network Participation
export const createParticipation = (input: any) => db.networkParticipation.create({ data: input });
export const findParticipation = (orgId: string) => db.networkParticipation.findUnique({ where: { organizationId: orgId } });
export const findParticipations = (input: any) => { const { limit, ...where } = input; return db.networkParticipation.findMany({ where, orderBy: { joinedAt: "desc" }, take: limit ?? 100 }); };
export const updateParticipation = (id: string, data: any) => db.networkParticipation.update({ where: { id }, data });
