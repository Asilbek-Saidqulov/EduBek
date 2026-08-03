/**
 * EduBek — Multi-Tenant Organization, Institution & Workspace Platform types.
 * Phase 6G.28: Single source of truth for organizations, institutions, tenancy,
 * workspaces, institutional hierarchy, memberships, branding, licensing metadata,
 * quotas, and tenant isolation across EduBek.
 *
 * Owns ONLY:
 *   organizations, institutions, tenants, workspaces, departments, campuses,
 *   faculties, hierarchy, memberships, branding metadata, quotas, license
 *   metadata, domains, policies.
 *
 * Never owns:
 *   users, authentication, sessions, permissions, roles, quizzes, AI, analytics,
 *   notifications, commerce, workflows, search, data warehouse, reports.
 *
 * Boundary:
 *   - Identity Platform owns users / authentication / sessions.
 *   - RBAC owns roles / permissions.
 *   - Commerce Platform owns billing / payments / subscriptions.
 *   - Workflow Platform owns workflow execution.
 *   - Notification Platform owns notifications.
 *   - Search indexes organizations (consumer).
 *   - Data Platform copies organization metadata for analytics (consumer).
 *
 * This platform only stores organization structure and tenancy metadata.
 * Everything communicates exclusively through the Event Bus.
 */

// System 1 — Organization Registry
export type OrganizationStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "archived"
  | "deleted";
export type OrganizationType =
  | "school"
  | "university"
  | "ministry"
  | "district"
  | "company"
  | "academy"
  | "training_center"
  | "tutoring_center"
  | "custom";
export interface OrganizationRegistryEntry {
  id: string; key: string; name: string; slug: string;
  tenantId: string; type: OrganizationType;
  status: OrganizationStatus; version: number;
  ownerId: string; parentId: string | null;
  displayName: string; description: string;
  timezone: string; locale: string;
  createdAt: string; updatedAt: string;
  archivedAt: string | null; deletedAt: string | null;
  metadata: Record<string, unknown>;
}

// System 2 — Tenant Registry
export type TenantStatus =
  | "provisioning"
  | "active"
  | "suspended"
  | "archived";
