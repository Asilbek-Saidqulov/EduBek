import { db } from "@/lib/db";
import { conflict, unauthorized } from "@/lib/errors";
import type { AuthContext } from "@/features/auth";
import type { CreateOrganizationBody } from "./organization.schema";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export async function createOrganization(ctx: AuthContext, data: CreateOrganizationBody) {
  if (!ctx.userId) throw unauthorized();
  const slug = data.slug || slugify(data.name);
  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) throw conflict("Organization slug already taken");

  const org = await db.organization.create({
    data: {
      name: data.name,
      slug,
      type: data.type || "school",
      ownerId: ctx.userId,
      country: data.country,
      billingEmail: data.billingEmail,
      seats: data.seats ?? 10,
      roles: {
        create: [
          { name: "owner", permissions: "['*']", isDefault: false },
          { name: "admin", permissions: "['invite','manage']", isDefault: false },
          { name: "teacher", permissions: "['teach']", isDefault: false },
          { name: "student", permissions: "['learn']", isDefault: true },
        ],
      },
      memberships: {
        create: { userId: ctx.userId, status: "active" },
      },
    },
  });
  return org;
}

export async function listMyOrganizations(ctx: AuthContext) {
  if (!ctx.userId) throw unauthorized();
  const memberships = await db.organizationMembership.findMany({
    where: { userId: ctx.userId, status: "active" },
    include: { org: true },
    orderBy: { joinedAt: "desc" },
  });
  return memberships.map((m) => ({
    membershipId: m.id,
    roleId: m.roleId,
    status: m.status,
    organization: m.org,
  }));
}
