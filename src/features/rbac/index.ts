/**
 * EduBek — RBAC barrel export.
 *
 * Re-exports the permission catalogue, role definitions, and the
 * authorization service so callers can `import { can, canInOrg, ... } from
 * "@/features/rbac"`.
 */

export {
  PlatformPermission,
  OrgPermission,
  PersonalPermission,
  PERMISSIONS,
  isPermission,
  type Permission,
} from "@/features/rbac/rbac.permissions";

export {
  PlatformRole,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_PERMISSIONS,
  OrgRole,
  ORG_ROLE_LABELS,
  ORG_DEFAULT_ROLES,
  isSuperadminRole,
  findDefaultOrgRole,
  platformRolePermissions,
  type OrgRoleDefinition,
} from "@/features/rbac/rbac.roles";

export {
  anonymousContext,
  buildContext,
  can,
  canAny,
  canInOrg,
  isOrgMember,
  resolveOrgRolePermissions,
  type AuthContext,
  type BuildContextInput,
  type OrgMembershipPermission,
  type PersonalPermissionOverride,
} from "@/features/rbac/rbac.service";
