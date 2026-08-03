import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getEarnings } from '@/features/creator-economy'
export const GET = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const { searchParams } = new URL(req.url); return NextResponse.json(await getEarnings(ctx, parseInt(searchParams.get('limit') ?? '20'), parseInt(searchParams.get('offset') ?? '0'))) })
