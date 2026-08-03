import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getFeatured } from '@/features/marketplace'
export const GET = withErrorHandler(async (req) => { const { searchParams } = new URL(req.url); return NextResponse.json({ listings: await getFeatured(parseInt(searchParams.get('limit') ?? '10')) }) })
