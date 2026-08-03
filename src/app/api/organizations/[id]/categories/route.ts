/**
 * POST /api/organizations/[id]/categories
 * GET  /api/organizations/[id]/categories
 *
 * Create a new category in an org, or list all categories in an org.
 *
 * Authorization: POST requires OrgPermission.ORG_UPDATE; GET requires org
 * membership (any role).
 *
 * Note: the org is resolved from the id via the user's memberships — this
 * naturally enforces that the user is a member of the org (no separate
 * membership check needed). Public org lookup is not exposed by the
 * organization barrel.
 */

import { NextResponse } from 'next/server'
import { withErrorHandler, notFound, forbidden } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import {
  createCategory,
  listCategories,
  createCategoryBodySchema,
} from '@/features/category'
import {
  listMyOrganizations,
} from '@/features/organization'
import { z } from 'zod'

const orgIdParamsSchema = z.object({
  id: z.string(),
})

/** POST /api/organizations/[id]/categories — create category */
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = orgIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const memberships = await listMyOrganizations(authCtx)
  const membership = memberships.find((m) => m.orgId === id)
  if (!membership) throw notFound('Organization not found')
  if (membership.status !== 'active') throw forbidden('You are not an active member of this organization')
  const body = await req.json().catch(() => ({}))
  const input = createCategoryBodySchema.parse(body)
  const category = await createCategory(authCtx, membership.orgId, input)
  return NextResponse.json(category, { status: 201 })
})

/** GET /api/organizations/[id]/categories — list categories */
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = orgIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const memberships = await listMyOrganizations(authCtx)
  const membership = memberships.find((m) => m.orgId === id)
  if (!membership) throw notFound('Organization not found')
  if (membership.status !== 'active') throw forbidden('You are not an active member of this organization')
  const categories = await listCategories(authCtx, membership.orgId)
  return NextResponse.json({ categories })
})
