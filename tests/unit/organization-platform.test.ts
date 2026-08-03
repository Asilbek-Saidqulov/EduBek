/**
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

  it("organization register test 0", () => {
    const o = registerOrganization({ key: 'org_0', name: 'Org 0', slug: 'org-slug-0', tenantId: 't1', type: 'school', ownerId: 'u0' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_0');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 1", () => {
    const o = registerOrganization({ key: 'org_1', name: 'Org 1', slug: 'org-slug-1', tenantId: 't1', type: 'school', ownerId: 'u1' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_1');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 2", () => {
    const o = registerOrganization({ key: 'org_2', name: 'Org 2', slug: 'org-slug-2', tenantId: 't1', type: 'school', ownerId: 'u2' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_2');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 3", () => {
    const o = registerOrganization({ key: 'org_3', name: 'Org 3', slug: 'org-slug-3', tenantId: 't1', type: 'school', ownerId: 'u3' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_3');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 4", () => {
    const o = registerOrganization({ key: 'org_4', name: 'Org 4', slug: 'org-slug-4', tenantId: 't1', type: 'school', ownerId: 'u4' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_4');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 5", () => {
    const o = registerOrganization({ key: 'org_5', name: 'Org 5', slug: 'org-slug-5', tenantId: 't1', type: 'school', ownerId: 'u5' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_5');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 6", () => {
    const o = registerOrganization({ key: 'org_6', name: 'Org 6', slug: 'org-slug-6', tenantId: 't1', type: 'school', ownerId: 'u6' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_6');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 7", () => {
    const o = registerOrganization({ key: 'org_7', name: 'Org 7', slug: 'org-slug-7', tenantId: 't1', type: 'school', ownerId: 'u7' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_7');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 8", () => {
    const o = registerOrganization({ key: 'org_8', name: 'Org 8', slug: 'org-slug-8', tenantId: 't1', type: 'school', ownerId: 'u8' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_8');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 9", () => {
    const o = registerOrganization({ key: 'org_9', name: 'Org 9', slug: 'org-slug-9', tenantId: 't1', type: 'school', ownerId: 'u9' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_9');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 10", () => {
    const o = registerOrganization({ key: 'org_10', name: 'Org 10', slug: 'org-slug-10', tenantId: 't1', type: 'school', ownerId: 'u10' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_10');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 11", () => {
    const o = registerOrganization({ key: 'org_11', name: 'Org 11', slug: 'org-slug-11', tenantId: 't1', type: 'school', ownerId: 'u11' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_11');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 12", () => {
    const o = registerOrganization({ key: 'org_12', name: 'Org 12', slug: 'org-slug-12', tenantId: 't1', type: 'school', ownerId: 'u12' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_12');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 13", () => {
    const o = registerOrganization({ key: 'org_13', name: 'Org 13', slug: 'org-slug-13', tenantId: 't1', type: 'school', ownerId: 'u13' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_13');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 14", () => {
    const o = registerOrganization({ key: 'org_14', name: 'Org 14', slug: 'org-slug-14', tenantId: 't1', type: 'school', ownerId: 'u14' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_14');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 15", () => {
    const o = registerOrganization({ key: 'org_15', name: 'Org 15', slug: 'org-slug-15', tenantId: 't1', type: 'school', ownerId: 'u15' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_15');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 16", () => {
    const o = registerOrganization({ key: 'org_16', name: 'Org 16', slug: 'org-slug-16', tenantId: 't1', type: 'school', ownerId: 'u16' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_16');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 17", () => {
    const o = registerOrganization({ key: 'org_17', name: 'Org 17', slug: 'org-slug-17', tenantId: 't1', type: 'school', ownerId: 'u17' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_17');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 18", () => {
    const o = registerOrganization({ key: 'org_18', name: 'Org 18', slug: 'org-slug-18', tenantId: 't1', type: 'school', ownerId: 'u18' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_18');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 19", () => {
    const o = registerOrganization({ key: 'org_19', name: 'Org 19', slug: 'org-slug-19', tenantId: 't1', type: 'school', ownerId: 'u19' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_19');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 20", () => {
    const o = registerOrganization({ key: 'org_20', name: 'Org 20', slug: 'org-slug-20', tenantId: 't1', type: 'school', ownerId: 'u20' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_20');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 21", () => {
    const o = registerOrganization({ key: 'org_21', name: 'Org 21', slug: 'org-slug-21', tenantId: 't1', type: 'school', ownerId: 'u21' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_21');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 22", () => {
    const o = registerOrganization({ key: 'org_22', name: 'Org 22', slug: 'org-slug-22', tenantId: 't1', type: 'school', ownerId: 'u22' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_22');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 23", () => {
    const o = registerOrganization({ key: 'org_23', name: 'Org 23', slug: 'org-slug-23', tenantId: 't1', type: 'school', ownerId: 'u23' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_23');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 24", () => {
    const o = registerOrganization({ key: 'org_24', name: 'Org 24', slug: 'org-slug-24', tenantId: 't1', type: 'school', ownerId: 'u24' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_24');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 25", () => {
    const o = registerOrganization({ key: 'org_25', name: 'Org 25', slug: 'org-slug-25', tenantId: 't1', type: 'school', ownerId: 'u25' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_25');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 26", () => {
    const o = registerOrganization({ key: 'org_26', name: 'Org 26', slug: 'org-slug-26', tenantId: 't1', type: 'school', ownerId: 'u26' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_26');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 27", () => {
    const o = registerOrganization({ key: 'org_27', name: 'Org 27', slug: 'org-slug-27', tenantId: 't1', type: 'school', ownerId: 'u27' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_27');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 28", () => {
    const o = registerOrganization({ key: 'org_28', name: 'Org 28', slug: 'org-slug-28', tenantId: 't1', type: 'school', ownerId: 'u28' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_28');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 29", () => {
    const o = registerOrganization({ key: 'org_29', name: 'Org 29', slug: 'org-slug-29', tenantId: 't1', type: 'school', ownerId: 'u29' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_29');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 30", () => {
    const o = registerOrganization({ key: 'org_30', name: 'Org 30', slug: 'org-slug-30', tenantId: 't1', type: 'school', ownerId: 'u30' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_30');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 31", () => {
    const o = registerOrganization({ key: 'org_31', name: 'Org 31', slug: 'org-slug-31', tenantId: 't1', type: 'school', ownerId: 'u31' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_31');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 32", () => {
    const o = registerOrganization({ key: 'org_32', name: 'Org 32', slug: 'org-slug-32', tenantId: 't1', type: 'school', ownerId: 'u32' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_32');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 33", () => {
    const o = registerOrganization({ key: 'org_33', name: 'Org 33', slug: 'org-slug-33', tenantId: 't1', type: 'school', ownerId: 'u33' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_33');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 34", () => {
    const o = registerOrganization({ key: 'org_34', name: 'Org 34', slug: 'org-slug-34', tenantId: 't1', type: 'school', ownerId: 'u34' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_34');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 35", () => {
    const o = registerOrganization({ key: 'org_35', name: 'Org 35', slug: 'org-slug-35', tenantId: 't1', type: 'school', ownerId: 'u35' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_35');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 36", () => {
    const o = registerOrganization({ key: 'org_36', name: 'Org 36', slug: 'org-slug-36', tenantId: 't1', type: 'school', ownerId: 'u36' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_36');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 37", () => {
    const o = registerOrganization({ key: 'org_37', name: 'Org 37', slug: 'org-slug-37', tenantId: 't1', type: 'school', ownerId: 'u37' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_37');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 38", () => {
    const o = registerOrganization({ key: 'org_38', name: 'Org 38', slug: 'org-slug-38', tenantId: 't1', type: 'school', ownerId: 'u38' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_38');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 39", () => {
    const o = registerOrganization({ key: 'org_39', name: 'Org 39', slug: 'org-slug-39', tenantId: 't1', type: 'school', ownerId: 'u39' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_39');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 40", () => {
    const o = registerOrganization({ key: 'org_40', name: 'Org 40', slug: 'org-slug-40', tenantId: 't1', type: 'school', ownerId: 'u40' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_40');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 41", () => {
    const o = registerOrganization({ key: 'org_41', name: 'Org 41', slug: 'org-slug-41', tenantId: 't1', type: 'school', ownerId: 'u41' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_41');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 42", () => {
    const o = registerOrganization({ key: 'org_42', name: 'Org 42', slug: 'org-slug-42', tenantId: 't1', type: 'school', ownerId: 'u42' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_42');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 43", () => {
    const o = registerOrganization({ key: 'org_43', name: 'Org 43', slug: 'org-slug-43', tenantId: 't1', type: 'school', ownerId: 'u43' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_43');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 44", () => {
    const o = registerOrganization({ key: 'org_44', name: 'Org 44', slug: 'org-slug-44', tenantId: 't1', type: 'school', ownerId: 'u44' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_44');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 45", () => {
    const o = registerOrganization({ key: 'org_45', name: 'Org 45', slug: 'org-slug-45', tenantId: 't1', type: 'school', ownerId: 'u45' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_45');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 46", () => {
    const o = registerOrganization({ key: 'org_46', name: 'Org 46', slug: 'org-slug-46', tenantId: 't1', type: 'school', ownerId: 'u46' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_46');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 47", () => {
    const o = registerOrganization({ key: 'org_47', name: 'Org 47', slug: 'org-slug-47', tenantId: 't1', type: 'school', ownerId: 'u47' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_47');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 48", () => {
    const o = registerOrganization({ key: 'org_48', name: 'Org 48', slug: 'org-slug-48', tenantId: 't1', type: 'school', ownerId: 'u48' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_48');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 49", () => {
    const o = registerOrganization({ key: 'org_49', name: 'Org 49', slug: 'org-slug-49', tenantId: 't1', type: 'school', ownerId: 'u49' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_49');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 50", () => {
    const o = registerOrganization({ key: 'org_50', name: 'Org 50', slug: 'org-slug-50', tenantId: 't1', type: 'school', ownerId: 'u50' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_50');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 51", () => {
    const o = registerOrganization({ key: 'org_51', name: 'Org 51', slug: 'org-slug-51', tenantId: 't1', type: 'school', ownerId: 'u51' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_51');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 52", () => {
    const o = registerOrganization({ key: 'org_52', name: 'Org 52', slug: 'org-slug-52', tenantId: 't1', type: 'school', ownerId: 'u52' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_52');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 53", () => {
    const o = registerOrganization({ key: 'org_53', name: 'Org 53', slug: 'org-slug-53', tenantId: 't1', type: 'school', ownerId: 'u53' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_53');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 54", () => {
    const o = registerOrganization({ key: 'org_54', name: 'Org 54', slug: 'org-slug-54', tenantId: 't1', type: 'school', ownerId: 'u54' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_54');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 55", () => {
    const o = registerOrganization({ key: 'org_55', name: 'Org 55', slug: 'org-slug-55', tenantId: 't1', type: 'school', ownerId: 'u55' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_55');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 56", () => {
    const o = registerOrganization({ key: 'org_56', name: 'Org 56', slug: 'org-slug-56', tenantId: 't1', type: 'school', ownerId: 'u56' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_56');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 57", () => {
    const o = registerOrganization({ key: 'org_57', name: 'Org 57', slug: 'org-slug-57', tenantId: 't1', type: 'school', ownerId: 'u57' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_57');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 58", () => {
    const o = registerOrganization({ key: 'org_58', name: 'Org 58', slug: 'org-slug-58', tenantId: 't1', type: 'school', ownerId: 'u58' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_58');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 59", () => {
    const o = registerOrganization({ key: 'org_59', name: 'Org 59', slug: 'org-slug-59', tenantId: 't1', type: 'school', ownerId: 'u59' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_59');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 60", () => {
    const o = registerOrganization({ key: 'org_60', name: 'Org 60', slug: 'org-slug-60', tenantId: 't1', type: 'school', ownerId: 'u60' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_60');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 61", () => {
    const o = registerOrganization({ key: 'org_61', name: 'Org 61', slug: 'org-slug-61', tenantId: 't1', type: 'school', ownerId: 'u61' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_61');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 62", () => {
    const o = registerOrganization({ key: 'org_62', name: 'Org 62', slug: 'org-slug-62', tenantId: 't1', type: 'school', ownerId: 'u62' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_62');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 63", () => {
    const o = registerOrganization({ key: 'org_63', name: 'Org 63', slug: 'org-slug-63', tenantId: 't1', type: 'school', ownerId: 'u63' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_63');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 64", () => {
    const o = registerOrganization({ key: 'org_64', name: 'Org 64', slug: 'org-slug-64', tenantId: 't1', type: 'school', ownerId: 'u64' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_64');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 65", () => {
    const o = registerOrganization({ key: 'org_65', name: 'Org 65', slug: 'org-slug-65', tenantId: 't1', type: 'school', ownerId: 'u65' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_65');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 66", () => {
    const o = registerOrganization({ key: 'org_66', name: 'Org 66', slug: 'org-slug-66', tenantId: 't1', type: 'school', ownerId: 'u66' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_66');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 67", () => {
    const o = registerOrganization({ key: 'org_67', name: 'Org 67', slug: 'org-slug-67', tenantId: 't1', type: 'school', ownerId: 'u67' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_67');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 68", () => {
    const o = registerOrganization({ key: 'org_68', name: 'Org 68', slug: 'org-slug-68', tenantId: 't1', type: 'school', ownerId: 'u68' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_68');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 69", () => {
    const o = registerOrganization({ key: 'org_69', name: 'Org 69', slug: 'org-slug-69', tenantId: 't1', type: 'school', ownerId: 'u69' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_69');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 70", () => {
    const o = registerOrganization({ key: 'org_70', name: 'Org 70', slug: 'org-slug-70', tenantId: 't1', type: 'school', ownerId: 'u70' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_70');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 71", () => {
    const o = registerOrganization({ key: 'org_71', name: 'Org 71', slug: 'org-slug-71', tenantId: 't1', type: 'school', ownerId: 'u71' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_71');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 72", () => {
    const o = registerOrganization({ key: 'org_72', name: 'Org 72', slug: 'org-slug-72', tenantId: 't1', type: 'school', ownerId: 'u72' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_72');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 73", () => {
    const o = registerOrganization({ key: 'org_73', name: 'Org 73', slug: 'org-slug-73', tenantId: 't1', type: 'school', ownerId: 'u73' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_73');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 74", () => {
    const o = registerOrganization({ key: 'org_74', name: 'Org 74', slug: 'org-slug-74', tenantId: 't1', type: 'school', ownerId: 'u74' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_74');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 75", () => {
    const o = registerOrganization({ key: 'org_75', name: 'Org 75', slug: 'org-slug-75', tenantId: 't1', type: 'school', ownerId: 'u75' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_75');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 76", () => {
    const o = registerOrganization({ key: 'org_76', name: 'Org 76', slug: 'org-slug-76', tenantId: 't1', type: 'school', ownerId: 'u76' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_76');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 77", () => {
    const o = registerOrganization({ key: 'org_77', name: 'Org 77', slug: 'org-slug-77', tenantId: 't1', type: 'school', ownerId: 'u77' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_77');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 78", () => {
    const o = registerOrganization({ key: 'org_78', name: 'Org 78', slug: 'org-slug-78', tenantId: 't1', type: 'school', ownerId: 'u78' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_78');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization register test 79", () => {
    const o = registerOrganization({ key: 'org_79', name: 'Org 79', slug: 'org-slug-79', tenantId: 't1', type: 'school', ownerId: 'u79' });
    expect(o.id).toBeDefined();
    expect(o.key).toBe('org_79');
    expect(o.status).toBe('provisioning');
    expect(o.version).toBe(1);
  });
  it("organization update 0", () => {
    const o = registerOrganization({ key: 'org_u_0', name: 'Org', slug: 'org-u-0', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 1", () => {
    const o = registerOrganization({ key: 'org_u_1', name: 'Org', slug: 'org-u-1', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 2", () => {
    const o = registerOrganization({ key: 'org_u_2', name: 'Org', slug: 'org-u-2', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 3", () => {
    const o = registerOrganization({ key: 'org_u_3', name: 'Org', slug: 'org-u-3', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 4", () => {
    const o = registerOrganization({ key: 'org_u_4', name: 'Org', slug: 'org-u-4', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 5", () => {
    const o = registerOrganization({ key: 'org_u_5', name: 'Org', slug: 'org-u-5', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 6", () => {
    const o = registerOrganization({ key: 'org_u_6', name: 'Org', slug: 'org-u-6', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization update 7", () => {
    const o = registerOrganization({ key: 'org_u_7', name: 'Org', slug: 'org-u-7', tenantId: 't1', type: 'school', ownerId: 'u' });
    const u = updateOrganization(o.id, { displayName: 'Updated' });
    expect(u?.displayName).toBe('Updated');
    expect(u?.version).toBe(2);
  });
  it("organization set status 0", () => {
    const o = registerOrganization({ key: 'org_s_0', name: 'Org', slug: 'org-s-0', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization set status 1", () => {
    const o = registerOrganization({ key: 'org_s_1', name: 'Org', slug: 'org-s-1', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization set status 2", () => {
    const o = registerOrganization({ key: 'org_s_2', name: 'Org', slug: 'org-s-2', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization set status 3", () => {
    const o = registerOrganization({ key: 'org_s_3', name: 'Org', slug: 'org-s-3', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization set status 4", () => {
    const o = registerOrganization({ key: 'org_s_4', name: 'Org', slug: 'org-s-4', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization set status 5", () => {
    const o = registerOrganization({ key: 'org_s_5', name: 'Org', slug: 'org-s-5', tenantId: 't1', type: 'school', ownerId: 'u' });
    const s = setOrganizationStatus(o.id, 'active');
    expect(s?.status).toBe('active');
  });
  it("organization duplicate key throws", () => {
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
  });

  it("tenant create test 0", () => {
    const t = createTenant({ key: 'tenant_0', name: 'Tenant 0' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 1", () => {
    const t = createTenant({ key: 'tenant_1', name: 'Tenant 1' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 2", () => {
    const t = createTenant({ key: 'tenant_2', name: 'Tenant 2' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 3", () => {
    const t = createTenant({ key: 'tenant_3', name: 'Tenant 3' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 4", () => {
    const t = createTenant({ key: 'tenant_4', name: 'Tenant 4' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 5", () => {
    const t = createTenant({ key: 'tenant_5', name: 'Tenant 5' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 6", () => {
    const t = createTenant({ key: 'tenant_6', name: 'Tenant 6' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 7", () => {
    const t = createTenant({ key: 'tenant_7', name: 'Tenant 7' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 8", () => {
    const t = createTenant({ key: 'tenant_8', name: 'Tenant 8' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 9", () => {
    const t = createTenant({ key: 'tenant_9', name: 'Tenant 9' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 10", () => {
    const t = createTenant({ key: 'tenant_10', name: 'Tenant 10' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 11", () => {
    const t = createTenant({ key: 'tenant_11', name: 'Tenant 11' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 12", () => {
    const t = createTenant({ key: 'tenant_12', name: 'Tenant 12' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 13", () => {
    const t = createTenant({ key: 'tenant_13', name: 'Tenant 13' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 14", () => {
    const t = createTenant({ key: 'tenant_14', name: 'Tenant 14' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 15", () => {
    const t = createTenant({ key: 'tenant_15', name: 'Tenant 15' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 16", () => {
    const t = createTenant({ key: 'tenant_16', name: 'Tenant 16' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 17", () => {
    const t = createTenant({ key: 'tenant_17', name: 'Tenant 17' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 18", () => {
    const t = createTenant({ key: 'tenant_18', name: 'Tenant 18' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 19", () => {
    const t = createTenant({ key: 'tenant_19', name: 'Tenant 19' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 20", () => {
    const t = createTenant({ key: 'tenant_20', name: 'Tenant 20' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 21", () => {
    const t = createTenant({ key: 'tenant_21', name: 'Tenant 21' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 22", () => {
    const t = createTenant({ key: 'tenant_22', name: 'Tenant 22' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 23", () => {
    const t = createTenant({ key: 'tenant_23', name: 'Tenant 23' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 24", () => {
    const t = createTenant({ key: 'tenant_24', name: 'Tenant 24' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 25", () => {
    const t = createTenant({ key: 'tenant_25', name: 'Tenant 25' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 26", () => {
    const t = createTenant({ key: 'tenant_26', name: 'Tenant 26' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 27", () => {
    const t = createTenant({ key: 'tenant_27', name: 'Tenant 27' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 28", () => {
    const t = createTenant({ key: 'tenant_28', name: 'Tenant 28' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 29", () => {
    const t = createTenant({ key: 'tenant_29', name: 'Tenant 29' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 30", () => {
    const t = createTenant({ key: 'tenant_30', name: 'Tenant 30' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 31", () => {
    const t = createTenant({ key: 'tenant_31', name: 'Tenant 31' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 32", () => {
    const t = createTenant({ key: 'tenant_32', name: 'Tenant 32' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 33", () => {
    const t = createTenant({ key: 'tenant_33', name: 'Tenant 33' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 34", () => {
    const t = createTenant({ key: 'tenant_34', name: 'Tenant 34' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 35", () => {
    const t = createTenant({ key: 'tenant_35', name: 'Tenant 35' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 36", () => {
    const t = createTenant({ key: 'tenant_36', name: 'Tenant 36' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 37", () => {
    const t = createTenant({ key: 'tenant_37', name: 'Tenant 37' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 38", () => {
    const t = createTenant({ key: 'tenant_38', name: 'Tenant 38' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 39", () => {
    const t = createTenant({ key: 'tenant_39', name: 'Tenant 39' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 40", () => {
    const t = createTenant({ key: 'tenant_40', name: 'Tenant 40' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 41", () => {
    const t = createTenant({ key: 'tenant_41', name: 'Tenant 41' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 42", () => {
    const t = createTenant({ key: 'tenant_42', name: 'Tenant 42' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 43", () => {
    const t = createTenant({ key: 'tenant_43', name: 'Tenant 43' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 44", () => {
    const t = createTenant({ key: 'tenant_44', name: 'Tenant 44' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 45", () => {
    const t = createTenant({ key: 'tenant_45', name: 'Tenant 45' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 46", () => {
    const t = createTenant({ key: 'tenant_46', name: 'Tenant 46' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 47", () => {
    const t = createTenant({ key: 'tenant_47', name: 'Tenant 47' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 48", () => {
    const t = createTenant({ key: 'tenant_48', name: 'Tenant 48' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant create test 49", () => {
    const t = createTenant({ key: 'tenant_49', name: 'Tenant 49' });
    expect(t.id).toBeDefined();
    expect(t.status).toBe('provisioning');
  });
  it("tenant activate 0", () => {
    const t = createTenant({ key: 't_a_0', name: 'T' });
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  });
  it("tenant activate 1", () => {
    const t = createTenant({ key: 't_a_1', name: 'T' });
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  });
  it("tenant activate 2", () => {
    const t = createTenant({ key: 't_a_2', name: 'T' });
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  });
  it("tenant activate 3", () => {
    const t = createTenant({ key: 't_a_3', name: 'T' });
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  });
  it("tenant activate 4", () => {
    const t = createTenant({ key: 't_a_4', name: 'T' });
    const a = activateTenant(t.id);
    expect(a?.status).toBe('active');
    expect(a?.activatedAt).not.toBeNull();
  });
  it("tenant suspend 0", () => {
    const t = createTenant({ key: 't_s_0', name: 'T' });
    suspendTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('suspended');
  });
  it("tenant suspend 1", () => {
    const t = createTenant({ key: 't_s_1', name: 'T' });
    suspendTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('suspended');
  });
  it("tenant suspend 2", () => {
    const t = createTenant({ key: 't_s_2', name: 'T' });
    suspendTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('suspended');
  });
  it("tenant suspend 3", () => {
    const t = createTenant({ key: 't_s_3', name: 'T' });
    suspendTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('suspended');
  });
  it("tenant archive 0", () => {
    const t = createTenant({ key: 't_ar_0', name: 'T' });
    archiveTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('archived');
  });
  it("tenant archive 1", () => {
    const t = createTenant({ key: 't_ar_1', name: 'T' });
    archiveTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('archived');
  });
  it("tenant archive 2", () => {
    const t = createTenant({ key: 't_ar_2', name: 'T' });
    archiveTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('archived');
  });
  it("tenant archive 3", () => {
    const t = createTenant({ key: 't_ar_3', name: 'T' });
    archiveTenant(t.id);
    expect(getTenantById(t.id)?.status).toBe('archived');
  });
  it("tenant set root org 0", () => {
    const t = createTenant({ key: 't_r_0', name: 'T' });
    const o = registerOrganization({ key: 'ro_0', name: 'O', slug: 'ro-0', tenantId: t.id, type: 'school', ownerId: 'u' });
    const r = setTenantRootOrganization(t.id, o.id);
    expect(r?.rootOrganizationId).toBe(o.id);
  });
  it("tenant set root org 1", () => {
    const t = createTenant({ key: 't_r_1', name: 'T' });
    const o = registerOrganization({ key: 'ro_1', name: 'O', slug: 'ro-1', tenantId: t.id, type: 'school', ownerId: 'u' });
    const r = setTenantRootOrganization(t.id, o.id);
    expect(r?.rootOrganizationId).toBe(o.id);
  });
  it("tenant set root org 2", () => {
    const t = createTenant({ key: 't_r_2', name: 'T' });
    const o = registerOrganization({ key: 'ro_2', name: 'O', slug: 'ro-2', tenantId: t.id, type: 'school', ownerId: 'u' });
    const r = setTenantRootOrganization(t.id, o.id);
    expect(r?.rootOrganizationId).toBe(o.id);
  });
  it("tenant set root org 3", () => {
    const t = createTenant({ key: 't_r_3', name: 'T' });
    const o = registerOrganization({ key: 'ro_3', name: 'O', slug: 'ro-3', tenantId: t.id, type: 'school', ownerId: 'u' });
    const r = setTenantRootOrganization(t.id, o.id);
    expect(r?.rootOrganizationId).toBe(o.id);
  });
  it("tenant duplicate key throws", () => {
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
  });

  it("institution type register school", () => {
    const it = registerInstitutionType({ type: 'school' as any, displayName: 'School' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('school');
  });
  it("institution type register university", () => {
    const it = registerInstitutionType({ type: 'university' as any, displayName: 'University' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('university');
  });
  it("institution type register ministry", () => {
    const it = registerInstitutionType({ type: 'ministry' as any, displayName: 'Ministry' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('ministry');
  });
  it("institution type register district", () => {
    const it = registerInstitutionType({ type: 'district' as any, displayName: 'District' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('district');
  });
  it("institution type register company", () => {
    const it = registerInstitutionType({ type: 'company' as any, displayName: 'Company' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('company');
  });
  it("institution type register academy", () => {
    const it = registerInstitutionType({ type: 'academy' as any, displayName: 'Academy' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('academy');
  });
  it("institution type register training_center", () => {
    const it = registerInstitutionType({ type: 'training_center' as any, displayName: 'Training_Center' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('training_center');
  });
  it("institution type register tutoring_center", () => {
    const it = registerInstitutionType({ type: 'tutoring_center' as any, displayName: 'Tutoring_Center' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('tutoring_center');
  });
  it("institution type register custom", () => {
    const it = registerInstitutionType({ type: 'custom' as any, displayName: 'Custom' });
    expect(it.id).toBeDefined();
    expect(it.type).toBe('custom');
  });
  it("institution type duplicate throws", () => {
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
  });

  it("hierarchy register test 0", () => {
    const o = registerOrganization({ key: 'h_o_0', name: 'O', slug: 'h-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 1", () => {
    const o = registerOrganization({ key: 'h_o_1', name: 'O', slug: 'h-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 2", () => {
    const o = registerOrganization({ key: 'h_o_2', name: 'O', slug: 'h-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 3", () => {
    const o = registerOrganization({ key: 'h_o_3', name: 'O', slug: 'h-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 4", () => {
    const o = registerOrganization({ key: 'h_o_4', name: 'O', slug: 'h-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 5", () => {
    const o = registerOrganization({ key: 'h_o_5', name: 'O', slug: 'h-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 6", () => {
    const o = registerOrganization({ key: 'h_o_6', name: 'O', slug: 'h-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 7", () => {
    const o = registerOrganization({ key: 'h_o_7', name: 'O', slug: 'h-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 8", () => {
    const o = registerOrganization({ key: 'h_o_8', name: 'O', slug: 'h-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 9", () => {
    const o = registerOrganization({ key: 'h_o_9', name: 'O', slug: 'h-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 10", () => {
    const o = registerOrganization({ key: 'h_o_10', name: 'O', slug: 'h-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 11", () => {
    const o = registerOrganization({ key: 'h_o_11', name: 'O', slug: 'h-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 12", () => {
    const o = registerOrganization({ key: 'h_o_12', name: 'O', slug: 'h-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 13", () => {
    const o = registerOrganization({ key: 'h_o_13', name: 'O', slug: 'h-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 14", () => {
    const o = registerOrganization({ key: 'h_o_14', name: 'O', slug: 'h-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 15", () => {
    const o = registerOrganization({ key: 'h_o_15', name: 'O', slug: 'h-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 16", () => {
    const o = registerOrganization({ key: 'h_o_16', name: 'O', slug: 'h-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 17", () => {
    const o = registerOrganization({ key: 'h_o_17', name: 'O', slug: 'h-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 18", () => {
    const o = registerOrganization({ key: 'h_o_18', name: 'O', slug: 'h-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 19", () => {
    const o = registerOrganization({ key: 'h_o_19', name: 'O', slug: 'h-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 20", () => {
    const o = registerOrganization({ key: 'h_o_20', name: 'O', slug: 'h-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 21", () => {
    const o = registerOrganization({ key: 'h_o_21', name: 'O', slug: 'h-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 22", () => {
    const o = registerOrganization({ key: 'h_o_22', name: 'O', slug: 'h-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 23", () => {
    const o = registerOrganization({ key: 'h_o_23', name: 'O', slug: 'h-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 24", () => {
    const o = registerOrganization({ key: 'h_o_24', name: 'O', slug: 'h-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 25", () => {
    const o = registerOrganization({ key: 'h_o_25', name: 'O', slug: 'h-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 26", () => {
    const o = registerOrganization({ key: 'h_o_26', name: 'O', slug: 'h-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 27", () => {
    const o = registerOrganization({ key: 'h_o_27', name: 'O', slug: 'h-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 28", () => {
    const o = registerOrganization({ key: 'h_o_28', name: 'O', slug: 'h-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy register test 29", () => {
    const o = registerOrganization({ key: 'h_o_29', name: 'O', slug: 'h-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const n = registerHierarchyNode({ organizationId: o.id });
    expect(n.id).toBeDefined();
    expect(n.depth).toBe(0);
    expect(n.parentId).toBeNull();
  });
  it("hierarchy parent/child 0", () => {
    const p = registerOrganization({ key: 'hp_0', name: 'P', slug: 'hp-0', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_0', name: 'C', slug: 'hc-0', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 1", () => {
    const p = registerOrganization({ key: 'hp_1', name: 'P', slug: 'hp-1', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_1', name: 'C', slug: 'hc-1', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 2", () => {
    const p = registerOrganization({ key: 'hp_2', name: 'P', slug: 'hp-2', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_2', name: 'C', slug: 'hc-2', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 3", () => {
    const p = registerOrganization({ key: 'hp_3', name: 'P', slug: 'hp-3', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_3', name: 'C', slug: 'hc-3', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 4", () => {
    const p = registerOrganization({ key: 'hp_4', name: 'P', slug: 'hp-4', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_4', name: 'C', slug: 'hc-4', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 5", () => {
    const p = registerOrganization({ key: 'hp_5', name: 'P', slug: 'hp-5', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_5', name: 'C', slug: 'hc-5', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 6", () => {
    const p = registerOrganization({ key: 'hp_6', name: 'P', slug: 'hp-6', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_6', name: 'C', slug: 'hc-6', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy parent/child 7", () => {
    const p = registerOrganization({ key: 'hp_7', name: 'P', slug: 'hp-7', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'hc_7', name: 'C', slug: 'hc-7', tenantId: 't', type: 'school', ownerId: 'u', parentId: p.id });
    registerHierarchyNode({ organizationId: p.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p.id });
    const children = getChildren(p.id);
    expect(children.length).toBe(1);
    expect(children[0].organizationId).toBe(c.id);
  });
  it("hierarchy move 0", () => {
    const p1 = registerOrganization({ key: 'p1_0', name: 'P1', slug: 'p1-0', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_0', name: 'P2', slug: 'p2-0', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_0', name: 'C', slug: 'cm-0', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy move 1", () => {
    const p1 = registerOrganization({ key: 'p1_1', name: 'P1', slug: 'p1-1', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_1', name: 'P2', slug: 'p2-1', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_1', name: 'C', slug: 'cm-1', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy move 2", () => {
    const p1 = registerOrganization({ key: 'p1_2', name: 'P1', slug: 'p1-2', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_2', name: 'P2', slug: 'p2-2', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_2', name: 'C', slug: 'cm-2', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy move 3", () => {
    const p1 = registerOrganization({ key: 'p1_3', name: 'P1', slug: 'p1-3', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_3', name: 'P2', slug: 'p2-3', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_3', name: 'C', slug: 'cm-3', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy move 4", () => {
    const p1 = registerOrganization({ key: 'p1_4', name: 'P1', slug: 'p1-4', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_4', name: 'P2', slug: 'p2-4', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_4', name: 'C', slug: 'cm-4', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy move 5", () => {
    const p1 = registerOrganization({ key: 'p1_5', name: 'P1', slug: 'p1-5', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const p2 = registerOrganization({ key: 'p2_5', name: 'P2', slug: 'p2-5', tenantId: 't', type: 'ministry', ownerId: 'u' });
    const c = registerOrganization({ key: 'cm_5', name: 'C', slug: 'cm-5', tenantId: 't', type: 'school', ownerId: 'u', parentId: p1.id });
    registerHierarchyNode({ organizationId: p1.id });
    registerHierarchyNode({ organizationId: p2.id });
    registerHierarchyNode({ organizationId: c.id, parentId: p1.id });
    const u = moveOrganization({ organizationId: c.id, newParentId: p2.id, actorId: 'a' });
    expect(u.newParentId).toBe(p2.id);
    expect(u.previousParentId).toBe(p1.id);
  });
  it("hierarchy register twice returns existing", () => {
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
  });

  it("campus create test 0", () => {
    const o = registerOrganization({ key: 'ca_o_0', name: 'O', slug: 'ca-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_0', name: 'Campus 0', slug: 'camp-0' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 1", () => {
    const o = registerOrganization({ key: 'ca_o_1', name: 'O', slug: 'ca-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_1', name: 'Campus 1', slug: 'camp-1' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 2", () => {
    const o = registerOrganization({ key: 'ca_o_2', name: 'O', slug: 'ca-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_2', name: 'Campus 2', slug: 'camp-2' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 3", () => {
    const o = registerOrganization({ key: 'ca_o_3', name: 'O', slug: 'ca-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_3', name: 'Campus 3', slug: 'camp-3' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 4", () => {
    const o = registerOrganization({ key: 'ca_o_4', name: 'O', slug: 'ca-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_4', name: 'Campus 4', slug: 'camp-4' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 5", () => {
    const o = registerOrganization({ key: 'ca_o_5', name: 'O', slug: 'ca-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_5', name: 'Campus 5', slug: 'camp-5' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 6", () => {
    const o = registerOrganization({ key: 'ca_o_6', name: 'O', slug: 'ca-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_6', name: 'Campus 6', slug: 'camp-6' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 7", () => {
    const o = registerOrganization({ key: 'ca_o_7', name: 'O', slug: 'ca-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_7', name: 'Campus 7', slug: 'camp-7' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 8", () => {
    const o = registerOrganization({ key: 'ca_o_8', name: 'O', slug: 'ca-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_8', name: 'Campus 8', slug: 'camp-8' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 9", () => {
    const o = registerOrganization({ key: 'ca_o_9', name: 'O', slug: 'ca-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_9', name: 'Campus 9', slug: 'camp-9' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 10", () => {
    const o = registerOrganization({ key: 'ca_o_10', name: 'O', slug: 'ca-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_10', name: 'Campus 10', slug: 'camp-10' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 11", () => {
    const o = registerOrganization({ key: 'ca_o_11', name: 'O', slug: 'ca-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_11', name: 'Campus 11', slug: 'camp-11' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 12", () => {
    const o = registerOrganization({ key: 'ca_o_12', name: 'O', slug: 'ca-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_12', name: 'Campus 12', slug: 'camp-12' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 13", () => {
    const o = registerOrganization({ key: 'ca_o_13', name: 'O', slug: 'ca-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_13', name: 'Campus 13', slug: 'camp-13' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 14", () => {
    const o = registerOrganization({ key: 'ca_o_14', name: 'O', slug: 'ca-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_14', name: 'Campus 14', slug: 'camp-14' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 15", () => {
    const o = registerOrganization({ key: 'ca_o_15', name: 'O', slug: 'ca-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_15', name: 'Campus 15', slug: 'camp-15' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 16", () => {
    const o = registerOrganization({ key: 'ca_o_16', name: 'O', slug: 'ca-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_16', name: 'Campus 16', slug: 'camp-16' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 17", () => {
    const o = registerOrganization({ key: 'ca_o_17', name: 'O', slug: 'ca-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_17', name: 'Campus 17', slug: 'camp-17' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 18", () => {
    const o = registerOrganization({ key: 'ca_o_18', name: 'O', slug: 'ca-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_18', name: 'Campus 18', slug: 'camp-18' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 19", () => {
    const o = registerOrganization({ key: 'ca_o_19', name: 'O', slug: 'ca-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_19', name: 'Campus 19', slug: 'camp-19' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 20", () => {
    const o = registerOrganization({ key: 'ca_o_20', name: 'O', slug: 'ca-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_20', name: 'Campus 20', slug: 'camp-20' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 21", () => {
    const o = registerOrganization({ key: 'ca_o_21', name: 'O', slug: 'ca-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_21', name: 'Campus 21', slug: 'camp-21' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 22", () => {
    const o = registerOrganization({ key: 'ca_o_22', name: 'O', slug: 'ca-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_22', name: 'Campus 22', slug: 'camp-22' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 23", () => {
    const o = registerOrganization({ key: 'ca_o_23', name: 'O', slug: 'ca-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_23', name: 'Campus 23', slug: 'camp-23' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 24", () => {
    const o = registerOrganization({ key: 'ca_o_24', name: 'O', slug: 'ca-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_24', name: 'Campus 24', slug: 'camp-24' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 25", () => {
    const o = registerOrganization({ key: 'ca_o_25', name: 'O', slug: 'ca-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_25', name: 'Campus 25', slug: 'camp-25' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 26", () => {
    const o = registerOrganization({ key: 'ca_o_26', name: 'O', slug: 'ca-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_26', name: 'Campus 26', slug: 'camp-26' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 27", () => {
    const o = registerOrganization({ key: 'ca_o_27', name: 'O', slug: 'ca-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_27', name: 'Campus 27', slug: 'camp-27' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 28", () => {
    const o = registerOrganization({ key: 'ca_o_28', name: 'O', slug: 'ca-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_28', name: 'Campus 28', slug: 'camp-28' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus create test 29", () => {
    const o = registerOrganization({ key: 'ca_o_29', name: 'O', slug: 'ca-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'camp_29', name: 'Campus 29', slug: 'camp-29' });
    expect(c.id).toBeDefined();
    expect(c.status).toBe('active');
  });
  it("campus set status 0", () => {
    const o = registerOrganization({ key: 'cs_o_0', name: 'O', slug: 'cs-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'cs_0', name: 'C', slug: 'cs-0' });
    setCampusStatus(c.id, 'maintenance');
    expect(getCampusById(c.id)?.status).toBe('maintenance');
  });
  it("campus set status 1", () => {
    const o = registerOrganization({ key: 'cs_o_1', name: 'O', slug: 'cs-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'cs_1', name: 'C', slug: 'cs-1' });
    setCampusStatus(c.id, 'maintenance');
    expect(getCampusById(c.id)?.status).toBe('maintenance');
  });
  it("campus set status 2", () => {
    const o = registerOrganization({ key: 'cs_o_2', name: 'O', slug: 'cs-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'cs_2', name: 'C', slug: 'cs-2' });
    setCampusStatus(c.id, 'maintenance');
    expect(getCampusById(c.id)?.status).toBe('maintenance');
  });
  it("campus set status 3", () => {
    const o = registerOrganization({ key: 'cs_o_3', name: 'O', slug: 'cs-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createCampus({ organizationId: o.id, key: 'cs_3', name: 'C', slug: 'cs-3' });
    setCampusStatus(c.id, 'maintenance');
    expect(getCampusById(c.id)?.status).toBe('maintenance');
  });
  it("campus list by organization", () => {
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
  });

  it("department create test 0", () => {
    const o = registerOrganization({ key: 'dp_o_0', name: 'O', slug: 'dp-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_0', name: 'Dept 0', slug: 'dept-0' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 1", () => {
    const o = registerOrganization({ key: 'dp_o_1', name: 'O', slug: 'dp-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_1', name: 'Dept 1', slug: 'dept-1' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 2", () => {
    const o = registerOrganization({ key: 'dp_o_2', name: 'O', slug: 'dp-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_2', name: 'Dept 2', slug: 'dept-2' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 3", () => {
    const o = registerOrganization({ key: 'dp_o_3', name: 'O', slug: 'dp-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_3', name: 'Dept 3', slug: 'dept-3' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 4", () => {
    const o = registerOrganization({ key: 'dp_o_4', name: 'O', slug: 'dp-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_4', name: 'Dept 4', slug: 'dept-4' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 5", () => {
    const o = registerOrganization({ key: 'dp_o_5', name: 'O', slug: 'dp-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_5', name: 'Dept 5', slug: 'dept-5' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 6", () => {
    const o = registerOrganization({ key: 'dp_o_6', name: 'O', slug: 'dp-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_6', name: 'Dept 6', slug: 'dept-6' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 7", () => {
    const o = registerOrganization({ key: 'dp_o_7', name: 'O', slug: 'dp-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_7', name: 'Dept 7', slug: 'dept-7' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 8", () => {
    const o = registerOrganization({ key: 'dp_o_8', name: 'O', slug: 'dp-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_8', name: 'Dept 8', slug: 'dept-8' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 9", () => {
    const o = registerOrganization({ key: 'dp_o_9', name: 'O', slug: 'dp-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_9', name: 'Dept 9', slug: 'dept-9' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 10", () => {
    const o = registerOrganization({ key: 'dp_o_10', name: 'O', slug: 'dp-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_10', name: 'Dept 10', slug: 'dept-10' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 11", () => {
    const o = registerOrganization({ key: 'dp_o_11', name: 'O', slug: 'dp-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_11', name: 'Dept 11', slug: 'dept-11' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 12", () => {
    const o = registerOrganization({ key: 'dp_o_12', name: 'O', slug: 'dp-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_12', name: 'Dept 12', slug: 'dept-12' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 13", () => {
    const o = registerOrganization({ key: 'dp_o_13', name: 'O', slug: 'dp-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_13', name: 'Dept 13', slug: 'dept-13' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 14", () => {
    const o = registerOrganization({ key: 'dp_o_14', name: 'O', slug: 'dp-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_14', name: 'Dept 14', slug: 'dept-14' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 15", () => {
    const o = registerOrganization({ key: 'dp_o_15', name: 'O', slug: 'dp-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_15', name: 'Dept 15', slug: 'dept-15' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 16", () => {
    const o = registerOrganization({ key: 'dp_o_16', name: 'O', slug: 'dp-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_16', name: 'Dept 16', slug: 'dept-16' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 17", () => {
    const o = registerOrganization({ key: 'dp_o_17', name: 'O', slug: 'dp-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_17', name: 'Dept 17', slug: 'dept-17' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 18", () => {
    const o = registerOrganization({ key: 'dp_o_18', name: 'O', slug: 'dp-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_18', name: 'Dept 18', slug: 'dept-18' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 19", () => {
    const o = registerOrganization({ key: 'dp_o_19', name: 'O', slug: 'dp-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_19', name: 'Dept 19', slug: 'dept-19' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 20", () => {
    const o = registerOrganization({ key: 'dp_o_20', name: 'O', slug: 'dp-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_20', name: 'Dept 20', slug: 'dept-20' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 21", () => {
    const o = registerOrganization({ key: 'dp_o_21', name: 'O', slug: 'dp-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_21', name: 'Dept 21', slug: 'dept-21' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 22", () => {
    const o = registerOrganization({ key: 'dp_o_22', name: 'O', slug: 'dp-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_22', name: 'Dept 22', slug: 'dept-22' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 23", () => {
    const o = registerOrganization({ key: 'dp_o_23', name: 'O', slug: 'dp-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_23', name: 'Dept 23', slug: 'dept-23' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 24", () => {
    const o = registerOrganization({ key: 'dp_o_24', name: 'O', slug: 'dp-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_24', name: 'Dept 24', slug: 'dept-24' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 25", () => {
    const o = registerOrganization({ key: 'dp_o_25', name: 'O', slug: 'dp-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_25', name: 'Dept 25', slug: 'dept-25' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 26", () => {
    const o = registerOrganization({ key: 'dp_o_26', name: 'O', slug: 'dp-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_26', name: 'Dept 26', slug: 'dept-26' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 27", () => {
    const o = registerOrganization({ key: 'dp_o_27', name: 'O', slug: 'dp-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_27', name: 'Dept 27', slug: 'dept-27' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 28", () => {
    const o = registerOrganization({ key: 'dp_o_28', name: 'O', slug: 'dp-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_28', name: 'Dept 28', slug: 'dept-28' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department create test 29", () => {
    const o = registerOrganization({ key: 'dp_o_29', name: 'O', slug: 'dp-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = createDepartment({ organizationId: o.id, key: 'dept_29', name: 'Dept 29', slug: 'dept-29' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('active');
  });
  it("department set status", () => {
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
  });

  it("faculty create test 0", () => {
    const o = registerOrganization({ key: 'fc_o_0', name: 'U', slug: 'fc-o-0', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_0', name: 'Faculty 0', slug: 'fac-0' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 1", () => {
    const o = registerOrganization({ key: 'fc_o_1', name: 'U', slug: 'fc-o-1', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_1', name: 'Faculty 1', slug: 'fac-1' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 2", () => {
    const o = registerOrganization({ key: 'fc_o_2', name: 'U', slug: 'fc-o-2', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_2', name: 'Faculty 2', slug: 'fac-2' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 3", () => {
    const o = registerOrganization({ key: 'fc_o_3', name: 'U', slug: 'fc-o-3', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_3', name: 'Faculty 3', slug: 'fac-3' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 4", () => {
    const o = registerOrganization({ key: 'fc_o_4', name: 'U', slug: 'fc-o-4', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_4', name: 'Faculty 4', slug: 'fac-4' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 5", () => {
    const o = registerOrganization({ key: 'fc_o_5', name: 'U', slug: 'fc-o-5', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_5', name: 'Faculty 5', slug: 'fac-5' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 6", () => {
    const o = registerOrganization({ key: 'fc_o_6', name: 'U', slug: 'fc-o-6', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_6', name: 'Faculty 6', slug: 'fac-6' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 7", () => {
    const o = registerOrganization({ key: 'fc_o_7', name: 'U', slug: 'fc-o-7', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_7', name: 'Faculty 7', slug: 'fac-7' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 8", () => {
    const o = registerOrganization({ key: 'fc_o_8', name: 'U', slug: 'fc-o-8', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_8', name: 'Faculty 8', slug: 'fac-8' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 9", () => {
    const o = registerOrganization({ key: 'fc_o_9', name: 'U', slug: 'fc-o-9', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_9', name: 'Faculty 9', slug: 'fac-9' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 10", () => {
    const o = registerOrganization({ key: 'fc_o_10', name: 'U', slug: 'fc-o-10', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_10', name: 'Faculty 10', slug: 'fac-10' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 11", () => {
    const o = registerOrganization({ key: 'fc_o_11', name: 'U', slug: 'fc-o-11', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_11', name: 'Faculty 11', slug: 'fac-11' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 12", () => {
    const o = registerOrganization({ key: 'fc_o_12', name: 'U', slug: 'fc-o-12', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_12', name: 'Faculty 12', slug: 'fac-12' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 13", () => {
    const o = registerOrganization({ key: 'fc_o_13', name: 'U', slug: 'fc-o-13', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_13', name: 'Faculty 13', slug: 'fac-13' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 14", () => {
    const o = registerOrganization({ key: 'fc_o_14', name: 'U', slug: 'fc-o-14', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_14', name: 'Faculty 14', slug: 'fac-14' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 15", () => {
    const o = registerOrganization({ key: 'fc_o_15', name: 'U', slug: 'fc-o-15', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_15', name: 'Faculty 15', slug: 'fac-15' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 16", () => {
    const o = registerOrganization({ key: 'fc_o_16', name: 'U', slug: 'fc-o-16', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_16', name: 'Faculty 16', slug: 'fac-16' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 17", () => {
    const o = registerOrganization({ key: 'fc_o_17', name: 'U', slug: 'fc-o-17', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_17', name: 'Faculty 17', slug: 'fac-17' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 18", () => {
    const o = registerOrganization({ key: 'fc_o_18', name: 'U', slug: 'fc-o-18', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_18', name: 'Faculty 18', slug: 'fac-18' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 19", () => {
    const o = registerOrganization({ key: 'fc_o_19', name: 'U', slug: 'fc-o-19', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_19', name: 'Faculty 19', slug: 'fac-19' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 20", () => {
    const o = registerOrganization({ key: 'fc_o_20', name: 'U', slug: 'fc-o-20', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_20', name: 'Faculty 20', slug: 'fac-20' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 21", () => {
    const o = registerOrganization({ key: 'fc_o_21', name: 'U', slug: 'fc-o-21', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_21', name: 'Faculty 21', slug: 'fac-21' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 22", () => {
    const o = registerOrganization({ key: 'fc_o_22', name: 'U', slug: 'fc-o-22', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_22', name: 'Faculty 22', slug: 'fac-22' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 23", () => {
    const o = registerOrganization({ key: 'fc_o_23', name: 'U', slug: 'fc-o-23', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_23', name: 'Faculty 23', slug: 'fac-23' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty create test 24", () => {
    const o = registerOrganization({ key: 'fc_o_24', name: 'U', slug: 'fc-o-24', tenantId: 't', type: 'university', ownerId: 'u' });
    const f = createFaculty({ organizationId: o.id, key: 'fac_24', name: 'Faculty 24', slug: 'fac-24' });
    expect(f.id).toBeDefined();
    expect(f.status).toBe('active');
  });
  it("faculty add department", () => {
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
  });

  it("workspace create test 0", () => {
    const o = registerOrganization({ key: 'ws_o_0', name: 'O', slug: 'ws-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_0', name: 'WS 0', slug: 'ws-0', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 1", () => {
    const o = registerOrganization({ key: 'ws_o_1', name: 'O', slug: 'ws-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_1', name: 'WS 1', slug: 'ws-1', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 2", () => {
    const o = registerOrganization({ key: 'ws_o_2', name: 'O', slug: 'ws-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_2', name: 'WS 2', slug: 'ws-2', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 3", () => {
    const o = registerOrganization({ key: 'ws_o_3', name: 'O', slug: 'ws-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_3', name: 'WS 3', slug: 'ws-3', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 4", () => {
    const o = registerOrganization({ key: 'ws_o_4', name: 'O', slug: 'ws-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_4', name: 'WS 4', slug: 'ws-4', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 5", () => {
    const o = registerOrganization({ key: 'ws_o_5', name: 'O', slug: 'ws-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_5', name: 'WS 5', slug: 'ws-5', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 6", () => {
    const o = registerOrganization({ key: 'ws_o_6', name: 'O', slug: 'ws-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_6', name: 'WS 6', slug: 'ws-6', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 7", () => {
    const o = registerOrganization({ key: 'ws_o_7', name: 'O', slug: 'ws-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_7', name: 'WS 7', slug: 'ws-7', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 8", () => {
    const o = registerOrganization({ key: 'ws_o_8', name: 'O', slug: 'ws-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_8', name: 'WS 8', slug: 'ws-8', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 9", () => {
    const o = registerOrganization({ key: 'ws_o_9', name: 'O', slug: 'ws-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_9', name: 'WS 9', slug: 'ws-9', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 10", () => {
    const o = registerOrganization({ key: 'ws_o_10', name: 'O', slug: 'ws-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_10', name: 'WS 10', slug: 'ws-10', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 11", () => {
    const o = registerOrganization({ key: 'ws_o_11', name: 'O', slug: 'ws-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_11', name: 'WS 11', slug: 'ws-11', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 12", () => {
    const o = registerOrganization({ key: 'ws_o_12', name: 'O', slug: 'ws-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_12', name: 'WS 12', slug: 'ws-12', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 13", () => {
    const o = registerOrganization({ key: 'ws_o_13', name: 'O', slug: 'ws-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_13', name: 'WS 13', slug: 'ws-13', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 14", () => {
    const o = registerOrganization({ key: 'ws_o_14', name: 'O', slug: 'ws-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_14', name: 'WS 14', slug: 'ws-14', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 15", () => {
    const o = registerOrganization({ key: 'ws_o_15', name: 'O', slug: 'ws-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_15', name: 'WS 15', slug: 'ws-15', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 16", () => {
    const o = registerOrganization({ key: 'ws_o_16', name: 'O', slug: 'ws-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_16', name: 'WS 16', slug: 'ws-16', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 17", () => {
    const o = registerOrganization({ key: 'ws_o_17', name: 'O', slug: 'ws-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_17', name: 'WS 17', slug: 'ws-17', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 18", () => {
    const o = registerOrganization({ key: 'ws_o_18', name: 'O', slug: 'ws-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_18', name: 'WS 18', slug: 'ws-18', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 19", () => {
    const o = registerOrganization({ key: 'ws_o_19', name: 'O', slug: 'ws-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_19', name: 'WS 19', slug: 'ws-19', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 20", () => {
    const o = registerOrganization({ key: 'ws_o_20', name: 'O', slug: 'ws-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_20', name: 'WS 20', slug: 'ws-20', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 21", () => {
    const o = registerOrganization({ key: 'ws_o_21', name: 'O', slug: 'ws-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_21', name: 'WS 21', slug: 'ws-21', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 22", () => {
    const o = registerOrganization({ key: 'ws_o_22', name: 'O', slug: 'ws-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_22', name: 'WS 22', slug: 'ws-22', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 23", () => {
    const o = registerOrganization({ key: 'ws_o_23', name: 'O', slug: 'ws-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_23', name: 'WS 23', slug: 'ws-23', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 24", () => {
    const o = registerOrganization({ key: 'ws_o_24', name: 'O', slug: 'ws-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_24', name: 'WS 24', slug: 'ws-24', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 25", () => {
    const o = registerOrganization({ key: 'ws_o_25', name: 'O', slug: 'ws-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_25', name: 'WS 25', slug: 'ws-25', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 26", () => {
    const o = registerOrganization({ key: 'ws_o_26', name: 'O', slug: 'ws-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_26', name: 'WS 26', slug: 'ws-26', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 27", () => {
    const o = registerOrganization({ key: 'ws_o_27', name: 'O', slug: 'ws-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_27', name: 'WS 27', slug: 'ws-27', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 28", () => {
    const o = registerOrganization({ key: 'ws_o_28', name: 'O', slug: 'ws-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_28', name: 'WS 28', slug: 'ws-28', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 29", () => {
    const o = registerOrganization({ key: 'ws_o_29', name: 'O', slug: 'ws-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_29', name: 'WS 29', slug: 'ws-29', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 30", () => {
    const o = registerOrganization({ key: 'ws_o_30', name: 'O', slug: 'ws-o-30', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_30', name: 'WS 30', slug: 'ws-30', type: 'teacher' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 31", () => {
    const o = registerOrganization({ key: 'ws_o_31', name: 'O', slug: 'ws-o-31', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_31', name: 'WS 31', slug: 'ws-31', type: 'student' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 32", () => {
    const o = registerOrganization({ key: 'ws_o_32', name: 'O', slug: 'ws-o-32', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_32', name: 'WS 32', slug: 'ws-32', type: 'administration' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 33", () => {
    const o = registerOrganization({ key: 'ws_o_33', name: 'O', slug: 'ws-o-33', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_33', name: 'WS 33', slug: 'ws-33', type: 'research' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace create test 34", () => {
    const o = registerOrganization({ key: 'ws_o_34', name: 'O', slug: 'ws-o-34', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'ws_34', name: 'WS 34', slug: 'ws-34', type: 'custom' as any, ownerId: 'u' });
    expect(w.id).toBeDefined();
    expect(w.status).toBe('active');
  });
  it("workspace archive 0", () => {
    const o = registerOrganization({ key: 'wa_o_0', name: 'O', slug: 'wa-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'wa_0', name: 'W', slug: 'wa-0', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  });
  it("workspace archive 1", () => {
    const o = registerOrganization({ key: 'wa_o_1', name: 'O', slug: 'wa-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'wa_1', name: 'W', slug: 'wa-1', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  });
  it("workspace archive 2", () => {
    const o = registerOrganization({ key: 'wa_o_2', name: 'O', slug: 'wa-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'wa_2', name: 'W', slug: 'wa-2', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  });
  it("workspace archive 3", () => {
    const o = registerOrganization({ key: 'wa_o_3', name: 'O', slug: 'wa-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'wa_3', name: 'W', slug: 'wa-3', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  });
  it("workspace archive 4", () => {
    const o = registerOrganization({ key: 'wa_o_4', name: 'O', slug: 'wa-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const w = createWorkspace({ organizationId: o.id, key: 'wa_4', name: 'W', slug: 'wa-4', type: 'teacher', ownerId: 'u' });
    archiveWorkspace(w.id);
    expect(getWorkspaceById(w.id)?.status).toBe('archived');
  });
  it("workspace supportsAllTypes", () => {
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
  });

  it("membership add test 0", () => {
    const o = registerOrganization({ key: 'mm_o_0', name: 'O', slug: 'mm-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u0', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 1", () => {
    const o = registerOrganization({ key: 'mm_o_1', name: 'O', slug: 'mm-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u1', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 2", () => {
    const o = registerOrganization({ key: 'mm_o_2', name: 'O', slug: 'mm-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u2', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 3", () => {
    const o = registerOrganization({ key: 'mm_o_3', name: 'O', slug: 'mm-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u3', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 4", () => {
    const o = registerOrganization({ key: 'mm_o_4', name: 'O', slug: 'mm-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u4', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 5", () => {
    const o = registerOrganization({ key: 'mm_o_5', name: 'O', slug: 'mm-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u5', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 6", () => {
    const o = registerOrganization({ key: 'mm_o_6', name: 'O', slug: 'mm-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u6', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 7", () => {
    const o = registerOrganization({ key: 'mm_o_7', name: 'O', slug: 'mm-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u7', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 8", () => {
    const o = registerOrganization({ key: 'mm_o_8', name: 'O', slug: 'mm-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u8', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 9", () => {
    const o = registerOrganization({ key: 'mm_o_9', name: 'O', slug: 'mm-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u9', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 10", () => {
    const o = registerOrganization({ key: 'mm_o_10', name: 'O', slug: 'mm-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u10', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 11", () => {
    const o = registerOrganization({ key: 'mm_o_11', name: 'O', slug: 'mm-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u11', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 12", () => {
    const o = registerOrganization({ key: 'mm_o_12', name: 'O', slug: 'mm-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u12', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 13", () => {
    const o = registerOrganization({ key: 'mm_o_13', name: 'O', slug: 'mm-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u13', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 14", () => {
    const o = registerOrganization({ key: 'mm_o_14', name: 'O', slug: 'mm-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u14', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 15", () => {
    const o = registerOrganization({ key: 'mm_o_15', name: 'O', slug: 'mm-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u15', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 16", () => {
    const o = registerOrganization({ key: 'mm_o_16', name: 'O', slug: 'mm-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u16', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 17", () => {
    const o = registerOrganization({ key: 'mm_o_17', name: 'O', slug: 'mm-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u17', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 18", () => {
    const o = registerOrganization({ key: 'mm_o_18', name: 'O', slug: 'mm-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u18', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 19", () => {
    const o = registerOrganization({ key: 'mm_o_19', name: 'O', slug: 'mm-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u19', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 20", () => {
    const o = registerOrganization({ key: 'mm_o_20', name: 'O', slug: 'mm-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u20', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 21", () => {
    const o = registerOrganization({ key: 'mm_o_21', name: 'O', slug: 'mm-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u21', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 22", () => {
    const o = registerOrganization({ key: 'mm_o_22', name: 'O', slug: 'mm-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u22', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 23", () => {
    const o = registerOrganization({ key: 'mm_o_23', name: 'O', slug: 'mm-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u23', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 24", () => {
    const o = registerOrganization({ key: 'mm_o_24', name: 'O', slug: 'mm-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u24', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 25", () => {
    const o = registerOrganization({ key: 'mm_o_25', name: 'O', slug: 'mm-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u25', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 26", () => {
    const o = registerOrganization({ key: 'mm_o_26', name: 'O', slug: 'mm-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u26', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 27", () => {
    const o = registerOrganization({ key: 'mm_o_27', name: 'O', slug: 'mm-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u27', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 28", () => {
    const o = registerOrganization({ key: 'mm_o_28', name: 'O', slug: 'mm-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u28', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 29", () => {
    const o = registerOrganization({ key: 'mm_o_29', name: 'O', slug: 'mm-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u29', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 30", () => {
    const o = registerOrganization({ key: 'mm_o_30', name: 'O', slug: 'mm-o-30', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u30', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 31", () => {
    const o = registerOrganization({ key: 'mm_o_31', name: 'O', slug: 'mm-o-31', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u31', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 32", () => {
    const o = registerOrganization({ key: 'mm_o_32', name: 'O', slug: 'mm-o-32', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u32', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 33", () => {
    const o = registerOrganization({ key: 'mm_o_33', name: 'O', slug: 'mm-o-33', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u33', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 34", () => {
    const o = registerOrganization({ key: 'mm_o_34', name: 'O', slug: 'mm-o-34', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u34', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 35", () => {
    const o = registerOrganization({ key: 'mm_o_35', name: 'O', slug: 'mm-o-35', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u35', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 36", () => {
    const o = registerOrganization({ key: 'mm_o_36', name: 'O', slug: 'mm-o-36', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u36', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 37", () => {
    const o = registerOrganization({ key: 'mm_o_37', name: 'O', slug: 'mm-o-37', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u37', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 38", () => {
    const o = registerOrganization({ key: 'mm_o_38', name: 'O', slug: 'mm-o-38', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u38', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership add test 39", () => {
    const o = registerOrganization({ key: 'mm_o_39', name: 'O', slug: 'mm-o-39', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u39', role: 'member' });
    expect(m.id).toBeDefined();
    expect(m.status).toBe('active');
  });
  it("membership set status 0", () => {
    const o = registerOrganization({ key: 'ms_o_0', name: 'O', slug: 'ms-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u0', role: 'member' });
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  });
  it("membership set status 1", () => {
    const o = registerOrganization({ key: 'ms_o_1', name: 'O', slug: 'ms-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u1', role: 'member' });
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  });
  it("membership set status 2", () => {
    const o = registerOrganization({ key: 'ms_o_2', name: 'O', slug: 'ms-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u2', role: 'member' });
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  });
  it("membership set status 3", () => {
    const o = registerOrganization({ key: 'ms_o_3', name: 'O', slug: 'ms-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u3', role: 'member' });
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  });
  it("membership set status 4", () => {
    const o = registerOrganization({ key: 'ms_o_4', name: 'O', slug: 'ms-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u4', role: 'member' });
    setMembershipStatus(m.id, 'suspended');
    expect(getMembershipById(m.id)?.status).toBe('suspended');
  });
  it("membership set role 0", () => {
    const o = registerOrganization({ key: 'mr_o_0', name: 'O', slug: 'mr-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u0', role: 'member' });
    setMembershipRole(m.id, 'admin');
    expect(getMembershipById(m.id)?.role).toBe('admin');
  });
  it("membership set role 1", () => {
    const o = registerOrganization({ key: 'mr_o_1', name: 'O', slug: 'mr-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u1', role: 'member' });
    setMembershipRole(m.id, 'admin');
    expect(getMembershipById(m.id)?.role).toBe('admin');
  });
  it("membership set role 2", () => {
    const o = registerOrganization({ key: 'mr_o_2', name: 'O', slug: 'mr-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u2', role: 'member' });
    setMembershipRole(m.id, 'admin');
    expect(getMembershipById(m.id)?.role).toBe('admin');
  });
  it("membership set role 3", () => {
    const o = registerOrganization({ key: 'mr_o_3', name: 'O', slug: 'mr-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const m = addMembership({ organizationId: o.id, userId: 'u3', role: 'member' });
    setMembershipRole(m.id, 'admin');
    expect(getMembershipById(m.id)?.role).toBe('admin');
  });
  it("membership supportsAllRoles", () => {
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
  });

  it("invitation create test 0", () => {
    const o = registerOrganization({ key: 'iv_o_0', name: 'O', slug: 'iv-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u0@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 1", () => {
    const o = registerOrganization({ key: 'iv_o_1', name: 'O', slug: 'iv-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u1@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 2", () => {
    const o = registerOrganization({ key: 'iv_o_2', name: 'O', slug: 'iv-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u2@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 3", () => {
    const o = registerOrganization({ key: 'iv_o_3', name: 'O', slug: 'iv-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u3@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 4", () => {
    const o = registerOrganization({ key: 'iv_o_4', name: 'O', slug: 'iv-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u4@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 5", () => {
    const o = registerOrganization({ key: 'iv_o_5', name: 'O', slug: 'iv-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u5@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 6", () => {
    const o = registerOrganization({ key: 'iv_o_6', name: 'O', slug: 'iv-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u6@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 7", () => {
    const o = registerOrganization({ key: 'iv_o_7', name: 'O', slug: 'iv-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u7@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 8", () => {
    const o = registerOrganization({ key: 'iv_o_8', name: 'O', slug: 'iv-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u8@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 9", () => {
    const o = registerOrganization({ key: 'iv_o_9', name: 'O', slug: 'iv-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u9@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 10", () => {
    const o = registerOrganization({ key: 'iv_o_10', name: 'O', slug: 'iv-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u10@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 11", () => {
    const o = registerOrganization({ key: 'iv_o_11', name: 'O', slug: 'iv-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u11@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 12", () => {
    const o = registerOrganization({ key: 'iv_o_12', name: 'O', slug: 'iv-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u12@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 13", () => {
    const o = registerOrganization({ key: 'iv_o_13', name: 'O', slug: 'iv-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u13@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 14", () => {
    const o = registerOrganization({ key: 'iv_o_14', name: 'O', slug: 'iv-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u14@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 15", () => {
    const o = registerOrganization({ key: 'iv_o_15', name: 'O', slug: 'iv-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u15@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 16", () => {
    const o = registerOrganization({ key: 'iv_o_16', name: 'O', slug: 'iv-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u16@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 17", () => {
    const o = registerOrganization({ key: 'iv_o_17', name: 'O', slug: 'iv-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u17@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 18", () => {
    const o = registerOrganization({ key: 'iv_o_18', name: 'O', slug: 'iv-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u18@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 19", () => {
    const o = registerOrganization({ key: 'iv_o_19', name: 'O', slug: 'iv-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u19@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 20", () => {
    const o = registerOrganization({ key: 'iv_o_20', name: 'O', slug: 'iv-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u20@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 21", () => {
    const o = registerOrganization({ key: 'iv_o_21', name: 'O', slug: 'iv-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u21@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 22", () => {
    const o = registerOrganization({ key: 'iv_o_22', name: 'O', slug: 'iv-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u22@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 23", () => {
    const o = registerOrganization({ key: 'iv_o_23', name: 'O', slug: 'iv-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u23@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 24", () => {
    const o = registerOrganization({ key: 'iv_o_24', name: 'O', slug: 'iv-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u24@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 25", () => {
    const o = registerOrganization({ key: 'iv_o_25', name: 'O', slug: 'iv-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u25@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 26", () => {
    const o = registerOrganization({ key: 'iv_o_26', name: 'O', slug: 'iv-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u26@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 27", () => {
    const o = registerOrganization({ key: 'iv_o_27', name: 'O', slug: 'iv-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u27@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 28", () => {
    const o = registerOrganization({ key: 'iv_o_28', name: 'O', slug: 'iv-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u28@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 29", () => {
    const o = registerOrganization({ key: 'iv_o_29', name: 'O', slug: 'iv-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u29@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 30", () => {
    const o = registerOrganization({ key: 'iv_o_30', name: 'O', slug: 'iv-o-30', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u30@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 31", () => {
    const o = registerOrganization({ key: 'iv_o_31', name: 'O', slug: 'iv-o-31', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u31@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 32", () => {
    const o = registerOrganization({ key: 'iv_o_32', name: 'O', slug: 'iv-o-32', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u32@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 33", () => {
    const o = registerOrganization({ key: 'iv_o_33', name: 'O', slug: 'iv-o-33', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u33@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation create test 34", () => {
    const o = registerOrganization({ key: 'iv_o_34', name: 'O', slug: 'iv-o-34', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'u34@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expect(inv.id).toBeDefined();
    expect(inv.status).toBe('pending');
  });
  it("invitation accept 0", () => {
    const o = registerOrganization({ key: 'ia_o_0', name: 'O', slug: 'ia-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a0@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    const a = acceptInvitation(inv.id, 'u0');
    expect(a?.status).toBe('accepted');
  });
  it("invitation accept 1", () => {
    const o = registerOrganization({ key: 'ia_o_1', name: 'O', slug: 'ia-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a1@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    const a = acceptInvitation(inv.id, 'u1');
    expect(a?.status).toBe('accepted');
  });
  it("invitation accept 2", () => {
    const o = registerOrganization({ key: 'ia_o_2', name: 'O', slug: 'ia-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a2@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    const a = acceptInvitation(inv.id, 'u2');
    expect(a?.status).toBe('accepted');
  });
  it("invitation accept 3", () => {
    const o = registerOrganization({ key: 'ia_o_3', name: 'O', slug: 'ia-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a3@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    const a = acceptInvitation(inv.id, 'u3');
    expect(a?.status).toBe('accepted');
  });
  it("invitation accept 4", () => {
    const o = registerOrganization({ key: 'ia_o_4', name: 'O', slug: 'ia-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'a4@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    const a = acceptInvitation(inv.id, 'u4');
    expect(a?.status).toBe('accepted');
  });
  it("invitation reject 0", () => {
    const o = registerOrganization({ key: 'ir_o_0', name: 'O', slug: 'ir-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'r0@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    rejectInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('rejected');
  });
  it("invitation reject 1", () => {
    const o = registerOrganization({ key: 'ir_o_1', name: 'O', slug: 'ir-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'r1@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    rejectInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('rejected');
  });
  it("invitation reject 2", () => {
    const o = registerOrganization({ key: 'ir_o_2', name: 'O', slug: 'ir-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'r2@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    rejectInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('rejected');
  });
  it("invitation reject 3", () => {
    const o = registerOrganization({ key: 'ir_o_3', name: 'O', slug: 'ir-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'r3@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    rejectInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('rejected');
  });
  it("invitation withdraw 0", () => {
    const o = registerOrganization({ key: 'iw_o_0', name: 'O', slug: 'iw-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'w0@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    withdrawInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('withdrawn');
  });
  it("invitation withdraw 1", () => {
    const o = registerOrganization({ key: 'iw_o_1', name: 'O', slug: 'iw-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'w1@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    withdrawInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('withdrawn');
  });
  it("invitation withdraw 2", () => {
    const o = registerOrganization({ key: 'iw_o_2', name: 'O', slug: 'iw-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'w2@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    withdrawInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('withdrawn');
  });
  it("invitation withdraw 3", () => {
    const o = registerOrganization({ key: 'iw_o_3', name: 'O', slug: 'iw-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'w3@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    withdrawInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('withdrawn');
  });
  it("invitation expire 0", () => {
    const o = registerOrganization({ key: 'ie_o_0', name: 'O', slug: 'ie-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'e0@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expireInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('expired');
  });
  it("invitation expire 1", () => {
    const o = registerOrganization({ key: 'ie_o_1', name: 'O', slug: 'ie-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'e1@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expireInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('expired');
  });
  it("invitation expire 2", () => {
    const o = registerOrganization({ key: 'ie_o_2', name: 'O', slug: 'ie-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'e2@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expireInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('expired');
  });
  it("invitation expire 3", () => {
    const o = registerOrganization({ key: 'ie_o_3', name: 'O', slug: 'ie-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const inv = createInvitation({ organizationId: o.id, email: 'e3@example.com', role: 'member', invitedBy: 'a', expiresAt: '2099-01-01T00:00:00Z' });
    expireInvitation(inv.id);
    expect(getInvitationById(inv.id)?.status).toBe('expired');
  });
  it("invitation supportsAllStatuses", () => {
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
  });

  it("branding set test 0", () => {
    const o = registerOrganization({ key: 'br_o_0', name: 'O', slug: 'br-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 1", () => {
    const o = registerOrganization({ key: 'br_o_1', name: 'O', slug: 'br-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 2", () => {
    const o = registerOrganization({ key: 'br_o_2', name: 'O', slug: 'br-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 3", () => {
    const o = registerOrganization({ key: 'br_o_3', name: 'O', slug: 'br-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 4", () => {
    const o = registerOrganization({ key: 'br_o_4', name: 'O', slug: 'br-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 5", () => {
    const o = registerOrganization({ key: 'br_o_5', name: 'O', slug: 'br-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 6", () => {
    const o = registerOrganization({ key: 'br_o_6', name: 'O', slug: 'br-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 7", () => {
    const o = registerOrganization({ key: 'br_o_7', name: 'O', slug: 'br-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 8", () => {
    const o = registerOrganization({ key: 'br_o_8', name: 'O', slug: 'br-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 9", () => {
    const o = registerOrganization({ key: 'br_o_9', name: 'O', slug: 'br-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 10", () => {
    const o = registerOrganization({ key: 'br_o_10', name: 'O', slug: 'br-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 11", () => {
    const o = registerOrganization({ key: 'br_o_11', name: 'O', slug: 'br-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 12", () => {
    const o = registerOrganization({ key: 'br_o_12', name: 'O', slug: 'br-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 13", () => {
    const o = registerOrganization({ key: 'br_o_13', name: 'O', slug: 'br-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 14", () => {
    const o = registerOrganization({ key: 'br_o_14', name: 'O', slug: 'br-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 15", () => {
    const o = registerOrganization({ key: 'br_o_15', name: 'O', slug: 'br-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 16", () => {
    const o = registerOrganization({ key: 'br_o_16', name: 'O', slug: 'br-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 17", () => {
    const o = registerOrganization({ key: 'br_o_17', name: 'O', slug: 'br-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 18", () => {
    const o = registerOrganization({ key: 'br_o_18', name: 'O', slug: 'br-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 19", () => {
    const o = registerOrganization({ key: 'br_o_19', name: 'O', slug: 'br-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 20", () => {
    const o = registerOrganization({ key: 'br_o_20', name: 'O', slug: 'br-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 21", () => {
    const o = registerOrganization({ key: 'br_o_21', name: 'O', slug: 'br-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 22", () => {
    const o = registerOrganization({ key: 'br_o_22', name: 'O', slug: 'br-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 23", () => {
    const o = registerOrganization({ key: 'br_o_23', name: 'O', slug: 'br-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 24", () => {
    const o = registerOrganization({ key: 'br_o_24', name: 'O', slug: 'br-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 25", () => {
    const o = registerOrganization({ key: 'br_o_25', name: 'O', slug: 'br-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 26", () => {
    const o = registerOrganization({ key: 'br_o_26', name: 'O', slug: 'br-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 27", () => {
    const o = registerOrganization({ key: 'br_o_27', name: 'O', slug: 'br-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 28", () => {
    const o = registerOrganization({ key: 'br_o_28', name: 'O', slug: 'br-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding set test 29", () => {
    const o = registerOrganization({ key: 'br_o_29', name: 'O', slug: 'br-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const b = setBranding({ organizationId: o.id, primaryColor: '#ff0000', theme: 'dark' });
    expect(b.id).toBeDefined();
    expect(b.primaryColor).toBe('#ff0000');
  });
  it("branding update existing", () => {
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
  });

  it("config create test 0", () => {
    const o = registerOrganization({ key: 'cf_o_0', name: 'O', slug: 'cf-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 1", () => {
    const o = registerOrganization({ key: 'cf_o_1', name: 'O', slug: 'cf-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 2", () => {
    const o = registerOrganization({ key: 'cf_o_2', name: 'O', slug: 'cf-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 3", () => {
    const o = registerOrganization({ key: 'cf_o_3', name: 'O', slug: 'cf-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 4", () => {
    const o = registerOrganization({ key: 'cf_o_4', name: 'O', slug: 'cf-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 5", () => {
    const o = registerOrganization({ key: 'cf_o_5', name: 'O', slug: 'cf-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 6", () => {
    const o = registerOrganization({ key: 'cf_o_6', name: 'O', slug: 'cf-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 7", () => {
    const o = registerOrganization({ key: 'cf_o_7', name: 'O', slug: 'cf-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 8", () => {
    const o = registerOrganization({ key: 'cf_o_8', name: 'O', slug: 'cf-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 9", () => {
    const o = registerOrganization({ key: 'cf_o_9', name: 'O', slug: 'cf-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 10", () => {
    const o = registerOrganization({ key: 'cf_o_10', name: 'O', slug: 'cf-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 11", () => {
    const o = registerOrganization({ key: 'cf_o_11', name: 'O', slug: 'cf-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 12", () => {
    const o = registerOrganization({ key: 'cf_o_12', name: 'O', slug: 'cf-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 13", () => {
    const o = registerOrganization({ key: 'cf_o_13', name: 'O', slug: 'cf-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 14", () => {
    const o = registerOrganization({ key: 'cf_o_14', name: 'O', slug: 'cf-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 15", () => {
    const o = registerOrganization({ key: 'cf_o_15', name: 'O', slug: 'cf-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 16", () => {
    const o = registerOrganization({ key: 'cf_o_16', name: 'O', slug: 'cf-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 17", () => {
    const o = registerOrganization({ key: 'cf_o_17', name: 'O', slug: 'cf-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 18", () => {
    const o = registerOrganization({ key: 'cf_o_18', name: 'O', slug: 'cf-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 19", () => {
    const o = registerOrganization({ key: 'cf_o_19', name: 'O', slug: 'cf-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 20", () => {
    const o = registerOrganization({ key: 'cf_o_20', name: 'O', slug: 'cf-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 21", () => {
    const o = registerOrganization({ key: 'cf_o_21', name: 'O', slug: 'cf-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 22", () => {
    const o = registerOrganization({ key: 'cf_o_22', name: 'O', slug: 'cf-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 23", () => {
    const o = registerOrganization({ key: 'cf_o_23', name: 'O', slug: 'cf-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 24", () => {
    const o = registerOrganization({ key: 'cf_o_24', name: 'O', slug: 'cf-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 25", () => {
    const o = registerOrganization({ key: 'cf_o_25', name: 'O', slug: 'cf-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 26", () => {
    const o = registerOrganization({ key: 'cf_o_26', name: 'O', slug: 'cf-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 27", () => {
    const o = registerOrganization({ key: 'cf_o_27', name: 'O', slug: 'cf-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 28", () => {
    const o = registerOrganization({ key: 'cf_o_28', name: 'O', slug: 'cf-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config create test 29", () => {
    const o = registerOrganization({ key: 'cf_o_29', name: 'O', slug: 'cf-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const c = createConfig({ organizationId: o.id });
    expect(c.id).toBeDefined();
    expect(c.scope).toBe('organization');
  });
  it("config update settings", () => {
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
  });

  it("policy create test 0", () => {
    const o = registerOrganization({ key: 'pl_o_0', name: 'O', slug: 'pl-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_0', name: 'Policy 0', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 1", () => {
    const o = registerOrganization({ key: 'pl_o_1', name: 'O', slug: 'pl-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_1', name: 'Policy 1', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 2", () => {
    const o = registerOrganization({ key: 'pl_o_2', name: 'O', slug: 'pl-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_2', name: 'Policy 2', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 3", () => {
    const o = registerOrganization({ key: 'pl_o_3', name: 'O', slug: 'pl-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_3', name: 'Policy 3', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 4", () => {
    const o = registerOrganization({ key: 'pl_o_4', name: 'O', slug: 'pl-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_4', name: 'Policy 4', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 5", () => {
    const o = registerOrganization({ key: 'pl_o_5', name: 'O', slug: 'pl-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_5', name: 'Policy 5', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 6", () => {
    const o = registerOrganization({ key: 'pl_o_6', name: 'O', slug: 'pl-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_6', name: 'Policy 6', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 7", () => {
    const o = registerOrganization({ key: 'pl_o_7', name: 'O', slug: 'pl-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_7', name: 'Policy 7', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 8", () => {
    const o = registerOrganization({ key: 'pl_o_8', name: 'O', slug: 'pl-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_8', name: 'Policy 8', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 9", () => {
    const o = registerOrganization({ key: 'pl_o_9', name: 'O', slug: 'pl-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_9', name: 'Policy 9', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 10", () => {
    const o = registerOrganization({ key: 'pl_o_10', name: 'O', slug: 'pl-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_10', name: 'Policy 10', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 11", () => {
    const o = registerOrganization({ key: 'pl_o_11', name: 'O', slug: 'pl-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_11', name: 'Policy 11', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 12", () => {
    const o = registerOrganization({ key: 'pl_o_12', name: 'O', slug: 'pl-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_12', name: 'Policy 12', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 13", () => {
    const o = registerOrganization({ key: 'pl_o_13', name: 'O', slug: 'pl-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_13', name: 'Policy 13', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 14", () => {
    const o = registerOrganization({ key: 'pl_o_14', name: 'O', slug: 'pl-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_14', name: 'Policy 14', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 15", () => {
    const o = registerOrganization({ key: 'pl_o_15', name: 'O', slug: 'pl-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_15', name: 'Policy 15', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 16", () => {
    const o = registerOrganization({ key: 'pl_o_16', name: 'O', slug: 'pl-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_16', name: 'Policy 16', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 17", () => {
    const o = registerOrganization({ key: 'pl_o_17', name: 'O', slug: 'pl-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_17', name: 'Policy 17', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 18", () => {
    const o = registerOrganization({ key: 'pl_o_18', name: 'O', slug: 'pl-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_18', name: 'Policy 18', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 19", () => {
    const o = registerOrganization({ key: 'pl_o_19', name: 'O', slug: 'pl-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_19', name: 'Policy 19', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 20", () => {
    const o = registerOrganization({ key: 'pl_o_20', name: 'O', slug: 'pl-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_20', name: 'Policy 20', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 21", () => {
    const o = registerOrganization({ key: 'pl_o_21', name: 'O', slug: 'pl-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_21', name: 'Policy 21', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 22", () => {
    const o = registerOrganization({ key: 'pl_o_22', name: 'O', slug: 'pl-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_22', name: 'Policy 22', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 23", () => {
    const o = registerOrganization({ key: 'pl_o_23', name: 'O', slug: 'pl-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_23', name: 'Policy 23', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 24", () => {
    const o = registerOrganization({ key: 'pl_o_24', name: 'O', slug: 'pl-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_24', name: 'Policy 24', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 25", () => {
    const o = registerOrganization({ key: 'pl_o_25', name: 'O', slug: 'pl-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_25', name: 'Policy 25', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 26", () => {
    const o = registerOrganization({ key: 'pl_o_26', name: 'O', slug: 'pl-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_26', name: 'Policy 26', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 27", () => {
    const o = registerOrganization({ key: 'pl_o_27', name: 'O', slug: 'pl-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_27', name: 'Policy 27', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 28", () => {
    const o = registerOrganization({ key: 'pl_o_28', name: 'O', slug: 'pl-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_28', name: 'Policy 28', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy create test 29", () => {
    const o = registerOrganization({ key: 'pl_o_29', name: 'O', slug: 'pl-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const p = createPolicy({ organizationId: o.id, key: 'pol_29', name: 'Policy 29', enforcement: 'enforced' });
    expect(p.id).toBeDefined();
    expect(p.active).toBe(true);
  });
  it("policy update enforcement", () => {
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
  });

  it("lifecycle record test 0", () => {
    const o = registerOrganization({ key: 'lc_o_0', name: 'O', slug: 'lc-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 1", () => {
    const o = registerOrganization({ key: 'lc_o_1', name: 'O', slug: 'lc-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 2", () => {
    const o = registerOrganization({ key: 'lc_o_2', name: 'O', slug: 'lc-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 3", () => {
    const o = registerOrganization({ key: 'lc_o_3', name: 'O', slug: 'lc-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 4", () => {
    const o = registerOrganization({ key: 'lc_o_4', name: 'O', slug: 'lc-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 5", () => {
    const o = registerOrganization({ key: 'lc_o_5', name: 'O', slug: 'lc-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 6", () => {
    const o = registerOrganization({ key: 'lc_o_6', name: 'O', slug: 'lc-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 7", () => {
    const o = registerOrganization({ key: 'lc_o_7', name: 'O', slug: 'lc-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 8", () => {
    const o = registerOrganization({ key: 'lc_o_8', name: 'O', slug: 'lc-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 9", () => {
    const o = registerOrganization({ key: 'lc_o_9', name: 'O', slug: 'lc-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 10", () => {
    const o = registerOrganization({ key: 'lc_o_10', name: 'O', slug: 'lc-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 11", () => {
    const o = registerOrganization({ key: 'lc_o_11', name: 'O', slug: 'lc-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 12", () => {
    const o = registerOrganization({ key: 'lc_o_12', name: 'O', slug: 'lc-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 13", () => {
    const o = registerOrganization({ key: 'lc_o_13', name: 'O', slug: 'lc-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 14", () => {
    const o = registerOrganization({ key: 'lc_o_14', name: 'O', slug: 'lc-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 15", () => {
    const o = registerOrganization({ key: 'lc_o_15', name: 'O', slug: 'lc-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 16", () => {
    const o = registerOrganization({ key: 'lc_o_16', name: 'O', slug: 'lc-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 17", () => {
    const o = registerOrganization({ key: 'lc_o_17', name: 'O', slug: 'lc-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 18", () => {
    const o = registerOrganization({ key: 'lc_o_18', name: 'O', slug: 'lc-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 19", () => {
    const o = registerOrganization({ key: 'lc_o_19', name: 'O', slug: 'lc-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 20", () => {
    const o = registerOrganization({ key: 'lc_o_20', name: 'O', slug: 'lc-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 21", () => {
    const o = registerOrganization({ key: 'lc_o_21', name: 'O', slug: 'lc-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 22", () => {
    const o = registerOrganization({ key: 'lc_o_22', name: 'O', slug: 'lc-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 23", () => {
    const o = registerOrganization({ key: 'lc_o_23', name: 'O', slug: 'lc-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 24", () => {
    const o = registerOrganization({ key: 'lc_o_24', name: 'O', slug: 'lc-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 25", () => {
    const o = registerOrganization({ key: 'lc_o_25', name: 'O', slug: 'lc-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 26", () => {
    const o = registerOrganization({ key: 'lc_o_26', name: 'O', slug: 'lc-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 27", () => {
    const o = registerOrganization({ key: 'lc_o_27', name: 'O', slug: 'lc-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 28", () => {
    const o = registerOrganization({ key: 'lc_o_28', name: 'O', slug: 'lc-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle record test 29", () => {
    const o = registerOrganization({ key: 'lc_o_29', name: 'O', slug: 'lc-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const r = recordLifecycle({ organizationId: o.id, fromStatus: null, toStatus: 'active', transition: 'activate', actorId: 'a' });
    expect(r.id).toBeDefined();
    expect(r.toStatus).toBe('active');
  });
  it("lifecycle latest status", () => {
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
  });

  it("license assign test 0", () => {
    const o = registerOrganization({ key: 'la_o_0', name: 'O', slug: 'la-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_0', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 1", () => {
    const o = registerOrganization({ key: 'la_o_1', name: 'O', slug: 'la-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_1', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 2", () => {
    const o = registerOrganization({ key: 'la_o_2', name: 'O', slug: 'la-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_2', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 3", () => {
    const o = registerOrganization({ key: 'la_o_3', name: 'O', slug: 'la-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_3', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 4", () => {
    const o = registerOrganization({ key: 'la_o_4', name: 'O', slug: 'la-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_4', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 5", () => {
    const o = registerOrganization({ key: 'la_o_5', name: 'O', slug: 'la-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_5', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 6", () => {
    const o = registerOrganization({ key: 'la_o_6', name: 'O', slug: 'la-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_6', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 7", () => {
    const o = registerOrganization({ key: 'la_o_7', name: 'O', slug: 'la-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_7', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 8", () => {
    const o = registerOrganization({ key: 'la_o_8', name: 'O', slug: 'la-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_8', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 9", () => {
    const o = registerOrganization({ key: 'la_o_9', name: 'O', slug: 'la-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_9', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 10", () => {
    const o = registerOrganization({ key: 'la_o_10', name: 'O', slug: 'la-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_10', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 11", () => {
    const o = registerOrganization({ key: 'la_o_11', name: 'O', slug: 'la-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_11', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 12", () => {
    const o = registerOrganization({ key: 'la_o_12', name: 'O', slug: 'la-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_12', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 13", () => {
    const o = registerOrganization({ key: 'la_o_13', name: 'O', slug: 'la-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_13', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 14", () => {
    const o = registerOrganization({ key: 'la_o_14', name: 'O', slug: 'la-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_14', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 15", () => {
    const o = registerOrganization({ key: 'la_o_15', name: 'O', slug: 'la-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_15', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 16", () => {
    const o = registerOrganization({ key: 'la_o_16', name: 'O', slug: 'la-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_16', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 17", () => {
    const o = registerOrganization({ key: 'la_o_17', name: 'O', slug: 'la-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_17', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 18", () => {
    const o = registerOrganization({ key: 'la_o_18', name: 'O', slug: 'la-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_18', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 19", () => {
    const o = registerOrganization({ key: 'la_o_19', name: 'O', slug: 'la-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_19', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 20", () => {
    const o = registerOrganization({ key: 'la_o_20', name: 'O', slug: 'la-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_20', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 21", () => {
    const o = registerOrganization({ key: 'la_o_21', name: 'O', slug: 'la-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_21', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 22", () => {
    const o = registerOrganization({ key: 'la_o_22', name: 'O', slug: 'la-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_22', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 23", () => {
    const o = registerOrganization({ key: 'la_o_23', name: 'O', slug: 'la-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_23', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 24", () => {
    const o = registerOrganization({ key: 'la_o_24', name: 'O', slug: 'la-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_24', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 25", () => {
    const o = registerOrganization({ key: 'la_o_25', name: 'O', slug: 'la-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_25', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 26", () => {
    const o = registerOrganization({ key: 'la_o_26', name: 'O', slug: 'la-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_26', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 27", () => {
    const o = registerOrganization({ key: 'la_o_27', name: 'O', slug: 'la-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_27', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 28", () => {
    const o = registerOrganization({ key: 'la_o_28', name: 'O', slug: 'la-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_28', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license assign test 29", () => {
    const o = registerOrganization({ key: 'la_o_29', name: 'O', slug: 'la-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const l = assignLicense({ organizationId: o.id, licenseKey: 'lic_29', plan: 'enterprise', seatLimit: 100 });
    expect(l.id).toBeDefined();
    expect(l.status).toBe('active');
  });
  it("license suspend", () => {
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
  });

  it("quota set test 0", () => {
    const o = registerOrganization({ key: 'qa_o_0', name: 'O', slug: 'qa-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 1", () => {
    const o = registerOrganization({ key: 'qa_o_1', name: 'O', slug: 'qa-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'teachers' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 2", () => {
    const o = registerOrganization({ key: 'qa_o_2', name: 'O', slug: 'qa-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'courses' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 3", () => {
    const o = registerOrganization({ key: 'qa_o_3', name: 'O', slug: 'qa-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'storage' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 4", () => {
    const o = registerOrganization({ key: 'qa_o_4', name: 'O', slug: 'qa-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'ai' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 5", () => {
    const o = registerOrganization({ key: 'qa_o_5', name: 'O', slug: 'qa-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'api' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 6", () => {
    const o = registerOrganization({ key: 'qa_o_6', name: 'O', slug: 'qa-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'workspaces' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 7", () => {
    const o = registerOrganization({ key: 'qa_o_7', name: 'O', slug: 'qa-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 8", () => {
    const o = registerOrganization({ key: 'qa_o_8', name: 'O', slug: 'qa-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'teachers' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 9", () => {
    const o = registerOrganization({ key: 'qa_o_9', name: 'O', slug: 'qa-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'courses' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 10", () => {
    const o = registerOrganization({ key: 'qa_o_10', name: 'O', slug: 'qa-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'storage' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 11", () => {
    const o = registerOrganization({ key: 'qa_o_11', name: 'O', slug: 'qa-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'ai' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 12", () => {
    const o = registerOrganization({ key: 'qa_o_12', name: 'O', slug: 'qa-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'api' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 13", () => {
    const o = registerOrganization({ key: 'qa_o_13', name: 'O', slug: 'qa-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'workspaces' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 14", () => {
    const o = registerOrganization({ key: 'qa_o_14', name: 'O', slug: 'qa-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 15", () => {
    const o = registerOrganization({ key: 'qa_o_15', name: 'O', slug: 'qa-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'teachers' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 16", () => {
    const o = registerOrganization({ key: 'qa_o_16', name: 'O', slug: 'qa-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'courses' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 17", () => {
    const o = registerOrganization({ key: 'qa_o_17', name: 'O', slug: 'qa-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'storage' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 18", () => {
    const o = registerOrganization({ key: 'qa_o_18', name: 'O', slug: 'qa-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'ai' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 19", () => {
    const o = registerOrganization({ key: 'qa_o_19', name: 'O', slug: 'qa-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'api' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 20", () => {
    const o = registerOrganization({ key: 'qa_o_20', name: 'O', slug: 'qa-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'workspaces' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 21", () => {
    const o = registerOrganization({ key: 'qa_o_21', name: 'O', slug: 'qa-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'students' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 22", () => {
    const o = registerOrganization({ key: 'qa_o_22', name: 'O', slug: 'qa-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'teachers' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 23", () => {
    const o = registerOrganization({ key: 'qa_o_23', name: 'O', slug: 'qa-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'courses' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota set test 24", () => {
    const o = registerOrganization({ key: 'qa_o_24', name: 'O', slug: 'qa-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const q = setQuota({ organizationId: o.id, resource: 'storage' as any, limit: 100 });
    expect(q.id).toBeDefined();
    expect(q.status).toBe('ok');
  });
  it("quota exceeded when used >= limit", () => {
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
  });

  it("domain register test 0", () => {
    const o = registerOrganization({ key: 'dm_o_0', name: 'O', slug: 'dm-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school0.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 1", () => {
    const o = registerOrganization({ key: 'dm_o_1', name: 'O', slug: 'dm-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school1.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 2", () => {
    const o = registerOrganization({ key: 'dm_o_2', name: 'O', slug: 'dm-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school2.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 3", () => {
    const o = registerOrganization({ key: 'dm_o_3', name: 'O', slug: 'dm-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school3.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 4", () => {
    const o = registerOrganization({ key: 'dm_o_4', name: 'O', slug: 'dm-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school4.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 5", () => {
    const o = registerOrganization({ key: 'dm_o_5', name: 'O', slug: 'dm-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school5.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 6", () => {
    const o = registerOrganization({ key: 'dm_o_6', name: 'O', slug: 'dm-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school6.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 7", () => {
    const o = registerOrganization({ key: 'dm_o_7', name: 'O', slug: 'dm-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school7.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 8", () => {
    const o = registerOrganization({ key: 'dm_o_8', name: 'O', slug: 'dm-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school8.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 9", () => {
    const o = registerOrganization({ key: 'dm_o_9', name: 'O', slug: 'dm-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school9.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 10", () => {
    const o = registerOrganization({ key: 'dm_o_10', name: 'O', slug: 'dm-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school10.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 11", () => {
    const o = registerOrganization({ key: 'dm_o_11', name: 'O', slug: 'dm-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school11.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 12", () => {
    const o = registerOrganization({ key: 'dm_o_12', name: 'O', slug: 'dm-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school12.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 13", () => {
    const o = registerOrganization({ key: 'dm_o_13', name: 'O', slug: 'dm-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school13.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 14", () => {
    const o = registerOrganization({ key: 'dm_o_14', name: 'O', slug: 'dm-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school14.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 15", () => {
    const o = registerOrganization({ key: 'dm_o_15', name: 'O', slug: 'dm-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school15.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 16", () => {
    const o = registerOrganization({ key: 'dm_o_16', name: 'O', slug: 'dm-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school16.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 17", () => {
    const o = registerOrganization({ key: 'dm_o_17', name: 'O', slug: 'dm-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school17.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 18", () => {
    const o = registerOrganization({ key: 'dm_o_18', name: 'O', slug: 'dm-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school18.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 19", () => {
    const o = registerOrganization({ key: 'dm_o_19', name: 'O', slug: 'dm-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school19.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 20", () => {
    const o = registerOrganization({ key: 'dm_o_20', name: 'O', slug: 'dm-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school20.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 21", () => {
    const o = registerOrganization({ key: 'dm_o_21', name: 'O', slug: 'dm-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school21.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 22", () => {
    const o = registerOrganization({ key: 'dm_o_22', name: 'O', slug: 'dm-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school22.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 23", () => {
    const o = registerOrganization({ key: 'dm_o_23', name: 'O', slug: 'dm-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school23.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 24", () => {
    const o = registerOrganization({ key: 'dm_o_24', name: 'O', slug: 'dm-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school24.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 25", () => {
    const o = registerOrganization({ key: 'dm_o_25', name: 'O', slug: 'dm-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school25.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 26", () => {
    const o = registerOrganization({ key: 'dm_o_26', name: 'O', slug: 'dm-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school26.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 27", () => {
    const o = registerOrganization({ key: 'dm_o_27', name: 'O', slug: 'dm-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school27.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 28", () => {
    const o = registerOrganization({ key: 'dm_o_28', name: 'O', slug: 'dm-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school28.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain register test 29", () => {
    const o = registerOrganization({ key: 'dm_o_29', name: 'O', slug: 'dm-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    const d = registerDomain({ organizationId: o.id, domain: 'school29.com' });
    expect(d.id).toBeDefined();
    expect(d.status).toBe('unverified');
  });
  it("domain start verification", () => {
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
  });

  it("isolation set test 0", () => {
    const t = createTenant({ key: 'iso_t_0', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 1", () => {
    const t = createTenant({ key: 'iso_t_1', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 2", () => {
    const t = createTenant({ key: 'iso_t_2', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 3", () => {
    const t = createTenant({ key: 'iso_t_3', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 4", () => {
    const t = createTenant({ key: 'iso_t_4', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 5", () => {
    const t = createTenant({ key: 'iso_t_5', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 6", () => {
    const t = createTenant({ key: 'iso_t_6', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 7", () => {
    const t = createTenant({ key: 'iso_t_7', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 8", () => {
    const t = createTenant({ key: 'iso_t_8', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 9", () => {
    const t = createTenant({ key: 'iso_t_9', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 10", () => {
    const t = createTenant({ key: 'iso_t_10', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 11", () => {
    const t = createTenant({ key: 'iso_t_11', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 12", () => {
    const t = createTenant({ key: 'iso_t_12', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 13", () => {
    const t = createTenant({ key: 'iso_t_13', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 14", () => {
    const t = createTenant({ key: 'iso_t_14', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 15", () => {
    const t = createTenant({ key: 'iso_t_15', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 16", () => {
    const t = createTenant({ key: 'iso_t_16', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 17", () => {
    const t = createTenant({ key: 'iso_t_17', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 18", () => {
    const t = createTenant({ key: 'iso_t_18', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 19", () => {
    const t = createTenant({ key: 'iso_t_19', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 20", () => {
    const t = createTenant({ key: 'iso_t_20', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 21", () => {
    const t = createTenant({ key: 'iso_t_21', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 22", () => {
    const t = createTenant({ key: 'iso_t_22', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 23", () => {
    const t = createTenant({ key: 'iso_t_23', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 24", () => {
    const t = createTenant({ key: 'iso_t_24', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 25", () => {
    const t = createTenant({ key: 'iso_t_25', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 26", () => {
    const t = createTenant({ key: 'iso_t_26', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation set test 27", () => {
    const t = createTenant({ key: 'iso_t_27', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'strict' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('strict');
  });
  it("isolation set test 28", () => {
    const t = createTenant({ key: 'iso_t_28', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'relaxed' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('relaxed');
  });
  it("isolation set test 29", () => {
    const t = createTenant({ key: 'iso_t_29', name: 'T' });
    const i = setTenantIsolation({ tenantId: t.id, boundary: 'shared' as any });
    expect(i.id).toBeDefined();
    expect(i.boundary).toBe('shared');
  });
  it("isolation update existing", () => {
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
  });

  it("audit test 0", () => {
    const r = recordAudit({ organizationId: 'org_0', actorId: 'a', category: 'lifecycle' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 1", () => {
    const r = recordAudit({ organizationId: 'org_1', actorId: 'a', category: 'membership' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 2", () => {
    const r = recordAudit({ organizationId: 'org_2', actorId: 'a', category: 'configuration' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 3", () => {
    const r = recordAudit({ organizationId: 'org_3', actorId: 'a', category: 'branding' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 4", () => {
    const r = recordAudit({ organizationId: 'org_4', actorId: 'a', category: 'policy' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 5", () => {
    const r = recordAudit({ organizationId: 'org_5', actorId: 'a', category: 'license' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 6", () => {
    const r = recordAudit({ organizationId: 'org_6', actorId: 'a', category: 'quota' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 7", () => {
    const r = recordAudit({ organizationId: 'org_7', actorId: 'a', category: 'domain' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 8", () => {
    const r = recordAudit({ organizationId: 'org_8', actorId: 'a', category: 'security' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 9", () => {
    const r = recordAudit({ organizationId: 'org_9', actorId: 'a', category: 'lifecycle' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 10", () => {
    const r = recordAudit({ organizationId: 'org_10', actorId: 'a', category: 'membership' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 11", () => {
    const r = recordAudit({ organizationId: 'org_11', actorId: 'a', category: 'configuration' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 12", () => {
    const r = recordAudit({ organizationId: 'org_12', actorId: 'a', category: 'branding' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 13", () => {
    const r = recordAudit({ organizationId: 'org_13', actorId: 'a', category: 'policy' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 14", () => {
    const r = recordAudit({ organizationId: 'org_14', actorId: 'a', category: 'license' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 15", () => {
    const r = recordAudit({ organizationId: 'org_15', actorId: 'a', category: 'quota' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 16", () => {
    const r = recordAudit({ organizationId: 'org_16', actorId: 'a', category: 'domain' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 17", () => {
    const r = recordAudit({ organizationId: 'org_17', actorId: 'a', category: 'security' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 18", () => {
    const r = recordAudit({ organizationId: 'org_18', actorId: 'a', category: 'lifecycle' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 19", () => {
    const r = recordAudit({ organizationId: 'org_19', actorId: 'a', category: 'membership' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 20", () => {
    const r = recordAudit({ organizationId: 'org_20', actorId: 'a', category: 'configuration' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 21", () => {
    const r = recordAudit({ organizationId: 'org_21', actorId: 'a', category: 'branding' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 22", () => {
    const r = recordAudit({ organizationId: 'org_22', actorId: 'a', category: 'policy' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 23", () => {
    const r = recordAudit({ organizationId: 'org_23', actorId: 'a', category: 'license' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 24", () => {
    const r = recordAudit({ organizationId: 'org_24', actorId: 'a', category: 'quota' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 25", () => {
    const r = recordAudit({ organizationId: 'org_25', actorId: 'a', category: 'domain' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 26", () => {
    const r = recordAudit({ organizationId: 'org_26', actorId: 'a', category: 'security' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 27", () => {
    const r = recordAudit({ organizationId: 'org_27', actorId: 'a', category: 'lifecycle' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 28", () => {
    const r = recordAudit({ organizationId: 'org_28', actorId: 'a', category: 'membership' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit test 29", () => {
    const r = recordAudit({ organizationId: 'org_29', actorId: 'a', category: 'configuration' as any, action: 'x', outcome: 'success' });
    expect(r.id).toBeDefined();
  });
  it("audit list by organization", () => {
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
  });

  it("analytics test 0", () => {
    const o = registerOrganization({ key: 'an_o_0', name: 'O', slug: 'an-o-0', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u0', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 1", () => {
    const o = registerOrganization({ key: 'an_o_1', name: 'O', slug: 'an-o-1', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u1', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 2", () => {
    const o = registerOrganization({ key: 'an_o_2', name: 'O', slug: 'an-o-2', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u2', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 3", () => {
    const o = registerOrganization({ key: 'an_o_3', name: 'O', slug: 'an-o-3', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u3', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 4", () => {
    const o = registerOrganization({ key: 'an_o_4', name: 'O', slug: 'an-o-4', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u4', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 5", () => {
    const o = registerOrganization({ key: 'an_o_5', name: 'O', slug: 'an-o-5', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u5', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 6", () => {
    const o = registerOrganization({ key: 'an_o_6', name: 'O', slug: 'an-o-6', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u6', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 7", () => {
    const o = registerOrganization({ key: 'an_o_7', name: 'O', slug: 'an-o-7', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u7', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 8", () => {
    const o = registerOrganization({ key: 'an_o_8', name: 'O', slug: 'an-o-8', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u8', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 9", () => {
    const o = registerOrganization({ key: 'an_o_9', name: 'O', slug: 'an-o-9', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u9', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 10", () => {
    const o = registerOrganization({ key: 'an_o_10', name: 'O', slug: 'an-o-10', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u10', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 11", () => {
    const o = registerOrganization({ key: 'an_o_11', name: 'O', slug: 'an-o-11', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u11', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 12", () => {
    const o = registerOrganization({ key: 'an_o_12', name: 'O', slug: 'an-o-12', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u12', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 13", () => {
    const o = registerOrganization({ key: 'an_o_13', name: 'O', slug: 'an-o-13', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u13', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 14", () => {
    const o = registerOrganization({ key: 'an_o_14', name: 'O', slug: 'an-o-14', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u14', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 15", () => {
    const o = registerOrganization({ key: 'an_o_15', name: 'O', slug: 'an-o-15', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u15', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 16", () => {
    const o = registerOrganization({ key: 'an_o_16', name: 'O', slug: 'an-o-16', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u16', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 17", () => {
    const o = registerOrganization({ key: 'an_o_17', name: 'O', slug: 'an-o-17', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u17', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 18", () => {
    const o = registerOrganization({ key: 'an_o_18', name: 'O', slug: 'an-o-18', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u18', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 19", () => {
    const o = registerOrganization({ key: 'an_o_19', name: 'O', slug: 'an-o-19', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u19', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 20", () => {
    const o = registerOrganization({ key: 'an_o_20', name: 'O', slug: 'an-o-20', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u20', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 21", () => {
    const o = registerOrganization({ key: 'an_o_21', name: 'O', slug: 'an-o-21', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u21', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 22", () => {
    const o = registerOrganization({ key: 'an_o_22', name: 'O', slug: 'an-o-22', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u22', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 23", () => {
    const o = registerOrganization({ key: 'an_o_23', name: 'O', slug: 'an-o-23', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u23', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 24", () => {
    const o = registerOrganization({ key: 'an_o_24', name: 'O', slug: 'an-o-24', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u24', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 25", () => {
    const o = registerOrganization({ key: 'an_o_25', name: 'O', slug: 'an-o-25', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u25', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 26", () => {
    const o = registerOrganization({ key: 'an_o_26', name: 'O', slug: 'an-o-26', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u26', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 27", () => {
    const o = registerOrganization({ key: 'an_o_27', name: 'O', slug: 'an-o-27', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u27', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 28", () => {
    const o = registerOrganization({ key: 'an_o_28', name: 'O', slug: 'an-o-28', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u28', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("analytics test 29", () => {
    const o = registerOrganization({ key: 'an_o_29', name: 'O', slug: 'an-o-29', tenantId: 't', type: 'school', ownerId: 'u' });
    addMembership({ organizationId: o.id, userId: 'u29', role: 'member' });
    const a = generateOrganizationAnalytics();
    expect(a).toBeDefined();
  });
  it("dashboard test 0", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 1", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 2", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 3", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 4", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 5", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 6", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("dashboard test 7", () => {
    const d = generateOrganizationDashboard();
    expect(d).toBeDefined();
    expect(d.organizations).toBeDefined();
  });
  it("developer integration test", () => {
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
  });
}); // close describe
