import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { createInvitation, createInvitationBodySchema } from '@/features/organization'

export const POST = withErrorHandler<{ slug: string }>(async (req, ctx) => {
  const { slug } = (await ctx.params) as { slug: string }
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const body = await req.json()
  const input = createInvitationBodySchema.parse(body)
  const invitation = await createInvitation(authCtx, slug, input)
  return NextResponse.json(invitation, { status: 201 })
})
