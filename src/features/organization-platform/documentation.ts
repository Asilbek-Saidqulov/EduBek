/** System 25 — Documentation Generator. Deterministic Markdown + JSON. No LLM. */
import type { OrganizationDocumentation, OrganizationEventType } from "./types";

const SYSTEMS_META: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }> = [
  { id: 1, name: "Organization Registry", description: "Lifecycle, statuses, versioning, ownership, metadata.", endpoints: ["/api/organizations/organizations"], events: ["OrganizationCreated", "OrganizationUpdated", "OrganizationArchived", "OrganizationRestored", "OrganizationDeleted"] },
  { id: 2, name: "Tenant Registry", description: "Tenant lifecycle, activation, suspension, archival.", endpoints: ["/api/organizations/tenants"], events: ["TenantCreated", "TenantActivated", "TenantSuspended"] },
  { id: 3, name: "Institution Types", description: "School, university, ministry, district, company, academy, training_center, tutoring_center, custom.", endpoints: ["/api/organizations/organizations"], events: [] },
  { id: 4, name: "Organization Hierarchy", description: "Parent/child recursive hierarchy (Ministry → Region → District → School).", endpoints: ["/api/organizations/hierarchy"], events: ["HierarchyUpdated"] },
  { id: 5, name: "Campus Registry", description: "Multiple campuses per institution.", endpoints: ["/api/organizations/campuses"], events: [] },
  { id: 6, name: "Department Registry", description: "Unlimited departments per organization.", endpoints: ["/api/organizations/departments"], events: [] },
  { id: 7, name: "Faculty Registry", description: "Universities may own faculties.", endpoints: ["/api/organizations/faculties"], events: [] },
  { id: 8, name: "Workspace Registry", description: "Teacher, student, administration, research workspaces.", endpoints: ["/api/organizations/workspaces"], events: ["WorkspaceCreated", "WorkspaceArchived"] },
  { id: 9, name: "Membership Registry", description: "Reference-only membership metadata. Identity owns users.", endpoints: ["/api/organizations/memberships"], events: ["MembershipAdded", "MembershipRemoved"] },
  { id: 10, name: "Invitation Platform", description: "Invitation lifecycle (accept, reject, expire, withdraw).", endpoints: ["/api/organizations/invitations"], events: ["InvitationCreated", "InvitationAccepted", "InvitationExpired"] },
  { id: 11, name: "Organization Branding", description: "Logos, colors, themes, branding assets metadata. Never binary storage.", endpoints: ["/api/organizations/branding"], events: ["OrganizationBranded"] },
  { id: 12, name: "Organization Configuration", description: "Institution-level settings. Never global feature flags.", endpoints: ["/api/organizations/configuration"], events: [] },
  { id: 13, name: "Organization Policies", description: "Institution-specific policies.", endpoints: ["/api/organizations/policies"], events: ["OrganizationPolicyUpdated"] },
  { id: 14, name: "Organization Lifecycle", description: "Provision, activate, suspend, archive, restore, delete.", endpoints: ["/api/organizations/organizations"], events: ["OrganizationArchived", "OrganizationRestored", "OrganizationDeleted"] },
  { id: 15, name: "License Metadata", description: "Institution licenses. Subscription references only. Commerce owns billing.", endpoints: ["/api/organizations/licenses"], events: ["LicenseAssigned", "LicenseExpired"] },
  { id: 16, name: "Quota Registry", description: "Reference quotas (students, teachers, courses, storage, AI, API). No billing.", endpoints: ["/api/organizations/quotas"], events: ["QuotaExceeded"] },
  { id: 17, name: "Domain Verification", description: "Institution domains, verification metadata, status.", endpoints: ["/api/organizations/domains"], events: ["DomainVerified"] },
  { id: 18, name: "Tenant Isolation", description: "Isolation metadata, boundaries, security metadata. Never authentication.", endpoints: ["/api/organizations/isolation"], events: [] },
  { id: 19, name: "Organization Analytics Metadata", description: "Operational metadata only. BI remains owned by Data Platform.", endpoints: ["/api/organizations/analytics"], events: [] },
  { id: 20, name: "Organization Audit", description: "Immutable audit history with correlation IDs. Append-only.", endpoints: ["/api/organizations/audit"], events: [] },
  { id: 21, name: "Organization Dashboard", description: "Institution overview, health, membership, hierarchy, licenses, quotas, branding.", endpoints: ["/api/organizations/dashboard"], events: [] },
  { id: 22, name: "Developer Integration", description: "Public APIs, SDK metadata, extension hooks, webhooks.", endpoints: ["/api/organizations/developer"], events: [] },
  { id: 23, name: "Administration API", description: "Operational endpoints, status, health, statistics.", endpoints: ["/api/organizations/status"], events: [] },
  { id: 24, name: "Event Bus Bridge", description: "Passive consumer, passive producer. Idempotent. No business logic.", endpoints: [], events: ["OrganizationCreated", "OrganizationArchived", "TenantCreated", "TenantActivated", "TenantSuspended", "WorkspaceCreated", "WorkspaceArchived", "MembershipAdded", "MembershipRemoved", "InvitationCreated", "InvitationAccepted", "InvitationExpired", "OrganizationBranded", "OrganizationPolicyUpdated", "QuotaExceeded", "LicenseAssigned", "LicenseExpired", "DomainVerified", "HierarchyUpdated"] },
  { id: 25, name: "Documentation Generator", description: "Generate deterministic Markdown, JSON, ownership matrix, API docs, event docs.", endpoints: ["/api/organizations/documentation"], events: [] },
];
const EVENT_PAYLOADS: Record<OrganizationEventType, string[]> = {
  OrganizationCreated: ["organizationId", "key", "type", "tenantId"],
  OrganizationUpdated: ["organizationId", "version"],
  OrganizationArchived: ["organizationId", "transition"],
  OrganizationRestored: ["organizationId", "transition"],
  OrganizationDeleted: ["organizationId", "transition"],
  TenantCreated: ["tenantId", "key"],
  TenantActivated: ["tenantId"],
  TenantSuspended: ["tenantId"],
  WorkspaceCreated: ["workspaceId", "organizationId", "type"],
  WorkspaceArchived: ["workspaceId", "organizationId"],
  MembershipAdded: ["membershipId", "organizationId", "userId", "role"],
  MembershipRemoved: ["membershipId", "organizationId", "userId"],
  InvitationCreated: ["invitationId", "organizationId", "email"],
  InvitationAccepted: ["invitationId", "organizationId", "userId"],
  InvitationExpired: ["invitationId", "organizationId"],
  OrganizationBranded: ["organizationId"],
  OrganizationPolicyUpdated: ["policyId", "organizationId", "enforcement"],
  QuotaExceeded: ["quotaId", "organizationId", "resource"],
  LicenseAssigned: ["licenseId", "organizationId", "plan"],
  LicenseExpired: ["licenseId", "organizationId"],
  DomainVerified: ["domainId", "organizationId", "domain"],
  HierarchyUpdated: ["organizationId", "previousParentId", "newParentId"],
};
const EVENT_DESCRIPTIONS: Record<OrganizationEventType, string> = {
  OrganizationCreated: "Emitted when an organization is registered.",
  OrganizationUpdated: "Emitted when an organization is updated.",
  OrganizationArchived: "Emitted when an organization is archived.",
  OrganizationRestored: "Emitted when an organization is restored from archive.",
  OrganizationDeleted: "Emitted when an organization is soft-deleted.",
  TenantCreated: "Emitted when a tenant is created.",
  TenantActivated: "Emitted when a tenant is activated.",
  TenantSuspended: "Emitted when a tenant is suspended.",
  WorkspaceCreated: "Emitted when a workspace is created.",
  WorkspaceArchived: "Emitted when a workspace is archived.",
  MembershipAdded: "Emitted when a user is added to an organization.",
  MembershipRemoved: "Emitted when a user is removed from an organization.",
  InvitationCreated: "Emitted when an invitation is created.",
  InvitationAccepted: "Emitted when an invitation is accepted.",
  InvitationExpired: "Emitted when an invitation expires.",
  OrganizationBranded: "Emitted when organization branding is updated.",
  OrganizationPolicyUpdated: "Emitted when an organization policy is updated.",
  QuotaExceeded: "Emitted when a quota is exceeded.",
  LicenseAssigned: "Emitted when a license is assigned to an organization.",
  LicenseExpired: "Emitted when a license expires.",
  DomainVerified: "Emitted when a domain is verified for an organization.",
  HierarchyUpdated: "Emitted when an organization's parent in the hierarchy changes.",
};

