import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { conflict, forbidden, notFound, unauthorized } from "@/lib/errors";
import type { AuthContext } from "@/features/auth";

export { listMyOrganizations, createOrganization } from "./organization/organization.service";
export { createOrganizationBodySchema } from "./organization/organization.schema";

export const createInvitationBodySchema = z.object({
  email: z.string().email(),
  roleName: z.string().optional(),
});
export type CreateInvitationBody = z.infer<typeof createInvitationBodySchema>;

async function requireOwnerAdmin(userId: string, orgId: string) {
  const org = await db.organization.findUnique({ where: { id: orgId }, include: { memberships: true, roles: true } });
  if (!org) throw notFound("Organization not found");
  if (org.ownerId === userId) return org;
  const membership = org.memberships.find((m) => m.userId === userId && m.status === "active");
  if (!membership) throw forbidden("Not a member");
  const role = org.roles.find((r) => r.id === membership.roleId);
  if (role && ["owner", "admin"].includes(role.name)) return org;
  throw forbidden("Only owner/admin can invite");
}

export async function createInvitation(authCtx: AuthContext, slug: string, input: CreateInvitationBody) {
  if (!authCtx.userId) throw unauthorized();
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) throw notFound("Organization not found");
  await requireOwnerAdmin(authCtx.userId, org.id);

  const email = input.email.trim().toLowerCase();
  const pending = await db.organizationInvitation.findFirst({
    where: { orgId: org.id, email, acceptedAt: null },
  });
  if (pending) throw conflict("Invitation already pending for this email");

  const role = input.roleName
    ? await db.organizationRole.findFirst({ where: { orgId: org.id, name: input.roleName } })
    : await db.organizationRole.findFirst({ where: { orgId: org.id, isDefault: true } });

  return db.organizationInvitation.create({
    data: {
      orgId: org.id,
      email,
      roleId: role?.id,
      token: randomBytes(24).toString("hex"),
      invitedById: authCtx.userId,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function acceptInvitation(authCtx: AuthContext, token: string) {
  if (!authCtx.userId) throw unauthorized();
  const invite = await db.organizationInvitation.findUnique({
    where: { token },
    include: { org: { include: { memberships: true } } },
  });
  if (!invite) throw notFound("Invitation not found");
  if (invite.acceptedAt) throw conflict("Invitation already accepted");
  if (invite.expiresAt < new Date()) throw forbidden("Invitation expired");
  if (authCtx.email && authCtx.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw forbidden("This invitation was issued to a different email");
  }

  const activeSeats = invite.org.memberships.filter((m) => m.status === "active").length;
  if (activeSeats >= invite.org.seats) throw forbidden("Organization is at seat capacity");

  await db.$transaction([
    db.organizationMembership.upsert({
      where: { orgId_userId: { orgId: invite.orgId, userId: authCtx.userId } },
      create: { orgId: invite.orgId, userId: authCtx.userId, roleId: invite.roleId, status: "active" },
      update: { status: "active", roleId: invite.roleId },
    }),
    db.organizationInvitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return { success: true, orgId: invite.orgId };
}
