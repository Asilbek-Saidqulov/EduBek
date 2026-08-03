import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getListing, updateListing, deleteListing, updateListingBodySchema } from '@/features/marketplace'
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); return NextResponse.json(await getListing(c, id, true)) })
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); const b = await req.json(); const i = updateListingBodySchema.parse(b); return NextResponse.json(await updateListing(c, id, i)) })
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); await deleteListing(c, id); return NextResponse.json({ success: true }) })
