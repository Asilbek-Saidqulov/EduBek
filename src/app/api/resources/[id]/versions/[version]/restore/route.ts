import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { restoreVersion, restoreVersionParamsSchema } from '@/features/resource'
export const POST = withErrorHandler<{ id: string; version: string }>(async (req, ctx) => { const p = (await ctx.params) as { id: string; version: string }; const { id, version } = restoreVersionParamsSchema.parse({ id: p.id, version: p.version }); const c = await loadOrgPermissions(await getAuthContext()); return NextResponse.json(await restoreVersion(c, id, version)) })
