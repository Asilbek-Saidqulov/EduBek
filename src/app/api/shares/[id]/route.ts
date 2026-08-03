import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { revokeShare } from '@/features/sharing'
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); await revokeShare(c, id); return NextResponse.json({ success: true }) })
