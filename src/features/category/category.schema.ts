/**
 * Category feature — Zod validation schemas.
 */

import { z } from 'zod'

// ----------------------------------------------------------------------------
// POST /api/organizations/[slug]/categories — create
// ----------------------------------------------------------------------------

export const createCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long'),
})

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>

// ----------------------------------------------------------------------------
// PATCH /api/categories/[id] — rename
// ----------------------------------------------------------------------------

export const updateCategoryBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
})

export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>

// ----------------------------------------------------------------------------
// POST /api/resources/[id]/category — assign resource to a category
// ----------------------------------------------------------------------------

export const assignCategoryBodySchema = z.object({
  categoryId: z.string().min(1).nullable(), // null = unassign
})

export type AssignCategoryBody = z.infer<typeof assignCategoryBodySchema>

// ----------------------------------------------------------------------------
// PATCH /api/organizations/[slug]/categories/reorder — reorder
// ----------------------------------------------------------------------------

export const reorderCategoriesBodySchema = z.object({
  categories: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one category is required')
    .max(100, 'Cannot reorder more than 100 categories at once'),
})

export type ReorderCategoriesBody = z.infer<typeof reorderCategoriesBodySchema>

// ----------------------------------------------------------------------------
// Path params
// ----------------------------------------------------------------------------

export const categoryIdParamsSchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
})
