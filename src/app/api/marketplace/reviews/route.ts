import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { createReview, createReviewBodySchema } from '@/features/commerce'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = createReviewBodySchema.parse(b); return NextResponse.json(await createReview(ctx, i), { status: 201 }) })
