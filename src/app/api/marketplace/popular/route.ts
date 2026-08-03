import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getPopular } from '@/features/marketplace'
export const GET = withErrorHandler(async (req) => { const { searchParams } = new URL(req.url); return NextResponse.json({ listings: await getPopular(parseInt(searchParams.get('limit') ?? '10')) }) })
