import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { transfer, transferBodySchema } from '@/features/wallet'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const body = await req.json(); const input = transferBodySchema.parse(body); await transfer(ctx, input); return NextResponse.json({ success: true }) })
