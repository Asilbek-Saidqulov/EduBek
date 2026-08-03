/** EduBek — Cloud Infrastructure repository. */
import { db } from "@/lib/db";

// Cloud Jobs
export const createJob = (input: any) => db.cloudJob.create({ data: input });
export const findJob = (id: string) => db.cloudJob.findUnique({ where: { id } });
export const findJobs = (input: any) => { const { limit, ...where } = input; return db.cloudJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateJob = (id: string, data: any) => db.cloudJob.update({ where: { id }, data });
export const findQueuedJobs = (queue: string, limit: number) => db.cloudJob.findMany({ where: { queue, status: "queued", OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }] }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }], take: limit });
export const countJobsByStatus = (status: string) => db.cloudJob.count({ where: { status } });
export const countJobsByQueue = (queue: string) => db.cloudJob.count({ where: { queue } });

// Inference Requests
export const createInference = (input: any) => db.inferenceRequest.create({ data: input });
export const findInference = (id: string) => db.inferenceRequest.findUnique({ where: { id } });
export const findInferences = (input: any) => { const { limit, ...where } = input; return db.inferenceRequest.findMany({ where, orderBy: { occurredAt: "desc" }, take: limit ?? 100 }); };
export const updateInference = (id: string, data: any) => db.inferenceRequest.update({ where: { id }, data });
export const countInferencesByProvider = (provider: string) => db.inferenceRequest.count({ where: { provider } });

// Scheduled Workflows
export const createScheduledWorkflow = (input: any) => db.scheduledWorkflow.create({ data: input });
export const findScheduledWorkflow = (id: string) => db.scheduledWorkflow.findUnique({ where: { id } });
export const findScheduledWorkflows = (input: any) => { const { limit, ...where } = input; return db.scheduledWorkflow.findMany({ where, orderBy: { nextRunAt: "asc" }, take: limit ?? 100 }); };
export const updateScheduledWorkflow = (id: string, data: any) => db.scheduledWorkflow.update({ where: { id }, data });
export const findDueWorkflows = () => db.scheduledWorkflow.findMany({ where: { status: "active", nextRunAt: { lte: new Date() } }, take: 100 });

// Resource Allocations
export const createAllocation = (input: any) => db.resourceAllocation.create({ data: input });
export const findAllocations = (input: any) => { const { limit, ...where } = input; return db.resourceAllocation.findMany({ where, orderBy: { allocatedAt: "desc" }, take: limit ?? 100 }); };
export const updateAllocation = (id: string, data: any) => db.resourceAllocation.update({ where: { id }, data });

// Cache
export const upsertCache = (input: any) => db.cacheEntry.upsert({ where: { namespace_key: { namespace: input.namespace, key: input.key } }, create: input, update: input });
export const findCache = (namespace: string, key: string) => db.cacheEntry.findUnique({ where: { namespace_key: { namespace, key } } });
export const findCacheByNamespace = (namespace: string, limit: number) => db.cacheEntry.findMany({ where: { namespace }, take: limit, orderBy: { lastAccessedAt: "desc" } });
export const deleteCache = (namespace: string, key: string) => db.cacheEntry.delete({ where: { namespace_key: { namespace, key } } });
export const deleteExpiredCache = () => db.cacheEntry.deleteMany({ where: { expiresAt: { lt: new Date() } } });
export const countCache = () => db.cacheEntry.count();
export const countCacheHits = async () => { const entries = await db.cacheEntry.aggregate({ _sum: { hitCount: true, missCount: true } }); return { hits: entries._sum.hitCount ?? 0, misses: entries._sum.missCount ?? 0 }; };

// Media Jobs
export const createMediaJob = (input: any) => db.mediaJob.create({ data: input });
export const findMediaJob = (id: string) => db.mediaJob.findUnique({ where: { id } });
export const findMediaJobs = (input: any) => { const { limit, ...where } = input; return db.mediaJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateMediaJob = (id: string, data: any) => db.mediaJob.update({ where: { id }, data });

// Document Jobs
export const createDocumentJob = (input: any) => db.documentJob.create({ data: input });
export const findDocumentJob = (id: string) => db.documentJob.findUnique({ where: { id } });
export const findDocumentJobs = (input: any) => { const { limit, ...where } = input; return db.documentJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateDocumentJob = (id: string, data: any) => db.documentJob.update({ where: { id }, data });

// Secrets
export const createSecret = (input: any) => db.secret.create({ data: input });
export const findSecret = (id: string) => db.secret.findUnique({ where: { id } });
export const findSecrets = (input: any) => { const { limit, ...where } = input; return db.secret.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateSecret = (id: string, data: any) => db.secret.update({ where: { id }, data });
export const findSecretsDueForRotation = () => db.secret.findMany({ where: { rotationEnabled: true, nextRotationAt: { lte: new Date() } } });

// Infra Metrics
export const createMetric = (input: any) => db.infraMetric.create({ data: input });
export const findMetrics = (input: any) => { const { limit, ...where } = input; return db.infraMetric.findMany({ where, orderBy: { timestamp: "desc" }, take: limit ?? 500 }); };
export const findLatestMetric = (source: string, metric: string) => db.infraMetric.findFirst({ where: { source, metric }, orderBy: { timestamp: "desc" } });

// Workers
export const createWorker = (input: any) => db.cloudWorker.create({ data: input });
export const findWorker = (id: string) => db.cloudWorker.findUnique({ where: { id } });
export const findWorkers = (input: any) => { const { limit, ...where } = input; return db.cloudWorker.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateWorker = (id: string, data: any) => db.cloudWorker.update({ where: { id }, data });
export const findIdleWorkers = (type: string) => db.cloudWorker.findMany({ where: { type, status: "idle" }, take: 50 });

// Cost Snapshots
export const createCostSnapshot = (input: any) => db.costSnapshot.create({ data: input });
export const findCostSnapshots = (input: any) => { const { limit, ...where } = input; return db.costSnapshot.findMany({ where, orderBy: { day: "desc" }, take: limit ?? 30 }); };
export const findLatestCost = (organizationId?: string) => db.costSnapshot.findFirst({ where: { organizationId }, orderBy: { day: "desc" } });
