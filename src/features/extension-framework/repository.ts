/** In-memory repository for Extension Framework Platform. Phase 6G.27. */
import type {
  ExtensionRegistryEntry, PluginRegistryEntry, ExtensionManifest,
  SdkEntry, CapabilityEntry, HookEntry,
  ExtensionPermission, PermissionGrant,
  SandboxPolicy, CompatibilityEntry, DependencyNode,
  LifecycleRecord, MarketplaceListing, ExtensionConfig,
  EventSubscription, EventContract, ApiContract,
  DeveloperPortalMetadata, ValidationReport, AuditRecord,
} from "./types";

const extensions = new Map<string, ExtensionRegistryEntry>();
const plugins = new Map<string, PluginRegistryEntry>();
const manifests = new Map<string, ExtensionManifest>();
const sdks = new Map<string, SdkEntry>();
const capabilities = new Map<string, CapabilityEntry>();
const hooks = new Map<string, HookEntry>();
const permissionDefs = new Map<string, ExtensionPermission>();
const permissionGrants = new Map<string, PermissionGrant>();
const sandboxPolicies = new Map<string, SandboxPolicy>();
const compatibilityEntries = new Map<string, CompatibilityEntry>();
const dependencyNodes = new Map<string, DependencyNode>();
const lifecycleRecords: LifecycleRecord[] = [];
const marketplaceListings = new Map<string, MarketplaceListing>();
const configs = new Map<string, ExtensionConfig>();
const eventSubscriptions = new Map<string, EventSubscription>();
const eventContracts = new Map<string, EventContract>();
const apiContracts = new Map<string, ApiContract>();
const portalMetadata = new Map<string, DeveloperPortalMetadata>();
const validationReports = new Map<string, ValidationReport>();
const auditRecords: AuditRecord[] = [];

