/**
 * EduBek — RBAC role definitions.
 *
 * Roles are bundles of permissions granted to a user, either globally
 * (PlatformRole) or scoped to a single organization (OrgRole).
 *
 * The platform ships six built-in org roles that cover the common
 * school/cohort/publisher workflows. Org admins can later create custom
 * roles by writing to `OrganizationRole`; that path is implemented in a
 * later phase. Phase R0 only needs the catalogue below.
 */

import {
  OrgPermission,
  PlatformPermission,
} from "@/features/rbac/rbac.permissions";

// ---------------------------------------------------------------------------
// Platform roles
// ---------------------------------------------------------------------------

export const PlatformRole = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  CREATOR: "creator",
  USER: "user",
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  creator: "Creator",
  user: "User",
};

/**
 * Permissions granted by each platform role. Superadmins implicitly get every
 * permission — they are kept out of this map so that adding a new permission
 * does not require updating the superadmin entry.
 */
export const PLATFORM_ROLE_PERMISSIONS: Record<
  Exclude<PlatformRole, "superadmin">,
  ReadonlySet<string>
> = {
  admin: new Set<string>([
    PlatformPermission.USERS_READ,
    PlatformPermission.USERS_CREATE,
    PlatformPermission.USERS_UPDATE,
    PlatformPermission.USERS_BAN,
    PlatformPermission.ORGS_READ_ALL,
    PlatformPermission.MARKETPLACE_MODERATE,
    PlatformPermission.MARKETPLACE_FEATURE,
    PlatformPermission.SYSTEM_CONFIG,
  ]),
  moderator: new Set<string>([
    PlatformPermission.USERS_READ,
    PlatformPermission.ORGS_READ_ALL,
    PlatformPermission.MARKETPLACE_MODERATE,
  ]),
  creator: new Set<string>([]),
  user: new Set<string>([]),
};

// ---------------------------------------------------------------------------
// Org roles
// ---------------------------------------------------------------------------

export const OrgRole = {
  OWNER: "owner",
  ADMIN: "admin",
  SCHOOL_ADMIN: "school_admin",
  TEACHER: "teacher",
  TA: "ta",
  STUDENT: "student",
} as const;

export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  school_admin: "School Admin",
  teacher: "Teacher",
  ta: "Teaching Assistant",
  student: "Student",
};

export interface OrgRoleDefinition {
  name: OrgRole;
  label: string;
  permissions: ReadonlySet<string>;
  isDefault: boolean;
}

/**
 * The six system org roles seeded into every new organization. Custom roles
 * (created by org admins) are stored in `OrganizationRole` and joined in at
 * runtime by the RBAC service.
 */
