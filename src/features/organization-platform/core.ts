/** Systems 1-12: Organization Registry, Tenant Registry, Institution Types, Hierarchy, Campus, Department, Faculty, Workspace, Membership, Invitation, Branding, Configuration. */
import { randomUUID } from "node:crypto";
import {
  storeOrganization, getOrganization, getOrganizationByKey, getOrganizationBySlug, getAllOrganizations,
  storeTenant, getTenant, getTenantByKey, getAllTenants,
  storeInstitutionType, getInstitutionType, getInstitutionTypeByType, getAllInstitutionTypes,
  storeHierarchyNode, getHierarchyNode, getHierarchyNodeByOrganization, getAllHierarchyNodes, appendHierarchyUpdate, getAllHierarchyUpdates,
  storeCampus, getCampus, getAllCampuses,
  storeDepartment, getDepartment, getAllDepartments,
  storeFaculty, getFaculty, getAllFaculties,
  storeWorkspace, getWorkspace, getAllWorkspaces,
  storeMembership, getMembership, getAllMemberships,
  storeInvitation, getInvitation, getInvitationByToken, getAllInvitations,
  storeBranding, getBranding, getBrandingByOrganization, getAllBranding,
  storeConfig, getConfig, getConfigByOrganization, getAllConfigs,
} from "./repository";
import type {
  OrganizationRegistryEntry, OrganizationStatus, OrganizationType,
  TenantEntry, TenantStatus,
  InstitutionTypeEntry,
  HierarchyNode, HierarchyUpdate,
  CampusEntry, CampusStatus,
  DepartmentEntry, DepartmentStatus,
  FacultyEntry, FacultyStatus,
  WorkspaceEntry, WorkspaceType, WorkspaceStatus,
  MembershipEntry, MembershipRole, MembershipStatus,
  InvitationEntry, InvitationStatus,
  OrganizationBranding,
  OrganizationConfiguration, ConfigScope,
} from "./types";
import { publishOrganizationEvent } from "./event-bus-bridge";

// System 1 — Organization Registry
export function registerOrganization(input: { key: string; name: string; slug: string; tenantId: string; type: OrganizationType; ownerId: string; parentId?: string | null; displayName?: string; description?: string; timezone?: string; locale?: string; metadata?: Record<string, unknown> }): OrganizationRegistryEntry {
  if (getOrganizationByKey(input.key)) throw new Error(`Organization key already exists: ${input.key}`);
  if (getOrganizationBySlug(input.slug)) throw new Error(`Organization slug already exists: ${input.slug}`);
  const now = new Date().toISOString();
  const o: OrganizationRegistryEntry = {
    id: randomUUID(), key: input.key, name: input.name, slug: input.slug,
    tenantId: input.tenantId, type: input.type, status: "provisioning", version: 1,
    ownerId: input.ownerId, parentId: input.parentId ?? null,
    displayName: input.displayName ?? input.name, description: input.description ?? "",
    timezone: input.timezone ?? "UTC", locale: input.locale ?? "en",
    createdAt: now, updatedAt: now, archivedAt: null, deletedAt: null,
    metadata: input.metadata ?? {},
  };
  storeOrganization(o);
  publishOrganizationEvent("OrganizationCreated", input.ownerId, { organizationId: o.id, key: o.key, type: o.type, tenantId: o.tenantId });
  return o;
}
export function getOrganizationById(id: string) { return getOrganization(id); }
export function getOrganizationByKeyOrSlug(k: string) { return getOrganizationByKey(k) ?? getOrganizationBySlug(k); }
export function listOrganizations(status?: OrganizationStatus, type?: OrganizationType) {
  let all = getAllOrganizations();
  if (status) all = all.filter(o => o.status === status);
  if (type) all = all.filter(o => o.type === type);
  return all;
}
export function updateOrganization(id: string, patch: Partial<Pick<OrganizationRegistryEntry, "name" | "displayName" | "description" | "timezone" | "locale">>) {
  const o = getOrganization(id); if (!o) return null;
  if (patch.name !== undefined) o.name = patch.name;
  if (patch.displayName !== undefined) o.displayName = patch.displayName;
  if (patch.description !== undefined) o.description = patch.description;
  if (patch.timezone !== undefined) o.timezone = patch.timezone;
  if (patch.locale !== undefined) o.locale = patch.locale;
  o.version += 1; o.updatedAt = new Date().toISOString();
  storeOrganization(o);
  publishOrganizationEvent("OrganizationUpdated", null, { organizationId: o.id, version: o.version });
  return o;
}
export function setOrganizationStatus(id: string, status: OrganizationStatus) { const o = getOrganization(id); if (!o) return null; o.status = status; o.updatedAt = new Date().toISOString(); storeOrganization(o); return o; }
export function supportsAllOrganizationStatuses(): OrganizationStatus[] { return ["provisioning", "active", "suspended", "archived", "deleted"]; }
export function supportsAllOrganizationTypes(): OrganizationType[] { return ["school", "university", "ministry", "district", "company", "academy", "training_center", "tutoring_center", "custom"]; }

