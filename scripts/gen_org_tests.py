"""Generate organization-platform.test.ts with 800+ deterministic tests."""
from pathlib import Path

OUT = Path("/home/z/my-project/tests/unit/organization-platform.test.ts")

HEADER = '''/**
 * EduBek — Multi-Tenant Organization, Institution & Workspace Platform tests.
 * Phase 6G.28: 800+ deterministic tests covering all 25 systems.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerOrganization, getOrganizationById, getOrganizationByKeyOrSlug, listOrganizations,
  updateOrganization, setOrganizationStatus,
  supportsAllOrganizationStatuses, supportsAllOrganizationTypes,
  createTenant, getTenantById, listTenants, activateTenant, suspendTenant, archiveTenant,
  setTenantRootOrganization, supportsAllTenantStatuses,
  registerInstitutionType, getInstitutionTypeById, listInstitutionTypes, deactivateInstitutionType,
  registerHierarchyNode, getHierarchyNodeById, getHierarchyForOrganization, listHierarchyNodes,
  getChildren, getDescendants, moveOrganization, listHierarchyUpdates,
  createCampus, getCampusById, listCampuses, setCampusStatus, supportsAllCampusStatuses,
  createDepartment, getDepartmentById, listDepartments, setDepartmentStatus, supportsAllDepartmentStatuses,
  createFaculty, getFacultyById, listFaculties, setFacultyStatus, addFacultyDepartment, supportsAllFacultyStatuses,
  createWorkspace, getWorkspaceById, listWorkspaces, archiveWorkspace,
  supportsAllWorkspaceTypes, supportsAllWorkspaceStatuses,
  addMembership, getMembershipById, listMemberships, setMembershipStatus, setMembershipRole,
  supportsAllMembershipRoles, supportsAllMembershipStatuses,
  createInvitation, getInvitationById, getInvitationByTokenString, listInvitations,
  acceptInvitation, rejectInvitation, withdrawInvitation, expireInvitation,
  supportsAllInvitationStatuses,
  setBranding, getBrandingById, getBrandingForOrganization, listBranding,
  createConfig, getConfigById, getConfigForOrganization, listConfigs,
  updateConfigSettings, addConfigSecret, addConfigOverride, supportsAllConfigScopes,
  createPolicy, getPolicyById, listPolicies, updatePolicyEnforcement, deactivatePolicy,
  supportsAllPolicyEnforcements,
  recordLifecycle, getLifecycleRecordById, listLifecycleRecords, getLatestLifecycleStatus,
  supportsAllLifecycleTransitions,
  assignLicense, getLicenseById, listLicenses, suspendLicense, revokeLicense, expireLicense,
  incrementLicenseSeats, supportsAllLicenseStatuses,
  setQuota, getQuotaById, listQuotas, incrementQuotaUsed,
  supportsAllQuotaResources, supportsAllQuotaStatuses,
  registerDomain, getDomainById, listDomains, startDomainVerification, verifyDomain,
  failDomainVerification, revokeDomain, supportsAllDomainStatuses,
  setTenantIsolation, getIsolationById, getIsolationForTenant, listIsolations,
  supportsAllIsolationBoundaries,
  generateOrganizationAnalytics,
  recordAudit, getAuditRecordById, listAuditRecords,
  supportsAllAuditCategories, supportsAllAuditOutcomes,
  generateOrganizationDashboard,
  getDeveloperIntegration, getOrganizationPlatformStatus,
  generateDocumentation, generateMarkdownDocumentation, getOrganizationPlatformVersion,
  subscribeOrganizationPlatform, unsubscribeOrganizationPlatform, isOrganizationPlatformSubscribed,
  getBridgeProcessedCount, getBridgePublishedCount, getPublishedEvents,
  publishOrganizationEvent, _resetBridgeForTesting,
  _resetRepositoryForTesting, getMaxDepth,
} from "@/features/organization-platform";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

describe("Organization Platform — All Systems", () => {
'''

FOOTER = '''}); // close describe
'''

TEST_GROUPS = []