export interface TenantEntry {
  id: string; key: string; name: string;
  status: TenantStatus;
  plan: string;
  region: string;
  rootOrganizationId: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  archivedAt: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 3 — Institution Types (catalog)
export interface InstitutionTypeEntry {
  id: string; type: OrganizationType;
  displayName: string; description: string;
  defaultHierarchyDepth: number;
  supportedFeatures: string[];
  active: boolean;
  createdAt: string; updatedAt: string;
}

// System 4 — Organization Hierarchy
export type HierarchyRelationshipType = "parent" | "child" | "sibling";
export interface HierarchyNode {
  id: string; organizationId: string;
  parentId: string | null;
  path: string; depth: number;
  childIds: string[];
  createdAt: string; updatedAt: string;
}
export interface HierarchyUpdate {
  id: string; organizationId: string;
  previousParentId: string | null; newParentId: string | null;
  actorId: string; reason: string | null;
  occurredAt: string; correlationId: string;
}

// System 5 — Campus Registry
export type CampusStatus = "active" | "inactive" | "maintenance";
export interface CampusEntry {
  id: string; organizationId: string;
  key: string; name: string; slug: string;
  status: CampusStatus;
  address: string | null;
  geo: { latitude: number | null; longitude: number | null } | null;
  timezone: string | null;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 6 — Department Registry
export type DepartmentStatus = "active" | "inactive" | "merged";
export interface DepartmentEntry {
  id: string; organizationId: string;
  key: string; name: string; slug: string;
  parentId: string | null;
  headUserId: string | null;
  status: DepartmentStatus;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 7 — Faculty Registry
export type FacultyStatus = "active" | "inactive" | "reorganized";
export interface FacultyEntry {
  id: string; organizationId: string;
  key: string; name: string; slug: string;
  deanUserId: string | null;
  departmentIds: string[];
  status: FacultyStatus;
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 8 — Workspace Registry
export type WorkspaceType =
  | "teacher"
  | "student"
  | "administration"
  | "research"
  | "custom";
export type WorkspaceStatus = "active" | "archived";
export interface WorkspaceEntry {
  id: string; organizationId: string;
  key: string; name: string; slug: string;
  type: WorkspaceType;
  ownerId: string; status: WorkspaceStatus;
  createdAt: string; updatedAt: string;
  archivedAt: string | null;
  metadata: Record<string, unknown>;
}

// System 9 — Membership Registry (reference-only — Identity owns users)
export type MembershipRole = "member" | "admin" | "owner" | "guest" | "observer";
export type MembershipStatus = "active" | "invited" | "suspended" | "removed";
export interface MembershipEntry {
  id: string; organizationId: string;
  userId: string; role: MembershipRole;
  status: MembershipStatus;
  departmentId: string | null;
  facultyId: string | null;
  campusId: string | null;
  workspaceId: string | null;
  invitedBy: string | null;
  joinedAt: string | null;
  removedAt: string | null;
  createdAt: string; updatedAt: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// System 10 — Invitation Platform
export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired" | "withdrawn";
export interface InvitationEntry {
  id: string; organizationId: string;
  email: string; userId: string | null;
  role: MembershipRole;
  invitedBy: string;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string; updatedAt: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}

// System 11 — Organization Branding
export interface OrganizationBranding {
  id: string; organizationId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  theme: string | null;
  customCssUrl: string | null;
  assets: Array<{ key: string; url: string; type: string }>;
  createdAt: string; updatedAt: string;
}

// System 12 — Organization Configuration
export type ConfigScope = "organization" | "campus" | "department" | "workspace";
export interface OrganizationConfiguration {
  id: string; organizationId: string;
  scope: ConfigScope; scopeId: string | null;
  settings: Record<string, unknown>;
  secrets: string[];
  overrides: string[];
  schemaVersion: number;
  updatedAt: string; createdAt: string;
}

// System 13 — Organization Policies
export type PolicyEnforcement = "enforced" | "advisory" | "disabled";
export interface OrganizationPolicy {
  id: string; organizationId: string;
  key: string; name: string;
  enforcement: PolicyEnforcement;
  conditions: Record<string, unknown>;
  description: string;
  active: boolean;
  createdAt: string; updatedAt: string;
}

// System 14 — Organization Lifecycle
export type LifecycleTransition =
  | "provision"
  | "activate"
  | "suspend"
  | "archive"
  | "restore"
  | "delete";
export interface LifecycleRecord {
  id: string; organizationId: string;
  fromStatus: OrganizationStatus | null;
  toStatus: OrganizationStatus;
  transition: LifecycleTransition;
  actorId: string; reason: string | null;
  occurredAt: string; correlationId: string;
  metadata: Record<string, unknown>;
}

// System 15 — License Metadata
export type LicenseStatus = "active" | "expired" | "suspended" | "revoked" | "pending";
export interface LicenseMetadataEntry {
  id: string; organizationId: string;
  licenseKey: string; plan: string;
  status: LicenseStatus;
  seatLimit: number; seatsUsed: number;
  startedAt: string; expiresAt: string | null;
  subscriptionRef: string | null; // Commerce owns billing
  createdAt: string; updatedAt: string;
  metadata: Record<string, unknown>;
}

// System 16 — Quota Registry
export type QuotaResource = "students" | "teachers" | "courses" | "storage" | "ai" | "api" | "workspaces";
export type QuotaStatus = "ok" | "warning" | "exceeded";
export interface QuotaEntry {
  id: string; organizationId: string;
  resource: QuotaResource;
  limit: number; used: number;
  period: string; status: QuotaStatus;
  updatedAt: string; createdAt: string;
}

// System 17 — Domain Verification
export type DomainStatus = "unverified" | "pending" | "verified" | "failed" | "revoked";
export interface DomainEntry {
  id: string; organizationId: string;
  domain: string; status: DomainStatus;
  verificationToken: string;
  dnsRecords: Array<{ type: string; host: string; value: string }>;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string; updatedAt: string;
}

// System 18 — Tenant Isolation
export type IsolationBoundary = "strict" | "relaxed" | "shared";
export interface TenantIsolation {
  id: string; tenantId: string;
  boundary: IsolationBoundary;
  dataIsolation: boolean;
  networkIsolation: boolean;
  encryptionScope: "tenant" | "shared";
  allowedCrossTenantFlows: string[];
  securityMetadata: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}

// System 19 — Organization Analytics Metadata
export interface OrganizationAnalytics {
  organizations: { total: number; active: number; suspended: number; archived: number };
  members: { total: number; active: number; invited: number };
  workspaces: { total: number; active: number };
  licenses: { active: number; expired: number };
  quotas: { exceeded: number; warning: number; ok: number };
  invitations: { pending: number; accepted: number; rejected: number };
  topOrganizations: Array<{ organizationId: string; members: number; workspaces: number }>;
  updatedAt: string;
}

// System 20 — Organization Audit (immutable, append-only)
export type AuditCategory =
  | "lifecycle" | "membership" | "configuration"
  | "branding" | "policy" | "license" | "quota" | "domain" | "security";
export type AuditOutcome = "success" | "failure" | "denied";
export interface OrganizationAuditRecord {
  id: string; organizationId: string | null;
  actorId: string; category: AuditCategory;
  action: string; outcome: AuditOutcome;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  occurredAt: string; correlationId: string;
  ipAddress: string | null; userAgent: string | null;
}

// System 21 — Organization Dashboard
export interface OrganizationDashboard {
  organizations: { total: number; active: number; suspended: number; archived: number };
  tenants: { total: number; active: number; suspended: number };
  members: { total: number; active: number; invited: number };
  hierarchy: { maxDepth: number; totalNodes: number };
  workspaces: { total: number; active: number };
  campuses: { total: number; active: number };
  departments: { total: number; active: number };
  faculties: { total: number; active: number };
  licenses: { active: number; expired: number };
  quotas: { exceeded: number; warning: number };
  domains: { verified: number; pending: number };
  invitations: { pending: number; accepted: number };
  updatedAt: string;
}

// System 22 — Developer Integration
export type OrganizationEventType =
  | "OrganizationCreated"
  | "OrganizationUpdated"
  | "OrganizationArchived"
  | "OrganizationRestored"
  | "OrganizationDeleted"
  | "TenantCreated"
  | "TenantActivated"
  | "TenantSuspended"
  | "WorkspaceCreated"
  | "WorkspaceArchived"
  | "MembershipAdded"
  | "MembershipRemoved"
  | "InvitationCreated"
  | "InvitationAccepted"
  | "InvitationExpired"
  | "OrganizationBranded"
  | "OrganizationPolicyUpdated"
  | "QuotaExceeded"
  | "LicenseAssigned"
  | "LicenseExpired"
  | "DomainVerified"
  | "HierarchyUpdated";
export interface OrganizationDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean; scope: string }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: OrganizationEventType; description: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string; capabilities: string[] };
  webhooks: Array<{ id: string; event: OrganizationEventType; description: string }>;
}

// System 23 — Administration API
export interface OrganizationAdminStatus {
  operational: boolean; systems: number;
  bridgeSubscribed: boolean; updatedAt: string;
}

// System 24 — Event Bus Bridge
// (uses OrganizationEventType from System 22)

// System 25 — Documentation Generator
export interface OrganizationDocumentation {
  version: string; generatedAt: string;
  systems: Array<{ id: number; name: string; description: string; endpoints: string[]; events: string[] }>;
  events: Array<{ type: OrganizationEventType; payload: string[]; description: string }>;
  ownership: { owns: string[]; doesNotOwn: string[] };
}
