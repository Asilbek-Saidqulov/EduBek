import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { createInvitation, createInvitationBodySchema } from '@/features/organization'
import { z } from 'zod'

const orgIdParamsSchema = z.object({
  id: z.string(),
})

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = orgIdParamsSchema.parse(await ctx.params)
  const authCtx = await loadOrgPermissions(await getAuthContext())
  const body = await req.json()
  const input = createInvitationBodySchema.parse(body)
  const invitation = await createInvitation(authCtx, id, input)
  return NextResponse.json(invitation, { status: 201 })
})
