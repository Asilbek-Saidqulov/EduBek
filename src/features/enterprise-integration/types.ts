/**
 * EduBek — Enterprise Integration types.
 * Phase 5B.1: Universal Integration Framework, Identity Federation,
 * Data Sync, Webhook Platform, API Gateway, External AI Plugins,
 * Import/Export, Marketplace, Multi-Tenant, Event Streaming.
 */

// Connector types
export type ConnectorType =
  | "google_classroom" | "moodle" | "canvas" | "blackboard"
  | "microsoft_teams" | "zoom" | "google_meet"
  | "google_drive" | "one_drive" | "dropbox"
  | "github" | "gitlab" | "ldap" | "active_directory"
  | "saml" | "oauth2" | "scim" | "custom";

export type IntegrationStatus = "pending" | "connected" | "disconnected" | "error" | "paused";
export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ConnectorDefinition {
  type: ConnectorType;
  name: string;
  description: string;
  authMethods: string[];
  supportedEntities: string[];
  supportsWebhooks: boolean;
  supportsBiDirectionalSync: boolean;
  iconUrl?: string;
}

export interface IntegrationDto {
  id: string;
  type: ConnectorType;
  name: string;
  description: string | null;
  organizationId: string | null;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  healthStatus: HealthStatus;
  syncSchedule: string;
  webhooksRegistered: boolean;
  syncEntities: string[];
  fieldMapping: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResultDto {
  id: string;
  integrationId: string;
  syncType: "full" | "incremental";
  status: "success" | "partial" | "failed";
  entities: Array<{ entity: string; imported: number; updated: number; skipped: number; errors: number }>;
  conflicts: Array<{ entity: string; localValue: unknown; remoteValue: unknown; resolution: string }>;
  totalProcessed: number;
  totalImported: number;
  totalUpdated: number;
  totalSkipped: number;
  totalErrors: number;
  durationMs: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

// Webhooks
export interface WebhookEndpointDto {
  id: string;
  ownerId: string;
  organizationId: string | null;
  url: string;
  events: string[];
  status: "active" | "paused" | "disabled";
  maxRetries: number;
  retryBackoffMs: number;
  totalDelivered: number;
  totalFailed: number;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryDto {
  id: string;
  endpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "retrying";
  responseCode: number | null;
  responseBody: string | null;
  attemptCount: number;
  nextRetryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

// API Keys
export interface ApiKeyDto {
  id: string;
  ownerId: string;
  organizationId: string | null;
  keyPrefix: string;
  name: string;
  scopes: string[];
  rateLimitPerMin: number;
  status: "active" | "revoked";
  totalRequests: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  // Only returned once on creation
  plainKey?: string;
}

// OAuth Clients
export interface OAuthClientDto {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  ownerId: string;
  organizationId: string | null;
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
  status: "active" | "disabled";
  createdAt: string;
  // Only returned once on creation
  plainSecret?: string;
}

// External AI Providers
export interface ExternalAiProviderDto {
  id: string;
  provider: string;
  name: string;
  description: string | null;
  apiEndpoint: string | null;
  capabilities: string[];
  models: Array<{ id: string; name: string; contextWindow?: number; inputCostPer1k?: number; outputCostPer1k?: number }>;
  defaultModel: string | null;
  enabled: boolean;
  organizationId: string | null;
  healthStatus: HealthStatus;
  createdAt: string;
  updatedAt: string;
}

// Import/Export
export type ImportExportFormat = "csv" | "excel" | "qti" | "ims_cc" | "moodle_backup" | "canvas_export" | "pdf" | "docx" | "json" | "xml";

export interface ImportExportJobDto {
  id: string;
  direction: "import" | "export";
  format: ImportExportFormat;
  entityType: string;
  organizationId: string | null;
  initiatedBy: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  totalRecords: number;
  processedRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  errors: Array<{ row: number; field: string; error: string }>;
  fieldMapping: Record<string, string>;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Marketplace
export interface MarketplaceAppDto {
  id: string;
  type: string;
  name: string;
  description: string | null;
  developerId: string;
  developerName: string;
  version: string;
  installCount: number;
  ratingAverage: number;
  ratingCount: number;
  pricingModel: "free" | "freemium" | "paid";
  priceEduTokens: number;
  configSchema: Record<string, unknown>;
  webhookUrl: string | null;
  status: "draft" | "submitted" | "approved" | "published" | "rejected" | "archived";
  screenshots: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

// Enterprise Tenants
export interface EnterpriseTenantDto {
  id: string;
  type: "district" | "ministry" | "university" | "franchise" | "regional_office" | "subsidiary" | "school";
  name: string;
  description: string | null;
  parentId: string | null;
  organizationId: string | null;
  adminIds: string[];
  delegatedAdmin: boolean;
  limits: Record<string, unknown>;
  branding: Record<string, unknown>;
  status: "active" | "suspended" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Event Subscriptions
export interface EventSubscriptionDto {
  id: string;
  ownerId: string;
  organizationId: string | null;
  eventTypes: string[];
  deliveryMethod: "webhook" | "api" | "email" | "push";
  deliveryTarget: string;
  filter: Record<string, unknown>;
  status: "active" | "paused" | "disabled";
  totalDelivered: number;
  totalFailed: number;
  createdAt: string;
  updatedAt: string;
}
