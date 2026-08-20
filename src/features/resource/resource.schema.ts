/** Resource feature — Zod validation schemas. */

import { z } from 'zod'

export const RESOURCE_TYPES = [
  'quiz', 'worksheet', 'lesson_plan', 'presentation',
  'flashcards', 'notes', 'exam', 'homework', 'practice_material',
] as const

export const createResourceBodySchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().default('{}'),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  language: z.string().min(2).max(10).default('en'),
  visibility: z.enum(['private', 'organization', 'public', 'marketplace']).default('private'),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  orgId: z.string().optional(),
})
export type CreateResourceBody = z.infer<typeof createResourceBodySchema>

export const updateResourceBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  content: z.string().optional(),
  subject: z.string().max(100).nullable().optional(),
  grade: z.string().max(50).nullable().optional(),
  language: z.string().min(2).max(10).optional(),
  visibility: z.enum(['private', 'organization', 'public', 'marketplace']).optional(),
  status: z.enum(['draft', 'ready']).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  changelog: z.string().max(500).optional(),
})
export type UpdateResourceBody = z.infer<typeof updateResourceBodySchema>

export const duplicateResourceBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  orgId: z.string().optional(),
})
export type DuplicateResourceBody = z.infer<typeof duplicateResourceBodySchema>

export const listResourcesQuerySchema = z.object({
  resourceType: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
  ownerId: z.string().optional(),
  orgId: z.string().optional(),
  tag: z.string().optional(),
  visibility: z.enum(['private', 'organization', 'public', 'marketplace']).optional(),
  status: z.enum(['draft', 'ready', 'archived']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>

export const restoreVersionParamsSchema = z.object({
  id: z.string().min(1),
  version: z.coerce.number().int().min(1),
})

export const bulkOperationBodySchema = z.object({
  resourceIds: z.array(z.string().min(1)).min(1).max(100),
})
export type BulkOperationBody = z.infer<typeof bulkOperationBodySchema>

export const importResourceBodySchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().default('{}'),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  language: z.string().min(2).max(10).default('en'),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
})
export type ImportResourceBody = z.infer<typeof importResourceBodySchema>

export const importResourcesBatchBodySchema = z.array(importResourceBodySchema).min(1).max(50)
export type ImportResourcesBatchBody = z.infer<typeof importResourcesBatchBodySchema>

/** Path-parameter schema for resource ID routes. */
export const resourceIdParamsSchema = z.object({
  id: z.string().min(1),
})
