import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { purchase } from '@/features/purchase'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); return NextResponse.json(await purchase(c, id), { status: 201 }) })
