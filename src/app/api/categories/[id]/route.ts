/**
 * PATCH  /api/categories/[id]
 * DELETE /api/categories/[id]
 *
 * Rename or delete a category. Deleting unassigns all resources currently
 * in the category (sets their categoryId to null).
 */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import {
  updateCategory,
  deleteCategory,
  updateCategoryBodySchema,
  categoryIdParamsSchema,
} from '@/features/category'

/** PATCH /api/categories/[id] — rename category */
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = categoryIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const body = await req.json().catch(() => ({}))
  const input = updateCategoryBodySchema.parse(body)
  const category = await updateCategory(authCtx, id, input)
  return NextResponse.json(category)
})

/** DELETE /api/categories/[id] — delete category (unassigns resources) */
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = categoryIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  await deleteCategory(authCtx, id)
  return NextResponse.json({ success: true })
})
