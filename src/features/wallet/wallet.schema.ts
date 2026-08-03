import { z } from 'zod'
export const transferBodySchema = z.object({ toUserId: z.string().min(1), amount: z.number().int().min(1), reason: z.string().max(200).optional() })
export type TransferBody = z.infer<typeof transferBodySchema>
