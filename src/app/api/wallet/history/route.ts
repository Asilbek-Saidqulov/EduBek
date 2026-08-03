import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getHistory } from '@/features/wallet'
export const GET = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const { searchParams } = new URL(req.url); return NextResponse.json(await getHistory(ctx, parseInt(searchParams.get('limit') ?? '20'), parseInt(searchParams.get('offset') ?? '0'))) })
