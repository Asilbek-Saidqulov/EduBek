/** EduBek — Platform SDK repository. */
import { db } from "@/lib/db";

// Extensions
export const createExtension = (input: any) => db.extension.create({ data: input });
export const findExtension = (id: string) => db.extension.findUnique({ where: { id }, include: { versions: { orderBy: { createdAt: "desc" } } } });
export const findExtensionBySlug = (slug: string) => db.extension.findUnique({ where: { slug } });
export const findExtensions = (input: any) => { const { limit, ...where } = input; return db.extension.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateExtension = (id: string, data: any) => db.extension.update({ where: { id }, data });

// Extension Versions
export const createVersion = (input: any) => db.extensionVersion.create({ data: input });
export const findVersion = (id: string) => db.extensionVersion.findUnique({ where: { id } });
export const findVersions = (extensionId: string) => db.extensionVersion.findMany({ where: { extensionId }, orderBy: { createdAt: "desc" } });
export const updateVersion = (id: string, data: any) => db.extensionVersion.update({ where: { id }, data });

// Installs
export const createInstall = (input: any) => db.extensionInstall.create({ data: input });
export const findInstall = (id: string) => db.extensionInstall.findUnique({ where: { id } });
export const findInstalls = (input: any) => { const { limit, ...where } = input; return db.extensionInstall.findMany({ where, orderBy: { installedAt: "desc" }, take: limit ?? 100 }); };
export const updateInstall = (id: string, data: any) => db.extensionInstall.update({ where: { id }, data });

// Hooks
export const createHook = (input: any) => db.extensionHook.create({ data: input });
export const findHooks = (input: any) => { const { limit, ...where } = input; return db.extensionHook.findMany({ where, take: limit ?? 500 }); };
export const findHooksForEvent = (event: string) => db.extensionHook.findMany({ where: { event, enabled: true }, orderBy: { priority: "asc" } });
export const updateHook = (id: string, data: any) => db.extensionHook.update({ where: { id }, data });

// Executions
export const createExecution = (input: any) => db.extensionExecution.create({ data: input });
export const findExecution = (id: string) => db.extensionExecution.findUnique({ where: { id } });
export const findExecutions = (input: any) => { const { limit, ...where } = input; return db.extensionExecution.findMany({ where, orderBy: { startedAt: "desc" }, take: limit ?? 100 }); };
export const updateExecution = (id: string, data: any) => db.extensionExecution.update({ where: { id }, data });

// Sandbox
export const createSandbox = (input: any) => db.sandboxSession.create({ data: input });
export const findSandbox = (id: string) => db.sandboxSession.findUnique({ where: { id } });
export const findSandboxes = (input: any) => { const { limit, ...where } = input; return db.sandboxSession.findMany({ where, orderBy: { startedAt: "desc" }, take: limit ?? 50 }); };
export const updateSandbox = (id: string, data: any) => db.sandboxSession.update({ where: { id }, data });

// Reviews
export const createReview = (input: any) => db.extensionReview.create({ data: input });
export const findReviews = (input: any) => { const { limit, ...where } = input; return db.extensionReview.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateExtensionRating = async (extensionId: string) => {
  const reviews = await db.extensionReview.findMany({ where: { extensionId }, select: { rating: true } });
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  await db.extension.update({ where: { id: extensionId }, data: { ratingAverage: avg, ratingCount: reviews.length } });
};

// Subscriptions
export const createSubscription = (input: any) => db.extensionSubscription.create({ data: input });
export const findSubscriptions = (input: any) => { const { limit, ...where } = input; return db.extensionSubscription.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateSubscription = (id: string, data: any) => db.extensionSubscription.update({ where: { id }, data });

// API Versions
export const createApiVersion = (input: any) => db.apiVersion.create({ data: input });
export const findApiVersions = (input: any) => { const { limit, ...where } = input; return db.apiVersion.findMany({ where, orderBy: { releaseDate: "desc" }, take: limit ?? 20 }); };

// Compatibility
export const createCompatibility = (input: any) => db.compatibilityMatrix.create({ data: input });
export const findCompatibility = (input: any) => { const { limit, ...where } = input; return db.compatibilityMatrix.findMany({ where, take: limit ?? 500 }); };
export const upsertCompatibility = async (input: any) => {
  const existing = await db.compatibilityMatrix.findUnique({ where: { extensionId_extensionVersion_platformVersion: { extensionId: input.extensionId, extensionVersion: input.extensionVersion, platformVersion: input.platformVersion } } });
  if (existing) return db.compatibilityMatrix.update({ where: { id: existing.id }, data: input });
  return db.compatibilityMatrix.create({ data: input });
};

// Counts
export const countExtensions = (status?: string) => db.extension.count({ where: status ? { status } : undefined });
export const countInstalls = () => db.extensionInstall.count();
