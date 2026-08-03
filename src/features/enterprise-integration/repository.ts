/** EduBek — Enterprise Integration repository. */
import { db } from "@/lib/db";

// Integration
export const createIntegration = (input: any) => db.integration.create({ data: input });
export const findIntegration = (id: string) => db.integration.findUnique({ where: { id } });
export const findIntegrations = (input: any) => { const { limit, ...where } = input; return db.integration.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateIntegration = (id: string, data: any) => db.integration.update({ where: { id }, data });

// Sync Log
export const createSyncLog = (input: any) => db.integrationSyncLog.create({ data: input });
export const findSyncLogs = (input: any) => { const { limit, ...where } = input; return db.integrationSyncLog.findMany({ where, orderBy: { startedAt: "desc" }, take: limit ?? 50 }); };
export const findSyncLog = (id: string) => db.integrationSyncLog.findUnique({ where: { id } });

// Webhook Endpoints
export const createWebhookEndpoint = (input: any) => db.webhookEndpoint.create({ data: input });
export const findWebhookEndpoint = (id: string) => db.webhookEndpoint.findUnique({ where: { id } });
export const findWebhookEndpoints = (input: any) => { const { limit, ...where } = input; return db.webhookEndpoint.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateWebhookEndpoint = (id: string, data: any) => db.webhookEndpoint.update({ where: { id }, data });
export const deleteWebhookEndpoint = (id: string) => db.webhookEndpoint.delete({ where: { id } });

// Webhook Deliveries
export const createWebhookDelivery = (input: any) => db.webhookDelivery.create({ data: input });
export const findWebhookDeliveries = (input: any) => { const { limit, ...where } = input; return db.webhookDelivery.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const findWebhookDelivery = (id: string) => db.webhookDelivery.findUnique({ where: { id } });
export const updateWebhookDelivery = (id: string, data: any) => db.webhookDelivery.update({ where: { id }, data });
export const findPendingDeliveries = (limit = 100) => db.webhookDelivery.findMany({ where: { OR: [{ status: "pending" }, { status: "retrying", nextRetryAt: { lte: new Date() } }] }, take: limit, orderBy: { createdAt: "asc" } });

// API Keys
export const createApiKey = (input: any) => db.apiKey.create({ data: input });
export const findApiKeyByHash = (hash: string) => db.apiKey.findUnique({ where: { keyHash: hash } });
export const findApiKey = (id: string) => db.apiKey.findUnique({ where: { id } });
export const findApiKeys = (input: any) => { const { limit, ...where } = input; return db.apiKey.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateApiKey = (id: string, data: any) => db.apiKey.update({ where: { id }, data });

// OAuth Clients
export const createOAuthClient = (input: any) => db.oAuthClient.create({ data: input });
export const findOAuthClient = (id: string) => db.oAuthClient.findUnique({ where: { id } });
export const findOAuthClientByClientId = (clientId: string) => db.oAuthClient.findUnique({ where: { clientId } });
export const findOAuthClients = (input: any) => { const { limit, ...where } = input; return db.oAuthClient.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateOAuthClient = (id: string, data: any) => db.oAuthClient.update({ where: { id }, data });

// External AI Providers
export const createAiProvider = (input: any) => db.externalAiProvider.create({ data: input });
export const findAiProvider = (id: string) => db.externalAiProvider.findUnique({ where: { id } });
export const findAiProviders = (input: any) => { const { limit, ...where } = input; return db.externalAiProvider.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateAiProvider = (id: string, data: any) => db.externalAiProvider.update({ where: { id }, data });

// Import/Export Jobs
export const createImportExportJob = (input: any) => db.importExportJob.create({ data: input });
export const findImportExportJob = (id: string) => db.importExportJob.findUnique({ where: { id } });
export const findImportExportJobs = (input: any) => { const { limit, ...where } = input; return db.importExportJob.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateImportExportJob = (id: string, data: any) => db.importExportJob.update({ where: { id }, data });

// Marketplace Apps
export const createMarketplaceApp = (input: any) => db.marketplaceApp.create({ data: input });
export const findMarketplaceApp = (id: string) => db.marketplaceApp.findUnique({ where: { id } });
export const findMarketplaceApps = (input: any) => { const { limit, ...where } = input; return db.marketplaceApp.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 50 }); };
export const updateMarketplaceApp = (id: string, data: any) => db.marketplaceApp.update({ where: { id }, data });

// Enterprise Tenants
export const createTenant = (input: any) => db.enterpriseTenant.create({ data: input });
export const findTenant = (id: string) => db.enterpriseTenant.findUnique({ where: { id } });
export const findTenants = (input: any) => { const { limit, ...where } = input; return db.enterpriseTenant.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const updateTenant = (id: string, data: any) => db.enterpriseTenant.update({ where: { id }, data });

// Event Subscriptions
export const createEventSubscription = (input: any) => db.eventSubscription.create({ data: input });
export const findEventSubscription = (id: string) => db.eventSubscription.findUnique({ where: { id } });
export const findEventSubscriptions = (input: any) => { const { limit, ...where } = input; return db.eventSubscription.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 100 }); };
export const findEventSubscriptionsForEvent = (eventType: string) => db.eventSubscription.findMany({ where: { status: "active" } });
export const updateEventSubscription = (id: string, data: any) => db.eventSubscription.update({ where: { id }, data });
