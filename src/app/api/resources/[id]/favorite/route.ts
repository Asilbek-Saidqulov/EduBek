import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { toggleFavorite } from '@/features/resource'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await loadOrgPermissions(await getAuthContext()); return NextResponse.json(await toggleFavorite(c, id)) })