// System 2 — Tenant Registry
export function createTenant(input: { key: string; name: string; plan?: string; region?: string; metadata?: Record<string, unknown> }): TenantEntry {
  if (getTenantByKey(input.key)) throw new Error(`Tenant key already exists: ${input.key}`);
  const now = new Date().toISOString();
  const t: TenantEntry = {
    id: randomUUID(), key: input.key, name: input.name,
    status: "provisioning", plan: input.plan ?? "standard", region: input.region ?? "default",
    rootOrganizationId: null,
    activatedAt: null, suspendedAt: null, archivedAt: null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeTenant(t);
  publishOrganizationEvent("TenantCreated", null, { tenantId: t.id, key: t.key });
  return t;
}
export function getTenantById(id: string) { return getTenant(id); }
export function listTenants(status?: TenantStatus) {
  const all = getAllTenants();
  return status ? all.filter(t => t.status === status) : all;
}
export function activateTenant(id: string) {
  const t = getTenant(id); if (!t) return null;
  t.status = "active"; t.activatedAt = new Date().toISOString(); t.updatedAt = t.activatedAt; storeTenant(t);
  publishOrganizationEvent("TenantActivated", null, { tenantId: t.id });
  return t;
}
export function suspendTenant(id: string) {
  const t = getTenant(id); if (!t) return null;
  t.status = "suspended"; t.suspendedAt = new Date().toISOString(); t.updatedAt = t.suspendedAt; storeTenant(t);
  publishOrganizationEvent("TenantSuspended", null, { tenantId: t.id });
  return t;
}
export function archiveTenant(id: string) {
  const t = getTenant(id); if (!t) return null;
  t.status = "archived"; t.archivedAt = new Date().toISOString(); t.updatedAt = t.archivedAt; storeTenant(t);
  return t;
}
export function setTenantRootOrganization(id: string, organizationId: string) {
  const t = getTenant(id); if (!t) return null;
  t.rootOrganizationId = organizationId; t.updatedAt = new Date().toISOString(); storeTenant(t);
  return t;
}
export function supportsAllTenantStatuses(): TenantStatus[] { return ["provisioning", "active", "suspended", "archived"]; }

// System 3 — Institution Types
export function registerInstitutionType(input: { type: OrganizationType; displayName: string; description?: string; defaultHierarchyDepth?: number; supportedFeatures?: string[]; active?: boolean }): InstitutionTypeEntry {
  if (getInstitutionTypeByType(input.type)) throw new Error(`Institution type already exists: ${input.type}`);
  const now = new Date().toISOString();
  const it: InstitutionTypeEntry = {
    id: randomUUID(), type: input.type,
    displayName: input.displayName, description: input.description ?? "",
    defaultHierarchyDepth: input.defaultHierarchyDepth ?? 3,
    supportedFeatures: input.supportedFeatures ?? [],
    active: input.active ?? true,
    createdAt: now, updatedAt: now,
  };
  storeInstitutionType(it);
  return it;
}
export function getInstitutionTypeById(id: string) { return getInstitutionType(id); }
export function listInstitutionTypes(activeOnly?: boolean) {
  const all = getAllInstitutionTypes();
  return activeOnly === undefined ? all : all.filter(i => i.active === activeOnly);
}
export function deactivateInstitutionType(id: string) { const it = getInstitutionType(id); if (!it) return null; it.active = false; it.updatedAt = new Date().toISOString(); storeInstitutionType(it); return it; }

// System 4 — Organization Hierarchy
function rebuildPath(orgId: string, parentId: string | null): { path: string; depth: number } {
  if (!parentId) return { path: `/${orgId}`, depth: 0 };
  const parentNode = getHierarchyNodeByOrganization(parentId);
  if (!parentNode) return { path: `/${orgId}`, depth: 0 };
  return { path: `${parentNode.path}/${orgId}`, depth: parentNode.depth + 1 };
}
export function registerHierarchyNode(input: { organizationId: string; parentId?: string | null }): HierarchyNode {
  const existing = getHierarchyNodeByOrganization(input.organizationId);
  if (existing) return existing;
  const { path, depth } = rebuildPath(input.organizationId, input.parentId ?? null);
  const now = new Date().toISOString();
  const n: HierarchyNode = {
    id: randomUUID(), organizationId: input.organizationId,
    parentId: input.parentId ?? null,
    path, depth, childIds: [],
    createdAt: now, updatedAt: now,
  };
  storeHierarchyNode(n);
  if (input.parentId) {
    const parent = getHierarchyNodeByOrganization(input.parentId);
    if (parent && !parent.childIds.includes(input.organizationId)) {
      parent.childIds.push(input.organizationId);
      parent.updatedAt = now;
      storeHierarchyNode(parent);
    }
  }
  return n;
}
export function getHierarchyNodeById(id: string) { return getHierarchyNode(id); }
export function getHierarchyForOrganization(organizationId: string) { return getHierarchyNodeByOrganization(organizationId); }
export function listHierarchyNodes() { return getAllHierarchyNodes(); }
export function getChildren(organizationId: string): HierarchyNode[] {
  return getAllHierarchyNodes().filter(n => n.parentId === organizationId);
}
export function getDescendants(organizationId: string): HierarchyNode[] {
  const result: HierarchyNode[] = [];
  const queue = [organizationId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!; if (visited.has(cur)) continue; visited.add(cur);
    const children = getChildren(cur);
    result.push(...children);
    queue.push(...children.map(c => c.organizationId));
  }
  return result;
}
export function moveOrganization(input: { organizationId: string; newParentId: string | null; actorId: string; reason?: string | null }): HierarchyUpdate {
  const node = getHierarchyNodeByOrganization(input.organizationId);
  if (!node) throw new Error(`Hierarchy node not found for organization: ${input.organizationId}`);
  const previousParentId = node.parentId;
  node.parentId = input.newParentId;
  const { path, depth } = rebuildPath(input.organizationId, input.newParentId);
  node.path = path; node.depth = depth;
  node.updatedAt = new Date().toISOString();
  storeHierarchyNode(node);
  if (previousParentId) {
    const prev = getHierarchyNodeByOrganization(previousParentId);
    if (prev) { prev.childIds = prev.childIds.filter(c => c !== input.organizationId); prev.updatedAt = new Date().toISOString(); storeHierarchyNode(prev); }
  }
  if (input.newParentId) {
    const np = getHierarchyNodeByOrganization(input.newParentId);
    if (np && !np.childIds.includes(input.organizationId)) { np.childIds.push(input.organizationId); np.updatedAt = new Date().toISOString(); storeHierarchyNode(np); }
  }
  const update: HierarchyUpdate = {
    id: randomUUID(), organizationId: input.organizationId,
    previousParentId, newParentId: input.newParentId,
    actorId: input.actorId, reason: input.reason ?? null,
    occurredAt: new Date().toISOString(), correlationId: randomUUID(),
  };
  appendHierarchyUpdate(update);
  publishOrganizationEvent("HierarchyUpdated", input.actorId, { organizationId: input.organizationId, previousParentId, newParentId: input.newParentId });
  return update;
}
export function listHierarchyUpdates() { return getAllHierarchyUpdates(); }

// System 5 — Campus Registry
export function createCampus(input: { organizationId: string; key: string; name: string; slug: string; address?: string | null; geo?: { latitude: number | null; longitude: number | null } | null; timezone?: string | null; metadata?: Record<string, unknown> }): CampusEntry {
  const now = new Date().toISOString();
  const c: CampusEntry = {
    id: randomUUID(), organizationId: input.organizationId,
    key: input.key, name: input.name, slug: input.slug,
    status: "active", address: input.address ?? null,
    geo: input.geo ?? null, timezone: input.timezone ?? null,
    createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeCampus(c);
  return c;
}
export function getCampusById(id: string) { return getCampus(id); }
export function listCampuses(organizationId?: string, status?: CampusStatus) {
  let all = getAllCampuses();
  if (organizationId) all = all.filter(c => c.organizationId === organizationId);
  if (status) all = all.filter(c => c.status === status);
  return all;
}
export function setCampusStatus(id: string, status: CampusStatus) { const c = getCampus(id); if (!c) return null; c.status = status; c.updatedAt = new Date().toISOString(); storeCampus(c); return c; }
export function supportsAllCampusStatuses(): CampusStatus[] { return ["active", "inactive", "maintenance"]; }

// System 6 — Department Registry
export function createDepartment(input: { organizationId: string; key: string; name: string; slug: string; parentId?: string | null; headUserId?: string | null; metadata?: Record<string, unknown> }): DepartmentEntry {
  const now = new Date().toISOString();
  const d: DepartmentEntry = {
    id: randomUUID(), organizationId: input.organizationId,
    key: input.key, name: input.name, slug: input.slug,
    parentId: input.parentId ?? null, headUserId: input.headUserId ?? null,
    status: "active", createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeDepartment(d);
  return d;
}
export function getDepartmentById(id: string) { return getDepartment(id); }
export function listDepartments(organizationId?: string, status?: DepartmentStatus) {
  let all = getAllDepartments();
  if (organizationId) all = all.filter(d => d.organizationId === organizationId);
  if (status) all = all.filter(d => d.status === status);
  return all;
}
export function setDepartmentStatus(id: string, status: DepartmentStatus) { const d = getDepartment(id); if (!d) return null; d.status = status; d.updatedAt = new Date().toISOString(); storeDepartment(d); return d; }
export function supportsAllDepartmentStatuses(): DepartmentStatus[] { return ["active", "inactive", "merged"]; }

// System 7 — Faculty Registry
export function createFaculty(input: { organizationId: string; key: string; name: string; slug: string; deanUserId?: string | null; departmentIds?: string[]; metadata?: Record<string, unknown> }): FacultyEntry {
  const now = new Date().toISOString();
  const f: FacultyEntry = {
    id: randomUUID(), organizationId: input.organizationId,
    key: input.key, name: input.name, slug: input.slug,
    deanUserId: input.deanUserId ?? null,
    departmentIds: input.departmentIds ?? [],
    status: "active", createdAt: now, updatedAt: now,
    metadata: input.metadata ?? {},
  };
  storeFaculty(f);
  return f;
}
export function getFacultyById(id: string) { return getFaculty(id); }
export function listFaculties(organizationId?: string, status?: FacultyStatus) {
  let all = getAllFaculties();
  if (organizationId) all = all.filter(f => f.organizationId === organizationId);
  if (status) all = all.filter(f => f.status === status);
  return all;
}
export function setFacultyStatus(id: string, status: FacultyStatus) { const f = getFaculty(id); if (!f) return null; f.status = status; f.updatedAt = new Date().toISOString(); storeFaculty(f); return f; }
export function addFacultyDepartment(id: string, departmentId: string) { const f = getFaculty(id); if (!f) return null; if (!f.departmentIds.includes(departmentId)) f.departmentIds.push(departmentId); f.updatedAt = new Date().toISOString(); storeFaculty(f); return f; }
export function supportsAllFacultyStatuses(): FacultyStatus[] { return ["active", "inactive", "reorganized"]; }

// System 8 — Workspace Registry
export function createWorkspace(input: { organizationId: string; key: string; name: string; slug: string; type: WorkspaceType; ownerId: string; metadata?: Record<string, unknown> }): WorkspaceEntry {
  const now = new Date().toISOString();
  const w: WorkspaceEntry = {
    id: randomUUID(), organizationId: input.organizationId,
    key: input.key, name: input.name, slug: input.slug,
    type: input.type, ownerId: input.ownerId,
    status: "active", createdAt: now, updatedAt: now, archivedAt: null,
    metadata: input.metadata ?? {},
  };
  storeWorkspace(w);
  publishOrganizationEvent("WorkspaceCreated", input.ownerId, { workspaceId: w.id, organizationId: w.organizationId, type: w.type });
  return w;
}
export function getWorkspaceById(id: string) { return getWorkspace(id); }
export function listWorkspaces(organizationId?: string, type?: WorkspaceType, status?: WorkspaceStatus) {
  let all = getAllWorkspaces();
  if (organizationId) all = all.filter(w => w.organizationId === organizationId);
  if (type) all = all.filter(w => w.type === type);
  if (status) all = all.filter(w => w.status === status);
  return all;
}
export function archiveWorkspace(id: string) {
  const w = getWorkspace(id); if (!w) return null;
  w.status = "archived"; w.archivedAt = new Date().toISOString(); w.updatedAt = w.archivedAt; storeWorkspace(w);
  publishOrganizationEvent("WorkspaceArchived", null, { workspaceId: w.id, organizationId: w.organizationId });
  return w;
}
export function supportsAllWorkspaceTypes(): WorkspaceType[] { return ["teacher", "student", "administration", "research", "custom"]; }
export function supportsAllWorkspaceStatuses(): WorkspaceStatus[] { return ["active", "archived"]; }

// System 9 — Membership Registry
export function addMembership(input: { organizationId: string; userId: string; role: MembershipRole; status?: MembershipStatus; departmentId?: string | null; facultyId?: string | null; campusId?: string | null; workspaceId?: string | null; invitedBy?: string | null; metadata?: Record<string, unknown> }): MembershipEntry {
  const now = new Date().toISOString();
  const m: MembershipEntry = {
    id: randomUUID(), organizationId: input.organizationId,
    userId: input.userId, role: input.role,
    status: input.status ?? "active",
    departmentId: input.departmentId ?? null,
    facultyId: input.facultyId ?? null,
    campusId: input.campusId ?? null,
    workspaceId: input.workspaceId ?? null,
    invitedBy: input.invitedBy ?? null,
    joinedAt: input.status === "active" ? now : null,
    removedAt: null,
    createdAt: now, updatedAt: now,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  storeMembership(m);
  publishOrganizationEvent("MembershipAdded", input.userId, { membershipId: m.id, organizationId: m.organizationId, userId: m.userId, role: m.role });
  return m;
}
export function getMembershipById(id: string) { return getMembership(id); }
export function listMemberships(organizationId?: string, userId?: string, status?: MembershipStatus) {
  let all = getAllMemberships();
  if (organizationId) all = all.filter(m => m.organizationId === organizationId);
  if (userId) all = all.filter(m => m.userId === userId);
  if (status) all = all.filter(m => m.status === status);
  return all;
}
export function setMembershipStatus(id: string, status: MembershipStatus) {
  const m = getMembership(id); if (!m) return null;
  m.status = status; m.updatedAt = new Date().toISOString();
  if (status === "active" && !m.joinedAt) m.joinedAt = m.updatedAt;
  if (status === "removed") m.removedAt = m.updatedAt;
  storeMembership(m);
  if (status === "removed") publishOrganizationEvent("MembershipRemoved", m.userId, { membershipId: m.id, organizationId: m.organizationId, userId: m.userId });
  return m;
}
export function setMembershipRole(id: string, role: MembershipRole) { const m = getMembership(id); if (!m) return null; m.role = role; m.updatedAt = new Date().toISOString(); storeMembership(m); return m; }
export function supportsAllMembershipRoles(): MembershipRole[] { return ["member", "admin", "owner", "guest", "observer"]; }
export function supportsAllMembershipStatuses(): MembershipStatus[] { return ["active", "invited", "suspended", "removed"]; }

// System 10 — Invitation Platform
export function createInvitation(input: { organizationId: string; email: string; userId?: string | null; role: MembershipRole; invitedBy: string; expiresAt: string; metadata?: Record<string, unknown> }): InvitationEntry {
  const now = new Date().toISOString();
  const i: InvitationEntry = {
    id: randomUUID(), organizationId: input.email as string, // placeholder to satisfy TS, overwritten below
    email: input.email, userId: input.userId ?? null,
    role: input.role, invitedBy: input.invitedBy,
    status: "pending", token: randomUUID(),
    expiresAt: input.expiresAt,
    acceptedAt: null, rejectedAt: null, withdrawnAt: null,
    createdAt: now, updatedAt: now,
    correlationId: randomUUID(),
    metadata: input.metadata ?? {},
  };
  i.organizationId = input.organizationId;
  storeInvitation(i);
  publishOrganizationEvent("InvitationCreated", input.invitedBy, { invitationId: i.id, organizationId: i.organizationId, email: i.email });
  return i;
}
export function getInvitationById(id: string) { return getInvitation(id); }
export function getInvitationByTokenString(token: string) { return getInvitationByToken(token); }
export function listInvitations(organizationId?: string, status?: InvitationStatus) {
  let all = getAllInvitations();
  if (organizationId) all = all.filter(i => i.organizationId === organizationId);
  if (status) all = all.filter(i => i.status === status);
  return all;
}
export function acceptInvitation(id: string, userId: string) {
  const i = getInvitation(id); if (!i || i.status !== "pending") return null;
  i.status = "accepted"; i.userId = userId; i.acceptedAt = new Date().toISOString(); i.updatedAt = i.acceptedAt; storeInvitation(i);
  publishOrganizationEvent("InvitationAccepted", userId, { invitationId: i.id, organizationId: i.organizationId, userId });
  return i;
}
export function rejectInvitation(id: string) {
  const i = getInvitation(id); if (!i || i.status !== "pending") return null;
  i.status = "rejected"; i.rejectedAt = new Date().toISOString(); i.updatedAt = i.rejectedAt; storeInvitation(i);
  return i;
}
export function withdrawInvitation(id: string) {
  const i = getInvitation(id); if (!i || i.status !== "pending") return null;
  i.status = "withdrawn"; i.withdrawnAt = new Date().toISOString(); i.updatedAt = i.withdrawnAt; storeInvitation(i);
  return i;
}
export function expireInvitation(id: string) {
  const i = getInvitation(id); if (!i) return null;
  i.status = "expired"; i.updatedAt = new Date().toISOString(); storeInvitation(i);
  publishOrganizationEvent("InvitationExpired", null, { invitationId: i.id, organizationId: i.organizationId });
  return i;
}
export function supportsAllInvitationStatuses(): InvitationStatus[] { return ["pending", "accepted", "rejected", "expired", "withdrawn"]; }

// System 11 — Organization Branding
export function setBranding(input: { organizationId: string; logoUrl?: string | null; faviconUrl?: string | null; primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null; theme?: string | null; customCssUrl?: string | null; assets?: Array<{ key: string; url: string; type: string }> }): OrganizationBranding {
  const existing = getBrandingByOrganization(input.organizationId);
  const now = new Date().toISOString();
  if (existing) {
    if (input.logoUrl !== undefined) existing.logoUrl = input.logoUrl;
    if (input.faviconUrl !== undefined) existing.faviconUrl = input.faviconUrl;
    if (input.primaryColor !== undefined) existing.primaryColor = input.primaryColor;
    if (input.secondaryColor !== undefined) existing.secondaryColor = input.secondaryColor;
    if (input.accentColor !== undefined) existing.accentColor = input.accentColor;
    if (input.theme !== undefined) existing.theme = input.theme;
    if (input.customCssUrl !== undefined) existing.customCssUrl = input.customCssUrl;
    if (input.assets !== undefined) existing.assets = input.assets;
    existing.updatedAt = now; storeBranding(existing);
    publishOrganizationEvent("OrganizationBranded", null, { organizationId: existing.organizationId });
    return existing;
  }
  const b: OrganizationBranding = {
    id: randomUUID(), organizationId: input.organizationId,
    logoUrl: input.logoUrl ?? null, faviconUrl: input.faviconUrl ?? null,
    primaryColor: input.primaryColor ?? null, secondaryColor: input.secondaryColor ?? null,
    accentColor: input.accentColor ?? null, theme: input.theme ?? null,
    customCssUrl: input.customCssUrl ?? null, assets: input.assets ?? [],
    createdAt: now, updatedAt: now,
  };
  storeBranding(b);
  publishOrganizationEvent("OrganizationBranded", null, { organizationId: b.organizationId });
  return b;
}
export function getBrandingById(id: string) { return getBranding(id); }
export function getBrandingForOrganization(organizationId: string) { return getBrandingByOrganization(organizationId); }
export function listBranding() { return getAllBranding(); }

// System 12 — Organization Configuration
export function createConfig(input: { organizationId: string; scope?: ConfigScope; scopeId?: string | null; settings?: Record<string, unknown>; secrets?: string[]; overrides?: string[]; schemaVersion?: number }): OrganizationConfiguration {
  const now = new Date().toISOString();
  const c: OrganizationConfiguration = {
    id: randomUUID(), organizationId: input.organizationId,
    scope: input.scope ?? "organization", scopeId: input.scopeId ?? null,
    settings: input.settings ?? {}, secrets: input.secrets ?? [],
    overrides: input.overrides ?? [], schemaVersion: input.schemaVersion ?? 1,
    updatedAt: now, createdAt: now,
  };
  storeConfig(c);
  return c;
}
export function getConfigById(id: string) { return getConfig(id); }
export function getConfigForOrganization(organizationId: string, scope?: ConfigScope) { return getConfigByOrganization(organizationId, scope); }
export function listConfigs(scope?: ConfigScope) {
  const all = getAllConfigs();
  return scope ? all.filter(c => c.scope === scope) : all;
}
export function updateConfigSettings(id: string, settings: Record<string, unknown>) { const c = getConfig(id); if (!c) return null; c.settings = settings; c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function addConfigSecret(id: string, secretKey: string) { const c = getConfig(id); if (!c) return null; if (!c.secrets.includes(secretKey)) c.secrets.push(secretKey); c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function addConfigOverride(id: string, overrideKey: string) { const c = getConfig(id); if (!c) return null; if (!c.overrides.includes(overrideKey)) c.overrides.push(overrideKey); c.updatedAt = new Date().toISOString(); storeConfig(c); return c; }
export function supportsAllConfigScopes(): ConfigScope[] { return ["organization", "campus", "department", "workspace"]; }
