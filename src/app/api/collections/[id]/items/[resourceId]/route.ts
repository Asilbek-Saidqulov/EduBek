import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { removeItem } from '@/features/collection'
export const DELETE = withErrorHandler<{ id: string; resourceId: string }>(async (req, ctx) => { const p = (await ctx.params) as { id: string; resourceId: string }; const c = await getAuthContext(); await removeItem(c, p.id, p.resourceId); return NextResponse.json({ success: true }) })
