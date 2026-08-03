import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { addToWishlist, removeFromWishlist } from '@/features/commerce'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); await addToWishlist(c, id); return NextResponse.json({ success: true }, { status: 201 }) })
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); await removeFromWishlist(c, id); return NextResponse.json({ success: true }) })
