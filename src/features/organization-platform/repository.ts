/** In-memory repository for Organization Platform. Phase 6G.28. */
import type {
  OrganizationRegistryEntry, TenantEntry, InstitutionTypeEntry,
  HierarchyNode, HierarchyUpdate,
  CampusEntry, DepartmentEntry, FacultyEntry, WorkspaceEntry,
  MembershipEntry, InvitationEntry, OrganizationBranding,
  OrganizationConfiguration, OrganizationPolicy,
  LifecycleRecord, LicenseMetadataEntry, QuotaEntry,
  DomainEntry, TenantIsolation,
  OrganizationAuditRecord,
} from "./types";

const organizations = new Map<string, OrganizationRegistryEntry>();
const tenants = new Map<string, TenantEntry>();
const institutionTypes = new Map<string, InstitutionTypeEntry>();
const hierarchyNodes = new Map<string, HierarchyNode>();
const hierarchyUpdates: HierarchyUpdate[] = [];
const campuses = new Map<string, CampusEntry>();
const departments = new Map<string, DepartmentEntry>();
const faculties = new Map<string, FacultyEntry>();
const workspaces = new Map<string, WorkspaceEntry>();
const memberships = new Map<string, MembershipEntry>();
const invitations = new Map<string, InvitationEntry>();
const branding = new Map<string, OrganizationBranding>();
const configs = new Map<string, OrganizationConfiguration>();
const policies = new Map<string, OrganizationPolicy>();
const lifecycleRecords: LifecycleRecord[] = [];
const licenses = new Map<string, LicenseMetadataEntry>();
const quotas = new Map<string, QuotaEntry>();
const domains = new Map<string, DomainEntry>();
const isolations = new Map<string, TenantIsolation>();
const auditRecords: OrganizationAuditRecord[] = [];