export function generateDocumentation(): OrganizationDocumentation {
  return {
    version: "1.0.0", generatedAt: new Date().toISOString(),
    systems: SYSTEMS_META,
    events: Object.keys(EVENT_PAYLOADS).map((type) => ({ type: type as OrganizationEventType, payload: EVENT_PAYLOADS[type as OrganizationEventType], description: EVENT_DESCRIPTIONS[type as OrganizationEventType] })),
    ownership: {
      owns: ["Organizations", "Institutions", "Tenants", "Workspaces", "Departments", "Campuses", "Faculties", "Hierarchy", "Memberships", "Branding Metadata", "Quotas", "License Metadata", "Domains", "Policies"],
      doesNotOwn: ["Users", "Authentication", "Sessions", "Permissions", "Roles", "Quizzes", "AI", "Analytics", "Notifications", "Commerce", "Workflows", "Search", "Data Warehouse", "Reports"],
    },
  };
}
export function generateMarkdownDocumentation(): string {
  const doc = generateDocumentation();
  let md = `# EduBek — Multi-Tenant Organization, Institution & Workspace Platform\n\n**Version:** ${doc.version}\n**Generated:** ${doc.generatedAt}\n**Phase:** 6G.28\n\n## Overview\nThis platform is the SINGLE SOURCE OF TRUTH for organizations, institutions, multi-tenancy, workspaces, institutional hierarchy, organization lifecycle, memberships, branding, licensing metadata, quotas, and tenant isolation across EduBek. Every business platform owns its own business data. The Organization Platform owns ONLY organization metadata and organizational structure. Everything communicates exclusively through the Event Bus. No service-to-service communication. No circular dependencies. No ownership violations. No duplicated logic.\n\n## Systems\n\n`;
  for (const s of doc.systems) { md += `### System ${s.id} — ${s.name}\n${s.description}\n\n`; if (s.endpoints.length > 0) { md += `**Endpoints:**\n`; for (const e of s.endpoints) md += `- \`${e}\`\n`; md += `\n`; } if (s.events.length > 0) { md += `**Events:**\n`; for (const e of s.events) md += `- \`${e}\`\n`; md += `\n`; } }
  md += `## Events\n\n`; for (const e of doc.events) { md += `### \`${e.type}\`\n${e.description}\n**Payload:**\n`; for (const p of e.payload) md += `- \`${p}\`\n`; md += `\n`; }
  md += `## Ownership\n\n### Owns\n`; for (const o of doc.ownership.owns) md += `- ${o}\n`;
  md += `\n### Does NOT Own\n`; for (const o of doc.ownership.doesNotOwn) md += `- ${o}\n`;
  return md;
}
export function getOrganizationPlatformVersion(): string { return "1.0.0"; }
