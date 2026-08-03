import { z } from 'zod'
export const refundBodySchema = z.object({ reason: z.string().max(500).optional() })
export type RefundBody = z.infer<typeof refundBodySchema>