export const storeOrganization = (o: OrganizationRegistryEntry) => organizations.set(o.id, o);
export const getOrganization = (id: string) => organizations.get(id) ?? null;
export const getOrganizationByKey = (k: string) => Array.from(organizations.values()).find(o => o.key === k) ?? null;
export const getOrganizationBySlug = (s: string) => Array.from(organizations.values()).find(o => o.slug === s) ?? null;
export const getAllOrganizations = () => Array.from(organizations.values());
export const storeTenant = (t: TenantEntry) => tenants.set(t.id, t);
export const getTenant = (id: string) => tenants.get(id) ?? null;
export const getTenantByKey = (k: string) => Array.from(tenants.values()).find(t => t.key === k) ?? null;
export const getAllTenants = () => Array.from(tenants.values());
export const storeInstitutionType = (i: InstitutionTypeEntry) => institutionTypes.set(i.id, i);
export const getInstitutionType = (id: string) => institutionTypes.get(id) ?? null;
export const getInstitutionTypeByType = (t: string) => Array.from(institutionTypes.values()).find(i => i.type === t) ?? null;
export const getAllInstitutionTypes = () => Array.from(institutionTypes.values());
export const storeHierarchyNode = (n: HierarchyNode) => hierarchyNodes.set(n.id, n);
export const getHierarchyNode = (id: string) => hierarchyNodes.get(id) ?? null;
export const getHierarchyNodeByOrganization = (orgId: string) => Array.from(hierarchyNodes.values()).find(n => n.organizationId === orgId) ?? null;
export const getAllHierarchyNodes = () => Array.from(hierarchyNodes.values());
export const appendHierarchyUpdate = (u: HierarchyUpdate) => hierarchyUpdates.push(u);
export const getAllHierarchyUpdates = () => hierarchyUpdates.slice();
export const storeCampus = (c: CampusEntry) => campuses.set(c.id, c);
export const getCampus = (id: string) => campuses.get(id) ?? null;
export const getAllCampuses = () => Array.from(campuses.values());
export const storeDepartment = (d: DepartmentEntry) => departments.set(d.id, d);
export const getDepartment = (id: string) => departments.get(id) ?? null;
export const getAllDepartments = () => Array.from(departments.values());
export const storeFaculty = (f: FacultyEntry) => faculties.set(f.id, f);
export const getFaculty = (id: string) => faculties.get(id) ?? null;
export const getAllFaculties = () => Array.from(faculties.values());
export const storeWorkspace = (w: WorkspaceEntry) => workspaces.set(w.id, w);
export const getWorkspace = (id: string) => workspaces.get(id) ?? null;
export const getAllWorkspaces = () => Array.from(workspaces.values());
export const storeMembership = (m: MembershipEntry) => memberships.set(m.id, m);
export const getMembership = (id: string) => memberships.get(id) ?? null;
export const getAllMemberships = () => Array.from(memberships.values());
export const storeInvitation = (i: InvitationEntry) => invitations.set(i.id, i);
export const getInvitation = (id: string) => invitations.get(id) ?? null;
export const getInvitationByToken = (t: string) => Array.from(invitations.values()).find(i => i.token === t) ?? null;
export const getAllInvitations = () => Array.from(invitations.values());
export const storeBranding = (b: OrganizationBranding) => branding.set(b.id, b);
export const getBranding = (id: string) => branding.get(id) ?? null;
export const getBrandingByOrganization = (orgId: string) => Array.from(branding.values()).find(b => b.organizationId === orgId) ?? null;
export const getAllBranding = () => Array.from(branding.values());
export const storeConfig = (c: OrganizationConfiguration) => configs.set(c.id, c);
export const getConfig = (id: string) => configs.get(id) ?? null;
export const getConfigByOrganization = (orgId: string, scope?: string) => Array.from(configs.values()).find(c => c.organizationId === orgId && (scope === undefined || c.scope === scope)) ?? null;
export const getAllConfigs = () => Array.from(configs.values());
export const storePolicy = (p: OrganizationPolicy) => policies.set(p.id, p);
export const getPolicy = (id: string) => policies.get(id) ?? null;
export const getAllPolicies = () => Array.from(policies.values());
export const appendLifecycleRecord = (r: LifecycleRecord) => lifecycleRecords.push(r);
export const getLifecycleRecord = (id: string) => lifecycleRecords.find(r => r.id === id) ?? null;
export const getAllLifecycleRecords = () => lifecycleRecords.slice();
export const storeLicense = (l: LicenseMetadataEntry) => licenses.set(l.id, l);
export const getLicense = (id: string) => licenses.get(id) ?? null;
export const getLicensesByOrganization = (orgId: string) => Array.from(licenses.values()).filter(l => l.organizationId === orgId);
export const getAllLicenses = () => Array.from(licenses.values());
export const storeQuota = (q: QuotaEntry) => quotas.set(q.id, q);
export const getQuota = (id: string) => quotas.get(id) ?? null;
export const getQuotaByOrgResource = (orgId: string, resource: string) => Array.from(quotas.values()).find(q => q.organizationId === orgId && q.resource === resource) ?? null;
export const getAllQuotas = () => Array.from(quotas.values());
export const storeDomain = (d: DomainEntry) => domains.set(d.id, d);
export const getDomain = (id: string) => domains.get(id) ?? null;
export const getDomainByOrganizationDomain = (orgId: string, domain: string) => Array.from(domains.values()).find(d => d.organizationId === orgId && d.domain === domain) ?? null;
export const getAllDomains = () => Array.from(domains.values());
export const storeIsolation = (i: TenantIsolation) => isolations.set(i.id, i);
export const getIsolation = (id: string) => isolations.get(id) ?? null;
export const getIsolationByTenant = (tenantId: string) => Array.from(isolations.values()).find(i => i.tenantId === tenantId) ?? null;
export const getAllIsolations = () => Array.from(isolations.values());
export const appendAuditRecord = (r: OrganizationAuditRecord) => auditRecords.push(r);
export const getAuditRecord = (id: string) => auditRecords.find(r => r.id === id) ?? null;
export const getAllAuditRecords = () => auditRecords.slice();

export function _resetRepositoryForTesting() {
  organizations.clear(); tenants.clear(); institutionTypes.clear();
  hierarchyNodes.clear(); hierarchyUpdates.length = 0;
  campuses.clear(); departments.clear(); faculties.clear();
  workspaces.clear(); memberships.clear(); invitations.clear();
  branding.clear(); configs.clear(); policies.clear();
  lifecycleRecords.length = 0; licenses.clear(); quotas.clear();
  domains.clear(); isolations.clear(); auditRecords.length = 0;
}

export function getMaxDepth(): number {
  const all = Array.from(hierarchyNodes.values());
  return all.length === 0 ? 0 : Math.max(...all.map(n => n.depth));
}
