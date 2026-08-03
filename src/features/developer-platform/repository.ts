/** In-memory repository for Developer Platform. Phase 6G.21. */
import type {
  ExtensionRegistryEntry, PluginManifest, SdkEntry, ApiCapability,
  SandboxPolicy, ExtensionPermission,
  LifecycleEvent, LifecycleState_ as LifecycleStateRecord,
  EventSubscription, ExtensionConfig, WebhookDefinition,
  DeveloperApiKey, DeveloperOrganization, MarketplaceReference,
  ExtensionHealth, CertificationRecord,
} from "./types";

const registry = new Map<string, ExtensionRegistryEntry>();
const manifests = new Map<string, PluginManifest>();
const sdks = new Map<string, SdkEntry>();
const capabilities = new Map<string, ApiCapability>();
const sandboxes = new Map<string, SandboxPolicy>();
const permissions = new Map<string, ExtensionPermission>();
const lifecycleEvents = new Map<string, LifecycleEvent[]>();
const lifecycleStates = new Map<string, LifecycleStateRecord>();
const subscriptions = new Map<string, EventSubscription>();
const configs = new Map<string, ExtensionConfig>();
const webhooks = new Map<string, WebhookDefinition>();
const apiKeys = new Map<string, DeveloperApiKey>();
const organizations = new Map<string, DeveloperOrganization>();
const marketplaceRefs = new Map<string, MarketplaceReference>();
const healthRecords = new Map<string, ExtensionHealth>();
const certifications = new Map<string, CertificationRecord>();

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storeExtension = (e: ExtensionRegistryEntry) => registry.set(e.id, e);
export const getExtension = (id: string) => registry.get(id) ?? null;
export const getExtensionByKey = (key: string) => Array.from(registry.values()).find(e => e.key === key) ?? null;
export const getAllExtensions = () => Array.from(registry.values());

export const storeManifest = (m: PluginManifest) => manifests.set(m.id, m);
export const getManifest = (id: string) => manifests.get(id) ?? null;
export const getManifestByExtension = (extId: string) => Array.from(manifests.values()).find(m => m.extensionId === extId) ?? null;
export const getAllManifests = () => Array.from(manifests.values());

export const storeSdk = (s: SdkEntry) => sdks.set(s.id, s);
export const getSdk = (id: string) => sdks.get(id) ?? null;
export const getSdkByKey = (key: string) => Array.from(sdks.values()).find(s => s.key === key) ?? null;
export const getAllSdks = () => Array.from(sdks.values());

export const storeCapability = (c: ApiCapability) => capabilities.set(c.id, c);
export const getCapability = (id: string) => capabilities.get(id) ?? null;
export const getCapabilityByKey = (key: string) => Array.from(capabilities.values()).find(c => c.key === key) ?? null;
export const getAllCapabilities = () => Array.from(capabilities.values());

export const storeSandbox = (s: SandboxPolicy) => sandboxes.set(s.id, s);
export const getSandbox = (id: string) => sandboxes.get(id) ?? null;
export const getSandboxByExtension = (extId: string) => Array.from(sandboxes.values()).find(s => s.extensionId === extId) ?? null;
export const getAllSandboxes = () => Array.from(sandboxes.values());

export const storePermission = (p: ExtensionPermission) => permissions.set(p.id, p);
export const getPermission = (id: string) => permissions.get(id) ?? null;
export const getAllPermissions = () => Array.from(permissions.values());
export const getPermissionsByExtension = (extId: string) => Array.from(permissions.values()).filter(p => p.extensionId === extId);

export const storeLifecycleEvent = (e: LifecycleEvent) => {
  const list = lifecycleEvents.get(e.extensionId) ?? [];
  list.push(e);
  lifecycleEvents.set(e.extensionId, list);
};
export const getLifecycleEvents = (extId: string) => lifecycleEvents.get(extId) ?? [];
export const storeLifecycleState = (s: LifecycleStateRecord) => lifecycleStates.set(s.extensionId, s);
export const getLifecycleState = (extId: string) => lifecycleStates.get(extId) ?? null;
export const getAllLifecycleStates = () => Array.from(lifecycleStates.values());

export const storeSubscription = (s: EventSubscription) => subscriptions.set(s.id, s);
export const getSubscription = (id: string) => subscriptions.get(id) ?? null;
export const getAllSubscriptions = () => Array.from(subscriptions.values());
export const getSubscriptionsByExtension = (extId: string) => Array.from(subscriptions.values()).filter(s => s.extensionId === extId);

export const storeConfig = (c: ExtensionConfig) => configs.set(c.id, c);
export const getConfig = (id: string) => configs.get(id) ?? null;
export const getConfigByExtension = (extId: string) => Array.from(configs.values()).find(c => c.extensionId === extId) ?? null;
export const getAllConfigs = () => Array.from(configs.values());

export const storeWebhook = (w: WebhookDefinition) => webhooks.set(w.id, w);
export const getWebhook = (id: string) => webhooks.get(id) ?? null;
export const getAllWebhooks = () => Array.from(webhooks.values());
export const getWebhooksByExtension = (extId: string) => Array.from(webhooks.values()).filter(w => w.extensionId === extId);

export const storeApiKey = (k: DeveloperApiKey) => apiKeys.set(k.id, k);
export const getApiKey = (id: string) => apiKeys.get(id) ?? null;
export const getAllApiKeys = () => Array.from(apiKeys.values());
export const getApiKeysByDeveloper = (devId: string) => Array.from(apiKeys.values()).filter(k => k.developerId === devId);

export const storeOrganization = (o: DeveloperOrganization) => organizations.set(o.id, o);
export const getOrganization = (id: string) => organizations.get(id) ?? null;
export const getAllOrganizations = () => Array.from(organizations.values());

export const storeMarketplaceRef = (m: MarketplaceReference) => marketplaceRefs.set(m.id, m);
export const getMarketplaceRef = (id: string) => marketplaceRefs.get(id) ?? null;
export const getAllMarketplaceRefs = () => Array.from(marketplaceRefs.values());

export const storeHealth = (h: ExtensionHealth) => healthRecords.set(h.id, h);
export const getHealth = (id: string) => healthRecords.get(id) ?? null;
export const getHealthByExtension = (extId: string) => Array.from(healthRecords.values()).find(h => h.extensionId === extId) ?? null;
export const getAllHealth = () => Array.from(healthRecords.values());

export const storeCertification = (c: CertificationRecord) => certifications.set(c.id, c);
export const getCertification = (id: string) => certifications.get(id) ?? null;
export const getCertificationByExtension = (extId: string) => Array.from(certifications.values()).find(c => c.extensionId === extId) ?? null;
export const getAllCertifications = () => Array.from(certifications.values());

export const fetchExtensions = async (_limit = 200) => getAllExtensions();
export const fetchExtensionInstalls = async (_limit = 500) => [];
export const fetchExtensionReviews = async (_limit = 500) => [];
export const fetchExtensionExecutions = async (_limit = 500) => [];
export const fetchCompatibilityMatrix = async (_limit = 500) => [];
export const fetchExtension = async (id: string) => getExtension(id);
export const fetchExtensionVersions = async (_extensionId: string) => [];

export function _resetRepositoryForTesting() {
  registry.clear(); manifests.clear(); sdks.clear(); capabilities.clear();
  sandboxes.clear(); permissions.clear();
  lifecycleEvents.clear(); lifecycleStates.clear();
  subscriptions.clear(); configs.clear(); webhooks.clear();
  apiKeys.clear(); organizations.clear(); marketplaceRefs.clear();
  healthRecords.clear(); certifications.clear();
}
