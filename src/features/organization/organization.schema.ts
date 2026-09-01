import { z } from "zod";

export const createOrganizationBodySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
  type: z.string().default("school"),
  country: z.string().optional(),
  billingEmail: z.string().email().optional(),
  seats: z.number().int().min(1).max(10000).optional(),
});
export type CreateOrganizationBody = z.infer<typeof createOrganizationBodySchema>;
