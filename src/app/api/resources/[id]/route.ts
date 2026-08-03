import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext, loadOrgPermissions } from '@/features/auth'
import { getResource, updateResource, deleteResource, updateResourceBodySchema } from '@/features/resource'
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await loadOrgPermissions(await getAuthContext()); return NextResponse.json(await getResource(c, id)) })
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await loadOrgPermissions(await getAuthContext()); const b = await req.json(); const i = updateResourceBodySchema.parse(b); return NextResponse.json(await updateResource(c, id, i)) })
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await loadOrgPermissions(await getAuthContext()); await deleteResource(c, id); return NextResponse.json({ success: true }) })
