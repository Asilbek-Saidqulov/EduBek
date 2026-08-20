/**
 * EduBek — auth Zod schemas.
 *
 * Every route handler that accepts a JSON body must validate it with one of
 * these schemas. Centralizing them here keeps the validation rules in one
 * place and makes them trivially reusable from the frontend (via a shared
 * package) or from tests.
 *
 * Note: Zod v4 is the runtime. The schemas use the canonical v4 API.
 */

import { z } from "zod";
import { locales } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" })
  .max(254, { message: "Email is too long" });

/**
 * Password policy:
 *   • ≥ 8 characters
 *   • ≥ 1 uppercase letter
 *   • ≥ 1 digit
 *
 * This is the minimum we enforce at signup; users are encouraged (but not
 * forced) to use passphrases or a password manager. Stricter policies
 * belong to a future "password strength" feature, not to schema validation.
 */
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password is too long" })
  .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain a digit" });

export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(32, { message: "Username is too long" })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username may only contain letters, digits, and underscores",
  });

// ---------------------------------------------------------------------------
// Route bodies
// ---------------------------------------------------------------------------

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, {
    message: "Name is too long",
  }).optional(),
  username: usernameSchema.optional(),
  // The locale the user was registering under (e.g. from `/uz/register`).
  // Optional so non-frontend clients (tests, API consumers) still work;
  // the service falls back to the platform default locale when omitted.
  locale: z.enum([...locales] as [string, ...string[]]).optional(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

/**
 * Refresh tokens are normally carried in an HTTP-only cookie, but we also
 * accept an explicit body for clients that cannot use cookies. The body
 * form is optional; when absent, the route reads the cookie.
 */
export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type RefreshBody = z.infer<typeof refreshBodySchema>;

// ---------------------------------------------------------------------------
// PATCH /api/auth/me — update profile
// ---------------------------------------------------------------------------

export const updateProfileBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name is too long" })
    .nullable()
    .optional(),
  username: usernameSchema.nullable().optional(),
  avatarUrl: z
    .string()
    .url({ message: "Avatar URL must be a valid URL" })
    .max(2_000, { message: "Avatar URL is too long" })
    .nullable()
    .optional(),
  bio: z
    .string()
    .max(500, { message: "Bio is too long" })
    .nullable()
    .optional(),
  country: z
    .string()
    .max(100, { message: "Country is too long" })
    .nullable()
    .optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
