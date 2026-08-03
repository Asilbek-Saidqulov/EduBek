/**
 * EduBek — auth request context.
 *
 * The middleware sets `x-edubek-user-id`, `x-edubek-user-email`, and
 * `x-edubek-user-roles` headers on every request after verifying the
 * session JWT. Route handlers and services consume those headers via
 * `getAuthContext()` to build an `AuthContext` for the current request.
 *
 * IMPORTANT — trust boundary:
 *   The middleware *strips* any client-supplied `x-edubek-*` headers before
 *   adding its own, so the headers we read here can be trusted to have
 *   originated from the middleware (and therefore from a valid JWT). Code
 *   that runs outside the middleware (e.g. scripts, tests) can build an
 *   AuthContext directly via `buildContext` / `buildAuthContext`.
 */

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/errors";
import {
  buildContext,
  type AuthContext,
} from "@/features/rbac/rbac.service";
import {
  findUserPermissionOverrides,
  findUserPlatformRoles,
} from "@/features/auth/auth.repository";

// ---------------------------------------------------------------------------
// Header names — keep in sync with `src/middleware.ts`.
// ---------------------------------------------------------------------------

export const USER_ID_HEADER = "x-edubek-user-id";
export const USER_EMAIL_HEADER = "x-edubek-user-email";
export const USER_ROLES_HEADER = "x-edubek-user-roles";
export const USER_LOCALE_HEADER = "x-edubek-user-locale";

// ---------------------------------------------------------------------------
// getAuthContext
// ---------------------------------------------------------------------------

/**
 * Build an `AuthContext` from the request headers set by the middleware.
 *
 * Returns an anonymous context if no session is present — callers can then
 * use `requireAuth(ctx)` to short-circuit unauthenticated requests.
 *
 * The function always re-fetches the user's permission overrides from the
 * DB so that revocations take effect on the next request. Platform roles
 * are taken from the JWT snapshot (the middleware re-issues the JWT on
 * every refresh, so the snapshot is at most `sessionTtlSeconds` stale).
 */
export async function getAuthContext(): Promise<AuthContext> {
  const h = await headers();
  const userId = h.get(USER_ID_HEADER);
  const email = h.get(USER_EMAIL_HEADER);
  const rolesHeader = h.get(USER_ROLES_HEADER);
  const locale = h.get(USER_LOCALE_HEADER) ?? undefined;

  if (!userId || !email) {
    return buildContext({
      userId: undefined,
      email: undefined,
      locale,
      platformRoles: [],
    });
  }

  const roles = parseRolesHeader(rolesHeader);
  const overrides = await findUserPermissionOverrides(userId);

  return buildContext({
    userId,
    email,
    locale,
    platformRoles: roles,
    personalPermissionOverrides: overrides.map((o) => ({
      permission: o.permission,
      granted: o.granted,
      reason: o.reason ?? undefined,
    })),
  });
}

function parseRolesHeader(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

// ---------------------------------------------------------------------------
// loadOrgPermissions
// ---------------------------------------------------------------------------

/**
 * Populate `ctx.orgPermissions` from the database. Call this lazily — only
 * when a handler actually needs org-scoped authorization checks — to avoid
 * paying the DB cost on every request.
 *
 * The function mutates `ctx` in place AND returns it for chaining.
 */
export async function loadOrgPermissions(
  ctx: AuthContext,
): Promise<AuthContext> {
  if (!ctx.userId || ctx.orgPermissions.size > 0) {
    return ctx;
  }

  const memberships = await db.organizationMembership.findMany({
    where: { userId: ctx.userId, status: "active" },
    include: {
      org: { select: { id: true, slug: true } },
      // We resolve role permissions from the default catalogue by name; if
      // the membership points at a custom OrganizationRole, we load its
      // permissions JSON. Phase R0 only seeds default roles, but the
      // lookup path is here so later phases don't have to revisit it.
    },
  });

  for (const m of memberships) {
    let permissions = new Set<string>();
    let roleName: string | undefined;
    let roleId: string | undefined;

    if (m.roleId) {
      const role = await db.organizationRole.findUnique({
        where: { id: m.roleId },
      });
      if (role) {
        roleName = role.name;
        roleId = role.id;
        try {
          const parsed = JSON.parse(role.permissions) as Record<
            string,
            boolean
          >;
          permissions = new Set(
            Object.entries(parsed)
              .filter(([, v]) => v === true)
              .map(([k]) => k),
          );
        } catch {
          permissions = new Set<string>();
        }
      }
    } else {
      // Default catalogue role — resolve from the static map.
      const { resolveOrgRolePermissions } = await import(
        "@/features/rbac/rbac.service"
      );
      const { findDefaultOrgRole } = await import(
        "@/features/rbac/rbac.roles"
      );
      // We don't know the role name without a roleId in the default flow;
      // treat membership without a roleId as a "member" with the default
      // student-level permissions. This branch is only hit by legacy data
      // — new memberships always carry a roleId.
      const fallback = findDefaultOrgRole("student");
      roleName = fallback?.name;
      permissions = new Set(resolveOrgRolePermissions("student"));
    }

    ctx.orgPermissions.set(m.orgId, {
      orgId: m.orgId,
      roleId,
      roleName,
      permissions,
    });
  }

  return ctx;
}

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

/**
 * Throw a 401 `HttpError` if the context represents an anonymous user.
 * Use this at the top of any handler that requires authentication.
 */
export function requireAuth(ctx: AuthContext): AuthContext {
  if (!ctx.userId) {
    throw unauthorized("Authentication required");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Convenience: roles-only fetch (used by middleware mirror / tests)
// ---------------------------------------------------------------------------

/**
 * Re-fetch the user's platform roles from the DB. Used when a caller has
 * only a `userId` and needs the fresh role list (e.g. for issuing a new
 * session token after a role change).
 */
export async function fetchPlatformRoles(
  userId: string,
): Promise<string[]> {
  const rows = await findUserPlatformRoles(userId);
  return rows.map((r) => r.role);
}
