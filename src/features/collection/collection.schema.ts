import { z } from 'zod'
export const createCollectionBodySchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(500).optional(), orgId: z.string().optional() })
export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>
export const updateCollectionBodySchema = z.object({ name: z.string().trim().min(1).max(100).optional(), description: z.string().max(500).nullable().optional() })
export type UpdateCollectionBody = z.infer<typeof updateCollectionBodySchema>
export const addItemsBodySchema = z.object({ resourceIds: z.array(z.string().min(1)).min(1).max(100) })
export type AddItemsBody = z.infer<typeof addItemsBodySchema>
export const reorderItemsBodySchema = z.object({ items: z.array(z.object({ resourceId: z.string(), sortOrder: z.number().int() })).min(1) })
export type ReorderItemsBody = z.infer<typeof reorderItemsBodySchema>
