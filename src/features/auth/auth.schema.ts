import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  locale: z.enum(["en", "uz", "ru"]).optional().default("uz"),
  country: z.string().optional().default("UZ"),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export const updateProfileBodySchema = z.object({

  name: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  country: z.string().max(10).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
export type RegisterInput = z.infer<typeof registerBodySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
