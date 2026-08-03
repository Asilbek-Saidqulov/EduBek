/**
 * EduBek — organization service.
 *
 * Business logic for creating organizations, seeding their default roles,
 * listing the user's orgs, inviting members, and accepting invitations.
 *
 * Routes are thin wrappers; everything throw-able lives here.
 *
 * Authorization:
 *   • `createOrganization` — any authenticated user can create an org; they
 *     become its OWNER.
 *   • `createInvitation` — requires MEMBERS_INVITE in the target org (or
 *     OWNER, who implicitly has every org permission).
 *   • `acceptInvitation` — requires a valid (unexpired, unaccepted) token;
 *     the accepting user becomes a member with the role named on the
 *     invitation (or STUDENT by default).
 */

import { randomBytes } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { conflict, forbidden, notFound } from "@/lib/errors";
import { eventBus } from "@/infra/event-bus";
import {
  INVITATION_ACCEPTED,
  MEMBER_INVITED,
  ORGANIZATION_CREATED,
} from "@/infra/event-bus/events";
import { OrgRole, ORG_DEFAULT_ROLES } from "@/features/rbac/rbac.roles";
import { OrgPermission, type Permission } from "@/features/rbac/rbac.permissions";
import { can, canInOrg, isOrgMember, type AuthContext } from "@/features/rbac/rbac.service";
import {
  acceptInvitation as acceptInvitationRow,
  createInvitation as createInvitationRow,
  createMembership,
  createOrganization as createOrganizationRow,
  createOrgRole,
  findInvitationByToken,
  findMembership,
  findOrganizationById,
  findOrganizationBySlug,
  findOrganizationsForUser,
  findOrgRoleById,
  findOrgRoleByName,
} from "@/features/organization/organization.repository";
import type {
  OrganizationDto,
  OrganizationInvitationDto,
  OrganizationMembershipDto,
  OrganizationType,
} from "@/features/organization/organization.types";
import type { CreateOrganizationBody } from "@/features/organization/organization.schema";

const log = getLogger("organization");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOrgDto(
  org: Awaited<ReturnType<typeof findOrganizationBySlug>>,
): OrganizationDto {
  if (!org) throw new Error("toOrgDto called with null org");
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type as OrganizationType,
    ownerId: org.ownerId,
    billingEmail: org.billingEmail,
    country: org.country,
    plan: org.plan,
    seats: org.seats,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

/**
 * Seed the six default org roles into a freshly created organization. The
 * permissions are written as a JSON map of `{ permission: boolean }` so
 * that admins can later toggle individual permissions per role without
 * changing the catalogue.
 */
async function seedDefaultRoles(orgId: string): Promise<void> {
  for (const role of ORG_DEFAULT_ROLES) {
    const permissions: Record<string, boolean> = {};
    for (const p of role.permissions) {
      permissions[p] = true;
    }
    await createOrgRole({
      orgId,
      name: role.name,
      permissions,
      isDefault: true,
    });
  }
}

function requireOrgPermission(
  ctx: AuthContext,
  orgId: string,
  permission: Permission,
): void {
  if (ctx.isSuperadmin) return;
  if (!isOrgMember(ctx, orgId)) {
    throw forbidden("You are not a member of this organization");
  }
  // canInOrg expects an OrgPermission; cast is safe because callers below
  // only pass org permissions.
  if (!canInOrg(ctx, orgId, permission as OrgPermission)) {
    throw forbidden("You do not have permission to perform this action");
  }
}

/**
 * Parse an `OrganizationRole.permissions` JSON string into a Set<string>.
 * The JSON shape is `{ "permission.string": true, ... }`; entries with
 * `false` values are dropped. Malformed JSON returns an empty set so the
 * role behaves as "no permissions" rather than crashing the request.
 */
function parseRolePermissions(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return new Set(
      Object.entries(parsed)
        .filter(([, v]) => v === true)
        .map(([k]) => k),
    );
  } catch {
    return new Set<string>();
  }
}

// ---------------------------------------------------------------------------
// createOrganization
// ---------------------------------------------------------------------------

export async function createOrganization(
  ctx: AuthContext,
  input: CreateOrganizationBody,
): Promise<OrganizationDto> {
  if (!ctx.userId) {
    throw forbidden("You must be signed in to create an organization");
  }

  const existing = await findOrganizationBySlug(input.slug);
  if (existing) {
    throw conflict("An organization with this slug already exists");
  }

  const org = await createOrganizationRow({
    name: input.name,
    slug: input.slug,
    type: input.type,
    ownerId: ctx.userId,
    billingEmail: input.billingEmail,
    country: input.country,
  });

  await seedDefaultRoles(org.id);

  // The creator becomes the OWNER of the org.
  const ownerRole = await findOrgRoleByName(org.id, OrgRole.OWNER);
  await createMembership({
    orgId: org.id,
    userId: ctx.userId,
    roleId: ownerRole?.id,
    status: "active",
  });

  // Seed the creator's auth context with the new membership so that
  // subsequent permission checks in the same request work without a DB
  // round-trip.
  if (ownerRole) {
    ctx.orgPermissions.set(org.id, {
      orgId: org.id,
      roleId: ownerRole.id,
      roleName: ownerRole.name,
      permissions: parseRolePermissions(ownerRole.permissions),
    });
  }

  eventBus.publish({
    type: ORGANIZATION_CREATED,
    occurredAt: new Date(),
    actorId: ctx.userId,
    orgId: org.id,
    slug: org.slug,
    name: org.name,
    ownerId: ctx.userId,
  });

  log.info("org.created", { orgId: org.id, slug: org.slug, ownerId: ctx.userId });
  return toOrgDto(org);
}