export const ORG_DEFAULT_ROLES: readonly OrgRoleDefinition[] = Object.freeze([
  {
    name: OrgRole.OWNER,
    label: ORG_ROLE_LABELS.owner,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.ORG_UPDATE,
      OrgPermission.ORG_DELETE,
      OrgPermission.ORG_TRANSFER_OWNERSHIP,
      OrgPermission.MEMBERS_READ,
      OrgPermission.MEMBERS_INVITE,
      OrgPermission.MEMBERS_REMOVE,
      OrgPermission.MEMBERS_UPDATE_ROLE,
      OrgPermission.ROLES_READ,
      OrgPermission.ROLES_CREATE,
      OrgPermission.ROLES_UPDATE,
      OrgPermission.ROLES_DELETE,
      OrgPermission.BILLING_READ,
      OrgPermission.BILLING_MANAGE,
      OrgPermission.QUIZ_CREATE,
      OrgPermission.QUIZ_PUBLISH,
      OrgPermission.QUIZ_DELETE,
      OrgPermission.LIBRARY_MANAGE,
      OrgPermission.RESOURCE_CREATE,
      OrgPermission.RESOURCE_READ,
      OrgPermission.RESOURCE_UPDATE_ANY,
      OrgPermission.RESOURCE_DELETE_ANY,
      OrgPermission.RESOURCE_ARCHIVE_ANY,
      OrgPermission.RESOURCE_DUPLICATE,
      OrgPermission.MARKETPLACE_PUBLISH,
      OrgPermission.MARKETPLACE_MANAGE,
      OrgPermission.MARKETPLACE_REVIEW,
      OrgPermission.ANALYTICS_READ,
      OrgPermission.ANALYTICS_EXPORT,
    ]),
  },
  {
    name: OrgRole.ADMIN,
    label: ORG_ROLE_LABELS.admin,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.ORG_UPDATE,
      OrgPermission.MEMBERS_READ,
      OrgPermission.MEMBERS_INVITE,
      OrgPermission.MEMBERS_REMOVE,
      OrgPermission.MEMBERS_UPDATE_ROLE,
      OrgPermission.ROLES_READ,
      OrgPermission.ROLES_CREATE,
      OrgPermission.ROLES_UPDATE,
      OrgPermission.ROLES_DELETE,
      OrgPermission.BILLING_READ,
      OrgPermission.QUIZ_CREATE,
      OrgPermission.QUIZ_PUBLISH,
      OrgPermission.QUIZ_DELETE,
      OrgPermission.LIBRARY_MANAGE,
      OrgPermission.RESOURCE_CREATE,
      OrgPermission.RESOURCE_READ,
      OrgPermission.RESOURCE_UPDATE_ANY,
      OrgPermission.RESOURCE_DELETE_ANY,
      OrgPermission.RESOURCE_ARCHIVE_ANY,
      OrgPermission.RESOURCE_DUPLICATE,
      OrgPermission.MARKETPLACE_PUBLISH,
      OrgPermission.MARKETPLACE_MANAGE,
      OrgPermission.ANALYTICS_READ,
      OrgPermission.ANALYTICS_EXPORT,
    ]),
  },
  {
    name: OrgRole.SCHOOL_ADMIN,
    label: ORG_ROLE_LABELS.school_admin,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.MEMBERS_READ,
      OrgPermission.MEMBERS_INVITE,
      OrgPermission.ROLES_READ,
      OrgPermission.QUIZ_CREATE,
      OrgPermission.QUIZ_PUBLISH,
      OrgPermission.LIBRARY_MANAGE,
      OrgPermission.RESOURCE_CREATE,
      OrgPermission.RESOURCE_READ,
      OrgPermission.RESOURCE_DUPLICATE,
      OrgPermission.ANALYTICS_READ,
    ]),
  },
  {
    name: OrgRole.TEACHER,
    label: ORG_ROLE_LABELS.teacher,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.MEMBERS_READ,
      OrgPermission.QUIZ_CREATE,
      OrgPermission.QUIZ_PUBLISH,
      OrgPermission.LIBRARY_MANAGE,
      OrgPermission.RESOURCE_CREATE,
      OrgPermission.RESOURCE_READ,
      OrgPermission.RESOURCE_DUPLICATE,
      OrgPermission.ANALYTICS_READ,
    ]),
  },
  {
    name: OrgRole.TA,
    label: ORG_ROLE_LABELS.ta,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.MEMBERS_READ,
      OrgPermission.QUIZ_CREATE,
      OrgPermission.RESOURCE_READ,
      OrgPermission.RESOURCE_DUPLICATE,
    ]),
  },
  {
    name: OrgRole.STUDENT,
    label: ORG_ROLE_LABELS.student,
    isDefault: true,
    permissions: new Set<string>([
      OrgPermission.ORG_READ,
      OrgPermission.RESOURCE_READ,
    ]),
  },
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when the platform role grants superadmin powers (implicit allow-all). */
export function isSuperadminRole(role: string): role is "superadmin" {
  return role === PlatformRole.SUPERADMIN;
}

/** Resolve the org-role definition for a given role name from the default catalogue. */
export function findDefaultOrgRole(
  name: string,
): OrgRoleDefinition | undefined {
  return ORG_DEFAULT_ROLES.find((role) => role.name === name);
}

/**
 * Returns the set of permissions granted by a platform role. Superadmins get
 * a sentinel `*` set; the RBAC service special-cases this.
 */
export function platformRolePermissions(
  role: string,
): ReadonlySet<string> {
  if (isSuperadminRole(role)) {
    return new Set<string>(["*"]);
  }
  if (role in PLATFORM_ROLE_PERMISSIONS) {
    return PLATFORM_ROLE_PERMISSIONS[
      role as Exclude<PlatformRole, "superadmin">
    ];
  }
  return new Set<string>();
}