export const storeExtension = (e: ExtensionRegistryEntry) => extensions.set(e.id, e);
export const getExtension = (id: string) => extensions.get(id) ?? null;
export const getExtensionByKey = (k: string) => Array.from(extensions.values()).find(e => e.key === k) ?? null;
export const getExtensionBySlug = (s: string) => Array.from(extensions.values()).find(e => e.slug === s) ?? null;
export const getAllExtensions = () => Array.from(extensions.values());
export const storePlugin = (p: PluginRegistryEntry) => plugins.set(p.id, p);
export const getPlugin = (id: string) => plugins.get(id) ?? null;
export const getPluginByKey = (k: string) => Array.from(plugins.values()).find(p => p.key === k) ?? null;
export const getPluginBySlug = (s: string) => Array.from(plugins.values()).find(p => p.slug === s) ?? null;
export const getAllPlugins = () => Array.from(plugins.values());
export const storeManifest = (m: ExtensionManifest) => manifests.set(m.id, m);
export const getManifest = (id: string) => manifests.get(id) ?? null;
export const getManifestByExtension = (extensionId: string) => Array.from(manifests.values()).find(m => m.extensionId === extensionId) ?? null;
export const getAllManifests = () => Array.from(manifests.values());
export const storeSdk = (s: SdkEntry) => sdks.set(s.id, s);
export const getSdk = (id: string) => sdks.get(id) ?? null;
export const getSdkByKey = (k: string) => Array.from(sdks.values()).find(s => s.key === k) ?? null;
export const getAllSdks = () => Array.from(sdks.values());
export const storeCapability = (c: CapabilityEntry) => capabilities.set(c.id, c);
export const getCapability = (id: string) => capabilities.get(id) ?? null;
export const getCapabilityByKey = (k: string) => Array.from(capabilities.values()).find(c => c.key === k) ?? null;
export const getAllCapabilities = () => Array.from(capabilities.values());
export const storeHook = (h: HookEntry) => hooks.set(h.id, h);
export const getHook = (id: string) => hooks.get(id) ?? null;
export const getHookByKey = (k: string) => Array.from(hooks.values()).find(h => h.key === k) ?? null;
export const getAllHooks = () => Array.from(hooks.values());
export const storePermissionDef = (p: ExtensionPermission) => permissionDefs.set(p.id, p);
export const getPermissionDef = (id: string) => permissionDefs.get(id) ?? null;
export const getPermissionDefByKey = (k: string) => Array.from(permissionDefs.values()).find(p => p.key === k) ?? null;
export const getAllPermissionDefs = () => Array.from(permissionDefs.values());
export const storePermissionGrant = (g: PermissionGrant) => permissionGrants.set(g.id, g);
export const getPermissionGrant = (id: string) => permissionGrants.get(id) ?? null;
export const getAllPermissionGrants = () => Array.from(permissionGrants.values());
export const storeSandboxPolicy = (s: SandboxPolicy) => sandboxPolicies.set(s.id, s);
export const getSandboxPolicy = (id: string) => sandboxPolicies.get(id) ?? null;
export const getSandboxPolicyByExtension = (extensionId: string) => Array.from(sandboxPolicies.values()).find(s => s.extensionId === extensionId) ?? null;
export const getAllSandboxPolicies = () => Array.from(sandboxPolicies.values());
export const storeCompatibility = (c: CompatibilityEntry) => compatibilityEntries.set(c.id, c);
export const getCompatibility = (id: string) => compatibilityEntries.get(id) ?? null;
export const getAllCompatibility = () => Array.from(compatibilityEntries.values());
export const storeDependencyNode = (n: DependencyNode) => dependencyNodes.set(n.id, n);
export const getDependencyNode = (id: string) => dependencyNodes.get(id) ?? null;
export const getDependencyNodeByExtension = (extensionKey: string) => Array.from(dependencyNodes.values()).find(n => n.extensionKey === extensionKey) ?? null;
export const getAllDependencyNodes = () => Array.from(dependencyNodes.values());
export const appendLifecycleRecord = (r: LifecycleRecord) => lifecycleRecords.push(r);
export const getLifecycleRecord = (id: string) => lifecycleRecords.find(r => r.id === id) ?? null;
export const getAllLifecycleRecords = () => lifecycleRecords.slice();
export const storeMarketplaceListing = (m: MarketplaceListing) => marketplaceListings.set(m.id, m);
export const getMarketplaceListing = (id: string) => marketplaceListings.get(id) ?? null;
export const getMarketplaceListingByExtension = (extensionId: string) => Array.from(marketplaceListings.values()).find(m => m.extensionId === extensionId) ?? null;
export const getAllMarketplaceListings = () => Array.from(marketplaceListings.values());
export const storeConfig = (c: ExtensionConfig) => configs.set(c.id, c);
export const getConfig = (id: string) => configs.get(id) ?? null;
export const getConfigByExtension = (extensionId: string, scope?: string) => Array.from(configs.values()).find(c => c.extensionId === extensionId && (scope === undefined || c.scope === scope)) ?? null;
export const getAllConfigs = () => Array.from(configs.values());
export const storeEventSubscription = (s: EventSubscription) => eventSubscriptions.set(s.id, s);
export const getEventSubscription = (id: string) => eventSubscriptions.get(id) ?? null;
export const getAllEventSubscriptions = () => Array.from(eventSubscriptions.values());
export const storeEventContract = (c: EventContract) => eventContracts.set(c.id, c);
export const getEventContract = (id: string) => eventContracts.get(id) ?? null;
export const getAllEventContracts = () => Array.from(eventContracts.values());
export const storeApiContract = (a: ApiContract) => apiContracts.set(a.id, a);
export const getApiContract = (id: string) => apiContracts.get(id) ?? null;
export const getAllApiContracts = () => Array.from(apiContracts.values());
export const storePortalMetadata = (p: DeveloperPortalMetadata) => portalMetadata.set(p.id, p);
export const getPortalMetadata = (id: string) => portalMetadata.get(id) ?? null;
export const getPortalMetadataByExtension = (extensionId: string) => Array.from(portalMetadata.values()).find(p => p.extensionId === extensionId) ?? null;
export const getAllPortalMetadata = () => Array.from(portalMetadata.values());
export const storeValidationReport = (r: ValidationReport) => validationReports.set(r.id, r);
export const getValidationReport = (id: string) => validationReports.get(id) ?? null;
export const getAllValidationReports = () => Array.from(validationReports.values());
export const appendAuditRecord = (r: AuditRecord) => auditRecords.push(r);
export const getAuditRecord = (id: string) => auditRecords.find(r => r.id === id) ?? null;
export const getAllAuditRecords = () => auditRecords.slice();

export function _resetRepositoryForTesting() {
  extensions.clear(); plugins.clear(); manifests.clear(); sdks.clear();
  capabilities.clear(); hooks.clear();
  permissionDefs.clear(); permissionGrants.clear();
  sandboxPolicies.clear(); compatibilityEntries.clear(); dependencyNodes.clear();
  lifecycleRecords.length = 0; marketplaceListings.clear();
  configs.clear(); eventSubscriptions.clear(); eventContracts.clear();
  apiContracts.clear(); portalMetadata.clear();
  validationReports.clear(); auditRecords.length = 0;
}