// ---------------------------------------------------------------------------
// listMyOrganizations
// ---------------------------------------------------------------------------

export async function listMyOrganizations(
  ctx: AuthContext,
): Promise<OrganizationDto[]> {
  if (!ctx.userId) return [];
  const orgs = await findOrganizationsForUser(ctx.userId);
  return orgs.map((o) => toOrgDto(o));
}

// ---------------------------------------------------------------------------
// createInvitation
// ---------------------------------------------------------------------------

export interface CreateInvitationInput {
  email: string;
  roleName?: string;
  expiresInHours?: number;
}

export async function createInvitation(
  ctx: AuthContext,
  slug: string,
  input: CreateInvitationInput,
): Promise<OrganizationInvitationDto> {
  if (!ctx.userId) {
    throw forbidden("You must be signed in to invite members");
  }

  const org = await findOrganizationBySlug(slug);
  if (!org) {
    throw notFound("Organization not found");
  }

  requireOrgPermission(ctx, org.id, OrgPermission.MEMBERS_INVITE);

  // Validate that the named role exists in this org (or is a default role).
  let roleId: string | undefined;
  let roleName: string | undefined;
  if (input.roleName) {
    const role = await findOrgRoleByName(org.id, input.roleName);
    if (!role) {
      throw conflict(`Role "${input.roleName}" does not exist in this organization`);
    }
    roleId = role.id;
    roleName = role.name;
  } else {
    // Default to STUDENT for new invitations.
    const studentRole = await findOrgRoleByName(org.id, OrgRole.STUDENT);
    roleId = studentRole?.id;
    roleName = studentRole?.name;
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + (input.expiresInHours ?? 168) * 60 * 60 * 1000,
  );

  const invitation = await createInvitationRow({
    orgId: org.id,
    email: input.email,
    roleId,
    token,
    invitedById: ctx.userId,
    expiresAt,
  });

  eventBus.publish({
    type: MEMBER_INVITED,
    occurredAt: new Date(),
    actorId: ctx.userId,
    orgId: org.id,
    orgSlug: org.slug,
    inviteeEmail: input.email,
    invitationToken: token,
    invitedBy: ctx.userId,
    roleName,
  });

  log.info("org.invitation_created", {
    orgId: org.id,
    email: input.email,
    roleName,
  });

  return {
    id: invitation.id,
    orgId: org.id,
    orgName: org.name,
    orgSlug: org.slug,
    email: invitation.email,
    roleId: invitation.roleId,
    roleName: roleName ?? null,
    invitedById: invitation.invitedById,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
    createdAt: invitation.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// acceptInvitation
// ---------------------------------------------------------------------------

export async function acceptInvitation(
  ctx: AuthContext,
  token: string,
): Promise<OrganizationMembershipDto> {
  if (!ctx.userId || !ctx.email) {
    throw forbidden("You must be signed in to accept an invitation");
  }

  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw notFound("Invitation not found");
  }
  if (invitation.acceptedAt) {
    throw conflict("This invitation has already been accepted");
  }
  if (invitation.expiresAt < new Date()) {
    throw conflict("This invitation has expired");
  }
  // The invitation email must match the authenticated user's email —
  // otherwise anyone who scraped a token could redeem it.
  if (invitation.email.toLowerCase() !== ctx.email.toLowerCase()) {
    throw forbidden("This invitation is for a different email address");
  }

  const existing = await findMembership(invitation.orgId, ctx.userId);
  if (existing) {
    throw conflict("You are already a member of this organization");
  }

  const membership = await createMembership({
    orgId: invitation.orgId,
    userId: ctx.userId,
    roleId: invitation.roleId ?? undefined,
    status: "active",
  });

  await acceptInvitationRow(invitation.id);

  // Populate the role name on the membership DTO if we can resolve it.
  let roleName: string | null = null;
  if (invitation.roleId) {
    const role = await findOrgRoleById(invitation.roleId);
    roleName = role?.name ?? null;
  }

  // Fetch the org to populate the slug on the published event. We always
  // re-read because the invitation may have been created long ago and the
  // org may have been renamed (slug is immutable, but we don't assume).
  const org = await findOrganizationById(invitation.orgId);
  const orgSlug = org?.slug ?? "";

  eventBus.publish({
    type: INVITATION_ACCEPTED,
    occurredAt: new Date(),
    actorId: ctx.userId,
    orgId: invitation.orgId,
    orgSlug,
    userId: ctx.userId,
    email: ctx.email,
    roleName: roleName ?? undefined,
  });

  log.info("org.invitation_accepted", {
    orgId: invitation.orgId,
    userId: ctx.userId,
  });

  return {
    id: membership.id,
    orgId: membership.orgId,
    userId: membership.userId,
    roleId: membership.roleId,
    roleName,
    status: membership.status,
    joinedAt: membership.joinedAt.toISOString(),
    expiresAt: membership.expiresAt ? membership.expiresAt.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Re-export `can` so route handlers can do permission checks without
 * crossing feature boundaries. */
export { can };
