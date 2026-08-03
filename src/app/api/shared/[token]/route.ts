import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getSharedResource } from '@/features/sharing'
export const GET = withErrorHandler<{ token: string }>(async (req, ctx) => { const { token } = (await ctx.params) as { token: string }; return NextResponse.json(await getSharedResource(token)) })
