import { z } from 'zod'
export const createShareBodySchema = z.object({ expiresAt: z.string().datetime().optional() })
export type CreateShareBody = z.infer<typeof createShareBodySchema>
