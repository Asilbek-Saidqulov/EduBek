/**
 * EduBek — organization Zod schemas.
 *
 * Validation rules for the organization API surface. As with the auth
 * schemas, centralizing them here keeps the rules in one place and makes
 * them trivially reusable from the frontend (via a shared package) or from
 * tests.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Slug rules:
 *   • 3–48 characters
 *   • lowercase letters, digits, and hyphens only
 *   • must start and end with a letter or digit (no leading/trailing hyphens,
 *     no consecutive hyphens)
 */
export const orgSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { message: "Slug must be at least 3 characters" })
  .max(48, { message: "Slug is too long" })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Slug may only contain lowercase letters, digits, and single hyphens",
  });

export const organizationTypeSchema = z.enum([
  "school",
  "company",
  "publisher",
  "cohort",
]);

// ---------------------------------------------------------------------------
// Bodies
// ---------------------------------------------------------------------------

export const createOrganizationBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(120, { message: "Name is too long" }),
  slug: orgSlugSchema,
  type: organizationTypeSchema.default("school"),
  billingEmail: z.string().email().optional(),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/, { message: "Country must be an ISO 3166-1 alpha-2 code" })
    .optional(),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;

export const createInvitationBodySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  roleName: z.string().trim().min(1).max(64).optional(),
  expiresInHours: z
    .number()
    .int()
    .min(1, { message: "Expires-in must be at least 1 hour" })
    .max(720, { message: "Expires-in must be at most 720 hours (30 days)" })
    .default(168), // 7 days
});

export type CreateInvitationBody = z.infer<typeof createInvitationBodySchema>;

// ---------------------------------------------------------------------------
// Route params
// ---------------------------------------------------------------------------

export const orgSlugParamsSchema = z.object({
  slug: orgSlugSchema,
});

export const invitationTokenParamsSchema = z.object({
  token: z.string().min(1, { message: "Invitation token is required" }),
});
