import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { createCollection, getCollections, createCollectionBodySchema } from '@/features/collection'
export const POST = withErrorHandler(async (req) => { const c = await getAuthContext(); const b = await req.json(); const i = createCollectionBodySchema.parse(b); return NextResponse.json(await createCollection(c, i), { status: 201 }) })
export const GET = withErrorHandler(async () => { const c = await getAuthContext(); return NextResponse.json({ collections: await getCollections(c) }) })
