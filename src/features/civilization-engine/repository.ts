/** EduBek — Civilization Engine repository. */
import { db } from "@/lib/db";

// Institutional Memory
export const createMemory = (input: any) => db.institutionalMemory.create({ data: input });
export const findMemory = (id: string) => db.institutionalMemory.findUnique({ where: { id } });
export const findMemories = (input: any) => { const { limit, ...where } = input; return db.institutionalMemory.findMany({ where, orderBy: [{ importance: "desc" }, { createdAt: "desc" }], take: limit ?? 100 }); };
export const searchMemories = (orgId: string, query: string, limit: number) => db.institutionalMemory.findMany({ where: { organizationId: orgId, searchText: { contains: query } }, orderBy: { importance: "desc" }, take: limit });

// Decision Analysis
export const createDecision = (input: any) => db.decisionAnalysis.create({ data: input });
export const findDecision = (id: string) => db.decisionAnalysis.findUnique({ where: { id } });
export const findDecisions = (input: any) => { const { limit, ...where } = input; return db.decisionAnalysis.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateDecision = (id: string, data: any) => db.decisionAnalysis.update({ where: { id }, data });

// Strategic Plans
export const createPlan = (input: any) => db.strategicPlan.create({ data: input });
export const findPlan = (id: string) => db.strategicPlan.findUnique({ where: { id } });
export const findPlans = (input: any) => { const { limit, ...where } = input; return db.strategicPlan.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updatePlan = (id: string, data: any) => db.strategicPlan.update({ where: { id }, data });

// Advisor Recommendations
export const createRecommendation = (input: any) => db.advisorRecommendation.create({ data: input });
export const findRecommendation = (id: string) => db.advisorRecommendation.findUnique({ where: { id } });
export const findRecommendations = (input: any) => { const { limit, ...where } = input; return db.advisorRecommendation.findMany({ where, orderBy: [{ priority: "asc" }, { createdAt: "desc" }], take: limit ?? 50 }); };
export const updateRecommendation = (id: string, data: any) => db.advisorRecommendation.update({ where: { id }, data });

// Educational Policies
export const createPolicy = (input: any) => db.educationalPolicy.create({ data: input });
export const findPolicy = (id: string) => db.educationalPolicy.findUnique({ where: { id } });
export const findPolicies = (input: any) => { const { limit, ...where } = input; return db.educationalPolicy.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updatePolicy = (id: string, data: any) => db.educationalPolicy.update({ where: { id }, data });

// Institutional Goals
export const createGoal = (input: any) => db.institutionalGoal.create({ data: input });
export const findGoal = (id: string) => db.institutionalGoal.findUnique({ where: { id } });
export const findGoals = (input: any) => { const { limit, ...where } = input; return db.institutionalGoal.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateGoal = (id: string, data: any) => db.institutionalGoal.update({ where: { id }, data });

// Timeline Events
export const createTimelineEvent = (input: any) => db.timelineEvent.create({ data: input });
export const findTimelineEvents = (input: any) => { const { limit, ...where } = input; return db.timelineEvent.findMany({ where, orderBy: { occurredAt: "desc" }, take: limit ?? 200 }); };

// Knowledge Base
export const createKnowledgeEntry = (input: any) => db.knowledgeBaseEntry.create({ data: input });
export const findKnowledgeEntry = (id: string) => db.knowledgeBaseEntry.findUnique({ where: { id } });
export const findKnowledgeEntries = (input: any) => { const { limit, ...where } = input; return db.knowledgeBaseEntry.findMany({ where, orderBy: [{ effectiveness: "desc" }, { createdAt: "desc" }], take: limit ?? 100 }); };
export const searchKnowledgeEntries = (query: string, limit: number) => db.knowledgeBaseEntry.findMany({ where: { searchText: { contains: query } }, orderBy: { effectiveness: "desc" }, take: limit });

// Simulations
export const createSimulation = (input: any) => db.institutionSimulation.create({ data: input });
export const findSimulation = (id: string) => db.institutionSimulation.findUnique({ where: { id } });
export const findSimulations = (input: any) => { const { limit, ...where } = input; return db.institutionSimulation.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };

// Wisdom Insights
export const createWisdom = (input: any) => db.wisdomInsight.create({ data: input });
export const findWisdom = (id: string) => db.wisdomInsight.findUnique({ where: { id } });
export const findWisdoms = (input: any) => { const { limit, ...where } = input; return db.wisdomInsight.findMany({ where, orderBy: [{ confidence: "desc" }, { createdAt: "desc" }], take: limit ?? 50 }); };

// Counts
export const countMemories = (orgId: string) => db.institutionalMemory.count({ where: { organizationId: orgId } });
export const countGoals = (orgId: string, status?: string) => db.institutionalGoal.count({ where: { organizationId: orgId, ...(status ? { status } : {}) } });
export const countDecisions = (orgId: string, status?: string) => db.decisionAnalysis.count({ where: { organizationId: orgId, ...(status ? { status } : {}) } });
export const countPolicies = (orgId: string, status?: string) => db.educationalPolicy.count({ where: { organizationId: orgId, ...(status ? { status } : {}) } });
export const countRecommendations = (orgId: string, status?: string) => db.advisorRecommendation.count({ where: { organizationId: orgId, ...(status ? { status } : {}) } });
export const countTimelineEvents = (orgId?: string) => db.timelineEvent.count({ where: orgId ? { organizationId: orgId } : undefined });
export const countKnowledgeEntries = (orgId?: string) => db.knowledgeBaseEntry.count({ where: { ...(orgId ? { organizationId: orgId } : {}), status: "published" } });
export const countSimulations = (orgId: string) => db.institutionSimulation.count({ where: { organizationId: orgId } });
export const countWisdoms = (orgId?: string) => db.wisdomInsight.count({ where: { ...(orgId ? { organizationId: orgId } : {}), status: "active" } });
export const countPlans = (orgId: string) => db.strategicPlan.count({ where: { organizationId: orgId } });
