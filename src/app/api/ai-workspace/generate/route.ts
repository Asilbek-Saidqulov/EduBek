import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { generateResource, generateBodySchema } from '@/features/ai-workspace'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = generateBodySchema.parse(b); return NextResponse.json(await generateResource(ctx, i), { status: 201 }) })
