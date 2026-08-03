import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getPayouts, requestPayout } from '@/features/creator-economy'
export const GET = withErrorHandler(async () => { const ctx = await getAuthContext(); return NextResponse.json({ payouts: await getPayouts(ctx) }) })
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); return NextResponse.json(await requestPayout(ctx, b.amount), { status: 201 }) })
