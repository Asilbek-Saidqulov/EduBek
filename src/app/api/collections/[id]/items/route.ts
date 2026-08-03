import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { addItems, reorderItems, addItemsBodySchema, reorderItemsBodySchema } from '@/features/collection'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); const b = await req.json(); const i = addItemsBodySchema.parse(b); await addItems(c, id, i); return NextResponse.json({ success: true }, { status: 201 }) })
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); const b = await req.json(); const i = reorderItemsBodySchema.parse(b); await reorderItems(c, id, i); return NextResponse.json({ success: true }) })
