import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { listFavoriteListings } from '@/features/marketplace'
export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const result = await listFavoriteListings(ctx, limit, offset)
  return NextResponse.json(result)
})
