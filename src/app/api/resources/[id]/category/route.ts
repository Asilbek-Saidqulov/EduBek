/**
 * POST /api/resources/[id]/category
 *
 * Assign a resource to an org category (or unassign, if categoryId is null).
 *
 * Authorization: the user must be able to UPDATE the resource AND (if
 * assigning) be a member of the category's org.
 */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { resourceIdParamsSchema } from '@/features/resource'
import {
  assignCategory,
  assignCategoryBodySchema,
} from '@/features/category'

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = resourceIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const body = await req.json().catch(() => ({}))
  const input = assignCategoryBodySchema.parse(body)
  await assignCategory(authCtx, id, input.categoryId)
  return NextResponse.json({ success: true })
})
