import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getCollection, updateCollection, deleteCollection, updateCollectionBodySchema } from '@/features/collection'
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); return NextResponse.json(await getCollection(c, id)) })
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); const b = await req.json(); const i = updateCollectionBodySchema.parse(b); return NextResponse.json(await updateCollection(c, id, i)) })
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); await deleteCollection(c, id); return NextResponse.json({ success: true }) })
