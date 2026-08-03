/**
 * EduBek — organization DTOs.
 *
 * Plain data shapes for the organization feature. Like the auth DTOs, these
 * are intentionally separate from the Prisma model types so that we can
 * evolve the persistence layer without leaking it through the API.
 */

export type OrganizationType =
  | "school"
  | "company"
  | "publisher"
  | "cohort";

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  ownerId: string;
  billingEmail: string | null;
  country: string | null;
  plan: string;
  seats: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembershipDto {
  id: string;
  orgId: string;
  userId: string;
  roleId: string | null;
  roleName: string | null;
  status: string;
  joinedAt: string;
  expiresAt: string | null;
}

export interface OrganizationInvitationDto {
  id: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  invitedById: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}
