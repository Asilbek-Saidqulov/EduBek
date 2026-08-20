/**
 * POST /api/organizations/[slug]/categories
 * GET  /api/organizations/[slug]/categories
 *
 * Create a new category in an org, or list all categories in an org.
 *
 * Authorization: POST requires OrgPermission.ORG_UPDATE; GET requires org
 * membership (any role).
 *
 * Note: the org is resolved from the slug via the user's memberships — this
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
  orgSlugParamsSchema,
  listMyOrganizations,
} from '@/features/organization'

/** POST /api/organizations/[slug]/categories — create category */
export const POST = withErrorHandler<{ organizationSlug: string }>( async (req, ctx) => {
const { organizationSlug } = await ctx.params;  const authCtx = await loadOrgPermissions(await getAuthContext())
  const { slug } = orgSlugParamsSchema.parse({
    slug: organizationSlug,
  });
  const memberships = await listMyOrganizations(authCtx)
  const membership = memberships.find((m) => m.orgSlug === organizationSlug)
  if (!membership) throw notFound('Organization not found')
  if (membership.status !== 'active') throw forbidden('You are not an active member of this organization')
  const body = await req.json().catch(() => ({}))
  const input = createCategoryBodySchema.parse(body)
  const category = await createCategory(authCtx, membership.orgId, input)
  return NextResponse.json(category, { status: 201 })
})

/** GET /api/organizations/[slug]/categories — list categories */
export const GET = withErrorHandler<{ slug: string }>(async (req, ctx) => {
  const { slug } = orgSlugParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const memberships = await listMyOrganizations(authCtx)
  const membership = memberships.find((m) => m.orgSlug === slug)
  if (!membership) throw notFound('Organization not found')
  if (membership.status !== 'active') throw forbidden('You are not an active member of this organization')
  const categories = await listCategories(authCtx, membership.orgId)
  return NextResponse.json({ categories })
})
