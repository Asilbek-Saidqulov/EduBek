/**
 * PATCH /api/organizations/[slug]/categories/reorder
 *
 * Reorder categories within an org.
 *
 * Note: the route path `categories/reorder` is more specific than
 * `categories/[id]`, so Next.js routes PATCH /categories/reorder here
 * (not to the [id] handler).
 */

import { NextResponse } from 'next/server'
import { withErrorHandler, notFound, forbidden } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import {
  reorderCategories,
  reorderCategoriesBodySchema,
} from '@/features/category'
import {
  orgSlugParamsSchema,
  listMyOrganizations,
} from '@/features/organization'

export const PATCH = withErrorHandler<{ slug: string }>(async (req, ctx) => {
  const { slug } = orgSlugParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const memberships = await listMyOrganizations(authCtx)
  const membership = memberships.find((m) => m.orgSlug === slug)
  if (!membership) throw notFound('Organization not found')
  if (membership.status !== 'active') throw forbidden('You are not an active member of this organization')
  const body = await req.json().catch(() => ({}))
  const input = reorderCategoriesBodySchema.parse(body)
  await reorderCategories(authCtx, membership.orgId, input)
  return NextResponse.json({ success: true })
})
