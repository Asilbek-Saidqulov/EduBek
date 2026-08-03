/**
 * Marketplace feature — Zod validation schemas.
 */

import { z } from 'zod'

// ----------------------------------------------------------------------------
// GET /api/marketplace/quizzes — query params
// ----------------------------------------------------------------------------

export const listMarketplaceQuizzesQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type ListMarketplaceQuizzesQuery = z.infer<typeof listMarketplaceQuizzesQuerySchema>

// ----------------------------------------------------------------------------
// Service input (framework-agnostic)
// ----------------------------------------------------------------------------

export interface ListMarketplaceQuizzesInput {
  category?: string
  q?: string
  limit: number
}
