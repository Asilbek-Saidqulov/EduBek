import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { convertResource, convertBodySchema } from '@/features/ai-workspace'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = convertBodySchema.parse(b); return NextResponse.json(await convertResource(ctx, i), { status: 201 }) })
