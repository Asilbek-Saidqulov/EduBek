import { z } from 'zod'
export const requestPayoutBodySchema = z.object({ amount: z.number().min(1, 'Amount must be positive') })
export type RequestPayoutBody = z.infer<typeof requestPayoutBodySchema>
