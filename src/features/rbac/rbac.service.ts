/**
 * EduBek — RBAC service.
 *
 * Pure, synchronous authorization checks. The service is intentionally
 * side-effect free: building an `AuthContext` is the only IO-adjacent step,
 * and even that is delegated to `auth.context.ts` (which calls into the auth
 * repository to fetch fresh role + permission-override rows).
 *
 * Permission resolution order:
 *
 *   1. If the user is a superadmin → allow (the wildcard set).
 *   2. If the permission is a PlatformPermission → allow if any of the
 *      user's platform roles grants it, *unless* a personal permission
 *      override explicitly denies it.
 *   3. If the permission is a PersonalPermission → allow by default unless
 *      a personal permission override denies it.
 *   4. If the permission is an OrgPermission → check `canInOrg(ctx, orgId, p)`.
 *
 * `canInOrg` resolves org-scoped permissions by looking up the user's role
 * in that org and consulting the role's permission set. Custom org roles
 * (created via the org admin UI) override the default catalogue.
 */

import {
  OrgPermission,
  PersonalPermission,
  PlatformPermission,
  isPermission,
  type Permission,
} from "@/features/rbac/rbac.permissions";
import {
  findDefaultOrgRole,
  isSuperadminRole,
  platformRolePermissions,
} from "@/features/rbac/rbac.roles";

// ---------------------------------------------------------------------------
// AuthContext
// ---------------------------------------------------------------------------

export interface PersonalPermissionOverride {
  permission: string;
  granted: boolean;
  reason?: string;
}

export interface OrgMembershipPermission {
  orgId: string;
  roleId?: string;
  roleName?: string;
  permissions: ReadonlySet<string>;
}

export interface AuthContext {
  userId?: string;
  email?: string;
  /**
   * User's preferred locale (ISO 639-1, e.g. "en", "uz", "ru").
   * Phase 4E.1: read from the JWT locale claim via middleware header.
   * May be undefined for anonymous users or pre-4E.1 tokens.
   */
  locale?: string;
  /** Roles granted at the platform level (UserRole.role). */
  platformRoles: string[];
  /** True when the user has the `superadmin` platform role. */
  isSuperadmin: boolean;
  /** Per-permission overrides applied on top of platform / personal defaults. */
  personalPermissionOverrides: PersonalPermissionOverride[];
  /** Org-scoped role + permission bundles, keyed by orgId. Populated lazily. */
  orgPermissions: Map<string, OrgMembershipPermission>;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

/**
 * Anonymous context — no user. Used for unauthenticated requests so that
 * `can()` returns a uniform `false` without null checks at every call site.
 */
export function anonymousContext(): AuthContext {
  return {
    platformRoles: [],
    isSuperadmin: false,
    personalPermissionOverrides: [],
    orgPermissions: new Map(),
  };
}

export interface BuildContextInput {
  userId?: string;
  email?: string;
  /** Phase 4E.1: user's preferred locale from JWT */
  locale?: string;
  platformRoles: string[];
  personalPermissionOverrides?: PersonalPermissionOverride[];
}

/**
 * Build an `AuthContext` from raw inputs. The org permissions map is left
 * empty by default; call `loadOrgPermissions()` (in auth.context.ts) to
 * populate it lazily — that avoids a DB hit on every request when the
 * handler doesn't actually need org-scoped checks.
 */
export function buildContext(input: BuildContextInput): AuthContext {
  return {
    userId: input.userId,
    email: input.email,
    locale: input.locale,
    platformRoles: input.platformRoles,
    isSuperadmin: input.platformRoles.some(isSuperadminRole),
    personalPermissionOverrides: input.personalPermissionOverrides ?? [],
    orgPermissions: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Permission checks
// ---------------------------------------------------------------------------

function overrideFor(
  ctx: AuthContext,
  permission: Permission,
): PersonalPermissionOverride | undefined {
  return ctx.personalPermissionOverrides.find(
    (o) => o.permission === permission,
  );
}

function platformGrants(ctx: AuthContext, permission: Permission): boolean {
  if (ctx.isSuperadmin) return true;
  for (const role of ctx.platformRoles) {
    const set = platformRolePermissions(role);
    if (set.has("*") || set.has(permission)) return true;
  }
  return false;
}

/**
 * Personal / platform permission check. Returns `true` only when the user
 * is allowed to perform the action *and* no personal override denies it.
 */
export function can(ctx: AuthContext, permission: Permission): boolean {
  if (!isPermission(permission)) return false;

  const override = overrideFor(ctx, permission);
  if (override && !override.granted) return false;

  if (ctx.isSuperadmin) return true;

  // Platform permissions are gated by the user's platform roles.
  const isPlatform = Object.values(PlatformPermission).includes(
    permission as PlatformPermission,
  );
  if (isPlatform) {
    return platformGrants(ctx, permission);
  }

  // Personal permissions default to allow for authenticated users, unless
  // an override denies them. If the override explicitly grants, allow.
  const isPersonal = Object.values(PersonalPermission).includes(
    permission as PersonalPermission,
  );
  if (isPersonal) {
    if (override?.granted) return true;
    return ctx.userId !== undefined;
  }

  // Org permissions are not answered here — the caller must use `canInOrg`.
  return false;
}

/** True when the user is allowed any of the given permissions. */
export function canAny(ctx: AuthContext, permissions: Permission[]): boolean {
  return permissions.some((p) => can(ctx, p));
}

/** True when the user is an explicit member of the given org. */
export function isOrgMember(ctx: AuthContext, orgId: string): boolean {
  return ctx.orgPermissions.has(orgId);
}

/**
 * Org-scoped permission check. Loads the user's role for the org from the
 * context's `orgPermissions` map (populated by `loadOrgPermissions`).
 *
 * Superadmins implicitly satisfy every org permission.
 */
export function canInOrg(
  ctx: AuthContext,
  orgId: string,
  permission: OrgPermission,
): boolean {
  if (ctx.isSuperadmin) return true;
  const membership = ctx.orgPermissions.get(orgId);
  if (!membership) return false;
  if (membership.permissions.has("*")) return true;
  return membership.permissions.has(permission);
}

/**
 * Lookup helper: returns the org role definition for a custom role name,
 * falling back to the default catalogue. Used by `loadOrgPermissions`.
 */
export function resolveOrgRolePermissions(
  roleName: string,
  customPermissions?: string[] | ReadonlySet<string>,
): ReadonlySet<string> {
  if (customPermissions) {
    const set =
      customPermissions instanceof Set
        ? customPermissions
        : new Set(customPermissions);
    return set;
  }
  const def = findDefaultOrgRole(roleName);
  return def ? def.permissions : new Set<string>();
}
