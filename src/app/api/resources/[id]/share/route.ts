import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { createShareLink, createShareBodySchema } from '@/features/sharing'
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = (await ctx.params) as { id: string }; const c = await getAuthContext(); const b = await req.json().catch(() => ({})); const i = createShareBodySchema.parse(b); return NextResponse.json(await createShareLink(c, id, i), { status: 201 }) })
