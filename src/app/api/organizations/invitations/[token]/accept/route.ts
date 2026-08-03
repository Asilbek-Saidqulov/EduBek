import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { acceptInvitation } from '@/features/organization'

export const POST = withErrorHandler<{ token: string }>(async (req, ctx) => {
  const { token } = (await ctx.params) as { token: string }
  const authCtx = await getAuthContext()
  const result = await acceptInvitation(authCtx, token)
  return NextResponse.json(result, { status: 201 })
})