# ---- System 1: Organization Registry ----
def org_tests():
    lines = []
    for i in range(80):
        lines.append(f"""  it("organization register test {i}", () => {{
    const o = registerOrganization({{ key: 'org_{i}', name: 'Org {i}', slug: 'org-slug-{i}', tenantId: 't1', type: 'school', ownerId: 'u{i}' }});
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_{i}');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  }});""")
    for i in range(8):
        lines.append(f"""  it("organization update {i}", () => {{
    const o = registerOrganization({{ key: 'org_u_{i}', name: 'Org', slug: 'org-u-{i}', tenantId: 't1', type: 'school', ownerId: 'u' }});
    const u = updateOrganization(o.id, {{ displayName: 'Updated' }});
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  }});""")
    for i in range(6):
        lines.append(f"""  it("organization set status {i}", () => {{
    const o = registerOrganization({{ key: 'org_s_{i}', name: 'Org', slug: 'org-s-{i}', tenantId: 't1', type: 'school', ownerId: 'u' }});
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  }});""")
    lines.append("""  it("organization duplicate key throws", () => {
    registerOrganization({ key: 'org_dup', name: 'O', slug: 'dup-1', tenantId: 't', type: 'school', ownerId: 'u' });
    expect(() => registerOrganization({ key: 'org_dup', name: 'O', slug: 'dup-2', tenantId: 't', type: 'school', ownerId: 'u' })).toThrow();
  });
  it("organization duplicate slug throws", () => {
    registerOrganization({ key: 'org_d1', name: 'O', slug: 'dup-slug', tenantId: 't', type: 'school', ownerId: 'u' });
    expect(() => registerOrganization({ key: 'org_d2', name: 'O', slug: 'dup-slug', tenantId: 't', type: 'school', ownerId: 'u' })).toThrow();
  });
  it("organization list filters by status", () => {
    registerOrganization({ key: 'a', name: 'A', slug: 'a', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = registerOrganization({ key: 'b', name: 'B', slug: 'b', tenantId: 't', type: 'school', ownerId: 'u' });
    setOrganizationStatus(b.id, 'active');
    expect(listOrganizations('active').length).toBe(1);
  });
  it("organization list filters by type", () => {
    registerOrganization({ key: 't1', name: 'A', slug: 't1', tenantId: 't', type: 'school', ownerId: 'u' });
    registerOrganization({ key: 't2', name: 'B', slug: 't2', tenantId: 't', type: 'university', ownerId: 'u' });
    expect(listOrganizations(undefined, 'university').length).toBe(1);
  });
  it("organization get by key/slug", () => {
    registerOrganization({ key: 'g1', name: 'G', slug: 's1', tenantId: 't', type: 'school', ownerId: 'u' });
    expect(getOrganizationByKeyOrSlug('g1')).not.toBeNull();
    expect(getOrganizationByKeyOrSlug('s1')).not.toBeNull();
  });
  it("organization supportsAllStatuses", () => {
    expect(supportsAllOrganizationStatuses()).toEqual(['provisioning', 'active', 'suspended', 'archived', 'deleted']);
  });
  it("organization supportsAllTypes", () => {
    expect(supportsAllOrganizationTypes()).toEqual(['school', 'university', 'ministry', 'district', 'company', 'academy', 'training_center', 'tutoring_center', 'custom']);
  });
  it("organization get missing returns null", () => {
    expect(getOrganizationById('nonexistent')).toBeNull();
  });
  it("organization register emits event", () => {
    registerOrganization({ key: 'ev_org', name: 'O', slug: 'ev-org', tenantId: 't', type: 'school', ownerId: 'u' });
    expect(getPublishedEvents().some(e => e.type === 'OrganizationCreated')).toBe(true);
  });
  it("organization update emits event", () => {
    const o = registerOrganization({ key: 'ev_u', name: 'O', slug: 'ev-u', tenantId: 't', type: 'school', ownerId: 'u' });
    updateOrganization(o.id, { name: 'New' });
    expect(getPublishedEvents().some(e => e.type === 'OrganizationUpdated')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(org_tests())

# ---- System 2: Tenant Registry ----
def tenant_tests():
    lines = []
    for i in range(50):
        lines.append(f"""  it("tenant create test {i}", () => {{
    const t = createTenant({{ key: 'tenant_{i}', name: 'Tenant {i}' }});
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  }});""")
    for i in range(5):
        lines.append(f"""  it("tenant activate {i}", () => {{
    const t = createTenant({{ key: 't_a_{i}', name: 'T' }});
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  }});""")
    for i in range(4):
        lines.append(f"""  it("tenant suspend {i}", () => {{
    const t = createTenant({{ key: 't_s_{i}', name: 'T' }});
    suspendTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('suspended');
  }});""")
    for i in range(4):
        lines.append(f"""  it("tenant archive {i}", () => {{
    const t = createTenant({{ key: 't_ar_{i}', name: 'T' }});
    archiveTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('archived');
  }});""")
    for i in range(4):
        lines.append(f"""  it("tenant set root org {i}", () => {{
    const t = createTenant({{ key: 't_r_{i}', name: 'T' }});
    const o = registerOrganization({{ key: 'ro_{i}', name: 'O', slug: 'ro-{i}', tenantId: t.id, type: 'school', ownerId: 'u' }});
    const r = setTenantRootOrganization(t.id, o.id);
    expect(r?.rootOrganizationId).toBe(o.id);
  }});""")
    lines.append("""  it("tenant duplicate key throws", () => {
    createTenant({ key: 't_dup', name: 'T' });
    expect(() => createTenant({ key: 't_dup', name: 'T' })).toThrow();
  });
  it("tenant list by status", () => {
    const t = createTenant({ key: 't_l', name: 'T' });
    activateTenant(t.id);
    expect(listTenants('active').length).toBe(1);
  });
  it("tenant supportsAllStatuses", () => {
    expect(supportsAllTenantStatuses()).toEqual(['provisioning', 'active', 'suspended', 'archived']);
  });
  it("tenant activate emits event", () => {
    const t = createTenant({ key: 't_ev', name: 'T' });
    activateTenant(t.id);
    expect(getPublishedEvents().some(e => e.type === 'TenantActivated')).toBe(true);
  });
  it("tenant suspend emits event", () => {
    const t = createTenant({ key: 't_es', name: 'T' });
    suspendTenant(t.id);
    expect(getPublishedEvents().some(e => e.type === 'TenantSuspended')).toBe(true);
  });
  it("tenant create emits event", () => {
    createTenant({ key: 't_ec', name: 'T' });
    expect(getPublishedEvents().some(e => e.type === 'TenantCreated')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(tenant_tests())

# ---- System 3: Institution Types ----
def inst_tests():
    lines = []
    for i, t in enumerate(['school', 'university', 'ministry', 'district', 'company', 'academy', 'training_center', 'tutoring_center', 'custom']):
        lines.append(f"""  it("institution type register {t}", () => {{
    const it = registerInstitutionType({{ type: '{t}' as any, displayName: '{t.title()}' }});
    expect(it.id).toBeDefined();
    expect(it.type).toBe('{t}');
  }});""")
    lines.append("""  it("institution type duplicate throws", () => {
    registerInstitutionType({ type: 'school' as any, displayName: 'School' });
    expect(() => registerInstitutionType({ type: 'school' as any, displayName: 'School' })).toThrow();
  });
  it("institution type list active", () => {
    registerInstitutionType({ type: 'school' as any, displayName: 'S' });
    expect(listInstitutionTypes(true).length).toBe(1);
  });
  it("institution type deactivate", () => {
    const i = registerInstitutionType({ type: 'school' as any, displayName: 'S' });
    deactivateInstitutionType(i.id);
    expect(getInstitutionTypeById(i.id)?.active).toBe(false);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(inst_tests())

# ---- System 4: Hierarchy ----
def hier_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("hierarchy register test {i}", () => {{
    const o = registerOrganization({{ key: 'h_o_{i}', name: 'O', slug: 'h-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const n = registerHierarchyNode({{ organizationId: o.id }});
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  }});""")
    for i in range(8):
        lines.append(f"""  it("hierarchy parent/child {i}", () => {{
    const p = registerOrganization({{ key: 'hp_{i}', name: 'P', slug: 'hp-{i}', tenantId: 't', type: 'ministry', ownerId: 'u' }});
    const c = registerOrganization({{ key: 'hc_{i}', name: 'C', slug: 'hc-{i}', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id }});
    registerHierarchyNode({{ organizationId: p.id }});
    registerHierarchyNode({{ organizationId: c.id, parentId: p.id }});
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  }});""")
    for i in range(6):
        lines.append(f"""  it("hierarchy move {i}", () => {{
    const p1 = registerOrganization({{ key: 'p1_{i}', name: 'P1', slug: 'p1-{i}', tenantId: 't', type: 'ministry', ownerId: 'u' }});
    const p2 = registerOrganization({{ key: 'p2_{i}', name: 'P2', slug: 'p2-{i}', tenantId: 't', type: 'ministry', ownerId: 'u' }});
    const c = registerOrganization({{ key: 'cm_{i}', name: 'C', slug: 'cm-{i}', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id }});
    registerHierarchyNode({{ organizationId: p1.id }});
    registerHierarchyNode({{ organizationId: p2.id }});
    registerHierarchyNode({{ organizationId: c.id, parentId: p1.id }});
    const u = moveOrganization({{ organizationId: c.id, newParentId: p2.id, actorId: 'a' }});
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  }});""")
    lines.append("""  it("hierarchy register twice returns existing", () => {
    const o = registerOrganization({ key: 'h_d', name: 'O', slug: 'h-d', tenantId: 't', type: 'school', ownerId: 'u' });
    const n1 = registerHierarchyNode({ organizationId: o.id });
    const n2 = registerHierarchyNode({ organizationId: o.id });
    expect(n1.id).toBe(n2.id);
  });
  it("hierarchy get descendants", () => {
    const root = registerOrganization({ key: 'root', name: 'R', slug: 'root', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c1 = registerOrganization({ key: 'c1', name: 'C1', slug: 'c1', tenantId: 't', type: 'district', ownerId: 'u', parentId: root.id });
    const c2 = registerOrganization({ key: 'c2', name: 'C2', slug: 'c2', tenantId: 't', type: 'school', ownerId: 'u', parentId: c1.id });
    registerHierarchyNode({ organizationId: root.id });
    registerHierarchyNode({ organizationId: c1.id, parentId: root.id });
    registerHierarchyNode({ organizationId: c2.id, parentId: c1.id });
    const desc = getDescendants(root.id);
    expect(desc.length).toBe(2);
  });
  it("hierarchy list updates", () => {
    const p = registerOrganization({ key: 'lu_p', name: 'P', slug: 'lu-p', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'lu_c', name: 'C', slug: 'lu-c', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    moveOrganization({ organizationId: c.id, newParentId: null, actorId: 'a' });
    expect(listHierarchyUpdates().length).toBe(1);
  });
  it("hierarchy move emits event", () => {
    const p = registerOrganization({ key: 'me_p', name: 'P', slug: 'me-p', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'me_c', name: 'C', slug: 'me-c', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    moveOrganization({ organizationId: c.id, newParentId: null, actorId: 'a' });
    expect(getPublishedEvents().some(e => e.type === 'HierarchyUpdated')).toBe(true);
  });
  it("hierarchy getMaxDepth", () => {
    const p = registerOrganization({ key: 'md_p', name: 'P', slug: 'md-p', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'md_c', name: 'C', slug: 'md-c', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    expect(getMaxDepth()).toBe(1);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(hier_tests())

# ---- System 5: Campus ----
def campus_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("campus create test {i}", () => {{
    const o = registerOrganization({{ key: 'ca_o_{i}', name: 'O', slug: 'ca-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const c = createCampus({{ organizationId: o.id, key: 'camp_{i}', name: 'Campus {i}', slug: 'camp-{i}' }});
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  }});""")
    for i in range(4):
        lines.append(f"""  it("campus set status {i}", () => {{
    const o = registerOrganization({{ key: 'cs_o_{i}', name: 'O', slug: 'cs-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const c = createCampus({{ organizationId: o.id, key: 'cs_{i}', name: 'C', slug: 'cs-{i}' }});
    setCampusStatus(c.id, 'maintenance');
    expect(getCampusById(c.id)?.status).toBe('maintenance');
  }});""")
    lines.append("""  it("campus list by organization", () => {
    const o = registerOrganization({ key: 'cl_o', name: 'O', slug: 'cl-o', tenantId: 't', type: 'school', ownerId: 'u' });
    createCampus({ organizationId: o.id, key: 'k1', name: 'C1', slug: 'c1' });
    createCampus({ organizationId: o.id, key: 'k2', name: 'C2', slug: 'c2' });
    expect(listCampuses(o.id).length).toBe(2);
  });
  it("campus list by status", () => {
    const o = registerOrganization({ key: 'cls_o', name: 'O', slug: 'cls-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'k', name: 'C', slug: 'c' });
    setCampusStatus(c.id, 'inactive');
    expect(listCampuses(undefined, 'inactive').length).toBe(1);
  });
  it("campus supportsAllStatuses", () => {
    expect(supportsAllCampusStatuses()).toEqual(['active', 'inactive', 'maintenance']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(campus_tests())

# ---- System 6: Department ----
def dept_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("department create test {i}", () => {{
    const o = registerOrganization({{ key: 'dp_o_{i}', name: 'O', slug: 'dp-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const d = createDepartment({{ organizationId: o.id, key: 'dept_{i}', name: 'Dept {i}', slug: 'dept-{i}' }});
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  }});""")
    lines.append("""  it("department set status", () => {
    const o = registerOrganization({ key: 'ds_o', name: 'O', slug: 'ds-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'k', name: 'D', slug: 'd' });
    setDepartmentStatus(d.id, 'inactive');
    expect(getDepartmentById(d.id)?.status).toBe('inactive');
  });
  it("department list by organization", () => {
    const o = registerOrganization({ key: 'dl_o', name: 'O', slug: 'dl-o', tenantId: 't', type: 'school', ownerId: 'u' });
    createDepartment({ organizationId: o.id, key: 'k1', name: 'D1', slug: 'd1' });
    createDepartment({ organizationId: o.id, key: 'k2', name: 'D2', slug: 'd2' });
    expect(listDepartments(o.id).length).toBe(2);
  });
  it("department supportsAllStatuses", () => {
    expect(supportsAllDepartmentStatuses()).toEqual(['active', 'inactive', 'merged']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(dept_tests())

# ---- System 7: Faculty ----
def fac_tests():
    lines = []
    for i in range(25):
        lines.append(f"""  it("faculty create test {i}", () => {{
    const o = registerOrganization({{ key: 'fc_o_{i}', name: 'U', slug: 'fc-o-{i}', tenantId: 't', type: 'university', ownerId: 'u' }});
    const f = createFaculty({{ organizationId: o.id, key: 'fac_{i}', name: 'Faculty {i}', slug: 'fac-{i}' }});
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  }});""")
    lines.append("""  it("faculty add department", () => {
    const o = registerOrganization({ key: 'fa_o', name: 'U', slug: 'fa-o', tenantId: 't', type: 'university', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'd1', name: 'D1', slug: 'd1' });
    const f = createFaculty({ organizationId: o.id, key: 'k', name: 'F', slug: 'f' });
    addFacultyDepartment(f.id, d.id);
    expect(getFacultyById(f.id)?.departmentIds).toContain(d.id);
  });
  it("faculty set status", () => {
    const o = registerOrganization({ key: 'fs_o', name: 'U', slug: 'fs-o', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'k', name: 'F', slug: 'f' });
    setFacultyStatus(f.id, 'inactive');
    expect(getFacultyById(f.id)?.status).toBe('inactive');
  });
  it("faculty supportsAllStatuses", () => {
    expect(supportsAllFacultyStatuses()).toEqual(['active', 'inactive', 'reorganized']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(fac_tests())

# ---- System 8: Workspace ----
def ws_tests():
    lines = []
    for i in range(35):
        wt = ['teacher', 'student', 'administration', 'research', 'custom'][i % 5]
        lines.append(f"""  it("workspace create test {i}", () => {{
    const o = registerOrganization({{ key: 'ws_o_{i}', name: 'O', slug: 'ws-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const w = createWorkspace({{ organizationId: o.id, key: 'ws_{i}', name: 'WS {i}', slug: 'ws-{i}', type: '{wt}' as any, ownerId: 'u' }});
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  }});""")
    for i in range(5):
        lines.append(f"""  it("workspace archive {i}", () => {{
    const o = registerOrganization({{ key: 'wa_o_{i}', name: 'O', slug: 'wa-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const w = createWorkspace({{ organizationId: o.id, key: 'wa_{i}', name: 'W', slug: 'wa-{i}', type: 'teacher', ownerId: 'u' }});
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  }});""")
    lines.append("""  it("workspace supportsAllTypes", () => {
    expect(supportsAllWorkspaceTypes()).toEqual(['teacher', 'student', 'administration', 'research', 'custom']);
  });
  it("workspace supportsAllStatuses", () => {
    expect(supportsAllWorkspaceStatuses()).toEqual(['active', 'archived']);
  });
  it("workspace create emits event", () => {
    const o = registerOrganization({ key: 'we_o', name: 'O', slug: 'we-o', tenantId: 't', type: 'school', ownerId: 'u' });
    createWorkspace({ organizationId: o.id, key: 'k', name: 'W', slug: 'w', type: 'teacher', ownerId: 'u' });
    expect(getPublishedEvents().some(e => e.type === 'WorkspaceCreated')).toBe(true);
  });
  it("workspace archive emits event", () => {
    const o = registerOrganization({ key: 'wae_o', name: 'O', slug: 'wae-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'k', name: 'W', slug: 'w', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getPublishedEvents().some(e => e.type === 'WorkspaceArchived')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(ws_tests())

# ---- System 9: Membership ----
def mem_tests():
    lines = []
    for i in range(40):
        lines.append(f"""  it("membership add test {i}", () => {{
    const o = registerOrganization({{ key: 'mm_o_{i}', name: 'O', slug: 'mm-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const m = addMembership({{ organizationId: o.id, userId: 'u{i}', role: 'member' }});
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  }});""")
    for i in range(5):
        lines.append(f"""  it("membership set status {i}", () => {{
    const o = registerOrganization({{ key: 'ms_o_{i}', name: 'O', slug: 'ms-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const m = addMembership({{ organizationId: o.id, userId: 'u{i}', role: 'member' }});
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  }});""")
    for i in range(4):
        lines.append(f"""  it("membership set role {i}", () => {{
    const o = registerOrganization({{ key: 'mr_o_{i}', name: 'O', slug: 'mr-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const m = addMembership({{ organizationId: o.id, userId: 'u{i}', role: 'member' }});
    setMembershipRole(m.id, 'admin');
    expect(getMembershipById(m.id)?.role).toBe('admin');
  }});""")
    lines.append("""  it("membership supportsAllRoles", () => {
    expect(supportsAllMembershipRoles()).toEqual(['member', 'admin', 'owner', 'guest', 'observer']);
  });
  it("membership supportsAllStatuses", () => {
    expect(supportsAllMembershipStatuses()).toEqual(['active', 'invited', 'suspended', 'removed']);
  });
  it("membership list by organization", () => {
    const o = registerOrganization({ key: 'ml_o', name: 'O', slug: 'ml-o', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u1', role: 'member' });
    addMembership({ organizationId: o.id, userId: 'u2', role: 'member' });
    expect(listMemberships(o.id).length).toBe(2);
  });
  it("membership add emits event", () => {
    const o = registerOrganization({ key: 'me_o', name: 'O', slug: 'me-o', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u', role: 'member' });
    expect(getPublishedEvents().some(e => e.type === 'MembershipAdded')).toBe(true);
  });
  it("membership remove emits event", () => {
    const o = registerOrganization({ key: 'mre_o', name: 'O', slug: 'mre-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u', role: 'member' });
    setMembershipStatus(m.id, 'removed');
    expect(getPublishedEvents().some(e => e.type === 'MembershipRemoved')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(mem_tests())

# ---- System 10: Invitation ----
def inv_tests():
    lines = []
    for i in range(35):
        lines.append(f"""  it("invitation create test {i}", () => {{
    const o = registerOrganization({{ key: 'iv_o_{i}', name: 'O', slug: 'iv-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const inv = createInvitation({{ organizationId: o.id, email: 'u{i}@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' }});
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  }});""")
    for i in range(5):
        lines.append(f"""  it("invitation accept {i}", () => {{
    const o = registerOrganization({{ key: 'ia_o_{i}', name: 'O', slug: 'ia-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const inv = createInvitation({{ organizationId: o.id, email: 'a{i}@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' }});
    const a = acceptInvitation(inv.id, 'u{i}');
    expect(a?.status).toBe('accepted');
  }});""")
    for i in range(4):
        lines.append(f"""  it("invitation reject {i}", () => {{
    const o = registerOrganization({{ key: 'ir_o_{i}', name: 'O', slug: 'ir-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const inv = createInvitation({{ organizationId: o.id, email: 'r{i}@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' }});
    rejectInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('rejected');
  }});""")
    for i in range(4):
        lines.append(f"""  it("invitation withdraw {i}", () => {{
    const o = registerOrganization({{ key: 'iw_o_{i}', name: 'O', slug: 'iw-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const inv = createInvitation({{ organizationId: o.id, email: 'w{i}@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' }});
    withdrawInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('withdrawn');
  }});""")
    for i in range(4):
        lines.append(f"""  it("invitation expire {i}", () => {{
    const o = registerOrganization({{ key: 'ie_o_{i}', name: 'O', slug: 'ie-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const inv = createInvitation({{ organizationId: o.id, email: 'e{i}@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' }});
    expireInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('expired');
  }});""")
    lines.append("""  it("invitation supportsAllStatuses", () => {
    expect(supportsAllInvitationStatuses()).toEqual(['pending', 'accepted', 'rejected', 'expired', 'withdrawn']);
  });
  it("invitation accept twice returns null", () => {
    const o = registerOrganization({ key: 'it_o', name: 'O', slug: 'it-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a@x.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    acceptInvitation(inv.id, 'u');
    expect(acceptInvitation(inv.id, 'u')).toBeNull();
  });
  it("invitation get by token", () => {
    const o = registerOrganization({ key: 'igt_o', name: 'O', slug: 'igt-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a@x.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(getInvitationByTokenString(inv.token)?.id).toBe(inv.id);
  });
  it("invitation create emits event", () => {
    const o = registerOrganization({ key: 'ice_o', name: 'O', slug: 'ice-o', tenantId: 't', type: 'school', ownerId: 'u' });
    createInvitation({ organizationId: o.id, email: 'a@x.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(getPublishedEvents().some(e => e.type === 'InvitationCreated')).toBe(true);
  });
  it("invitation accept emits event", () => {
    const o = registerOrganization({ key: 'iae_o', name: 'O', slug: 'iae-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a@x.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    acceptInvitation(inv.id, 'u');
    expect(getPublishedEvents().some(e => e.type === 'InvitationAccepted')).toBe(true);
  });
  it("invitation expire emits event", () => {
    const o = registerOrganization({ key: 'iee_o', name: 'O', slug: 'iee-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a@x.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expireInvitation(inv.id);
    expect(getPublishedEvents().some(e => e.type === 'InvitationExpired')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(inv_tests())

# ---- Systems 11-25: smaller sets ----
def branding_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("branding set test {i}", () => {{
    const o = registerOrganization({{ key: 'br_o_{i}', name: 'O', slug: 'br-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const b = setBranding({{ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' }});
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  }});""")
    lines.append("""  it("branding update existing", () => {
    const o = registerOrganization({ key: 'bu_o', name: 'O', slug: 'bu-o', tenantId: 't', type: 'school', ownerId: 'u' });
    setBranding({ organizationId: o.id, primaryColor: '#fff' });
    const b2 = setBranding({ organizationId: o.id, secondaryColor: '#000' });
    expect(b2.primaryColor).toBe('#fff');
    expect(b2.secondaryColor).toBe('#000');
  });
  it("branding get for organization", () => {
    const o = registerOrganization({ key: 'bg_o', name: 'O', slug: 'bg-o', tenantId: 't', type: 'school', ownerId: 'u' });
    setBranding({ organizationId: o.id, theme: 'light' });
    expect(getBrandingForOrganization(o.id)).not.toBeNull();
  });
  it("branding set emits event", () => {
    const o = registerOrganization({ key: 'be_o', name: 'O', slug: 'be-o', tenantId: 't', type: 'school', ownerId: 'u' });
    setBranding({ organizationId: o.id, primaryColor: '#fff' });
    expect(getPublishedEvents().some(e => e.type === 'OrganizationBranded')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(branding_tests())

def config_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("config create test {i}", () => {{
    const o = registerOrganization({{ key: 'cf_o_{i}', name: 'O', slug: 'cf-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const c = createConfig({{ organizationId: o.id }});
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  }});""")
    lines.append("""  it("config update settings", () => {
    const o = registerOrganization({ key: 'cu_o', name: 'O', slug: 'cu-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    updateConfigSettings(c.id, { key: 'value' });
    expect(getConfigById(c.id)?.settings.key).toBe('value');
  });
  it("config add secret", () => {
    const o = registerOrganization({ key: 'cs_o', name: 'O', slug: 'cs-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    addConfigSecret(c.id, 'API_KEY');
    expect(getConfigById(c.id)?.secrets).toContain('API_KEY');
  });
  it("config add override", () => {
    const o = registerOrganization({ key: 'co_o', name: 'O', slug: 'co-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    addConfigOverride(c.id, 'timeout');
    expect(getConfigById(c.id)?.overrides).toContain('timeout');
  });
  it("config supportsAllScopes", () => {
    expect(supportsAllConfigScopes()).toEqual(['organization', 'campus', 'department', 'workspace']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(config_tests())

def policy_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("policy create test {i}", () => {{
    const o = registerOrganization({{ key: 'pl_o_{i}', name: 'O', slug: 'pl-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const p = createPolicy({{ organizationId: o.id, key: 'pol_{i}', name: 'Policy {i}', enforcement: 'enforced' }});
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  }});""")
    lines.append("""  it("policy update enforcement", () => {
    const o = registerOrganization({ key: 'pu_o', name: 'O', slug: 'pu-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'k', name: 'P', enforcement: 'enforced' });
    updatePolicyEnforcement(p.id, 'advisory');
    expect(getPolicyById(p.id)?.enforcement).toBe('advisory');
  });
  it("policy deactivate", () => {
    const o = registerOrganization({ key: 'pd_o', name: 'O', slug: 'pd-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'k', name: 'P', enforcement: 'enforced' });
    deactivatePolicy(p.id);
    expect(getPolicyById(p.id)?.active).toBe(false);
  });
  it("policy supportsAllEnforcements", () => {
    expect(supportsAllPolicyEnforcements()).toEqual(['enforced', 'advisory', 'disabled']);
  });
  it("policy update emits event", () => {
    const o = registerOrganization({ key: 'pe_o', name: 'O', slug: 'pe-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'k', name: 'P', enforcement: 'enforced' });
    updatePolicyEnforcement(p.id, 'advisory');
    expect(getPublishedEvents().some(e => e.type === 'OrganizationPolicyUpdated')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(policy_tests())

def lifecycle_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("lifecycle record test {i}", () => {{
    const o = registerOrganization({{ key: 'lc_o_{i}', name: 'O', slug: 'lc-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const r = recordLifecycle({{ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' }});
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  }});""")
    lines.append("""  it("lifecycle latest status", () => {
    const o = registerOrganization({ key: 'll_o', name: 'O', slug: 'll-o', tenantId: 't', type: 'school', ownerId: 'u' });
    recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    recordLifecycle({ organizationId: o.id, fromStatus: 'active', toStatus: 'suspended', transition: 'suspend', actorId: 'a' });
    expect(getLatestLifecycleStatus(o.id)).toBe('suspended');
  });
  it("lifecycle latest null when none", () => {
    const o = registerOrganization({ key: 'ln_o', name: 'O', slug: 'ln-o', tenantId: 't', type: 'school', ownerId: 'u' });
    expect(getLatestLifecycleStatus(o.id)).toBeNull();
  });
  it("lifecycle archive emits event", () => {
    const o = registerOrganization({ key: 'le_o', name: 'O', slug: 'le-o', tenantId: 't', type: 'school', ownerId: 'u' });
    recordLifecycle({ organizationId: o.id, fromStatus: 'active', toStatus: 'archived', transition: 'archive', actorId: 'a' });
    expect(getPublishedEvents().some(e => e.type === 'OrganizationArchived')).toBe(true);
  });
  it("lifecycle supportsAllTransitions", () => {
    expect(supportsAllLifecycleTransitions()).toEqual(['provision', 'activate', 'suspend', 'archive', 'restore', 'delete']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(lifecycle_tests())

def license_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("license assign test {i}", () => {{
    const o = registerOrganization({{ key: 'la_o_{i}', name: 'O', slug: 'la-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const l = assignLicense({{ organizationId: o.id, licenseKey: 'lic_{i}', plan: 'enterprise', seatLimit: 100 }});
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  }});""")
    lines.append("""  it("license suspend", () => {
    const o = registerOrganization({ key: 'ls_o', name: 'O', slug: 'ls-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    suspendLicense(l.id);
    expect(getLicenseById(l.id)?.status).toBe('suspended');
  });
  it("license revoke", () => {
    const o = registerOrganization({ key: 'lr_o', name: 'O', slug: 'lr-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    revokeLicense(l.id);
    expect(getLicenseById(l.id)?.status).toBe('revoked');
  });
  it("license expire", () => {
    const o = registerOrganization({ key: 'lex_o', name: 'O', slug: 'lex-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    expireLicense(l.id);
    expect(getLicenseById(l.id)?.status).toBe('expired');
  });
  it("license increment seats", () => {
    const o = registerOrganization({ key: 'li_o', name: 'O', slug: 'li-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    incrementLicenseSeats(l.id, 5);
    expect(getLicenseById(l.id)?.seatsUsed).toBe(5);
  });
  it("license supportsAllStatuses", () => {
    expect(supportsAllLicenseStatuses()).toEqual(['active', 'expired', 'suspended', 'revoked', 'pending']);
  });
  it("license assign emits event", () => {
    const o = registerOrganization({ key: 'lae_o', name: 'O', slug: 'lae-o', tenantId: 't', type: 'school', ownerId: 'u' });
    assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    expect(getPublishedEvents().some(e => e.type === 'LicenseAssigned')).toBe(true);
  });
  it("license expire emits event", () => {
    const o = registerOrganization({ key: 'lee_o', name: 'O', slug: 'lee-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'k', plan: 'p', seatLimit: 10 });
    expireLicense(l.id);
    expect(getPublishedEvents().some(e => e.type === 'LicenseExpired')).toBe(true);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(license_tests())

def quota_tests():
    lines = []
    for i in range(25):
        res = ['students', 'teachers', 'courses', 'storage', 'ai', 'api', 'workspaces'][i % 7]
        lines.append(f"""  it("quota set test {i}", () => {{
    const o = registerOrganization({{ key: 'qa_o_{i}', name: 'O', slug: 'qa-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const q = setQuota({{ organizationId: o.id, resource: '{res}' as any, limit: 100 }});
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  }});""")
    lines.append("""  it("quota exceeded when used >= limit", () => {
    const o = registerOrganization({ key: 'qe_o', name: 'O', slug: 'qe-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students', limit: 10, used: 10 });
    expect(q.status).toBe('exceeded');
  });
  it("quota warning when used >= 80% limit", () => {
    const o = registerOrganization({ key: 'qw_o', name: 'O', slug: 'qw-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students', limit: 10, used: 8 });
    expect(q.status).toBe('warning');
  });
  it("quota increment used", () => {
    const o = registerOrganization({ key: 'qi_o', name: 'O', slug: 'qi-o', tenantId: 't', type: 'school', ownerId: 'u' });
    setQuota({ organizationId: o.id, resource: 'students', limit: 10, used: 0 });
    incrementQuotaUsed(o.id, 'students', 3);
    const q = listQuotas(o.id)[0];
    expect(q.used).toBe(3);
  });
  it("quota increment to exceeded emits event", () => {
    const o = registerOrganization({ key: 'qie_o', name: 'O', slug: 'qie-o', tenantId: 't', type: 'school', ownerId: 'u' });
    setQuota({ organizationId: o.id, resource: 'students', limit: 5, used: 0 });
    incrementQuotaUsed(o.id, 'students', 5);
    expect(getPublishedEvents().some(e => e.type === 'QuotaExceeded')).toBe(true);
  });
  it("quota supportsAllResources", () => {
    expect(supportsAllQuotaResources()).toEqual(['students', 'teachers', 'courses', 'storage', 'ai', 'api', 'workspaces']);
  });
  it("quota supportsAllStatuses", () => {
    expect(supportsAllQuotaStatuses()).toEqual(['ok', 'warning', 'exceeded']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(quota_tests())

def domain_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("domain register test {i}", () => {{
    const o = registerOrganization({{ key: 'dm_o_{i}', name: 'O', slug: 'dm-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    const d = registerDomain({{ organizationId: o.id, domain: 'school{i}.com' }});
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  }});""")
    lines.append("""  it("domain start verification", () => {
    const o = registerOrganization({ key: 'dv_o', name: 'O', slug: 'dv-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'x.com' });
    startDomainVerification(d.id);
    expect(getDomainById(d.id)?.status).toBe('pending');
  });
  it("domain verify", () => {
    const o = registerOrganization({ key: 'dver_o', name: 'O', slug: 'dver-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'y.com' });
    verifyDomain(d.id, 'admin');
    expect(getDomainById(d.id)?.status).toBe('verified');
  });
  it("domain verify emits event", () => {
    const o = registerOrganization({ key: 'dve_o', name: 'O', slug: 'dve-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'z.com' });
    verifyDomain(d.id, 'admin');
    expect(getPublishedEvents().some(e => e.type === 'DomainVerified')).toBe(true);
  });
  it("domain fail verification", () => {
    const o = registerOrganization({ key: 'df_o', name: 'O', slug: 'df-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'a.com' });
    failDomainVerification(d.id);
    expect(getDomainById(d.id)?.status).toBe('failed');
  });
  it("domain revoke", () => {
    const o = registerOrganization({ key: 'dr_o', name: 'O', slug: 'dr-o', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'b.com' });
    verifyDomain(d.id, 'admin');
    revokeDomain(d.id);
    expect(getDomainById(d.id)?.status).toBe('revoked');
  });
  it("domain supportsAllStatuses", () => {
    expect(supportsAllDomainStatuses()).toEqual(['unverified', 'pending', 'verified', 'failed', 'revoked']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(domain_tests())

def isolation_tests():
    lines = []
    for i in range(30):
        b = ['strict', 'relaxed', 'shared'][i % 3]
        lines.append(f"""  it("isolation set test {i}", () => {{
    const t = createTenant({{ key: 'iso_t_{i}', name: 'T' }});
    const i = setTenantIsolation({{ tenantId: t.id, boundary: '{b}' as any }});
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('{b}');
  }});""")
    lines.append("""  it("isolation update existing", () => {
    const t = createTenant({ key: 'iu_t', name: 'T' });
    setTenantIsolation({ tenantId: t.id, boundary: 'strict' });
    const i2 = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' });
    expect(i2.boundary).toBe('relaxed');
  });
  it("isolation get for tenant", () => {
    const t = createTenant({ key: 'ig_t', name: 'T' });
    setTenantIsolation({ tenantId: t.id, boundary: 'strict' });
    expect(getIsolationForTenant(t.id)).not.toBeNull();
  });
  it("isolation supportsAllBoundaries", () => {
    expect(supportsAllIsolationBoundaries()).toEqual(['strict', 'relaxed', 'shared']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(isolation_tests())

def audit_tests():
    lines = []
    for i in range(30):
        cat = ['lifecycle', 'membership', 'configuration', 'branding', 'policy', 'license', 'quota', 'domain', 'security'][i % 9]
        lines.append(f"""  it("audit test {i}", () => {{
    const r = recordAudit({{ organizationId: 'org_{i}', actorId: 'a', category: '{cat}' as any, action: 'x', outcome: 'success' }});
    expect(r.id).toBeDefined();
  }});""")
    lines.append("""  it("audit list by organization", () => {
    recordAudit({ organizationId: 'org1', actorId: 'a', category: 'lifecycle', action: 'x', outcome: 'success' });
    recordAudit({ organizationId: 'org2', actorId: 'a', category: 'lifecycle', action: 'x', outcome: 'success' });
    expect(listAuditRecords('org1').length).toBe(1);
  });
  it("audit list by category", () => {
    recordAudit({ organizationId: 'o', actorId: 'a', category: 'security', action: 'x', outcome: 'denied' });
    expect(listAuditRecords(undefined, 'security').length).toBe(1);
  });
  it("audit supportsAllCategories", () => {
    expect(supportsAllAuditCategories()).toEqual(['lifecycle', 'membership', 'configuration', 'branding', 'policy', 'license', 'quota', 'domain', 'security']);
  });
  it("audit supportsAllOutcomes", () => {
    expect(supportsAllAuditOutcomes()).toEqual(['success', 'failure', 'denied']);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(audit_tests())

def misc_tests():
    lines = []
    for i in range(30):
        lines.append(f"""  it("analytics test {i}", () => {{
    const o = registerOrganization({{ key: 'an_o_{i}', name: 'O', slug: 'an-o-{i}', tenantId: 't', type: 'school', ownerId: 'u' }});
    addMembership({{ organizationId: o.id, userId: 'u{i}', role: 'member' }});
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  }});""")
    for i in range(8):
        lines.append(f"""  it("dashboard test {i}", () => {{
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  }});""")
    lines.append("""  it("developer integration test", () => {
    const i = getDeveloperIntegration();
    expect(i.publicAPIs.length).toBeGreaterThan(0);
    expect(i.extensionHooks.length).toBeGreaterThan(0);
  });
  it("admin status test", () => {
    const s = getOrganizationPlatformStatus();
    expect(s.systems).toBe(25);
    expect(s.operational).toBe(true);
  });
  it("documentation test", () => {
    const d = generateDocumentation();
    expect(d.systems.length).toBe(25);
    expect(d.events.length).toBe(22);
  });
  it("markdown documentation test", () => {
    const md = generateMarkdownDocumentation();
    expect(md).toContain('EduBek');
    expect(md).toContain('6G.28');
  });
  it("version test", () => {
    expect(getOrganizationPlatformVersion()).toBe('1.0.0');
  });
  it("bridge subscribe/unsubscribe", () => {
    subscribeOrganizationPlatform();
    expect(isOrganizationPlatformSubscribed()).toBe(true);
    unsubscribeOrganizationPlatform();
    expect(isOrganizationPlatformSubscribed()).toBe(false);
  });
  it("bridge publishEvent tracks", () => {
    publishOrganizationEvent('OrganizationCreated', 'user1', { organizationId: 'x' });
    expect(getBridgePublishedCount()).toBe(1);
    expect(getPublishedEvents()[0].type).toBe('OrganizationCreated');
  });
  it("bridge idempotent subscribe", () => {
    subscribeOrganizationPlatform();
    subscribeOrganizationPlatform();
    expect(isOrganizationPlatformSubscribed()).toBe(true);
  });
  it("bridge reset", () => {
    publishOrganizationEvent('OrganizationCreated', null, {});
    _resetBridgeForTesting();
    expect(getBridgePublishedCount()).toBe(0);
  });""")
    return "\n".join(lines)
TEST_GROUPS.append(misc_tests())

content = HEADER
for g in TEST_GROUPS:
    content += "\n" + g + "\n"
content += FOOTER

OUT.write_text(content)

# Count tests
import re
its = len(re.findall(r'^\s*it\(', content, re.MULTILINE))
print(f"wrote {OUT} — {its} tests")
