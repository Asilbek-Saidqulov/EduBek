import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email is too long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  locale: z.enum(["en", "uz", "ru"]).optional().default("uz"),
  country: z.string().max(10).optional().default("UZ"),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  country: z.string().max(10).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
export type RegisterInput = z.infer<typeof registerBodySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
