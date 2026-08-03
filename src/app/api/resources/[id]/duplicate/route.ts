import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { duplicateResource, duplicateResourceBodySchema } from '@/features/resource'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string }
  const c = await loadOrgPermissions(await getAuthContext())
  const b = await req.json().catch(() => ({}))
  const i = duplicateResourceBodySchema.parse(b)
  return NextResponse.json(await duplicateResource(c, id, i), { status: 201 })
})
