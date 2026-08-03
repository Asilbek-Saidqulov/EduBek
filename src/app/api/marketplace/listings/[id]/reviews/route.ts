import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getReviews } from '@/features/commerce'
export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const { searchParams } = new URL(req.url); return NextResponse.json(await getReviews(id, parseInt(searchParams.get('limit') ?? '20'), parseInt(searchParams.get('offset') ?? '0'))) })
