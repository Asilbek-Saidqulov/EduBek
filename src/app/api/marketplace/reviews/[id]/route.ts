import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { updateReview, deleteReview, updateReviewBodySchema } from '@/features/commerce'
const params = z.object({ id: z.string().min(1) })
export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = params.parse(await ctx.params); const authCtx = await getAuthContext(); const body = await req.json(); const input = updateReviewBodySchema.parse(body); const review = await updateReview(authCtx, id, input); return NextResponse.json(review) })
export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => { const { id } = params.parse(await ctx.params); const authCtx = await getAuthContext(); await deleteReview(authCtx, id); return NextResponse.json({ success: true }) })
