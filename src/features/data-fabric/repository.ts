/** EduBek — Data Fabric repository. */
import { db } from "@/lib/db";

// Data Fabric Entities
export const upsertEntity = (input: any) => db.dataFabricEntity.upsert({ where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } }, create: input, update: input });
export const findEntity = (entityType: string, entityId: string) => db.dataFabricEntity.findUnique({ where: { entityType_entityId: { entityType, entityId } } });
export const findEntities = (input: any) => { const { limit, ...where } = input; return db.dataFabricEntity.findMany({ where, orderBy: { updatedAt: "desc" }, take: limit ?? 100 }); };
export const countEntities = (input?: any) => db.dataFabricEntity.count({ where: input });

// Event Store
export const createEvent = (input: any) => db.eventStore.create({ data: input });
export const findEvents = (input: any) => { const { limit, ...where } = input; return db.eventStore.findMany({ where, orderBy: { sequence: "asc" }, take: limit ?? 500 }); };
export const countEvents = (input?: any) => db.eventStore.count({ where: input });
export const findLastSequence = async (entityType: string, entityId: string) => { const last = await db.eventStore.findFirst({ where: { entityType, entityId }, orderBy: { sequence: "desc" }, select: { sequence: true } }); return last?.sequence ?? 0; };

// Read Models
export const upsertReadModel = (input: any) => db.readModel.upsert({ where: { modelType_entityType_entityId: { modelType: input.modelType, entityType: input.entityType, entityId: input.entityId } }, create: input, update: input });
export const findReadModel = (modelType: string, entityType: string, entityId: string) => db.readModel.findUnique({ where: { modelType_entityType_entityId: { modelType, entityType, entityId } } });
export const findReadModels = (input: any) => { const { limit, ...where } = input; return db.readModel.findMany({ where, orderBy: { projectedAt: "desc" }, take: limit ?? 100 }); };
export const countReadModels = () => db.readModel.count();

// Sync Checkpoints
export const upsertCheckpoint = (input: any) => db.syncCheckpoint.upsert({ where: { nodeId_entityType: { nodeId: input.nodeId, entityType: input.entityType } }, create: input, update: input });
export const findCheckpoint = (nodeId: string, entityType: string) => db.syncCheckpoint.findUnique({ where: { nodeId_entityType: { nodeId, entityType } } });
export const findCheckpoints = (input: any) => { const { limit, ...where } = input; return db.syncCheckpoint.findMany({ where, orderBy: { lastSyncAt: "desc" }, take: limit ?? 50 }); };

// Global Search Index
export const upsertSearchIndex = (input: any) => db.globalSearchIndex.upsert({ where: { entityType_entityId: { entityType: input.entityType, entityId: input.entityId } }, create: input, update: input });
export const findSearchIndex = (entityType: string, entityId: string) => db.globalSearchIndex.findUnique({ where: { entityType_entityId: { entityType, entityId } } });
export const searchIndex = (input: any) => { const { limit, ...where } = input; return db.globalSearchIndex.findMany({ where, orderBy: { popularity: "desc" }, take: limit ?? 50 }); };
export const countSearchIndex = () => db.globalSearchIndex.count();

// Federated Learning
export const createFedJob = (input: any) => db.federatedLearningJob.create({ data: input });
export const findFedJob = (id: string) => db.federatedLearningJob.findUnique({ where: { id } });
export const findFedJobs = (input: any) => { const { limit, ...where } = input; return db.federatedLearningJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateFedJob = (id: string, data: any) => db.federatedLearningJob.update({ where: { id }, data });

// Benchmark Reports
export const createBenchmark = (input: any) => db.benchmarkReport.create({ data: input });
export const findBenchmarks = (input: any) => { const { limit, ...where } = input; return db.benchmarkReport.findMany({ where, orderBy: { periodStart: "desc" }, take: limit ?? 50 }); };
export const findBenchmark = (id: string) => db.benchmarkReport.findUnique({ where: { id } });

// Observability Traces
export const createTrace = (input: any) => db.observabilityTrace.create({ data: input });
export const findTraces = (input: any) => { const { limit, ...where } = input; return db.observabilityTrace.findMany({ where, orderBy: { occurredAt: "desc" }, take: limit ?? 100 }); };
export const findTrace = (id: string) => db.observabilityTrace.findUnique({ where: { id } });

// Governance Policies
export const createPolicy = (input: any) => db.governancePolicy.create({ data: input });
export const findPolicies = (input: any) => { const { limit, ...where } = input; return db.governancePolicy.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updatePolicy = (id: string, data: any) => db.governancePolicy.update({ where: { id }, data });

// Intelligence Lake
export const createLakeSnapshot = (input: any) => db.intelligenceLakeSnapshot.create({ data: input });
export const findLakeSnapshots = (input: any) => { const { limit, ...where } = input; return db.intelligenceLakeSnapshot.findMany({ where, orderBy: { day: "desc" }, take: limit ?? 100 }); };

// Stream Subscriptions
export const createStreamSub = (input: any) => db.streamSubscription.create({ data: input });
export const findStreamSubs = (input: any) => { const { limit, ...where } = input; return db.streamSubscription.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateStreamSub = (id: string, data: any) => db.streamSubscription.update({ where: { id }, data });
export const findActiveStreamSubs = (streamType?: string) => db.streamSubscription.findMany({ where: { status: "active", ...(streamType ? { streamType } : {}) } });
