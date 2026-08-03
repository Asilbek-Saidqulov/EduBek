/**
 * EduBek — organization barrel export.
 */

export {
  type OrganizationType,
  type OrganizationDto,
  type OrganizationMembershipDto,
  type OrganizationInvitationDto,
} from "@/features/organization/organization.types";

export {
  createOrganizationBodySchema,
  createInvitationBodySchema,
  orgSlugSchema,
  organizationTypeSchema,
  orgSlugParamsSchema,
  invitationTokenParamsSchema,
  type CreateOrganizationBody,
  type CreateInvitationBody,
} from "@/features/organization/organization.schema";

export {
  createOrganization,
  createInvitation,
  acceptInvitation,
  listMyOrganizations,
  type CreateInvitationInput,
} from "@/features/organization/organization.service";

export {
  createOrgRole,
  findOrganizationById,
  findOrganizationBySlug,
  findOrganizationsForUser,
  findOrgRoleById,
  findOrgRoleByName,
  findDefaultOrgRoles,
  findMembership,
  findInvitationByToken,
  findInvitationsForOrg,
  acceptInvitation as acceptInvitationRow,
  createInvitation as createInvitationRow,
  createMembership,
  createOrganization as createOrganizationRow,
} from "@/features/organization/organization.repository";
