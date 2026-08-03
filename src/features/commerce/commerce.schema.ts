import { z } from 'zod'
export const createReviewBodySchema = z.object({ purchaseId: z.string().min(1), rating: z.number().int().min(1).max(5), title: z.string().max(200).optional(), body: z.string().max(2000).optional() })
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>
export const updateReviewBodySchema = z.object({ rating: z.number().int().min(1).max(5).optional(), title: z.string().max(200).nullable().optional(), body: z.string().max(2000).nullable().optional() })
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>
