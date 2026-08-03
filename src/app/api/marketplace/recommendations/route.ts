import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getRecommendations } from '@/features/commerce'
export const GET = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const { searchParams } = new URL(req.url); return NextResponse.json({ recommendations: await getRecommendations(ctx, parseInt(searchParams.get('limit') ?? '10')) }) })
