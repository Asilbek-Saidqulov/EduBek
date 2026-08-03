import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { getStats } from '@/features/resource'
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await loadOrgPermissions(await getAuthContext()); return NextResponse.json(await getStats(c, id)) })
