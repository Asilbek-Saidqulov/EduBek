/**
 * EduBek — organization repository.
 *
 * The ONLY layer that talks to Prisma for the organization feature. The
 * service layer composes these helpers; routes never touch `db` directly.
 *
 * Slug uniqueness: the `Organization.slug` column has a `@unique` constraint
 * in the Prisma schema, so the database is the final authority. The
 * repository exposes `findOrganizationBySlug` so the service can give a
 * friendly CONFLICT error before attempting the insert.
 */

import { db } from "@/lib/db";
import type {
  Organization,
  OrganizationInvitation,
  OrganizationMembership,
  OrganizationRole,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type: string;
  ownerId: string;
  billingEmail?: string;
  country?: string;
  plan?: string;
  seats?: number;
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  return db.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      ownerId: input.ownerId,
      billingEmail: input.billingEmail ?? null,
      country: input.country ?? null,
      plan: input.plan ?? "free",
      seats: input.seats ?? 10,
    },
  });
}

export async function findOrganizationById(
  id: string,
): Promise<Organization | null> {
  return db.organization.findUnique({ where: { id } });
}

export async function findOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  return db.organization.findUnique({ where: { slug } });
}

export async function findOrganizationsForUser(
  userId: string,
): Promise<Array<Organization & { memberships: OrganizationMembership[] }>> {
  const memberships = await db.organizationMembership.findMany({
    where: { userId, status: "active" },
    select: { orgId: true },
  });
  if (memberships.length === 0) return [];
  return db.organization.findMany({
    where: { id: { in: memberships.map((m) => m.orgId) } },
    include: {
      memberships: { where: { userId } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Roles (default + custom)
// ---------------------------------------------------------------------------

export interface CreateOrgRoleInput {
  orgId: string;
  name: string;
  permissions: Record<string, boolean>;
  isDefault?: boolean;
}

export async function createOrgRole(
  input: CreateOrgRoleInput,
): Promise<OrganizationRole> {
  return db.organizationRole.create({
    data: {
      orgId: input.orgId,
      name: input.name,
      permissions: JSON.stringify(input.permissions),
      isDefault: input.isDefault ?? false,
    },
  });
}

export async function findOrgRoleById(
  id: string,
): Promise<OrganizationRole | null> {
  return db.organizationRole.findUnique({ where: { id } });
}

export async function findOrgRoleByName(
  orgId: string,
  name: string,
): Promise<OrganizationRole | null> {
  return db.organizationRole.findUnique({
    where: { orgId_name: { orgId, name } },
  });
}

export async function findDefaultOrgRoles(
  orgId: string,
): Promise<OrganizationRole[]> {
  return db.organizationRole.findMany({
    where: { orgId, isDefault: true },
  });
}

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------

export interface CreateMembershipInput {
  orgId: string;
  userId: string;
  roleId?: string;
  status?: string;
  expiresAt?: Date;
}

export async function createMembership(
  input: CreateMembershipInput,
): Promise<OrganizationMembership> {
  return db.organizationMembership.create({
    data: {
      orgId: input.orgId,
      userId: input.userId,
      roleId: input.roleId ?? null,
      status: input.status ?? "active",
      expiresAt: input.expiresAt ?? null,
    },
  });
}

export async function findMembership(
  orgId: string,
  userId: string,
): Promise<OrganizationMembership | null> {
  return db.organizationMembership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export interface CreateInvitationInput {
  orgId: string;
  email: string;
  roleId?: string;
  token: string;
  invitedById: string;
  expiresAt: Date;
}

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<OrganizationInvitation> {
  return db.organizationInvitation.create({
    data: {
      orgId: input.orgId,
      email: input.email.toLowerCase(),
      roleId: input.roleId ?? null,
      token: input.token,
      invitedById: input.invitedById,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findInvitationByToken(
  token: string,
): Promise<OrganizationInvitation | null> {
  return db.organizationInvitation.findUnique({ where: { token } });
}

export async function findInvitationsForOrg(
  orgId: string,
): Promise<OrganizationInvitation[]> {
  return db.organizationInvitation.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitation(
  invitationId: string,
): Promise<OrganizationInvitation> {
  return db.organizationInvitation.update({
    where: { id: invitationId },
    data: { acceptedAt: new Date() },
  });
}
